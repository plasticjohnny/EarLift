// Tone Generator using Web Audio API
class ToneGenerator {
    constructor() {
        this.audioContext = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.currentFrequency = null;

        // Create a dummy audio element to help iOS route audio correctly
        // This is a workaround for iOS Bluetooth routing issues
        this.dummyAudio = null;
        this.setupIOSAudioRouting();
        this.setupVisibilityHandlers();
    }

    setupVisibilityHandlers() {
        // Resume AudioContext when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(err => {
                    console.warn('Failed to resume audio context:', err);
                });
            }
        });

        // Also handle when window gains focus
        window.addEventListener('focus', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(err => {
                    console.warn('Failed to resume audio context:', err);
                });
            }
        });

        // Handle page show event (for back/forward navigation)
        window.addEventListener('pageshow', (event) => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(err => {
                    console.warn('Failed to resume audio context:', err);
                });
            }
        });
    }

    setupIOSAudioRouting() {
        // Create a silent audio element that helps iOS establish proper audio routing
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            this.dummyAudio = new Audio();
            this.dummyAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            this.dummyAudio.loop = false;
            this.dummyAudio.volume = 0.01;
            this.dummyAudio.preload = 'auto';

            // Play and pause immediately to "activate" audio routing
            this.dummyAudio.play().then(() => {
                setTimeout(() => {
                    if (this.dummyAudio) {
                        this.dummyAudio.pause();
                        this.dummyAudio.currentTime = 0;
                    }
                }, 10);
            }).catch(() => {
                // Ignore errors - will retry on first user interaction
            });
        }
    }

    async initialize() {
        if (!this.audioContext) {
            // Create AudioContext with iOS-specific configuration
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;

            // For iOS, specify latency hint and sample rate for better Bluetooth compatibility
            this.audioContext = new AudioContextClass({
                latencyHint: 'playback',
                sampleRate: 44100  // Standard sample rate for better compatibility
            });
        }

        // iOS requires AudioContext to be resumed after user interaction
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // For iOS: Ensure audio context is running
        if (this.audioContext.state === 'running') {
            // Create a silent buffer to "warm up" the audio pipeline for iOS
            if (!this.audioContext._initialized) {
                const buffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                source.start(0);
                this.audioContext._initialized = true;
            }
        }
    }

    async playTone(frequency, volume = 0.6) {
        console.log(`ToneGenerator.playTone called: ${frequency}Hz, volume: ${volume}`);

        // For iOS: play dummy audio to ensure routing is active
        if (this.dummyAudio) {
            this.dummyAudio.play().catch(() => {});
        }

        await this.initialize();
        console.log(`AudioContext state: ${this.audioContext.state}, sample rate: ${this.audioContext.sampleRate}`);

        // Stop any currently playing tone
        this.stopTone();

        // Create oscillator
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'sine'; // Smooth, pure tone
        this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);

        // Fade in to avoid clicks - louder volume for exercises
        this.gainNode.gain.linearRampToValueAtTime(
            volume,
            this.audioContext.currentTime + 0.05
        );

        // Connect nodes
        this.oscillator.connect(this.gainNode);
        // If an analyser is provided, connect through it, otherwise direct to destination
        if (this.analyser) {
            this.gainNode.connect(this.analyser);
        } else {
            this.gainNode.connect(this.audioContext.destination);
        }

        // Start playing
        this.oscillator.start();
        this.isPlaying = true;
        this.currentFrequency = frequency;
        console.log(`Tone started successfully: ${frequency}Hz, isPlaying: ${this.isPlaying}`);
    }

    stopTone() {
        if (this.oscillator && this.isPlaying) {
            // Fade out to avoid clicks
            this.gainNode.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + 0.05
            );

            // Stop after fade out
            setTimeout(() => {
                if (this.oscillator) {
                    this.oscillator.stop();
                    this.oscillator.disconnect();
                    this.oscillator = null;
                }
                if (this.gainNode) {
                    this.gainNode.disconnect();
                    this.gainNode = null;
                }
            }, 60);

            this.isPlaying = false;
            this.currentFrequency = null;
        }
    }

    getRandomFrequencyInRange(lowFreq, highFreq) {
        // Get random frequency within the vocal range
        // Bias towards middle range for comfort
        const logLow = Math.log2(lowFreq);
        const logHigh = Math.log2(highFreq);
        const logRandom = logLow + Math.random() * (logHigh - logLow);
        return Math.pow(2, logRandom);
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

    async playButtonClick() {
        // For iOS: play dummy audio to ensure routing is active
        if (this.dummyAudio) {
            this.dummyAudio.play().catch(() => {});
        }

        // Play a short neon-style button click sound
        await this.initialize();

        const now = this.audioContext.currentTime;
        const duration = 0.08; // 80ms click

        // Create oscillator for the "beep"
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';

        // Quick frequency drop for digital click feel
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + duration);

        // Create gain node for volume envelope
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Connect and play
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + duration);

        // Clean up
        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, duration * 1000 + 10);
    }

    cleanup() {
        this.stopTone();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
