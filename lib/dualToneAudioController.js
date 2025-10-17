/**
 * Dual Tone Audio Controller
 *
 * Manages two ToneGenerator instances for dual-tone audio playback and
 * calculates beat amplitude based on the frequency difference.
 *
 * Usage:
 *   const audioCtrl = new DualToneAudioController();
 *   audioCtrl.setFrequencies(440, 554);
 *   audioCtrl.playBoth();
 *   const beatAmp = audioCtrl.getBeatAmplitude();
 *   audioCtrl.stopBoth();
 *   audioCtrl.destroy();
 */

class DualToneAudioController {
    constructor() {
        // Create tone generators
        this.toneGen1 = new ToneGenerator();
        this.toneGen2 = new ToneGenerator();

        // Frequencies
        this.tone1Freq = 440;
        this.tone2Freq = 554;

        // Playback state
        this.isPlayingTone1 = false;
        this.isPlayingTone2 = false;

        // Timing for animations
        this.tone1StartTime = null;
        this.tone1StopTime = null;
        this.tone2StartTime = null;
        this.tone2StopTime = null;

        // Beat amplitude (for visualization)
        this.beatAmplitude = 0;
        this.startTime = performance.now();

        console.log('DualToneAudioController initialized');
    }

    /**
     * Set frequencies for both tones
     * @param {number} freq1 - Frequency for tone 1 (Hz)
     * @param {number} freq2 - Frequency for tone 2 (Hz)
     */
    setFrequencies(freq1, freq2) {
        this.tone1Freq = freq1;
        this.tone2Freq = freq2;
    }

    /**
     * Set frequency for tone 1
     * @param {number} freq - Frequency in Hz
     * @param {boolean} updateIfPlaying - If true, update frequency while playing
     */
    setTone1Frequency(freq, updateIfPlaying = false) {
        this.tone1Freq = freq;
        if (updateIfPlaying && this.isPlayingTone1) {
            this.toneGen1.playTone(this.tone1Freq);
        }
    }

    /**
     * Set frequency for tone 2
     * @param {number} freq - Frequency in Hz
     * @param {boolean} updateIfPlaying - If true, update frequency while playing
     */
    setTone2Frequency(freq, updateIfPlaying = false) {
        this.tone2Freq = freq;
        if (updateIfPlaying && this.isPlayingTone2) {
            this.toneGen2.playTone(this.tone2Freq);
        }
    }

    /**
     * Play tone 1
     * @param {boolean} resetTiming - If true, reset start time (for expand animation)
     */
    playTone1(resetTiming = true) {
        if (isNaN(this.tone1Freq) || this.tone1Freq <= 0) {
            console.error('Invalid tone1 frequency:', this.tone1Freq);
            this.tone1Freq = 440; // Emergency fallback
        }
        if (!this.toneGen1) {
            console.error('ToneGenerator 1 not initialized!');
            return;
        }
        this.toneGen1.playTone(this.tone1Freq);
        this.isPlayingTone1 = true;
        if (resetTiming) {
            this.tone1StartTime = performance.now();
            this.tone1StopTime = null;
        }
    }

    /**
     * Stop tone 1
     */
    stopTone1() {
        if (this.toneGen1) {
            this.toneGen1.stopTone();
        }
        this.isPlayingTone1 = false;
        this.tone1StopTime = performance.now();
    }

    /**
     * Play tone 2
     * @param {boolean} resetTiming - If true, reset start time (for expand animation)
     */
    playTone2(resetTiming = true) {
        if (isNaN(this.tone2Freq) || this.tone2Freq <= 0) {
            console.error('Invalid tone2 frequency:', this.tone2Freq);
            this.tone2Freq = 554; // Emergency fallback
        }
        if (!this.toneGen2) {
            console.error('ToneGenerator 2 not initialized!');
            return;
        }
        this.toneGen2.playTone(this.tone2Freq);
        this.isPlayingTone2 = true;
        if (resetTiming) {
            this.tone2StartTime = performance.now();
            this.tone2StopTime = null;
        }
    }

    /**
     * Stop tone 2
     */
    stopTone2() {
        if (this.toneGen2) {
            this.toneGen2.stopTone();
        }
        this.isPlayingTone2 = false;
        this.tone2StopTime = performance.now();
    }

    /**
     * Play both tones
     * @param {boolean} resetTiming - If true, reset start times (for expand animation)
     */
    playBoth(resetTiming = true) {
        this.playTone1(resetTiming);
        this.playTone2(resetTiming);
    }

    /**
     * Stop both tones
     */
    stopBoth() {
        this.stopTone1();
        this.stopTone2();
    }

    /**
     * Update frequencies without resetting timing (for smooth frequency changes)
     * Only updates if tones are currently playing
     */
    updatePlayingFrequencies() {
        if (this.isPlayingTone1) {
            this.toneGen1.playTone(this.tone1Freq);
        }
        if (this.isPlayingTone2) {
            this.toneGen2.playTone(this.tone2Freq);
        }
    }

    /**
     * Calculate and return beat amplitude based on frequency difference
     * Beat amplitude oscillates at the difference frequency
     * @returns {number} Beat amplitude (0.0 to 1.0)
     */
    getBeatAmplitude() {
        if (this.isPlayingTone1 && this.isPlayingTone2) {
            const beatFreq = Math.abs(this.tone1Freq - this.tone2Freq);
            const time = (performance.now() - this.startTime) / 1000; // Time in seconds
            // Generate smooth pulsing beat amplitude (0 to 1)
            this.beatAmplitude = (Math.sin(time * beatFreq * 2 * Math.PI) + 1) / 2;
        } else {
            this.beatAmplitude = 0;
        }
        return this.beatAmplitude;
    }

    /**
     * Get current playback state
     * @returns {Object} State object with playing flags and frequencies
     */
    getState() {
        return {
            isPlayingTone1: this.isPlayingTone1,
            isPlayingTone2: this.isPlayingTone2,
            tone1Freq: this.tone1Freq,
            tone2Freq: this.tone2Freq,
            tone1StartTime: this.tone1StartTime,
            tone1StopTime: this.tone1StopTime,
            tone2StartTime: this.tone2StartTime,
            tone2StopTime: this.tone2StopTime,
            beatAmplitude: this.beatAmplitude
        };
    }

    /**
     * Check if any tone is playing
     * @returns {boolean} True if either tone is playing
     */
    isAnyPlaying() {
        return this.isPlayingTone1 || this.isPlayingTone2;
    }

    /**
     * Check if both tones are playing
     * @returns {boolean} True if both tones are playing
     */
    areBothPlaying() {
        return this.isPlayingTone1 && this.isPlayingTone2;
    }

    /**
     * Clean up audio resources
     */
    destroy() {
        this.stopBoth();
        // ToneGenerator cleanup happens automatically
        this.toneGen1 = null;
        this.toneGen2 = null;
    }
}
