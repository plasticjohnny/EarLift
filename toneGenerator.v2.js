// Simplified Tone Generator using shared AudioManager
class ToneGenerator {
    constructor() {
        this.oscillator = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.currentFrequency = null;
    }

    async ensureAudioContext() {
        // Initialize AudioManager if not already done
        if (!window.audioManager.getAudioContext()) {
            // Only initialize playback (no microphone needed for tone generation)
            await window.audioManager.initializePlaybackOnly();
        }

        // Resume if suspended (iOS)
        await window.audioManager.resume();
    }

    async playTone(frequency, volume = 0.3) {
        await this.ensureAudioContext();

        const audioContext = window.audioManager.getAudioContext();
        console.log(`AudioContext:`, audioContext ? `state=${audioContext.state}, sampleRate=${audioContext.sampleRate}` : 'NULL');

        // Check audio output devices
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
            console.log('Available audio outputs:', audioOutputs.map(d => `${d.label} (${d.deviceId.substr(0, 20)}...)`));
            console.log('AudioContext destination:', audioContext.destination);
        } catch (e) {
            console.log('Could not enumerate devices:', e);
        }

        if (!audioContext) {
            // Audio context will be created on first user interaction
            return;
        }

        // Stop any currently playing tone
        this.stopTone();

        try {
            // Create oscillator
            this.oscillator = audioContext.createOscillator();
            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

            // Create gain node for volume control
            this.gainNode = audioContext.createGain();
            this.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);

            // Connect: oscillator -> gain -> destination
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(audioContext.destination);

            // Start oscillator
            this.oscillator.start(audioContext.currentTime);

            this.isPlaying = true;
            this.currentFrequency = frequency;
            console.log(`Tone started successfully: ${frequency}Hz, isPlaying: ${this.isPlaying}`);

            // Notify debug mode if it's active
            if (window.debugMode && window.debugMode.isEnabled) {
                window.debugMode.setTargetFrequency(frequency);
            }

        } catch (error) {
            console.error('ToneGenerator: Error playing tone:', error);
        }
    }

    stopTone() {
        if (!this.isPlaying || !this.oscillator) {
            return;
        }

        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext) {
            return;
        }

        try {
            // Fade out
            const currentTime = audioContext.currentTime;
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
            this.gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.05);

            // Stop oscillator after fade
            this.oscillator.stop(currentTime + 0.05);

            this.isPlaying = false;
            this.currentFrequency = null;

            // Clear debug mode target when tone stops
            if (window.debugMode && window.debugMode.isEnabled) {
                window.debugMode.clearTargetFrequency();
            }

        } catch (error) {
            console.error('ToneGenerator: Error stopping tone:', error);
        }

        // Clean up
        this.oscillator = null;
        this.gainNode = null;
    }

    getRandomFrequencyInRange(minFreq, maxFreq) {
        // Generate a random frequency within the range
        const range = maxFreq - minFreq;
        return minFreq + (Math.random() * range);
    }

    async playButtonClick() {
        // Play a short neon-style button click sound
        await this.ensureAudioContext();

        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext) {
            console.error('ToneGenerator: No audio context for button click');
            return;
        }

        const now = audioContext.currentTime;
        const duration = 0.08; // 80ms click

        // Create oscillator for the "beep"
        const osc = audioContext.createOscillator();
        osc.type = 'sine';

        // Quick frequency drop for digital click feel
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + duration);

        // Create gain node for volume envelope
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Connect and play
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start(now);
        osc.stop(now + duration);

        // Clean up
        setTimeout(() => {
            try {
                osc.disconnect();
                gain.disconnect();
            } catch (e) {
                // Already disconnected
            }
        }, duration * 1000 + 10);
    }

    cleanup() {
        this.stopTone();
        // Don't stop AudioManager - it's shared
    }
}
