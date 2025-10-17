/**
 * Audio Service Interface
 * Platform-agnostic interface for audio input/output operations
 *
 * Implementations:
 * - Web: WebAudioService (uses Web Audio API)
 * - iOS: IOSAudioService (uses AVAudioEngine)
 * - Android: AndroidAudioService (uses AudioRecord/AudioTrack)
 */
class IAudioService {
    /**
     * Initialize audio system
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        throw new Error('IAudioService.initialize() must be implemented');
    }

    /**
     * Initialize audio for playback only (no microphone)
     * @returns {Promise<boolean>} Success status
     */
    async initializePlaybackOnly() {
        throw new Error('IAudioService.initializePlaybackOnly() must be implemented');
    }

    /**
     * Get audio context (or equivalent platform object)
     * @returns {Object} Platform audio context
     */
    getAudioContext() {
        throw new Error('IAudioService.getAudioContext() must be implemented');
    }

    /**
     * Get analyser node for frequency analysis
     * @returns {Object} Analyser node
     */
    getAnalyser() {
        throw new Error('IAudioService.getAnalyser() must be implemented');
    }

    /**
     * Get sample rate of audio system
     * @returns {number} Sample rate in Hz
     */
    getSampleRate() {
        throw new Error('IAudioService.getSampleRate() must be implemented');
    }

    /**
     * Get FFT size for frequency analysis
     * @returns {number} FFT size
     */
    getFFTSize() {
        throw new Error('IAudioService.getFFTSize() must be implemented');
    }

    /**
     * Get time domain data (waveform)
     * @param {Float32Array} buffer - Buffer to fill with data
     */
    getTimeDomainData(buffer) {
        throw new Error('IAudioService.getTimeDomainData() must be implemented');
    }

    /**
     * Get frequency domain data (spectrum)
     * @param {Float32Array} buffer - Buffer to fill with data
     */
    getFrequencyData(buffer) {
        throw new Error('IAudioService.getFrequencyData() must be implemented');
    }

    /**
     * Set microphone gain
     * @param {number} gain - Gain multiplier (0.1 to 5.0)
     */
    setMicrophoneGain(gain) {
        throw new Error('IAudioService.setMicrophoneGain() must be implemented');
    }

    /**
     * Get current microphone gain
     * @returns {number} Current gain multiplier
     */
    getMicrophoneGain() {
        throw new Error('IAudioService.getMicrophoneGain() must be implemented');
    }

    /**
     * Change microphone device
     * @param {string} deviceId - Device identifier
     * @returns {Promise<boolean>} Success status
     */
    async changeMicrophone(deviceId) {
        throw new Error('IAudioService.changeMicrophone() must be implemented');
    }

    /**
     * Get available microphone devices
     * @returns {Promise<Array>} Array of {id, label} objects
     */
    async getAvailableMicrophones() {
        throw new Error('IAudioService.getAvailableMicrophones() must be implemented');
    }

    /**
     * Play tone at specified frequency
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds (0 = infinite)
     * @param {number} volume - Volume 0.0 to 1.0
     * @returns {Object} Tone handle (for stopping)
     */
    playTone(frequency, duration = 0, volume = 0.5) {
        throw new Error('IAudioService.playTone() must be implemented');
    }

    /**
     * Stop currently playing tone
     */
    stopTone() {
        throw new Error('IAudioService.stopTone() must be implemented');
    }

    /**
     * Stop audio system and release resources
     */
    stop() {
        throw new Error('IAudioService.stop() must be implemented');
    }

    /**
     * Resume audio context (for user gesture requirements)
     */
    async resume() {
        throw new Error('IAudioService.resume() must be implemented');
    }

    /**
     * Check if audio system is initialized
     * @returns {boolean}
     */
    isInitialized() {
        throw new Error('IAudioService.isInitialized() must be implemented');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IAudioService;
}
