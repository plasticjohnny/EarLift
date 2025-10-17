// Pitch Detector using Pitchy library
// This is an alternative to pitchDetector.v2.js that uses the Pitchy library
class PitchDetectorPitchy {
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
        this.fftLogInterval = 500; // Log FFT results every 500ms (slower for readability)
        this.volumeThreshold = 20; // Only log when volume is above this (ignore background noise)

        // Pitchy detector (will be initialized after Pitchy library loads)
        this.detector = null;

        // Smoothing buffer for stable readings
        this.smoothingBuffer = [];
        this.smoothingBufferSize = 3;
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

        // Initialize Pitchy detector
        if (typeof Pitchy !== 'undefined') {
            const audioContext = window.audioManager.getAudioContext();
            this.detector = Pitchy.PitchDetector.forFloat32Array(analyser.fftSize);
        } else {
            throw new Error('Pitchy library not loaded');
        }

        this.isListening = true;
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

        // Initialize Pitchy detector
        if (typeof Pitchy !== 'undefined') {
            const audioContext = window.audioManager.getAudioContext();
            this.detector = Pitchy.PitchDetector.forFloat32Array(analyser.fftSize);
        } else {
            throw new Error('Pitchy library not loaded');
        }

        this.isListening = true;
        console.log('PitchDetectorPitchy: Initialized with shared audio');
        return true;
    }

    detectPitch() {
        if (!this.isListening || !this.detector) {
            return null;
        }

        const analyser = window.audioManager.getAnalyser();
        const audioContext = window.audioManager.getAudioContext();

        if (!analyser || !audioContext || !this.buffer) {
            return null;
        }

        // Get time-domain data
        analyser.getFloatTimeDomainData(this.buffer);

        // Calculate volume metrics
        this.currentVolume = this.calculateVolume(this.buffer);
        this.currentRMS = this.calculateRawRMS(this.buffer);

        const now = Date.now();

        // Use Pitchy to detect pitch
        const sampleRate = audioContext.sampleRate;
        let [pitch, clarity] = this.detector.findPitch(this.buffer, sampleRate);

        // Pitchy sometimes detects sub-harmonics (octaves too low)
        // Multiply by 2 until we're in reasonable vocal range (80-2000 Hz)
        while (pitch > 0 && pitch < 80 && pitch * 2 < 2000) {
            pitch *= 2;
        }

        // Pitchy returns pitch and clarity (0-1)
        // Lower clarity threshold significantly - voice is harder to detect than pure tones
        // Check for reasonable frequency range (80-2000 Hz) after octave correction
        if (pitch >= 80 && pitch < 2000 && clarity > 0.1) {
            // Apply smoothing filter
            const smoothedFrequency = this.applySmoothingFilter(pitch);

            return {
                frequency: smoothedFrequency,
                note: this.frequencyToNote(smoothedFrequency),
                cents: this.getCents(smoothedFrequency),
                confidence: clarity,
                method: 'pitchy',
                candidates: []
            };
        }

        return null;
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

    // Check if audio is clipping
    isClipping() {
        if (!this.buffer) return false;
        for (let i = 0; i < this.buffer.length; i++) {
            if (Math.abs(this.buffer[i]) >= 0.99) {
                return true;
            }
        }
        return false;
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

    stop() {
        // Don't stop AudioManager - it's shared
        // Just mark this detector as not listening
        this.isListening = false;
        // Clear smoothing buffer when stopping
        this.smoothingBuffer = [];
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

    // Stub methods for compatibility with diagnostics
    detectPitchFFT() {
        // Pitchy doesn't separate FFT detection - just return null
        return null;
    }

    autoCorrelate(buffer, sampleRate) {
        // Pitchy uses its own autocorrelation internally - just return null
        return null;
    }

    getWaveformData() {
        // Return the current buffer if available
        if (this.buffer) {
            return Array.from(this.buffer);
        }
        return [];
    }
}
