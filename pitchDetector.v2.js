// Simplified Pitch Detection using shared AudioManager
class PitchDetector {
    constructor() {
        this.buffer = null;
        this.currentVolume = 0;
        this.currentRMS = 0;
        this.isListening = false;

        // Diagnostic logging
        this.diagnosticsEnabled = false;
        this.diagnosticsCallback = null;
        this.lastDiagnosticTime = 0;
        this.diagnosticInterval = 100; // Log every 100ms
        this.lastFFTLogTime = 0;
        this.fftLogInterval = 200; // Log FFT results every 200ms

        // Frequency tracking for stability
        this.lastDetectedFrequency = null;
        this.lastDetectionTime = 0;
        this.frequencyStabilityWindow = 500; // ms - prefer similar frequencies within 500ms

        // Smoothing buffer for stable readings
        this.smoothingBuffer = [];
        this.smoothingBufferSize = 5; // Keep last 5 readings
    }

    async initialize() {
        // Use shared AudioManager
        await window.audioManager.initialize();

        const analyser = window.audioManager.getAnalyser();
        if (!analyser) {
            throw new Error('Analyser not available from AudioManager');
        }

        // Create buffer for time-domain data
        this.buffer = new Float32Array(analyser.fftSize);

        // Create buffer for frequency-domain data (FFT)
        this.frequencyBuffer = new Float32Array(analyser.frequencyBinCount);

        this.isListening = true;

        console.log('PitchDetector: Initialized using AudioManager');
        return true;
    }

    // Initialize with already-initialized AudioManager (for shared pitch detector)
    async initializeWithSharedAudio() {
        const analyser = window.audioManager.getAnalyser();
        if (!analyser) {
            throw new Error('Analyser not available from AudioManager');
        }

        // Create buffer for time-domain data
        this.buffer = new Float32Array(analyser.fftSize);

        // Create buffer for frequency-domain data (FFT)
        this.frequencyBuffer = new Float32Array(analyser.frequencyBinCount);

        this.isListening = true;

        console.log('PitchDetector: Initialized with shared audio');
        return true;
    }

    // Autocorrelation algorithm for pitch detection
    autoCorrelate(buffer, sampleRate) {
        const SIZE = buffer.length;
        let rms = 0;

        // Calculate RMS to check signal strength
        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        // Very low threshold for quiet microphones (AirPods, etc.)
        const rmsThreshold = 0.0005;
        const belowThreshold = rms < rmsThreshold;

        // Diagnostic logging
        if (this.diagnosticsEnabled && this.diagnosticsCallback) {
            const now = Date.now();
            if (now - this.lastDiagnosticTime >= this.diagnosticInterval) {
                this.diagnosticsCallback({
                    type: 'autocorrelate',
                    rms: rms,
                    rmsThreshold: rmsThreshold,
                    belowThreshold: belowThreshold,
                    bufferSize: SIZE,
                    sampleRate: window.audioManager.getAudioContext().sampleRate
                });
                this.lastDiagnosticTime = now;
            }
        }

        if (belowThreshold) return { frequency: -1, candidates: [], rms };

        // Frequency range: 50 Hz to 2000 Hz (covers full vocal range)
        const MAX_FREQUENCY = 2000;
        const MIN_FREQUENCY = 50;
        const MIN_OFFSET = Math.max(Math.floor(sampleRate / MAX_FREQUENCY), 4);
        const MAX_OFFSET = Math.min(Math.floor(sampleRate / MIN_FREQUENCY), SIZE / 2);

        // Use normalized square difference
        const correlations = new Array(MAX_OFFSET);

        for (let offset = MIN_OFFSET; offset < MAX_OFFSET; offset++) {
            let sum = 0;
            const step = offset < 50 ? 1 : 2;

            for (let i = 0; i < SIZE / 2; i += step) {
                const diff = buffer[i] - buffer[i + offset];
                sum += diff * diff;
            }

            correlations[offset] = sum;
        }

        // Find local minima (candidate pitches)
        const candidates = [];
        for (let offset = MIN_OFFSET; offset < MAX_OFFSET; offset++) {
            if (offset > MIN_OFFSET && offset < MAX_OFFSET - 1) {
                if (correlations[offset] < correlations[offset - 1] &&
                    correlations[offset] < correlations[offset + 1]) {
                    candidates.push({ offset, value: correlations[offset] });
                }
            }
        }

        // Sort candidates by correlation strength (lower is better)
        candidates.sort((a, b) => a.value - b.value);

        // Store top candidates for debugging
        const debugCandidates = candidates.slice(0, 5).map(c => ({
            freq: Math.round(sampleRate / c.offset),
            correlation: c.value.toFixed(6)
        }));

        // Find potential fundamental using harmonic analysis
        const topCandidates = candidates.slice(0, 10).map(c => ({
            freq: sampleRate / c.offset,
            offset: c.offset,
            value: c.value
        })).filter(c => c.freq >= MIN_FREQUENCY && c.freq <= MAX_FREQUENCY);

        // Count harmonics for each candidate
        for (let i = 0; i < topCandidates.length; i++) {
            const candidate = topCandidates[i];
            let harmonicCount = 0;

            for (let j = 0; j < topCandidates.length; j++) {
                if (i === j) continue;

                const ratio = topCandidates[j].freq / candidate.freq;
                const nearestMultiple = Math.round(ratio);

                if (nearestMultiple >= 2 && Math.abs(ratio - nearestMultiple) < 0.12) {
                    harmonicCount++;
                }
            }

            topCandidates[i].harmonicCount = harmonicCount;
        }

        // Sort by harmonic count (descending), then correlation strength (ascending)
        topCandidates.sort((a, b) => {
            if (b.harmonicCount !== a.harmonicCount) {
                return b.harmonicCount - a.harmonicCount;
            }
            return a.value - b.value;
        });

        // Prefer candidates in vocal range (80-1200 Hz)
        const PREFERRED_MIN = 80;
        const PREFERRED_MAX = 1200;

        let bestCandidate = null;
        for (let candidate of topCandidates) {
            const inPreferredRange = candidate.freq >= PREFERRED_MIN && candidate.freq <= PREFERRED_MAX;
            const correlationQuality = candidate.value / (rms * rms * SIZE);

            // Skip noise
            if (candidate.freq < PREFERRED_MIN && correlationQuality > 0.1 && candidate.harmonicCount === 0) {
                continue;
            }

            if (!bestCandidate) {
                bestCandidate = candidate;
            } else {
                const bestInPreferred = bestCandidate.freq >= PREFERRED_MIN && bestCandidate.freq <= PREFERRED_MAX;

                if (inPreferredRange && !bestInPreferred) {
                    bestCandidate = candidate;
                } else if (inPreferredRange === bestInPreferred && candidate.harmonicCount > bestCandidate.harmonicCount) {
                    bestCandidate = candidate;
                }
            }

            if (inPreferredRange && candidate.harmonicCount >= 2 && correlationQuality < 0.05) {
                break;
            }
        }

        const minPos = bestCandidate ? bestCandidate.offset : (topCandidates.length > 0 ? topCandidates[0].offset : -1);

        // Refine with parabolic interpolation
        if (minPos > MIN_OFFSET && minPos < MAX_OFFSET - 1) {
            const y0 = correlations[minPos - 1];
            const y1 = correlations[minPos];
            const y2 = correlations[minPos + 1];

            const delta = (y2 - y0) / (2 * (2 * y1 - y2 - y0));
            const interpolatedOffset = minPos + delta;

            if (interpolatedOffset > 0 && !isNaN(interpolatedOffset)) {
                const frequency = sampleRate / interpolatedOffset;

                if (frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY) {
                    return { frequency, candidates: debugCandidates, rms };
                }
            }
        }

        // Fallback without interpolation
        if (minPos > 0) {
            const frequency = sampleRate / minPos;
            if (frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY) {
                return { frequency, candidates: debugCandidates, rms };
            }
        }

        return { frequency: -1, candidates: debugCandidates, rms };
    }

    // FFT-based pitch detection - reliable for pure tones
    detectPitchFFT() {
        const analyser = window.audioManager.getAnalyser();
        const audioContext = window.audioManager.getAudioContext();

        if (!analyser || !audioContext || !this.frequencyBuffer) {
            return null;
        }

        // Clear rejection reason
        this.lastRejectionReason = null;

        // Get frequency domain data
        analyser.getFloatFrequencyData(this.frequencyBuffer);

        const bufferLength = this.frequencyBuffer.length;
        const sampleRate = audioContext.sampleRate;
        const nyquist = sampleRate / 2;

        // Find all significant peaks, not just the loudest
        const threshold = -120; // dB - Extremely permissive for very quiet microphones
        const peaks = [];

        // Only look in vocal range (50 Hz to 2000 Hz)
        const minBin = Math.floor((50 / nyquist) * bufferLength);
        const maxBin = Math.ceil((2000 / nyquist) * bufferLength);

        // Find all peaks above threshold
        for (let i = minBin + 1; i < maxBin - 1 && i < bufferLength - 1; i++) {
            const value = this.frequencyBuffer[i];
            if (value > threshold &&
                value > this.frequencyBuffer[i - 1] &&
                value > this.frequencyBuffer[i + 1]) {
                const freq = (i * nyquist) / bufferLength;
                peaks.push({ bin: i, value: value, freq: freq });
            }
        }

        if (peaks.length === 0) {
            this.lastRejectionReason = 'No peaks above -120dB threshold (signal too quiet)';
            if (this.diagnosticsEnabled) {
                console.log('FFT: No peaks found above threshold - signal too quiet');
            }
            return null;
        }

        // Sort peaks by strength
        peaks.sort((a, b) => b.value - a.value);

        // Find fundamental: look for the lowest frequency that has harmonics
        let fundamental = null;
        const PREFERRED_MIN = 65; // Allow lower for male voices (C2 is 65Hz)
        const PREFERRED_MAX = 800; // Vocal fundamental usually < 800 Hz

        // Debug logging (only if volume is significant and throttled)
        const hasSignificantVolume = this.currentVolume > 5;
        const now = Date.now();
        const shouldLog = this.diagnosticsEnabled && hasSignificantVolume && (now - this.lastFFTLogTime >= this.fftLogInterval);

        if (shouldLog) {
            this.lastFFTLogTime = now;
            console.log(`\n=== FFT Analysis ===`);
            console.log(`Found ${peaks.length} peaks:`, peaks.slice(0, 8).map(p => `${p.freq.toFixed(1)}Hz (${p.value.toFixed(1)}dB)`));
        }

        // Try to find fundamental by checking harmonic series
        const candidates = [];
        for (let candidate of peaks) {
            // Don't skip low frequencies - they might be valid fundamentals
            // Even frequencies below 65Hz could be valid (very low bass voices)
            if (candidate.freq < 50) continue; // Only skip extremely low noise

            // Check if this frequency has harmonic support
            let harmonicCount = 0;
            const foundHarmonics = [];
            for (let harmonic = 2; harmonic <= 6; harmonic++) {
                const expectedFreq = candidate.freq * harmonic;
                if (expectedFreq > 2000) break;

                // Look for a peak near this harmonic (within 6% for better detection)
                for (let peak of peaks) {
                    const ratio = peak.freq / candidate.freq;
                    if (Math.abs(ratio - harmonic) < 0.06) {
                        harmonicCount++;
                        foundHarmonics.push(harmonic);
                        break;
                    }
                }
            }

            // Check if this might be a harmonic itself (subharmonic check)
            // Look for a STRONGER lower frequency that this could be a harmonic of
            let isLikelyHarmonic = false;
            let fundamentalStrength = 0;
            let detectedFundamental = null;

            // Only check for harmonics if this frequency is in a range where harmonics are common
            if (candidate.freq >= 150) { // Only check frequencies >= 150 Hz for being harmonics
                for (let divider = 2; divider <= 4; divider++) {
                    const potentialFundamental = candidate.freq / divider;
                    // Check if potential fundamental is in vocal range
                    if (potentialFundamental >= 50 && potentialFundamental <= 400) {
                        // Check if we have a peak near this potential fundamental
                        for (let peak of peaks) {
                            const freqMatch = Math.abs(peak.freq - potentialFundamental) / potentialFundamental < 0.06;
                            if (freqMatch) {
                                // Found a potential fundamental
                                // Only mark as harmonic if fundamental is stronger OR similar strength
                                const relativeStrength = peak.value - candidate.value; // dB difference
                                if (relativeStrength > -5) { // Fundamental must be within 5dB or stronger
                                    isLikelyHarmonic = true;
                                    fundamentalStrength = relativeStrength;
                                    detectedFundamental = peak.freq;
                                }
                                break;
                            }
                        }
                    }
                    if (isLikelyHarmonic) break;
                }
            }

            const inPreferred = candidate.freq >= PREFERRED_MIN && candidate.freq <= PREFERRED_MAX;

            // Bonus for stability - prefer frequencies close to recent detection
            let stabilityBonus = 0;
            const now = Date.now();
            if (this.lastDetectedFrequency && (now - this.lastDetectionTime) < this.frequencyStabilityWindow) {
                const freqDiff = Math.abs(candidate.freq - this.lastDetectedFrequency) / this.lastDetectedFrequency;
                if (freqDiff < 0.05) { // Within 5%
                    stabilityBonus = 15; // Strong bonus for stability
                } else if (freqDiff < 0.10) { // Within 10%
                    stabilityBonus = 8;
                }
            }

            // STRONG preference for low frequencies (especially sub-200 Hz fundamentals)
            // This is the most important factor for avoiding harmonic selection
            const lowFreqBonus = candidate.freq < 200 ? ((200 - candidate.freq) / 100) * 50 : 0;

            // EXTREMELY STRONGLY penalize if this looks like a harmonic itself
            const harmonicPenalty = isLikelyHarmonic ? -1000 : 0;

            // High frequencies without harmonics are likely noise/artifacts
            const needsHarmonics = candidate.freq > PREFERRED_MAX && harmonicCount === 0;
            const noHarmonicPenalty = needsHarmonics ? -100 : 0;

            // Weight signal strength (loudness) - make this less influential
            const strengthScore = (candidate.value + 100) / 12;

            // Reward having harmonics (indicator of a fundamental)
            const harmonicScore = harmonicCount * 30 + (harmonicCount >= 3 ? 20 : 0);

            const score = lowFreqBonus + harmonicScore + (inPreferred ? 20 : 0) + strengthScore + stabilityBonus + harmonicPenalty + noHarmonicPenalty;

            candidates.push({
                freq: candidate.freq,
                value: candidate.value,
                harmonicCount,
                foundHarmonics,
                inPreferred,
                stabilityBonus,
                isLikelyHarmonic,
                detectedFundamental,
                lowFreqBonus,
                score
            });
        }

        // Sort by score (harmonics + preferred range + strength)
        candidates.sort((a, b) => b.score - a.score);

        if (shouldLog && candidates.length > 0) {
            console.log('=== Candidate Scoring ===');
            candidates.slice(0, 8).forEach((c, i) => {
                // Calculate individual score components for display
                const lowFreqBonus = c.freq < 200 ? ((200 - c.freq) / 100) * 50 : 0;
                const harmonicPenalty = c.isLikelyHarmonic ? -1000 : 0;
                const harmonicScore = c.harmonicCount * 30 + (c.harmonicCount >= 3 ? 20 : 0);
                const inPreferred = c.freq >= PREFERRED_MIN && c.freq <= PREFERRED_MAX;

                let info = `  ${i+1}. ${c.freq.toFixed(1)}Hz (${this.frequencyToNote(c.freq)}) = ${c.score.toFixed(1)}`;
                info += `\n      [lowFreq:+${lowFreqBonus.toFixed(1)}, harmonics:+${harmonicScore}, strength:+${((c.value + 100) / 12).toFixed(1)}`;
                if (harmonicPenalty < 0) info += `, HARMONIC:${harmonicPenalty}`;
                if (c.detectedFundamental) info += ` of ${c.detectedFundamental.toFixed(1)}Hz`;
                info += `]`;
                console.log(info);
            });
        }

        // Prefer the BEST scoring candidate (balances low frequency with harmonics and strength)
        if (candidates.length > 0) {
            // Filter to only non-harmonic candidates
            // Don't require harmonics for very low frequencies (50-100 Hz) - they might be hard to detect
            const validFundamentals = candidates.filter(c => {
                if (c.isLikelyHarmonic) {
                    if (shouldLog) {
                        console.log(`  ✗ Rejected ${c.freq.toFixed(1)}Hz - detected as harmonic`);
                    }
                    return false;
                }
                if (c.freq < 100) return true; // Very low notes: don't require harmonics (hard to detect)
                if (c.freq > 500) return true; // High notes: don't require harmonics (outside range)
                if (c.harmonicCount >= 1) return true; // Has harmonics

                if (shouldLog) {
                    console.log(`  ✗ Rejected ${c.freq.toFixed(1)}Hz - no harmonics detected`);
                }
                return false;
            });

            if (shouldLog) {
                console.log(`=== After filtering: ${validFundamentals.length} valid candidates ===`);
            }

            if (validFundamentals.length > 0) {
                // Use the best scoring candidate
                // Scoring already balances low freq preference, harmonics, and strength
                validFundamentals.sort((a, b) => b.score - a.score);
                const bestScoring = validFundamentals[0];

                fundamental = peaks.find(p => Math.abs(p.freq - bestScoring.freq) < 1);
                if (shouldLog) {
                    console.log(`✓ SELECTED: ${bestScoring.freq.toFixed(1)}Hz (${this.frequencyToNote(bestScoring.freq)}) - score:${bestScoring.score.toFixed(1)}, harmonics:${bestScoring.harmonicCount}`);
                }
            } else {
                // No valid candidates - use lowest peak in vocal range (50-800Hz)
                const preferredPeaks = peaks.filter(p => p.freq >= 50 && p.freq <= PREFERRED_MAX);
                if (preferredPeaks.length > 0) {
                    // Sort by frequency to get lowest
                    preferredPeaks.sort((a, b) => a.freq - b.freq);
                    fundamental = preferredPeaks[0];
                    if (shouldLog) {
                        console.log(`⚠ No valid candidates, using LOWEST in vocal range: ${fundamental.freq.toFixed(1)}Hz (${this.frequencyToNote(fundamental.freq)})`);
                    }
                } else {
                    // All peaks outside preferred range - reject detection
                    this.lastRejectionReason = `All ${peaks.length} peaks outside vocal range (50-800Hz)`;
                    if (shouldLog) {
                        console.log('✗ REJECT: All peaks outside vocal range (50-800Hz)');
                    }
                    return null;
                }
            }
        }

        // Fall back to loudest peak in preferred range if no good fundamental found
        if (!fundamental) {
            const preferredPeak = peaks.find(p => p.freq >= PREFERRED_MIN && p.freq <= PREFERRED_MAX);
            if (preferredPeak) {
                fundamental = preferredPeak;
            } else {
                // No peaks in vocal range - reject
                this.lastRejectionReason = `No peaks in vocal range (found ${peaks.length} peaks outside)`;
                return null;
            }
        }

        const maxValue = fundamental.value;
        const maxIndex = fundamental.bin;

        // Convert bin index to frequency
        let frequency = (maxIndex * nyquist) / bufferLength;

        // Parabolic interpolation for sub-bin accuracy
        if (maxIndex > 0 && maxIndex < bufferLength - 1) {
            const y0 = this.frequencyBuffer[maxIndex - 1];
            const y1 = this.frequencyBuffer[maxIndex];
            const y2 = this.frequencyBuffer[maxIndex + 1];

            const delta = 0.5 * (y2 - y0) / (2 * y1 - y2 - y0);
            const interpolatedIndex = maxIndex + delta;

            frequency = (interpolatedIndex * nyquist) / bufferLength;
        }

        // Update tracking for stability
        this.lastDetectedFrequency = frequency;
        this.lastDetectionTime = Date.now();

        return {
            frequency: frequency,
            confidence: maxValue,
            method: 'fft',
            maxBin: maxIndex,
            threshold: threshold,
            passedThreshold: maxValue >= threshold
        };
    }

    // Narrow autocorrelation search around a target frequency
    autoCorrelateNarrow(buffer, sampleRate, targetFrequency, searchRangePercent = 0.1) {
        const SIZE = buffer.length;
        let rms = 0;

        // Calculate RMS
        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        // Don't reject based on RMS - we're being called because FFT already detected something
        // Just calculate it for diagnostic purposes

        // Calculate search range based on target frequency
        const targetPeriod = sampleRate / targetFrequency;
        const searchRange = targetPeriod * searchRangePercent;
        const minOffset = Math.max(4, Math.floor(targetPeriod - searchRange));
        const maxOffset = Math.min(Math.floor(targetPeriod + searchRange), SIZE / 2);

        // Validate search range
        if (minOffset >= maxOffset || maxOffset >= SIZE / 2) {
            // Invalid range, return -1
            return { frequency: -1, candidates: [], rms, method: 'autocorr-narrow' };
        }

        // Autocorrelation in narrow range
        const correlations = new Array(maxOffset - minOffset + 1);

        for (let offset = minOffset; offset <= maxOffset; offset++) {
            let sum = 0;
            for (let i = 0; i < SIZE / 2; i++) {
                const diff = buffer[i] - buffer[i + offset];
                sum += diff * diff;
            }
            correlations[offset - minOffset] = sum;
        }

        // Find minimum correlation (best match)
        let minValue = Infinity;
        let minPos = minOffset;

        for (let i = 0; i < correlations.length; i++) {
            if (correlations[i] < minValue) {
                minValue = correlations[i];
                minPos = minOffset + i;
            }
        }

        // Parabolic interpolation
        const localIndex = minPos - minOffset;
        if (localIndex > 0 && localIndex < correlations.length - 1) {
            const y0 = correlations[localIndex - 1];
            const y1 = correlations[localIndex];
            const y2 = correlations[localIndex + 1];

            const delta = (y2 - y0) / (2 * (2 * y1 - y2 - y0));
            const interpolatedOffset = minPos + delta;

            if (interpolatedOffset > 0 && !isNaN(interpolatedOffset)) {
                const frequency = sampleRate / interpolatedOffset;
                return {
                    frequency: frequency,
                    candidates: [],
                    rms: rms,
                    method: 'autocorr-narrow'
                };
            }
        }

        // Fallback
        const frequency = sampleRate / minPos;
        return {
            frequency: frequency,
            candidates: [],
            rms: rms,
            method: 'autocorr-narrow'
        };
    }

    // Hybrid approach: FFT for rough detection, autocorrelation for refinement
    detectPitchHybrid() {
        const analyser = window.audioManager.getAnalyser();
        const audioContext = window.audioManager.getAudioContext();

        if (!analyser || !audioContext || !this.buffer) {
            return null;
        }

        // Get time-domain data for autocorrelation
        analyser.getFloatTimeDomainData(this.buffer);

        // Calculate volume metrics
        this.currentVolume = this.calculateVolume(this.buffer);
        this.currentRMS = this.calculateRawRMS(this.buffer);

        const sampleRate = audioContext.sampleRate;

        // Step 1: Get rough frequency from FFT
        const fftResult = this.detectPitchFFT();

        // Diagnostic logging
        if (this.diagnosticsEnabled) {
            console.log('FFT Result:', fftResult);
        }

        if (!fftResult || !fftResult.frequency) {
            // Fallback to full autocorrelation if FFT fails
            const autocorrResult = this.autoCorrelate(this.buffer, sampleRate);
            if (autocorrResult.frequency > 0) {
                return {
                    frequency: autocorrResult.frequency,
                    note: this.frequencyToNote(autocorrResult.frequency),
                    cents: this.getCents(autocorrResult.frequency),
                    candidates: autocorrResult.candidates,
                    method: 'autocorr-fallback'
                };
            }
            return null;
        }

        // FFT found a frequency - try to refine with narrow autocorrelation
        // But if it fails, we'll still use the FFT result
        let finalFrequency = fftResult.frequency;
        let detectionMethod = 'fft-only';

        try {
            const refinedResult = this.autoCorrelateNarrow(
                this.buffer,
                sampleRate,
                fftResult.frequency,
                0.20 // Search within ±20% of FFT frequency
            );

            // Only use refined result if it's close to FFT result (within 10%)
            if (refinedResult.frequency > 0) {
                let autocorrFreq = refinedResult.frequency;

                // Check if autocorr found an octave (half or double)
                const ratio = fftResult.frequency / autocorrFreq;

                // PREFER LOWER frequencies - if autocorr found a lower octave, trust it!
                if (ratio > 1.9 && ratio < 2.1) {
                    // Autocorr found half frequency (octave down)
                    // For low voices, this is likely CORRECT - keep the lower frequency
                    if (autocorrFreq >= 65 && autocorrFreq <= 800) {
                        // Keep autocorr result as-is (the lower frequency)
                        if (this.diagnosticsEnabled) {
                            console.log(`Autocorr found lower octave: ${autocorrFreq.toFixed(1)}Hz (FFT had ${fftResult.frequency.toFixed(1)}Hz) - keeping lower`);
                        }
                    } else {
                        // Outside vocal range, double it
                        autocorrFreq *= 2;
                        if (this.diagnosticsEnabled) {
                            console.log(`Autocorr octave correction UP: ${refinedResult.frequency.toFixed(1)}Hz -> ${autocorrFreq.toFixed(1)}Hz`);
                        }
                    }
                } else if (ratio > 0.48 && ratio < 0.52) {
                    // Autocorr found double frequency (octave up) - prefer the lower FFT result
                    autocorrFreq /= 2;
                    if (this.diagnosticsEnabled) {
                        console.log(`Autocorr octave correction DOWN: ${refinedResult.frequency.toFixed(1)}Hz -> ${autocorrFreq.toFixed(1)}Hz`);
                    }
                }

                const difference = Math.abs(autocorrFreq - fftResult.frequency) / fftResult.frequency;
                if (difference < 0.10) {
                    finalFrequency = autocorrFreq;
                    detectionMethod = 'hybrid';
                }
            }
        } catch (error) {
            console.warn('Narrow autocorrelation failed, using FFT result:', error);
        }

        // Apply smoothing filter to reduce jitter
        const smoothedFrequency = this.applySmoothingFilter(finalFrequency);

        // Always return a result if FFT detected something
        return {
            frequency: smoothedFrequency,
            note: this.frequencyToNote(smoothedFrequency),
            cents: this.getCents(smoothedFrequency),
            candidates: [],
            method: detectionMethod,
            fftFrequency: fftResult.frequency,
            fftConfidence: fftResult.confidence
        };
    }

    applySmoothingFilter(newFrequency) {
        // Much more lenient smoothing - only reject obvious octave errors
        if (this.smoothingBuffer.length > 0) {
            const medianFreq = [...this.smoothingBuffer].sort((a, b) => a - b)[Math.floor(this.smoothingBuffer.length / 2)];
            const ratio = newFrequency / medianFreq;

            // Only reject clear octave jumps (2x or 0.5x)
            if ((ratio > 1.9 && ratio < 2.1) || (ratio > 0.48 && ratio < 0.52)) {
                // If buffer is full and consistent, allow the octave change
                const maxBufferSize = 3;
                if (this.smoothingBuffer.length >= maxBufferSize) {
                    const bufferVariance = Math.max(...this.smoothingBuffer) / Math.min(...this.smoothingBuffer);
                    if (bufferVariance < 1.05) { // Very consistent (within 5%)
                        // Reset buffer to allow octave change
                        this.smoothingBuffer = [newFrequency];
                        return newFrequency;
                    }
                }
                // Reject the octave jump
                return medianFreq;
            }

            // Allow large pitch changes (user singing different notes)
            // Only reject extreme jumps that are clearly errors
            if (ratio > 2.5 || ratio < 0.4) {
                return medianFreq;
            }
        }

        // Add to buffer
        this.smoothingBuffer.push(newFrequency);

        // Keep buffer size limited to 3 for more responsiveness
        const maxBufferSize = 3;
        if (this.smoothingBuffer.length > maxBufferSize) {
            this.smoothingBuffer.shift();
        }

        // Return median of buffer (most resistant to outliers)
        const sorted = [...this.smoothingBuffer].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
    }

    detectPitch() {
        if (!this.isListening) {
            return null;
        }

        // Use hybrid approach for best results
        return this.detectPitchHybrid();
    }

    calculateRawRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    }

    calculateVolume(buffer) {
        const rms = this.calculateRawRMS(buffer);
        return Math.min(100, rms * 200);
    }

    getVolume() {
        return this.currentVolume;
    }

    getRMS() {
        return this.currentRMS || 0;
    }

    // Get current pitch (alias for detectPitch for compatibility)
    getCurrentPitch() {
        return this.detectPitch();
    }

    setGain(gainValue) {
        window.audioManager.setGain(gainValue);
    }

    getGain() {
        return window.audioManager.getGain();
    }

    frequencyToNote(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);

        const halfSteps = 12 * Math.log2(frequency / C0);
        const octave = Math.floor(halfSteps / 12);
        const noteIndex = Math.round(halfSteps % 12);

        return noteNames[noteIndex] + octave;
    }

    getCents(frequency) {
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const halfSteps = 12 * Math.log2(frequency / C0);
        const nearestNote = Math.round(halfSteps);
        return Math.floor((halfSteps - nearestNote) * 100);
    }

    noteToFrequency(noteName, octave) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const noteIndex = noteNames.indexOf(noteName);

        if (noteIndex === -1) return null;

        const halfStepsFromA4 = (octave - 4) * 12 + (noteIndex - 9);
        return A4 * Math.pow(2, halfStepsFromA4 / 12);
    }

    stop() {
        // Don't stop AudioManager - it's shared
        // Just mark this detector as not listening
        this.isListening = false;
        // Clear smoothing buffer when stopping
        this.smoothingBuffer = [];
        console.log('PitchDetector: Stopped listening');
    }

    // Enable diagnostic logging
    enableDiagnostics(callback) {
        this.diagnosticsEnabled = true;
        this.diagnosticsCallback = callback;
    }

    // Disable diagnostic logging
    disableDiagnostics() {
        this.diagnosticsEnabled = false;
        this.diagnosticsCallback = null;
    }

    // Get raw buffer data for waveform visualization
    getWaveformData() {
        if (!this.buffer) return null;
        return Array.from(this.buffer);
    }

    // Check if signal is clipping
    isClipping() {
        if (!this.buffer) return false;
        for (let i = 0; i < this.buffer.length; i++) {
            if (Math.abs(this.buffer[i]) >= 0.99) {
                return true;
            }
        }
        return false;
    }
}
