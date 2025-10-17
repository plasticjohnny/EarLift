// Pitch Detection using Web Audio API and Autocorrelation
class PitchDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.gainNode = null;
        this.stream = null;
        this.buffer = null;
        this.isListening = false;
        this.currentVolume = 0;
        this.microphoneGain = 1.0; // Default gain level

        // Diagnostic logging
        this.diagnosticsEnabled = false;
        this.diagnosticsCallback = null;
        this.lastDiagnosticTime = 0;
        this.diagnosticInterval = 100; // Log every 100ms
    }

    async initialize(deviceId = null) {
        try {
            // Request microphone access with optional device ID
            const constraints = {
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false,
                    sampleRate: { ideal: 48000 }, // AirPods prefer 48kHz
                    channelCount: { ideal: 1 } // Mono is fine for pitch detection
                }
            };

            // If specific device requested, add it to constraints
            if (deviceId) {
                constraints.audio.deviceId = { exact: deviceId };
            }

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Log which device we're actually using
            const audioTracks = this.stream.getAudioTracks();
            let deviceName = 'Unknown';
            if (audioTracks.length > 0) {
                deviceName = audioTracks[0].label || 'Default Microphone';
                console.log('Using microphone:', deviceName);
                console.log('Settings:', audioTracks[0].getSettings());
            }

            // Create audio context - let it use native sample rate
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({
                latencyHint: 'interactive'
                // Don't force sample rate - use native
            });

            console.log('Audio context sample rate:', this.audioContext.sampleRate);

            // Update debug panel with microphone info
            if (window.debugMode) {
                window.debugMode.setMicrophoneInfo(deviceName, this.audioContext.sampleRate);
            }

            // Resume context if suspended (iOS)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;

            // Create gain node for volume control
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.microphoneGain;

            // Connect microphone -> gain -> analyser
            this.microphone = this.audioContext.createMediaStreamSource(this.stream);
            this.microphone.connect(this.gainNode);
            this.gainNode.connect(this.analyser);

            // Create buffer for time-domain data
            const bufferLength = this.analyser.fftSize;
            this.buffer = new Float32Array(bufferLength);

            this.isListening = true;
            return true;
        } catch (error) {
            console.error('Error initializing pitch detector:', error);
            throw new Error('Microphone access denied. Please allow microphone access to use this app.');
        }
    }

    // Autocorrelation algorithm for pitch detection with overtone/undertone filtering
    autoCorrelate(buffer, sampleRate) {
        const SIZE = buffer.length;
        let best_offset = -1;
        let best_correlation = 0;
        let rms = 0;

        // Calculate RMS to check signal strength
        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        // Threshold tuned to ignore background noise while detecting singing
        // With gain applied, even quiet signals should be detectable
        const rmsThreshold = 0.003;
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
                    sampleRate: sampleRate
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

        // Use normalized square difference for better accuracy
        const correlations = new Array(MAX_OFFSET);

        for (let offset = MIN_OFFSET; offset < MAX_OFFSET; offset++) {
            let sum = 0;

            // Use fewer samples for higher frequencies to speed up
            const step = offset < 50 ? 1 : 2;

            for (let i = 0; i < SIZE / 2; i += step) {
                const diff = buffer[i] - buffer[i + offset];
                sum += diff * diff;
            }

            correlations[offset] = sum;
        }

        // Find multiple local minima (candidate pitches)
        const candidates = [];
        const threshold = 0.3; // Correlation threshold for considering a candidate

        for (let offset = MIN_OFFSET; offset < MAX_OFFSET; offset++) {
            // Check if this is a local minimum
            if (offset > MIN_OFFSET && offset < MAX_OFFSET - 1) {
                if (correlations[offset] < correlations[offset - 1] &&
                    correlations[offset] < correlations[offset + 1]) {
                    candidates.push({ offset, value: correlations[offset] });
                }
            }
        }

        // Sort candidates by correlation strength (lower is better)
        candidates.sort((a, b) => a.value - b.value);

        // Store top candidates with frequencies for debugging
        const debugCandidates = candidates.slice(0, 5).map(c => ({
            freq: Math.round(sampleRate / c.offset),
            correlation: c.value.toFixed(6)
        }));

        // Improved fundamental detection: look for the lowest frequency that other candidates are multiples of
        // This helps when overtones are stronger than the fundamental (common with "oo" vowels)
        let bestCandidate = null;

        // First, prefer candidates in the vocal range (80 Hz - 1200 Hz)
        // Lower frequencies are often noise or room rumble
        const PREFERRED_MIN = 80;
        const PREFERRED_MAX = 1200;

        // Check top candidates to find potential fundamental
        const topCandidates = candidates.slice(0, 10).map(c => ({
            freq: sampleRate / c.offset,
            offset: c.offset,
            value: c.value
        })).filter(c => c.freq >= MIN_FREQUENCY && c.freq <= MAX_FREQUENCY);

        // For each candidate, check if other strong candidates are harmonics of it
        // The fundamental will have the most harmonics present
        for (let i = 0; i < topCandidates.length; i++) {
            const candidate = topCandidates[i];
            let harmonicCount = 0;

            // Check if other strong candidates are multiples of this frequency
            for (let j = 0; j < topCandidates.length; j++) {
                if (i === j) continue;

                const ratio = topCandidates[j].freq / candidate.freq;
                const nearestMultiple = Math.round(ratio);

                // If another candidate is close to a harmonic multiple (2x, 3x, 4x, etc.)
                if (nearestMultiple >= 2 && Math.abs(ratio - nearestMultiple) < 0.12) {
                    harmonicCount++;
                }
            }

            // Store harmonic count for decision making
            topCandidates[i].harmonicCount = harmonicCount;
        }

        // Sort by harmonic count (descending), then by correlation strength (ascending)
        topCandidates.sort((a, b) => {
            if (b.harmonicCount !== a.harmonicCount) {
                return b.harmonicCount - a.harmonicCount;
            }
            return a.value - b.value;
        });

        // Now select best candidate with preference for vocal range
        for (let i = 0; i < topCandidates.length; i++) {
            const candidate = topCandidates[i];
            const candidateFreq = candidate.freq;

            // Calculate correlation quality score
            const correlationQuality = candidate.value / (rms * rms * SIZE);

            let isNoise = false;

            // Additional filtering: very low frequencies are likely noise unless they have very strong correlation
            if (candidateFreq < PREFERRED_MIN) {
                // Only accept very low frequencies if they have exceptional correlation AND harmonics
                if (correlationQuality > 0.1 && candidate.harmonicCount === 0) {
                    isNoise = true;
                }
            }

            // Prefer candidates in the typical vocal range
            const inPreferredRange = candidateFreq >= PREFERRED_MIN && candidateFreq <= PREFERRED_MAX;

            if (!isNoise) {
                // If we haven't found a candidate yet
                if (bestCandidate === null) {
                    bestCandidate = candidate;
                } else {
                    const bestFreq = bestCandidate.freq;
                    const bestInPreferred = bestFreq >= PREFERRED_MIN && bestFreq <= PREFERRED_MAX;

                    // Replace if this candidate is in preferred range and previous wasn't
                    if (inPreferredRange && !bestInPreferred) {
                        bestCandidate = candidate;
                    } else if (inPreferredRange === bestInPreferred) {
                        // Within same range, prefer one with more harmonics
                        if (candidate.harmonicCount > bestCandidate.harmonicCount) {
                            bestCandidate = candidate;
                        }
                    }
                }

                // If we found a good candidate with harmonics in the preferred range, we can stop
                if (inPreferredRange && candidate.harmonicCount >= 2 && correlationQuality < 0.05) {
                    break;
                }
            }
        }

        // Use best candidate or fall back to first candidate
        const minPos = bestCandidate ? bestCandidate.offset : (topCandidates.length > 0 ? topCandidates[0].offset : -1);

        // Refine with parabolic interpolation for sub-sample accuracy
        if (minPos > MIN_OFFSET && minPos < MAX_OFFSET - 1) {
            const y0 = correlations[minPos - 1];
            const y1 = correlations[minPos];
            const y2 = correlations[minPos + 1];

            const delta = (y2 - y0) / (2 * (2 * y1 - y2 - y0));
            const interpolatedOffset = minPos + delta;

            if (interpolatedOffset > 0 && !isNaN(interpolatedOffset)) {
                const frequency = sampleRate / interpolatedOffset;

                // Validate frequency is in reasonable range
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

    detectPitch() {
        if (!this.isListening || !this.analyser) {
            return null;
        }

        this.analyser.getFloatTimeDomainData(this.buffer);

        // Calculate current volume level (RMS) and raw RMS
        this.currentVolume = this.calculateVolume(this.buffer);
        this.currentRMS = this.calculateRawRMS(this.buffer);

        const result = this.autoCorrelate(this.buffer, this.audioContext.sampleRate);

        if (result.frequency > 0) {
            return {
                frequency: result.frequency,
                note: this.frequencyToNote(result.frequency),
                cents: this.getCents(result.frequency),
                candidates: result.candidates // For debugging
            };
        }

        return null;
    }

    calculateRawRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    }

    calculateVolume(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sum / buffer.length);
        // Normalize to 0-100 range (typical RMS values are 0-0.5)
        return Math.min(100, rms * 200);
    }

    getVolume() {
        return this.currentVolume;
    }

    getRMS() {
        return this.currentRMS || 0;
    }

    setGain(gainValue) {
        // Clamp gain between 0.1 and 5.0
        this.microphoneGain = Math.max(0.1, Math.min(5.0, gainValue));

        if (this.gainNode) {
            this.gainNode.gain.value = this.microphoneGain;
        }
    }

    getGain() {
        return this.microphoneGain;
    }

    // Convert frequency to musical note
    frequencyToNote(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);

        const halfSteps = 12 * Math.log2(frequency / C0);
        const octave = Math.floor(halfSteps / 12);
        const noteIndex = Math.round(halfSteps % 12);

        return noteNames[noteIndex] + octave;
    }

    // Calculate how many cents off from the nearest note
    getCents(frequency) {
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const halfSteps = 12 * Math.log2(frequency / C0);
        const nearestNote = Math.round(halfSteps);
        return Math.floor((halfSteps - nearestNote) * 100);
    }

    // Get the frequency of a specific note
    noteToFrequency(noteName, octave) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const noteIndex = noteNames.indexOf(noteName);

        if (noteIndex === -1) return null;

        const halfStepsFromA4 = (octave - 4) * 12 + (noteIndex - 9);
        return A4 * Math.pow(2, halfStepsFromA4 / 12);
    }

    stop() {
        // Stop all media stream tracks (this turns off the microphone)
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Disconnect and clean up audio nodes
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }

        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.buffer = null;
        this.isListening = false;
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
