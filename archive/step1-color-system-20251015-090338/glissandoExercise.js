// Glissando Exercise - Smooth pitch sliding
class GlissandoExercise {
    constructor() {
        this.pitchDetector = null; // Created lazily on first use
        this.vocalRange = null;
        this.isActive = false;
        this.detectionInterval = null;

        // Progress tracking
        this.completedGlissandos = 0;
        this.totalRequired = 5;
        this.currentDirection = 'up'; // 'up' or 'down'

        // Thresholds for detecting glissando completion
        this.lowThreshold = 0.15; // 15% from bottom
        this.highThreshold = 0.85; // 85% from top
        this.atLow = false;
        this.atHigh = false;

        // Smoothing and history
        this.pitchHistory = [];
        this.maxHistoryLength = 10;

        // Pitch persistence - hold last valid pitch when audio drops below threshold
        this.lastValidFrequency = null;
        this.lastValidPitch = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById('glissandoExercise');
        this.noteName = document.getElementById('glissandoNoteName');
        this.noteFreq = document.getElementById('glissandoNoteFreq');
        this.pitchDisplay = document.getElementById('glissandoPitchDisplay');
        this.marker = document.getElementById('glissandoMarker');
        this.rangeFill = document.getElementById('glissandoRangeFill');
        this.lowMarker = document.getElementById('glissandoLowMarker');
        this.lowLabel = document.getElementById('glissandoLowLabel');
        this.highLabel = document.getElementById('glissandoHighLabel');
        this.countDisplay = document.getElementById('glissandoCount');
        this.directionDisplay = document.getElementById('glissandoDirection');
        this.exitBtn = document.getElementById('exitGlissandoExercise');
    }

    attachEventListeners() {
        this.exitBtn.addEventListener('click', () => this.exit());
    }

    async start() {
        // Get user's vocal range
        this.vocalRange = appSettings.getVocalRange();

        if (!this.vocalRange || !this.vocalRange.low || !this.vocalRange.high) {
            alert('Please set your vocal range first!');
            return;
        }

        // Show exercise container
        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';

        // Reset state
        this.completedGlissandos = 0;
        this.currentDirection = 'up';
        this.atLow = false;
        this.atHigh = false;
        this.pitchHistory = [];

        // Update UI
        this.updateLabels();
        this.updateProgress();

        // Start pitch detection
        await this.startDetection();
    }

    async startDetection() {
        try {
            // Create pitch detector lazily (so config has time to load)
            if (!this.pitchDetector) {
                this.pitchDetector = new PitchDetector();
            }

            // Initialize pitch detector if needed
            if (!this.pitchDetector.isListening) {
                // Get selected microphone device ID if available
                const deviceId = window.audioSettings ? window.audioSettings.getSelectedMicId() : null;
                await this.pitchDetector.initialize(deviceId);
            }

            this.isActive = true;

            // Start detection loop
            this.detectionInterval = setInterval(() => {
                this.detectAndUpdate();
            }, 50); // 20 Hz update rate for smooth feedback

        } catch (error) {
            alert(error.message);
            this.exit();
        }
    }

    stopDetection() {
        this.isActive = false;
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }

    detectAndUpdate() {
        const pitch = this.pitchDetector.detectPitch();

        // Check volume level to ensure decent volume before registering
        const volume = this.pitchDetector.getVolume();
        const rms = this.pitchDetector.getRMS();
        const volumeThreshold = 2.0; // Requires decent volume to register

        // Update debug mode with detected pitch and volume
        if (window.debugMode) {
            window.debugMode.updateDetectedPitch(pitch, volume, rms);
        }

        if (pitch && pitch.frequency > 50 && pitch.frequency < 2000 && volume >= volumeThreshold) {
            // Add to history for smoothing
            this.pitchHistory.push(pitch.frequency);
            if (this.pitchHistory.length > this.maxHistoryLength) {
                this.pitchHistory.shift();
            }

            // Calculate smoothed frequency
            const smoothedFreq = this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;

            // Store as last valid pitch
            this.lastValidFrequency = smoothedFreq;
            this.lastValidPitch = pitch;

            // Update display
            this.noteName.textContent = pitch.note;
            this.noteFreq.textContent = `${Math.round(smoothedFreq)} Hz`;

            // Calculate cents deviation and show visual feedback
            const cents = Math.abs(pitch.cents);
            const accuracy = Math.max(0, 1 - (cents / 50));

            // Apply brightness based on accuracy (no scale change)
            const brightness = 0.7 + (accuracy * 0.3);
            this.noteName.style.filter = `brightness(${brightness})`;
            this.noteName.style.transform = 'scale(1)'; // Keep size constant

            // Update range visualization
            this.updateRangeVisualization(smoothedFreq);

            // Check for glissando progress
            this.checkGlissandoProgress(smoothedFreq);

        } else {
            // No pitch detected - keep displaying last valid pitch to avoid jumps
            if (this.lastValidFrequency && this.lastValidPitch) {
                // Keep displaying the last valid position (dimmed)
                this.noteName.textContent = this.lastValidPitch.note;
                this.noteFreq.textContent = `${Math.round(this.lastValidFrequency)} Hz`;
                this.noteName.style.filter = 'brightness(0.5)';
                this.noteName.style.transform = 'scale(1)';

                // Keep the marker at the last valid position
                this.updateRangeVisualization(this.lastValidFrequency);
            } else {
                // No valid pitch ever detected
                this.noteName.textContent = '♪';
                this.noteFreq.textContent = 'Sing to continue';
                this.noteName.style.filter = 'brightness(0.5)';
                this.noteName.style.transform = 'scale(1)';
            }
        }
    }

    updateRangeVisualization(frequency) {
        const percentage = this.frequencyToPercentage(frequency);

        // Add smooth transition to marker movement
        if (!this.marker.style.transition || this.marker.style.transition === 'none') {
            this.marker.style.transition = 'bottom 0.15s ease-out';
            this.rangeFill.style.transition = 'height 0.15s ease-out, bottom 0.15s ease-out';
        }

        // Update current pitch marker
        this.marker.style.bottom = `${percentage}%`;

        // Update fill from low note to current position
        const lowPercentage = this.frequencyToPercentage(this.vocalRange.low.frequency);
        const fillHeight = percentage - lowPercentage;
        this.rangeFill.style.height = `${Math.max(0, fillHeight)}%`;
        this.rangeFill.style.bottom = `${lowPercentage}%`;

        // Update low marker
        this.lowMarker.style.bottom = `${lowPercentage}%`;
    }

    frequencyToPercentage(frequency) {
        const clampedFreq = Math.max(
            this.vocalRange.low.frequency,
            Math.min(this.vocalRange.high.frequency, frequency)
        );

        // Linear mapping
        const linear = (clampedFreq - this.vocalRange.low.frequency) /
                      (this.vocalRange.high.frequency - this.vocalRange.low.frequency);

        // Add padding
        const padded = 0.05 + (linear * 0.9);

        return padded * 100;
    }

    checkGlissandoProgress(frequency) {
        const percentage = (frequency - this.vocalRange.low.frequency) /
                          (this.vocalRange.high.frequency - this.vocalRange.low.frequency);

        // Check if at low or high threshold
        const nowAtLow = percentage <= this.lowThreshold;
        const nowAtHigh = percentage >= this.highThreshold;

        if (this.currentDirection === 'up') {
            // Going up: need to reach high threshold
            if (nowAtHigh && !this.atHigh) {
                this.atHigh = true;
                this.completeGlissando();
            }
            this.atLow = nowAtLow;
        } else {
            // Going down: need to reach low threshold
            if (nowAtLow && !this.atLow) {
                this.atLow = true;
                this.completeGlissando();
            }
            this.atHigh = nowAtHigh;
        }
    }

    completeGlissando() {
        this.completedGlissandos++;
        this.updateProgress();

        // Celebration effect
        this.pitchDisplay.style.animation = 'none';
        setTimeout(() => {
            this.pitchDisplay.style.animation = 'pulse 0.5s ease-out';
        }, 10);

        // Check if exercise complete
        if (this.completedGlissandos >= this.totalRequired) {
            this.congratulate();
        } else {
            // Switch direction
            this.currentDirection = this.currentDirection === 'up' ? 'down' : 'up';
            this.atLow = false;
            this.atHigh = false;
            this.updateProgress();
        }
    }

    updateProgress() {
        this.countDisplay.textContent = this.completedGlissandos;

        if (this.currentDirection === 'up') {
            this.directionDisplay.textContent = 'Slide Up! 🔼';
            this.directionDisplay.style.color = 'var(--neon-cyan)';
        } else {
            this.directionDisplay.textContent = 'Slide Down! 🔽';
            this.directionDisplay.style.color = 'var(--neon-pink)';
        }
    }

    updateLabels() {
        this.lowLabel.textContent = this.vocalRange.low.note;
        this.highLabel.textContent = this.vocalRange.high.note;
    }

    congratulate() {
        this.stopDetection();

        this.noteName.textContent = '🎉';
        this.noteFreq.textContent = 'Complete!';
        this.directionDisplay.textContent = 'Great job! 🌟';
        this.directionDisplay.style.color = 'var(--neon-green)';

        // Celebration animation
        this.pitchDisplay.style.animation = 'celebration 1s ease-out';

        setTimeout(() => {
            this.exit();
        }, 3000);
    }

    exit() {
        this.stopDetection();

        // Stop the pitch detector and turn off microphone
        this.pitchDetector.stop();

        // Stop microphone stream
        if (window.audioManager && window.audioManager.isInitialized) {
            window.audioManager.stop();
        }

        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        // Clear exercise from URL
        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize exercise
window.glissandoExercise = new GlissandoExercise();
