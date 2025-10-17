// Feel the Root Exercise - Base Class
// Helps users internalize intervals by toggling between root and interval tones
class FeelTheRootExercise {
    constructor(intervalName, intervalRatio, exerciseId, containerId) {
        this.intervalName = intervalName; // "Half-Step" or "Whole-Step"
        this.intervalRatio = intervalRatio; // Math.pow(2, 1/12) or Math.pow(2, 2/12)
        this.exerciseId = exerciseId;
        this.containerId = containerId;

        this.toneGenerator = new ToneGenerator();
        this.vocalRange = null;
        this.rootFrequency = null;
        this.intervalFrequency = null;
        this.goingUp = true; // Random direction for interval
        this.rootPlaying = false;
        this.intervalPlaying = false;
        this.tonesCompleted = 0;

        this.initializeElements();
        this.attachEventListeners();
        this.initializeInstructions();
    }

    initializeInstructions() {
        const instructions = [
            `At first, play around with playing the root note, the ${this.intervalName}, and both. Listen for the difference in tone.`,
            `Then, playing just the root note, match your voice to it like in Pitch Match. While continuing to sing that note, play just the ${this.intervalName} note.`,
            `Make sure to match the root note first, and listen closely for how the ${this.intervalName} feels.`,
            `Now play the root note and match it with your voice, then try to glissando your voice to the ${this.intervalName} note.`,
            "If you feel like you have it, turn off the root note and turn on the interval note. See how close you are.",
            "If you're right, keep practicing. If you need more work, try and go back and forth a few times, play / turn off the tones to help hone in.",
            "Over time, this should help you get a sense for the interval!"
        ];

        this.instructions = new ExerciseInstructions(
            `${this.exerciseId}Instructions`,
            instructions
        );
    }

    initializeElements() {
        this.exerciseContainer = document.getElementById(this.containerId);
        this.currentNote = document.getElementById(`${this.exerciseId}CurrentNote`);
        this.currentFreq = document.getElementById(`${this.exerciseId}CurrentFreq`);
        this.rootBtn = document.getElementById(`${this.exerciseId}RootBtn`);
        this.intervalBtn = document.getElementById(`${this.exerciseId}IntervalBtn`);
        this.bothBtn = document.getElementById(`${this.exerciseId}BothBtn`);
        this.swapBtn = document.getElementById(`${this.exerciseId}SwapBtn`);
        this.nextToneBtn = document.getElementById(`${this.exerciseId}NextToneBtn`);
        this.exitBtn = document.getElementById(`${this.exerciseId}ExitBtn`);
        this.toneCounter = document.getElementById(`${this.exerciseId}ToneCounter`);
        this.rootAnimation = document.getElementById(`${this.exerciseId}RootAnimation`);
        this.intervalAnimation = document.getElementById(`${this.exerciseId}IntervalAnimation`);
    }

    attachEventListeners() {
        if (!this.exitBtn) {
            console.error(`FeelTheRootExercise: exitBtn not found for ${this.exerciseId}`);
            return;
        }

        this.exitBtn.addEventListener('click', () => this.exitExercise());

        if (this.rootBtn) {
            this.rootBtn.addEventListener('click', () => this.toggleRoot());
        }
        if (this.intervalBtn) {
            this.intervalBtn.addEventListener('click', () => this.toggleInterval());
        }
        if (this.bothBtn) {
            this.bothBtn.addEventListener('click', () => this.toggleBoth());
        }
        if (this.swapBtn) {
            this.swapBtn.addEventListener('click', () => this.swap());
        }
        if (this.nextToneBtn) {
            this.nextToneBtn.addEventListener('click', () => this.playNextTone());
        }
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

        // Reset state - generate first tone pair
        this.tonesCompleted = 0;
        this.rootPlaying = false;
        this.intervalPlaying = false;
        this.updateCounter();
        this.generateNewTone();
        this.updateButtonStates();
    }

    generateNewTone() {
        // F3 is approximately 174.61 Hz - use as minimum unless user's range is lower
        const MIN_FREQUENCY = 174.61; // F3

        // Generate random frequency within vocal range (minimum F3)
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;

        // Randomly choose to go up or down
        this.goingUp = Math.random() < 0.5;

        // Generate root frequency with constraints based on direction
        let constrainedLowFreq, constrainedHighFreq;

        if (this.goingUp) {
            // Make sure we have room for the interval above
            const maxRootFreq = highFreq / this.intervalRatio;
            constrainedLowFreq = lowFreq;
            constrainedHighFreq = Math.min(maxRootFreq, highFreq);
        } else {
            // Make sure we have room for the interval below
            const minRootFreq = lowFreq * this.intervalRatio;
            constrainedLowFreq = Math.max(minRootFreq, lowFreq);
            constrainedHighFreq = highFreq;
        }

        this.rootFrequency = this.toneGenerator.getRandomFrequencyInRange(constrainedLowFreq, constrainedHighFreq);

        // Calculate interval frequency based on direction
        this.intervalFrequency = this.goingUp ?
            this.rootFrequency * this.intervalRatio :
            this.rootFrequency / this.intervalRatio;

        // Display direction indicator
        const direction = this.goingUp ? '↑' : '↓';
        this.currentNote.textContent = `♪ ${direction}`;
        this.currentFreq.style.display = 'none';
    }

    frequencyToNote(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);

        const halfSteps = Math.round(12 * Math.log2(frequency / C0));
        const octave = Math.floor(halfSteps / 12);
        const note = noteNames[halfSteps % 12];

        return `${note}${octave}`;
    }

    async toggleRoot() {
        // If root is playing, stop it
        if (this.rootPlaying) {
            this.stopRoot();
            this.rootPlaying = false;
            this.updateButtonStates();
            this.updateAnimations();
            return;
        }

        // Start playing root
        await this.playRoot();
        this.rootPlaying = true;
        this.updateButtonStates();
        this.updateAnimations();
    }

    async toggleInterval() {
        // If interval is playing, stop it
        if (this.intervalPlaying) {
            this.stopInterval();
            this.intervalPlaying = false;
            this.updateButtonStates();
            this.updateAnimations();
            return;
        }

        // Start playing interval
        await this.playInterval();
        this.intervalPlaying = true;
        this.updateButtonStates();
        this.updateAnimations();
    }

    async playRoot() {
        // Ensure audio context is initialized
        await this.toneGenerator.ensureAudioContext();

        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext) {
            console.error('Audio context not initialized');
            return;
        }

        try {
            // Create gain node for root
            this.rootGainNode = audioContext.createGain();
            this.rootGainNode.gain.setValueAtTime(0, audioContext.currentTime);
            this.rootGainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
            this.rootGainNode.connect(audioContext.destination);

            // Create root oscillator
            this.rootOscillator = audioContext.createOscillator();
            this.rootOscillator.type = 'sine';
            this.rootOscillator.frequency.setValueAtTime(this.rootFrequency, audioContext.currentTime);
            this.rootOscillator.connect(this.rootGainNode);
            this.rootOscillator.start(audioContext.currentTime);
        } catch (error) {
            console.error('Error playing root tone:', error);
        }
    }

    async playInterval() {
        // Ensure audio context is initialized
        await this.toneGenerator.ensureAudioContext();

        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext) {
            console.error('Audio context not initialized');
            return;
        }

        try {
            // Create gain node for interval
            this.intervalGainNode = audioContext.createGain();
            this.intervalGainNode.gain.setValueAtTime(0, audioContext.currentTime);
            this.intervalGainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
            this.intervalGainNode.connect(audioContext.destination);

            // Create interval oscillator
            this.intervalOscillator = audioContext.createOscillator();
            this.intervalOscillator.type = 'sine';
            this.intervalOscillator.frequency.setValueAtTime(this.intervalFrequency, audioContext.currentTime);
            this.intervalOscillator.connect(this.intervalGainNode);
            this.intervalOscillator.start(audioContext.currentTime);
        } catch (error) {
            console.error('Error playing interval tone:', error);
        }
    }

    stopRoot() {
        const audioContext = window.audioManager.getAudioContext();

        if (this.rootOscillator) {
            try {
                if (audioContext && this.rootGainNode) {
                    // Fade out
                    const currentTime = audioContext.currentTime;
                    this.rootGainNode.gain.setValueAtTime(this.rootGainNode.gain.value, currentTime);
                    this.rootGainNode.gain.linearRampToValueAtTime(0, currentTime + 0.05);
                    this.rootOscillator.stop(currentTime + 0.05);
                } else {
                    this.rootOscillator.stop();
                }
                this.rootOscillator.disconnect();
            } catch (e) {
                // Oscillator may already be stopped
            }
            this.rootOscillator = null;
        }

        if (this.rootGainNode) {
            try {
                this.rootGainNode.disconnect();
            } catch (e) {
                // Already disconnected
            }
            this.rootGainNode = null;
        }
    }

    stopInterval() {
        const audioContext = window.audioManager.getAudioContext();

        if (this.intervalOscillator) {
            try {
                if (audioContext && this.intervalGainNode) {
                    // Fade out
                    const currentTime = audioContext.currentTime;
                    this.intervalGainNode.gain.setValueAtTime(this.intervalGainNode.gain.value, currentTime);
                    this.intervalGainNode.gain.linearRampToValueAtTime(0, currentTime + 0.05);
                    this.intervalOscillator.stop(currentTime + 0.05);
                } else {
                    this.intervalOscillator.stop();
                }
                this.intervalOscillator.disconnect();
            } catch (e) {
                // Oscillator may already be stopped
            }
            this.intervalOscillator = null;
        }

        if (this.intervalGainNode) {
            try {
                this.intervalGainNode.disconnect();
            } catch (e) {
                // Already disconnected
            }
            this.intervalGainNode = null;
        }
    }

    async toggleBoth() {
        // If both are already playing, stop both
        if (this.rootPlaying && this.intervalPlaying) {
            this.stopRoot();
            this.stopInterval();
            this.rootPlaying = false;
            this.intervalPlaying = false;
            this.updateButtonStates();
            this.updateAnimations();
            return;
        }

        // Start both tones
        if (!this.rootPlaying) {
            await this.playRoot();
            this.rootPlaying = true;
        }

        if (!this.intervalPlaying) {
            await this.playInterval();
            this.intervalPlaying = true;
        }

        this.updateButtonStates();
        this.updateAnimations();
    }

    async swap() {
        // Swap which tone is playing
        // If root is playing, switch to interval
        // If interval is playing, switch to root
        // If both or neither are playing, do nothing

        const wasRootPlaying = this.rootPlaying;
        const wasIntervalPlaying = this.intervalPlaying;

        // Only swap if exactly one is playing
        if (wasRootPlaying && !wasIntervalPlaying) {
            // Switch from root to interval
            this.stopRoot();
            this.rootPlaying = false;
            await this.playInterval();
            this.intervalPlaying = true;
        } else if (!wasRootPlaying && wasIntervalPlaying) {
            // Switch from interval to root
            this.stopInterval();
            this.intervalPlaying = false;
            await this.playRoot();
            this.rootPlaying = true;
        }
        // If both or neither are playing, don't do anything

        this.updateButtonStates();
        this.updateAnimations();
    }

    updateButtonStates() {
        // Update Root button
        if (this.rootPlaying) {
            this.rootBtn.classList.add('playing');
        } else {
            this.rootBtn.classList.remove('playing');
        }

        // Update Interval button
        if (this.intervalPlaying) {
            this.intervalBtn.classList.add('playing');
        } else {
            this.intervalBtn.classList.remove('playing');
        }

        // Both button doesn't change state
    }

    updateAnimations() {
        // Root animation
        if (this.rootPlaying) {
            this.rootAnimation.classList.add('playing');
        } else {
            this.rootAnimation.classList.remove('playing');
        }

        // Interval animation
        if (this.intervalPlaying) {
            this.intervalAnimation.classList.add('playing');
        } else {
            this.intervalAnimation.classList.remove('playing');
        }

        // Adjust animation speed based on frequency
        const minFreq = 174;
        const maxFreq = 1000;
        const minDuration = 0.2;
        const maxDuration = 1.2;

        if (this.rootPlaying) {
            const normalizedFreq = Math.max(0, Math.min(1, (this.rootFrequency - minFreq) / (maxFreq - minFreq)));
            const duration = maxDuration - (normalizedFreq * (maxDuration - minDuration));
            const waves = this.rootAnimation.querySelectorAll('.tone-wave');
            waves.forEach(wave => {
                wave.style.animationDuration = `${duration}s`;
            });
        }

        if (this.intervalPlaying) {
            const normalizedFreq = Math.max(0, Math.min(1, (this.intervalFrequency - minFreq) / (maxFreq - minFreq)));
            const duration = maxDuration - (normalizedFreq * (maxDuration - minDuration));
            const waves = this.intervalAnimation.querySelectorAll('.tone-wave');
            waves.forEach(wave => {
                wave.style.animationDuration = `${duration}s`;
            });
        }
    }

    async playNextTone() {
        // Stop all tones
        this.stopRoot();
        this.stopInterval();
        this.rootPlaying = false;
        this.intervalPlaying = false;
        this.updateButtonStates();
        this.updateAnimations();

        // Increment counter
        this.tonesCompleted++;
        this.updateCounter();

        // Generate new tone pair
        this.generateNewTone();

        // Automatically start playing root note
        await this.playRoot();
        this.rootPlaying = true;
        this.updateButtonStates();
        this.updateAnimations();
    }

    updateCounter() {
        if (this.toneCounter) {
            this.toneCounter.textContent = this.tonesCompleted;
        }
    }

    exitExercise() {
        // Stop all tones
        this.stopRoot();
        this.stopInterval();
        this.rootPlaying = false;
        this.intervalPlaying = false;

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
        this.stopRoot();
        this.stopInterval();
        this.rootPlaying = false;
        this.intervalPlaying = false;
    }
}

// Initialize all Feel the Root exercise variants when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Half-Step Feel the Root
        window.halfStepFeelRootExercise = new FeelTheRootExercise(
            'Half-Step',
            Math.pow(2, 1/12),
            'halfStepFeelRoot',
            'halfStepFeelRootExercise'
        );

        // Whole-Step Feel the Root
        window.wholeStepFeelRootExercise = new FeelTheRootExercise(
            'Whole-Step',
            Math.pow(2, 2/12),
            'wholeStepFeelRoot',
            'wholeStepFeelRootExercise'
        );

        // Octave Feel the Root
        window.octaveFeelRootExercise = new FeelTheRootExercise(
            'Octave',
            2.0,
            'octaveFeelRoot',
            'octaveFeelRootExercise'
        );

        // Major Third Feel the Root
        window.majorThirdFeelRootExercise = new FeelTheRootExercise(
            'Major Third',
            Math.pow(2, 4/12),
            'majorThirdFeelRoot',
            'majorThirdFeelRootExercise'
        );

        // Perfect Fourth Feel the Root
        window.perfectFourthFeelRootExercise = new FeelTheRootExercise(
            'Perfect Fourth',
            Math.pow(2, 5/12),
            'perfectFourthFeelRoot',
            'perfectFourthFeelRootExercise'
        );

        // Perfect Fifth Feel the Root
        window.perfectFifthFeelRootExercise = new FeelTheRootExercise(
            'Perfect Fifth',
            Math.pow(2, 7/12),
            'perfectFifthFeelRoot',
            'perfectFifthFeelRootExercise'
        );

        // Major Sixth Feel the Root
        window.majorSixthFeelRootExercise = new FeelTheRootExercise(
            'Major Sixth',
            Math.pow(2, 9/12),
            'majorSixthFeelRoot',
            'majorSixthFeelRootExercise'
        );

        // Major Seventh Feel the Root
        window.majorSeventhFeelRootExercise = new FeelTheRootExercise(
            'Major Seventh',
            Math.pow(2, 11/12),
            'majorSeventhFeelRoot',
            'majorSeventhFeelRootExercise'
        );
    });
} else {
    // Half-Step Feel the Root
    window.halfStepFeelRootExercise = new FeelTheRootExercise(
        'Half-Step',
        Math.pow(2, 1/12),
        'halfStepFeelRoot',
        'halfStepFeelRootExercise'
    );

    // Whole-Step Feel the Root
    window.wholeStepFeelRootExercise = new FeelTheRootExercise(
        'Whole-Step',
        Math.pow(2, 2/12),
        'wholeStepFeelRoot',
        'wholeStepFeelRootExercise'
    );

    // Octave Feel the Root
    window.octaveFeelRootExercise = new FeelTheRootExercise(
        'Octave',
        2.0,
        'octaveFeelRoot',
        'octaveFeelRootExercise'
    );

    // Major Third Feel the Root
    window.majorThirdFeelRootExercise = new FeelTheRootExercise(
        'Major Third',
        Math.pow(2, 4/12),
        'majorThirdFeelRoot',
        'majorThirdFeelRootExercise'
    );

    // Perfect Fourth Feel the Root
    window.perfectFourthFeelRootExercise = new FeelTheRootExercise(
        'Perfect Fourth',
        Math.pow(2, 5/12),
        'perfectFourthFeelRoot',
        'perfectFourthFeelRootExercise'
    );

    // Perfect Fifth Feel the Root
    window.perfectFifthFeelRootExercise = new FeelTheRootExercise(
        'Perfect Fifth',
        Math.pow(2, 7/12),
        'perfectFifthFeelRoot',
        'perfectFifthFeelRootExercise'
    );

    // Major Sixth Feel the Root
    window.majorSixthFeelRootExercise = new FeelTheRootExercise(
        'Major Sixth',
        Math.pow(2, 9/12),
        'majorSixthFeelRoot',
        'majorSixthFeelRootExercise'
    );

    // Major Seventh Feel the Root
    window.majorSeventhFeelRootExercise = new FeelTheRootExercise(
        'Major Seventh',
        Math.pow(2, 11/12),
        'majorSeventhFeelRoot',
        'majorSeventhFeelRootExercise'
    );
}
