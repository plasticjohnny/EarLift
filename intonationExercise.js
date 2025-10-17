// Intonation Exercise
class IntonationExercise {
    constructor() {
        this.toneGenerator = new ToneGenerator();
        this.vocalRange = null;
        this.currentFrequency = null;
        this.isPaused = false;
        this.tonesCompleted = 0;
        this.micStream = null; // Keep mic stream to maintain audio routing

        // Car mode state
        this.isCarMode = false;
        this.carModeTimer = null;
        this.carModePhase = null; // 'playing' or 'silence'

        this.initializeElements();
        this.attachEventListeners();
        this.initializeInstructions();
    }

    initializeInstructions() {
        const instructions = [
            "With the tone playing, start your voice low and smoothly increase your pitch until you find the tone.",
            "It takes a bit at first to find it, move up and down to try and locate it.",
            "Feel the vibrational differences as you get close. The pulses will go slower when you're very close.",
            "Also try to go from high to lower pitch to find the note. It's all about feeling the vibrational differences.",
            "When it's matching, it should feel very smooth.",
            "The trainer won't tell you when you're there - you have to feel it. When you've found the smoothness of unison, hit Next Tone for another one."
        ];

        this.instructions = new ExerciseInstructions(
            'pitchMatchInstructions',
            instructions
        );
    }

    initializeElements() {
        this.exerciseContainer = document.getElementById('intonationExercise');
        this.currentNote = document.getElementById('currentNote');
        this.currentFreq = document.getElementById('currentFreq');
        this.toneAnimation = document.getElementById('toneAnimation');
        this.playBtn = document.getElementById('pitchMatchPlayBtn');
        this.playIcon = document.getElementById('pitchMatchPlayIcon');
        this.nextToneBtn = document.getElementById('nextToneBtn');
        this.exitBtn = document.getElementById('exitExercise');
        this.toneCounter = document.getElementById('toneCounter');
    }

    attachEventListeners() {
        this.playBtn.addEventListener('click', () => this.togglePlayPause());
        this.nextToneBtn.addEventListener('click', () => this.playNextTone());
        this.exitBtn.addEventListener('click', () => this.exitExercise());
    }

    async start() {
        console.log('IntonationExercise.start() called');

        // Get vocal range from settings
        this.vocalRange = appSettings.getVocalRange();

        if (!this.vocalRange.low || !this.vocalRange.high) {
            alert('Please set up your vocal range first.');
            return;
        }

        // Check if car mode
        const usageMode = appSettings.getUsageMode();
        this.isCarMode = (usageMode === 'car-mode');

        // No microphone needed for Pitch Match - only playback

        // Show exercise screen
        document.getElementById('appContainer').style.display = 'none';
        this.exerciseContainer.style.display = 'block';

        // Reset state - generate first tone
        this.isPaused = false;
        this.tonesCompleted = 0;
        this.updateCounter();
        this.generateNewTone();

        if (this.isCarMode) {
            // Car mode: start automatic cycling
            this.startCarMode();
        } else {
            // Normal mode: manual control
            this.playCurrentTone();
            this.playIcon.textContent = '⏸';
        }
    }

    generateNewTone() {
        // F3 is approximately 174.61 Hz - use as minimum unless user's range is lower
        const MIN_FREQUENCY = 174.61; // F3

        // Generate random frequency within vocal range (minimum F3)
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;

        this.currentFrequency = this.toneGenerator.getRandomFrequencyInRange(lowFreq, highFreq);

        // Don't display note or frequency - just show animation
        this.currentNote.textContent = '♪';
        this.currentFreq.style.display = 'none';
    }

    playCurrentTone() {
        console.log(`IntonationExercise.playCurrentTone() called with frequency: ${this.currentFrequency}`);
        this.toneGenerator.playTone(this.currentFrequency);
        console.log('After toneGenerator.playTone() call');
        this.toneAnimation.classList.add('playing');

        // Adjust animation speed based on frequency
        // Higher frequencies = faster vibration, lower = slower
        // Map frequency range (roughly 174-1000 Hz) to animation duration (0.2s - 1.2s)
        const minFreq = 174;
        const maxFreq = 1000;
        const minDuration = 0.2; // Fast for high notes
        const maxDuration = 1.2; // Slow for low notes

        const normalizedFreq = Math.max(0, Math.min(1, (this.currentFrequency - minFreq) / (maxFreq - minFreq)));
        const duration = maxDuration - (normalizedFreq * (maxDuration - minDuration));

        // Set animation duration on each bar
        const waves = this.toneAnimation.querySelectorAll('.tone-wave');
        waves.forEach(wave => {
            wave.style.animationDuration = `${duration}s`;
        });

        this.isPaused = false;
    }

    togglePlayPause() {
        if (this.isCarMode) {
            // In car mode, this button does nothing (auto cycles)
            return;
        }

        if (this.isPaused) {
            // Resume playing
            this.playCurrentTone();
            this.playIcon.textContent = '⏸';
        } else {
            // Pause
            this.toneGenerator.stopTone();
            this.toneAnimation.classList.remove('playing');
            this.isPaused = true;
            this.playIcon.textContent = '▶';
        }
    }

    playNextTone() {
        if (this.isCarMode) {
            // In car mode, skip current tone and move to next
            this.stopCarMode();
            this.tonesCompleted++;
            this.updateCounter();
            this.generateNewTone();
            this.startCarMode();
            return;
        }

        // Stop current tone first
        this.toneGenerator.stopTone();
        this.toneAnimation.classList.remove('playing');

        // Increment counter
        this.tonesCompleted++;
        this.updateCounter();

        // Small delay to ensure previous tone has stopped (70ms for fade-out)
        setTimeout(() => {
            this.generateNewTone();
            this.playCurrentTone();
            this.playIcon.textContent = '⏸';
        }, 70);
    }

    updateCounter() {
        if (this.toneCounter) {
            this.toneCounter.textContent = this.tonesCompleted;
        }
    }

    // ========== CAR MODE METHODS ==========

    startCarMode() {
        this.carModePhase = 'playing';
        this.playCarModePhase();
    }

    playCarModePhase() {
        if (this.carModePhase === 'playing') {
            // Play tone for 20 seconds (2x longer for car mode)
            this.playCurrentTone();
            this.playIcon.textContent = '🔊';
            this.playBtn.textContent = 'Playing...';
            this.playBtn.disabled = true;

            this.carModeTimer = setTimeout(() => {
                this.carModePhase = 'silence';
                this.playCarModePhase();
            }, 20000);
        } else if (this.carModePhase === 'silence') {
            // Silence for 7.5 seconds (50% longer break)
            this.toneGenerator.stopTone();
            this.toneAnimation.classList.remove('playing');
            this.playIcon.textContent = '🎤';
            this.playBtn.textContent = 'Sing now!';

            this.carModeTimer = setTimeout(() => {
                // Move to next tone
                this.tonesCompleted++;
                this.updateCounter();
                this.generateNewTone();
                this.carModePhase = 'playing';
                this.playCarModePhase();
            }, 7500);
        }
    }

    stopCarMode() {
        if (this.carModeTimer) {
            clearTimeout(this.carModeTimer);
            this.carModeTimer = null;
        }
        this.toneGenerator.stopTone();
        this.toneAnimation.classList.remove('playing');
        this.carModePhase = null;
    }

    exitExercise() {
        // Stop car mode if active
        if (this.isCarMode) {
            this.stopCarMode();
        }

        // Stop any playing tone
        this.toneGenerator.stopTone();

        // Stop microphone stream
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
            console.log('Pitch Match: Microphone stream released');
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

        // Clean up microphone stream
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
    }
}

// Initialize when DOM is ready and expose globally
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.intonationExercise = new IntonationExercise();
    });
} else {
    window.intonationExercise = new IntonationExercise();
}
