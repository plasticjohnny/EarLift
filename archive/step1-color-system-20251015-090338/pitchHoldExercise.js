// Pitch Hold Exercise
class PitchHoldExercise {
    constructor() {
        this.toneGenerator = new ToneGenerator();
        this.pitchDetector = null; // Created lazily on first use
        this.vocalRange = null;
        this.currentFrequency = null;
        this.isPaused = false;
        this.tonesCompleted = 0;
        this.isDetecting = false;
        this.totalMatchedTime = 0; // Cumulative time matched
        this.matchDuration = 3000; // 3 seconds
        this.detectionInterval = null;
        this.lastMatchTime = null; // Track last time we were matching

        // Sensitivity settings (loaded from appSettings)
        this.sensitivityConfig = null;
        this.stableReadings = [];
        this.graceTokens = [];

        this.initializeElements();
        this.attachEventListeners();
        this.loadSensitivitySettings();
    }

    initializeElements() {
        this.exerciseContainer = document.getElementById('pitchHoldExercise');
        this.currentNote = document.getElementById('pitchHoldNote');
        this.currentFreq = document.getElementById('pitchHoldFreq');
        this.toneAnimation = document.getElementById('pitchHoldAnimation');
        this.matchThisBtn = document.getElementById('pitchHoldMatchBtn');
        this.nextToneBtn = document.getElementById('pitchHoldNextBtn');
        this.exitBtn = document.getElementById('exitPitchHold');
        this.toneCounter = document.getElementById('pitchHoldCounter');
        this.successAnimation = document.getElementById('pitchHoldSuccess');
        this.progressBar = document.getElementById('pitchHoldProgress');
        this.progressFill = document.getElementById('pitchHoldProgressFill');
    }

    attachEventListeners() {
        this.matchThisBtn.addEventListener('click', () => this.togglePlayPause());
        this.nextToneBtn.addEventListener('click', () => this.playNextTone());
        this.exitBtn.addEventListener('click', () => this.exitExercise());
    }

    loadSensitivitySettings() {
        this.sensitivityConfig = appSettings.getCurrentSensitivityConfig();
    }

    async start() {
        // Get vocal range from settings
        this.vocalRange = appSettings.getVocalRange();

        if (!this.vocalRange.low || !this.vocalRange.high) {
            alert('Please set up your vocal range first.');
            return;
        }

        // Show exercise screen
        document.getElementById('appContainer').style.display = 'none';
        this.exerciseContainer.style.display = 'block';

        // IMPORTANT: Start pitch detection FIRST to establish audio routing
        // iOS needs to see microphone access before audio playback to route correctly
        await this.startPitchDetection();

        // Reset state - generate first tone
        this.isPaused = false;
        this.tonesCompleted = 0;
        this.updateCounter();
        this.generateNewTone();
        this.playCurrentTone();
    }

    generateNewTone() {
        // F3 is approximately 174.61 Hz - use as minimum unless user's range is lower
        const MIN_FREQUENCY = 174.61; // F3

        // Generate random frequency within vocal range (minimum F3)
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;

        this.currentFrequency = this.toneGenerator.getRandomFrequencyInRange(lowFreq, highFreq);

        // Update debug mode with target frequency
        if (window.debugMode) {
            window.debugMode.setTargetFrequency(this.currentFrequency);
        }

        // Don't display note or frequency - just show animation
        this.currentNote.textContent = '♪';
        this.currentFreq.style.display = 'none';

        // Reset match tracking - bar never goes down, only accumulates
        this.totalMatchedTime = 0;
        this.lastMatchTime = null;
        this.hideSuccessAnimation();
        // Show progress bucket for debugging (always visible)
        if (this.progressBar) {
            this.progressBar.style.display = 'block';
        }
        if (this.progressFill) {
            this.progressFill.style.height = '0%';
        }
    }

    playCurrentTone() {
        console.log(`playCurrentTone() called with frequency: ${this.currentFrequency}`);
        this.toneGenerator.playTone(this.currentFrequency);
        console.log('After toneGenerator.playTone() call');
        this.toneAnimation.classList.add('playing');

        // Adjust animation speed based on frequency
        const minFreq = 174;
        const maxFreq = 1000;
        const minDuration = 0.2;
        const maxDuration = 1.2;

        const normalizedFreq = Math.max(0, Math.min(1, (this.currentFrequency - minFreq) / (maxFreq - minFreq)));
        const duration = maxDuration - (normalizedFreq * (maxDuration - minDuration));

        const waves = this.toneAnimation.querySelectorAll('.tone-wave');
        waves.forEach(wave => {
            wave.style.animationDuration = `${duration}s`;
        });

        this.isPaused = false;
    }

    togglePlayPause() {
        if (this.isPaused) {
            // Resume playing
            this.playCurrentTone();
        } else {
            // Pause
            this.toneGenerator.stopTone();
            this.toneAnimation.classList.remove('playing');
            this.isPaused = true;
        }
    }

    async startPitchDetection() {
        try {
            // Create pitch detector lazily (so config has time to load)
            if (!this.pitchDetector) {
                this.pitchDetector = new PitchDetector();
            }

            // Get selected microphone device ID if available
            const deviceId = window.audioSettings ? window.audioSettings.getSelectedMicId() : null;

            await this.pitchDetector.initialize(deviceId);

            // Apply saved microphone gain
            const savedGain = appSettings.getMicrophoneGain();
            this.pitchDetector.setGain(savedGain);

            this.isDetecting = true;

            this.detectionInterval = setInterval(() => {
                this.checkPitchMatch();
            }, 100);
        } catch (error) {
            console.error('Pitch detection failed:', error);
            alert('Failed to access microphone. Please check your audio settings and permissions.');
        }
    }

    checkPitchMatch() {
        if (!this.isDetecting || this.isPaused) return;

        const pitch = this.pitchDetector.detectPitch();

        // Update debug mode with detected pitch, volume, and raw RMS
        if (window.debugMode) {
            const volume = this.pitchDetector.getVolume();
            const rms = this.pitchDetector.getRMS();
            window.debugMode.updateDetectedPitch(pitch, volume, rms);
        }

        if (pitch && pitch.frequency) {
            const difference = Math.abs(pitch.frequency - this.currentFrequency);
            const tolerance = this.currentFrequency * this.sensitivityConfig.tolerance;
            const isWithinTolerance = difference <= tolerance;

            // Add to stable readings buffer
            this.stableReadings.push({
                timestamp: Date.now(),
                withinTolerance: isWithinTolerance,
                frequency: pitch.frequency
            });

            // Keep only recent readings based on stableReadings requirement
            const maxReadings = this.sensitivityConfig.stableReadings + 5;
            if (this.stableReadings.length > maxReadings) {
                this.stableReadings.shift();
            }

            // Check if we have enough consecutive stable readings
            const recentReadings = this.stableReadings.slice(-this.sensitivityConfig.stableReadings);
            const allStable = recentReadings.length >= this.sensitivityConfig.stableReadings &&
                            recentReadings.every(r => r.withinTolerance);

            if (allStable) {
                // Pitch is stable and matching
                const now = Date.now();

                // If this is a new match period, record the start time
                if (this.lastMatchTime === null) {
                    this.lastMatchTime = now;
                }

                // Calculate time since last check and add to total
                const timeDelta = now - this.lastMatchTime;
                this.totalMatchedTime += timeDelta;
                this.lastMatchTime = now;

                // Update progress bar (never goes down)
                this.updateProgressBar(this.totalMatchedTime);

                if (this.totalMatchedTime >= this.matchDuration) {
                    // Success! They accumulated 3 seconds of matching
                    this.showSuccessAnimation();
                    this.stopCurrentTone();
                    this.playSuccessSound();
                    this.totalMatchedTime = 0;
                    this.lastMatchTime = null;
                    this.stableReadings = [];
                    this.graceTokens = [];

                    // Auto-play next tone after 5 seconds
                    setTimeout(() => {
                        this.playNextTone();
                    }, 5000);
                }
            } else {
                // Not matching - stop accumulating time but don't reset the bar
                this.lastMatchTime = null;
                this.graceTokens = [];
            }
        } else {
            // No pitch detected - stop accumulating but don't reset the bar
            this.lastMatchTime = null;
            this.stableReadings = [];
            this.graceTokens = [];
        }
    }

    updateProgressBar(totalTime) {
        if (!this.progressBar || !this.progressFill) return;

        // Always show progress bucket
        this.progressBar.style.display = 'block';
        const percentage = Math.min(100, (totalTime / this.matchDuration) * 100);
        // Cap at 92% so it doesn't go above the top horizontal line of the bucket
        const cappedPercentage = Math.min(92, percentage);
        // Update height instead of width for bucket fill
        this.progressFill.style.height = `${cappedPercentage}%`;
    }

    stopCurrentTone() {
        this.toneGenerator.stopTone();
        this.toneAnimation.classList.remove('playing');
        this.isPaused = true;
    }

    showSuccessAnimation() {
        if (!this.successAnimation) return;

        // Show bigger checkmark
        this.successAnimation.textContent = '✓';
        this.successAnimation.style.display = 'flex';
        this.successAnimation.style.fontSize = '120px';
        this.successAnimation.style.color = 'var(--neon-green)';
        this.successAnimation.style.textShadow = '0 0 30px var(--neon-green)';
        this.successAnimation.classList.add('animate-success');

        // Keep checkmark visible (don't auto-hide)
    }

    hideSuccessAnimation() {
        if (!this.successAnimation) return;

        this.successAnimation.style.display = 'none';
        this.successAnimation.classList.remove('animate-success');
    }

    async playSuccessSound() {
        // Play a happy musical arpeggio
        await this.toneGenerator.ensureAudioContext();
        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext) return;

        // Major arpeggio: root, third, fifth, octave
        const baseFreq = 523.25; // C5
        const notes = [
            baseFreq,           // C
            baseFreq * 1.25992, // E (major third)
            baseFreq * 1.49831, // G (fifth)
            baseFreq * 2        // C (octave)
        ];

        const noteDuration = 0.15; // 150ms per note
        let currentTime = audioContext.currentTime;

        notes.forEach((freq, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, currentTime);

            gain.gain.setValueAtTime(0, currentTime);
            gain.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, currentTime + noteDuration);

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.start(currentTime);
            osc.stop(currentTime + noteDuration);

            currentTime += noteDuration * 0.8; // Slight overlap
        });
    }

    playNextTone() {
        // Stop current tone first
        this.toneGenerator.stopTone();
        this.toneAnimation.classList.remove('playing');

        // Increment counter
        this.tonesCompleted++;
        this.updateCounter();

        // Hide success animation for next round
        this.hideSuccessAnimation();

        // Small delay to ensure previous tone has stopped
        setTimeout(() => {
            this.generateNewTone();
            this.playCurrentTone();
        }, 70);
    }

    updateCounter() {
        if (this.toneCounter) {
            this.toneCounter.textContent = this.tonesCompleted;
        }
    }

    exitExercise() {
        // Stop pitch detection
        this.isDetecting = false;
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        this.pitchDetector.stop();

        // Stop any playing tone
        this.toneGenerator.stopTone();

        // Stop microphone stream
        if (window.audioManager && window.audioManager.isInitialized) {
            window.audioManager.stop();
        }

        // Return to main app with transition
        this.exerciseContainer.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        // Add fade-in
        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }

    cleanup() {
        this.toneGenerator.cleanup();
        this.pitchDetector.stop();
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }
    }
}

// Initialize when DOM is ready and expose globally
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pitchHoldExercise = new PitchHoldExercise();
    });
} else {
    window.pitchHoldExercise = new PitchHoldExercise();
}
