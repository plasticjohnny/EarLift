/**
 * FTUE Sound Effects
 *
 * Generates unlock sounds procedurally using Web Audio API
 */

class FTUESounds {
    constructor() {
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Play metallic lock breaking/unlocking sound
     * Creates a sound with:
     * - Initial metallic "clink" (high frequency noise burst)
     * - Lock mechanism "click" (mid frequency click)
     * - Release "sproing" (descending tone)
     * - Success chime (ascending arpeggio)
     */
    playUnlockSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Part 1: Metallic clink (0.0s)
        this.playMetallicClink(now);

        // Part 2: Lock click (0.05s)
        this.playLockClick(now + 0.05);

        // Part 3: Release sproing (0.1s)
        this.playReleaseSproing(now + 0.1);

        // Part 4: Success chime (0.25s)
        this.playSuccessChime(now + 0.25);
    }

    /**
     * Metallic clink - high frequency noise burst
     */
    playMetallicClink(startTime) {
        const duration = 0.04;

        // White noise for metallic sound
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        // High-pass filter for metallic quality
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        // Envelope
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        noise.start(startTime);
        noise.stop(startTime + duration);
    }

    /**
     * Lock click - percussive mid-frequency click
     */
    playLockClick(startTime) {
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(150, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, startTime + 0.05);

        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.05);
    }

    /**
     * Release sproing - descending tone with harmonics
     */
    playReleaseSproing(startTime) {
        const duration = 0.15;

        // Fundamental frequency
        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, startTime);
        osc1.frequency.exponentialRampToValueAtTime(200, startTime + duration);

        // Harmonic
        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1600, startTime);
        osc2.frequency.exponentialRampToValueAtTime(400, startTime + duration);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioContext.destination);

        osc1.start(startTime);
        osc1.stop(startTime + duration);
        osc2.start(startTime);
        osc2.stop(startTime + duration);
    }

    /**
     * Success chime - ascending arpeggio (C major chord)
     */
    playSuccessChime(startTime) {
        // C major arpeggio: C5, E5, G5, C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const noteGap = 0.08;
        const noteDuration = 0.3;

        notes.forEach((freq, index) => {
            const time = startTime + (index * noteGap);

            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = freq;

            // Fade in and out
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.15, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, time + noteDuration);

            oscillator.connect(gain);
            gain.connect(this.audioContext.destination);

            oscillator.start(time);
            oscillator.stop(time + noteDuration);
        });
    }

    /**
     * Play big celebration sound (for "Unlock All" and Training Mode unlock)
     */
    playCelebrationSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Fanfare-style ascending major scale with harmonies
        const scale = [
            523.25,  // C5
            587.33,  // D5
            659.25,  // E5
            698.46,  // F5
            783.99,  // G5
            880.00,  // A5
            987.77,  // B5
            1046.50  // C6
        ];

        const noteGap = 0.06;
        const noteDuration = 0.4;

        scale.forEach((freq, index) => {
            const time = now + (index * noteGap);

            // Main note
            const osc1 = this.audioContext.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = freq;

            // Harmony (perfect fifth above)
            const osc2 = this.audioContext.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = freq * 1.5;

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, time + noteDuration);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.audioContext.destination);

            osc1.start(time);
            osc1.stop(time + noteDuration);
            osc2.start(time);
            osc2.stop(time + noteDuration);
        });

        // Add some sparkle (high-frequency shimmer)
        for (let i = 0; i < 8; i++) {
            const time = now + (i * 0.05);
            const sparkle = this.audioContext.createOscillator();
            const sparkleGain = this.audioContext.createGain();

            sparkle.type = 'sine';
            sparkle.frequency.value = 2000 + Math.random() * 1000;

            sparkleGain.gain.setValueAtTime(0, time);
            sparkleGain.gain.linearRampToValueAtTime(0.05, time + 0.01);
            sparkleGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

            sparkle.connect(sparkleGain);
            sparkleGain.connect(this.audioContext.destination);

            sparkle.start(time);
            sparkle.stop(time + 0.1);
        }
    }
}

// Export for use in other files
window.FTUESounds = FTUESounds;
