// Pitch Detector Configuration
// This file controls which pitch detector implementation to use

const PITCH_DETECTOR_CONFIG = {
    // Options: 'custom' or 'pitchy'
    // 'custom' = our custom FFT/autocorrelation implementation (pitchDetector.v2.js)
    // 'pitchy' = Pitchy library implementation (pitchDetector.pitchy.js)
    activeDetector: 'pitchy',

    // Enable this to see which detector is being used
    debugMode: true
};

// Save the original custom PitchDetector
// Note: PitchDetector is a global class, not window.PitchDetector
const PitchDetectorCustom = (typeof PitchDetector !== 'undefined') ? PitchDetector : null;

// Create a wrapper class that delegates to the configured detector
class PitchDetectorWrapper {
    constructor() {
        if (PITCH_DETECTOR_CONFIG.debugMode) {
            console.log(`%cUsing pitch detector: ${PITCH_DETECTOR_CONFIG.activeDetector}`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
        }

        // Create the actual detector based on config
        if (PITCH_DETECTOR_CONFIG.activeDetector === 'pitchy') {
            if (typeof PitchDetectorPitchy === 'undefined') {
                console.error('PitchDetectorPitchy not loaded! Falling back to custom detector.');
                this._detector = new PitchDetectorCustom();
            } else {
                this._detector = new PitchDetectorPitchy();
            }
        } else {
            this._detector = new PitchDetectorCustom();
        }
    }

    // Delegate all methods to the actual detector
    async initialize(deviceId) {
        return this._detector.initialize(deviceId);
    }

    async initializeWithSharedAudio() {
        if (this._detector.initializeWithSharedAudio) {
            return this._detector.initializeWithSharedAudio();
        }
        // Fallback to regular initialize if method doesn't exist
        return this._detector.initialize();
    }

    detectPitch() {
        return this._detector.detectPitch();
    }

    getCurrentPitch() {
        if (this._detector.getCurrentPitch) {
            return this._detector.getCurrentPitch();
        }
        // Fallback to detectPitch if method doesn't exist
        return this._detector.detectPitch();
    }

    getVolume() {
        return this._detector.getVolume();
    }

    getRMS() {
        return this._detector.getRMS();
    }

    setGain(gainValue) {
        return this._detector.setGain(gainValue);
    }

    getGain() {
        return this._detector.getGain();
    }

    stop() {
        return this._detector.stop();
    }

    enableDiagnostics(callback) {
        return this._detector.enableDiagnostics(callback);
    }

    disableDiagnostics() {
        return this._detector.disableDiagnostics();
    }

    isClipping() {
        if (this._detector.isClipping) {
            return this._detector.isClipping();
        }
        return false;
    }

    detectPitchFFT() {
        if (this._detector.detectPitchFFT) {
            return this._detector.detectPitchFFT();
        }
        return null;
    }

    autoCorrelate(buffer, sampleRate) {
        if (this._detector.autoCorrelate) {
            return this._detector.autoCorrelate(buffer, sampleRate);
        }
        return null;
    }

    getWaveformData() {
        if (this._detector.getWaveformData) {
            return this._detector.getWaveformData();
        }
        return [];
    }

    frequencyToNote(frequency) {
        if (this._detector.frequencyToNote) {
            return this._detector.frequencyToNote(frequency);
        }
        return 'N/A';
    }

    // Expose buffer property for direct access
    get buffer() {
        return this._detector.buffer;
    }

    // Expose lastRejectionReason property
    get lastRejectionReason() {
        return this._detector.lastRejectionReason || 'Unknown';
    }

    // Expose currentVolume property for direct access
    get currentVolume() {
        return this._detector.currentVolume || 0;
    }

    // Expose currentRMS property for direct access
    get currentRMS() {
        return this._detector.currentRMS || 0;
    }
}

// Replace the global PitchDetector with our wrapper
// Need to reassign in global scope, not just window object
PitchDetector = PitchDetectorWrapper;
window.PitchDetector = PitchDetectorWrapper;
window.PitchDetectorCustom = PitchDetectorCustom;

// Log that the config has loaded (only in debug mode)
if (PITCH_DETECTOR_CONFIG.debugMode) {
    console.log('%cPitch Detector Config Loaded - wrapper installed', 'color: yellow; font-weight: bold;');
}
