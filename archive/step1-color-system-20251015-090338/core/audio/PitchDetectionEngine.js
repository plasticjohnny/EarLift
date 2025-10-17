/**
 * Pitch Detection Engine (Core Business Logic)
 * Platform-agnostic pitch detection using FFT + Autocorrelation
 *
 * This class contains ZERO platform-specific code.
 * All audio I/O goes through IAudioService interface.
 */
class PitchDetectionEngine {
    constructor(audioService) {
        if (!audioService) {
            throw new Error('PitchDetectionEngine requires an IAudioService implementation');
        }

        this.audioService = audioService;
        this.isActive = false;

        // Frequency tracking for stability
        this.lastDetectedFrequency = null;
        this.lastDetectionTime = 0;
        this.stabilityWindow = 500; // ms

        // Buffers (will be initialized when started)
        this.timeBuffer = null;
        this.frequencyBuffer = null;

        // Diagnostics
        this.diagnosticsEnabled = false;
        this.diagnosticsCallback = null;
        this.lastRejectionReason = null;

        // Constants
        this.MIN_FREQUENCY = 50;  // Hz
        this.MAX_FREQUENCY = 2000; // Hz
        this.VOCAL_MIN = 80;       // Hz - Minimum fundamental for voice
        this.VOCAL_MAX = 800;      // Hz - Maximum fundamental for voice
        this.FFT_THRESHOLD = -120; // dB - Very permissive threshold
    }

    /**
     * Start pitch detection
     */
    start() {
        if (!this.audioService.isInitialized()) {
            throw new Error('Audio service must be initialized before starting pitch detection');
        }

        const fftSize = this.audioService.getFFTSize();
        this.timeBuffer = new Float32Array(fftSize);
        this.frequencyBuffer = new Float32Array(fftSize / 2);

        this.isActive = true;
    }

    /**
     * Stop pitch detection
     */
    stop() {
        this.isActive = false;
        this.timeBuffer = null;
        this.frequencyBuffer = null;
    }

    /**
     * Detect pitch from current audio input
     * @returns {Object|null} {frequency, note, cents, method} or null
     */
    detectPitch() {
        if (!this.isActive) {
            return null;
        }

        // Use hybrid approach: FFT for initial detection, autocorr for refinement
        return this.detectPitchHybrid();
    }

    /**
     * FFT-based pitch detection
     * @returns {Object|null}
     */
    detectPitchFFT() {
        this.lastRejectionReason = null;

        // Get frequency domain data from audio service
        this.audioService.getFrequencyData(this.frequencyBuffer);

        const sampleRate = this.audioService.getSampleRate();
        const bufferLength = this.frequencyBuffer.length;
        const nyquist = sampleRate / 2;

        // Find all peaks above threshold in vocal range
        const peaks = this._findPeaks(bufferLength, nyquist);

        if (peaks.length === 0) {
            this.lastRejectionReason = `No peaks above ${this.FFT_THRESHOLD}dB threshold (signal too quiet)`;
            if (this.diagnosticsEnabled) {
                console.log('FFT: No peaks found above threshold - signal too quiet');
            }
            return null;
        }

        // Sort peaks by strength
        peaks.sort((a, b) => b.value - a.value);

        if (this.diagnosticsEnabled) {
            console.log(`FFT found ${peaks.length} peaks:`,
                peaks.map(p => `${p.freq.toFixed(1)}Hz (${p.value.toFixed(1)}dB)`));
        }

        // Find fundamental frequency with harmonic analysis
        const fundamental = this._findFundamental(peaks);

        if (!fundamental) {
            return null; // Rejection reason set by _findFundamental
        }

        // Refine frequency with parabolic interpolation
        const frequency = this._interpolateFrequency(fundamental, bufferLength, nyquist);

        // Update tracking for stability
        this.lastDetectedFrequency = frequency;
        this.lastDetectionTime = Date.now();

        return {
            frequency: frequency,
            confidence: fundamental.value,
            method: 'fft',
            threshold: this.FFT_THRESHOLD
        };
    }

    /**
     * Autocorrelation pitch detection (full range)
     * @returns {Object}
     */
    autoCorrelate() {
        this.audioService.getTimeDomainData(this.timeBuffer);

        const sampleRate = this.audioService.getSampleRate();
        const size = this.timeBuffer.length;

        // Calculate RMS
        const rms = this._calculateRMS(this.timeBuffer);

        // Threshold tuned to ignore background noise
        if (rms < 0.003) {
            return { frequency: -1, rms, method: 'autocorr' };
        }

        // Calculate autocorrelation
        const minOffset = Math.max(Math.floor(sampleRate / this.MAX_FREQUENCY), 4);
        const maxOffset = Math.min(Math.floor(sampleRate / this.MIN_FREQUENCY), size / 2);

        const correlations = new Array(maxOffset);

        for (let offset = minOffset; offset < maxOffset; offset++) {
            let sum = 0;
            const step = offset < 50 ? 1 : 2;

            for (let i = 0; i < size / 2; i += step) {
                const diff = this.timeBuffer[i] - this.timeBuffer[i + offset];
                sum += diff * diff;
            }

            correlations[offset] = sum;
        }

        // Find minimum (best correlation)
        let minValue = Infinity;
        let minPos = minOffset;

        for (let i = minOffset; i < maxOffset; i++) {
            if (correlations[i] < minValue) {
                minValue = correlations[i];
                minPos = i;
            }
        }

        // Parabolic interpolation
        if (minPos > minOffset && minPos < maxOffset - 1) {
            const y0 = correlations[minPos - 1];
            const y1 = correlations[minPos];
            const y2 = correlations[minPos + 1];

            const delta = (y2 - y0) / (2 * (2 * y1 - y2 - y0));
            const interpolatedOffset = minPos + delta;

            if (interpolatedOffset > 0 && !isNaN(interpolatedOffset)) {
                const frequency = sampleRate / interpolatedOffset;
                return { frequency, rms, method: 'autocorr' };
            }
        }

        const frequency = sampleRate / minPos;
        return { frequency, rms, method: 'autocorr' };
    }

    /**
     * Hybrid approach: FFT + Autocorrelation
     * @returns {Object|null}
     */
    detectPitchHybrid() {
        // Step 1: Try FFT
        const fftResult = this.detectPitchFFT();

        if (!fftResult || !fftResult.frequency) {
            // Fallback to full autocorrelation
            const autocorrResult = this.autoCorrelate();
            if (autocorrResult.frequency > 0 &&
                autocorrResult.frequency >= this.MIN_FREQUENCY &&
                autocorrResult.frequency <= this.MAX_FREQUENCY) {
                return {
                    frequency: autocorrResult.frequency,
                    note: this._frequencyToNote(autocorrResult.frequency),
                    cents: this._getCents(autocorrResult.frequency),
                    method: 'autocorr-fallback'
                };
            }
            return null;
        }

        // FFT found something - return it
        // (In future could refine with narrow autocorr, but FFT is good enough now)
        return {
            frequency: fftResult.frequency,
            note: this._frequencyToNote(fftResult.frequency),
            cents: this._getCents(fftResult.frequency),
            method: 'fft-only',
            fftFrequency: fftResult.frequency,
            fftConfidence: fftResult.confidence
        };
    }

    /**
     * Enable diagnostics logging
     * @param {Function} callback - Called with diagnostic data
     */
    enableDiagnostics(callback) {
        this.diagnosticsEnabled = true;
        this.diagnosticsCallback = callback;
    }

    /**
     * Disable diagnostics logging
     */
    disableDiagnostics() {
        this.diagnosticsEnabled = false;
        this.diagnosticsCallback = null;
    }

    // ============================================
    // PRIVATE METHODS (Pure logic, no I/O)
    // ============================================

    /**
     * Find peaks in frequency spectrum
     * @private
     */
    _findPeaks(bufferLength, nyquist) {
        const peaks = [];
        const minBin = Math.floor((this.MIN_FREQUENCY / nyquist) * bufferLength);
        const maxBin = Math.ceil((this.MAX_FREQUENCY / nyquist) * bufferLength);

        for (let i = minBin + 1; i < maxBin - 1 && i < bufferLength - 1; i++) {
            const value = this.frequencyBuffer[i];
            if (value > this.FFT_THRESHOLD &&
                value > this.frequencyBuffer[i - 1] &&
                value > this.frequencyBuffer[i + 1]) {
                const freq = (i * nyquist) / bufferLength;
                peaks.push({ bin: i, value: value, freq: freq });
            }
        }

        return peaks;
    }

    /**
     * Find fundamental frequency with harmonic analysis
     * @private
     */
    _findFundamental(peaks) {
        const candidates = [];

        for (let candidate of peaks) {
            if (candidate.freq < this.VOCAL_MIN) continue;

            // Check harmonic support
            let harmonicCount = 0;
            const foundHarmonics = [];

            for (let harmonic = 2; harmonic <= 5; harmonic++) {
                const expectedFreq = candidate.freq * harmonic;
                if (expectedFreq > this.MAX_FREQUENCY) break;

                // Look for peak near this harmonic (within 5%)
                for (let peak of peaks) {
                    const ratio = peak.freq / candidate.freq;
                    if (Math.abs(ratio - harmonic) < 0.05) {
                        harmonicCount++;
                        foundHarmonics.push(harmonic);
                        break;
                    }
                }
            }

            const inPreferred = candidate.freq >= this.VOCAL_MIN && candidate.freq <= this.VOCAL_MAX;

            // Stability bonus
            let stabilityBonus = 0;
            const now = Date.now();
            if (this.lastDetectedFrequency && (now - this.lastDetectionTime) < this.stabilityWindow) {
                const freqDiff = Math.abs(candidate.freq - this.lastDetectedFrequency) / this.lastDetectedFrequency;
                if (freqDiff < 0.05) stabilityBonus = 15;
                else if (freqDiff < 0.10) stabilityBonus = 8;
            }

            const score = harmonicCount * 10 + (inPreferred ? 5 : 0) + (candidate.value + 120) / 10 + stabilityBonus;

            candidates.push({
                freq: candidate.freq,
                value: candidate.value,
                bin: candidate.bin,
                harmonicCount,
                inPreferred,
                stabilityBonus,
                score
            });
        }

        candidates.sort((a, b) => b.score - a.score);

        if (this.diagnosticsEnabled && candidates.length > 0) {
            console.log('Top candidates:', candidates.slice(0, 3).map(c =>
                `${c.freq.toFixed(1)}Hz (h:${c.harmonicCount}, pref:${c.inPreferred}, stab:${c.stabilityBonus}, score:${c.score.toFixed(1)})`
            ));
        }

        // Pick best candidate with harmonics in preferred range
        const goodCandidates = candidates.filter(c => c.harmonicCount >= 1 && c.inPreferred);

        if (goodCandidates.length > 0) {
            if (this.diagnosticsEnabled) {
                console.log(`Selected: ${goodCandidates[0].freq.toFixed(1)}Hz with ${goodCandidates[0].harmonicCount} harmonics`);
            }
            return goodCandidates[0];
        }

        // No harmonics - use loudest in preferred range
        const preferredPeak = candidates.find(c => c.inPreferred);
        if (preferredPeak) {
            if (this.diagnosticsEnabled) {
                console.log(`No harmonics found, using loudest in range: ${preferredPeak.freq.toFixed(1)}Hz`);
            }
            return preferredPeak;
        }

        // All peaks outside vocal range
        this.lastRejectionReason = `All ${peaks.length} peaks outside vocal range (${this.VOCAL_MIN}-${this.VOCAL_MAX}Hz)`;
        if (this.diagnosticsEnabled) {
            console.log('REJECT: All peaks outside vocal range');
        }
        return null;
    }

    /**
     * Interpolate frequency for sub-bin accuracy
     * @private
     */
    _interpolateFrequency(fundamental, bufferLength, nyquist) {
        const maxIndex = fundamental.bin;

        if (maxIndex > 0 && maxIndex < bufferLength - 1) {
            const y0 = this.frequencyBuffer[maxIndex - 1];
            const y1 = this.frequencyBuffer[maxIndex];
            const y2 = this.frequencyBuffer[maxIndex + 1];

            const delta = 0.5 * (y2 - y0) / (2 * y1 - y2 - y0);
            const interpolatedIndex = maxIndex + delta;

            return (interpolatedIndex * nyquist) / bufferLength;
        }

        return (maxIndex * nyquist) / bufferLength;
    }

    /**
     * Calculate RMS of buffer
     * @private
     */
    _calculateRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    }

    /**
     * Convert frequency to note name
     * @private
     */
    _frequencyToNote(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const a4 = 440;
        const c0 = a4 * Math.pow(2, -4.75);

        if (frequency < 1) return null;

        const halfSteps = 12 * Math.log2(frequency / c0);
        const noteIndex = Math.round(halfSteps);
        const octave = Math.floor(noteIndex / 12);
        const note = noteIndex % 12;

        return noteNames[note] + octave;
    }

    /**
     * Get cents offset from nearest note
     * @private
     */
    _getCents(frequency) {
        const a4 = 440;
        const c0 = a4 * Math.pow(2, -4.75);

        if (frequency < 1) return 0;

        const halfSteps = 12 * Math.log2(frequency / c0);
        const nearestNote = Math.round(halfSteps);
        const cents = Math.round((halfSteps - nearestNote) * 100);

        return cents;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PitchDetectionEngine;
}
