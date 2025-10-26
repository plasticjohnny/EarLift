/**
 * Interval System Exercise Class
 *
 * Guided singing exercises for practicing intervals.
 * System exercises are designed for spaced repetition learning.
 */

class IntervalSystemExercise {
    constructor(intervalConfig, containerId) {
        // Interval configuration from intervalConfigs.js
        this.intervalConfig = intervalConfig;
        this.intervalType = intervalConfig.intervalType;
        this.intervalName = intervalConfig.intervalName;
        this.containerId = containerId;
        this.isUnison = this.intervalType === 'unison';

        // Audio
        this.toneGenerator = new ToneGenerator();
        this.vocalRange = null;
        this.rootFrequency = null;
        this.intervalFrequency = null;
        this.rootPlaying = false;
        this.intervalPlaying = false;

        // Oscillators for playing tones
        this.rootOscillator = null;
        this.intervalOscillator = null;
        this.rootGainNode = null;
        this.intervalGainNode = null;

        // Exercise progression
        this.exercises = getSystemExercisesForInterval(this.intervalType);
        this.currentExerciseIndex = 0;
        this.currentStepIndex = 0;
        this.repetitionsCompleted = 0;
        this.maxRepetitions = 5; // Practice same interval 5 times
        this.doAllExercises = false; // If false, return to menu after completing one exercise

        // Randomization support
        this.glissandoDirection = null; // 'up' or 'down'

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            const error = `IntervalSystemExercise: container not found: ${this.containerId}`;
            console.error(error);
            throw new Error(error);
        }

        // Display elements
        this.exerciseTitle = this.container.querySelector('[data-system-exercise="title"]');
        this.exerciseLabel = this.container.querySelector('[data-system-exercise="exercise-label"]');
        this.stepIndicator = this.container.querySelector('[data-system-exercise="step-indicator"]');

        // Carousel step cards
        this.stepPrevCard = this.container.querySelector('[data-system-exercise="step-prev"]');
        this.stepCurrentCard = this.container.querySelector('[data-system-exercise="step-current"]');
        this.stepNextCard = this.container.querySelector('[data-system-exercise="step-next"]');

        // Step instructions
        this.instructionPrev = this.container.querySelector('[data-system-exercise="instruction-prev"]');
        this.instructionCurrent = this.container.querySelector('[data-system-exercise="instruction-current"]');
        this.instructionNext = this.container.querySelector('[data-system-exercise="instruction-next"]');

        // Step action buttons
        this.actionPrevBtn = this.container.querySelector('[data-system-exercise="action-prev"]');
        this.actionCurrentBtn = this.container.querySelector('[data-system-exercise="action-current"]');
        this.actionNextBtn = this.container.querySelector('[data-system-exercise="action-next"]');

        // Control buttons
        this.skipExerciseBtn = this.container.querySelector('[data-system-exercise="skip-exercise"]');
        this.exitBtn = this.container.querySelector('[data-system-exercise="exit"]');

        // Visual indicators
        this.rootIndicator = this.container.querySelector('[data-system-exercise="root-indicator"]');
        this.intervalIndicator = this.container.querySelector('[data-system-exercise="interval-indicator"]');
        this.glissandoIndicator = this.container.querySelector('[data-system-exercise="glissando-indicator"]');
        this.glissandoNotesImg = this.glissandoIndicator ? this.glissandoIndicator.querySelector('.glissando-notes') : null;
    }

    attachEventListeners() {
        // Current step action button
        if (this.actionCurrentBtn) {
            this.actionCurrentBtn.addEventListener('click', () => this.handleCurrentAction());
        }

        // Clicking prev/next cards navigates to them
        if (this.stepPrevCard) {
            this.stepPrevCard.addEventListener('click', () => this.navigateToPrev());
        }
        if (this.stepNextCard) {
            this.stepNextCard.addEventListener('click', () => this.navigateToNext());
        }

        // Clicking visual indicators toggles their audio
        if (this.rootIndicator) {
            this.rootIndicator.addEventListener('click', () => this.toggleRoot());
        }
        if (this.intervalIndicator) {
            this.intervalIndicator.addEventListener('click', () => this.toggleInterval());
        }

        // Control buttons
        if (this.skipExerciseBtn) {
            this.skipExerciseBtn.addEventListener('click', () => this.skipExercise());
        }
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => this.exit());
        }
    }

    async start() {
        // Get vocal range
        this.vocalRange = appSettings.getVocalRange();
        if (!this.vocalRange.low || !this.vocalRange.high) {
            alert('Please set up your vocal range first.');
            return;
        }

        // Show exercise screen
        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';

        // Reset step state (but preserve currentExerciseIndex set by caller)
        this.currentStepIndex = 0;
        this.repetitionsCompleted = 0;
        this.rootPlaying = false;
        this.intervalPlaying = false;

        // Generate first tone pair
        this.generateNewTones();

        // Update UI
        this.updateDisplay();
        this.renderCurrentStep();
    }

    generateNewTones() {
        // Generate root frequency within vocal range
        const lowFreq = this.vocalRange.low.frequency;
        const highFreq = this.vocalRange.high.frequency;

        // For intervals, ensure both root and interval fit in range
        if (this.isUnison) {
            this.rootFrequency = Math.random() * (highFreq - lowFreq) + lowFreq;
            this.intervalFrequency = this.rootFrequency; // Same as root for unison
        } else {
            // Calculate interval frequency range
            const semitones = this.intervalConfig.semitones;
            const intervalRatio = Math.pow(2, semitones / 12);

            // Ensure interval fits in range (assuming upward interval)
            const maxRootFreq = highFreq / intervalRatio;
            const effectiveHighFreq = Math.min(maxRootFreq, highFreq);

            this.rootFrequency = Math.random() * (effectiveHighFreq - lowFreq) + lowFreq;
            this.intervalFrequency = this.rootFrequency * intervalRatio;
        }

        // Randomize glissando direction if current exercise supports it
        const currentExercise = this.exercises[this.currentExerciseIndex];
        if (currentExercise && currentExercise.randomizeDirection) {
            this.glissandoDirection = Math.random() < 0.5 ? 'up' : 'down';
        }

        this.updateDisplay();
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

    updateDisplay() {
        // Update header with interval name and exercise name
        const currentExercise = this.exercises[this.currentExerciseIndex];
        if (this.exerciseTitle) {
            this.exerciseTitle.textContent = this.intervalName;
        }
        if (this.exerciseLabel) {
            this.exerciseLabel.textContent = currentExercise.name;
        }

        // Hide interval controls for unison
        if (this.isUnison) {
            if (this.intervalIndicator) this.intervalIndicator.style.display = 'none';
            if (this.skipExerciseBtn) {
                this.skipExerciseBtn.textContent = 'Next Note';
            }
        }

        // Hide root indicator if exercise specifies
        if (currentExercise.hideRootIndicator) {
            if (this.rootIndicator) this.rootIndicator.style.display = 'none';
        } else {
            if (this.rootIndicator) this.rootIndicator.style.display = '';
        }

        // Show glissando indicator for glissando exercise
        if (currentExercise.name === 'Glissando') {
            if (this.glissandoIndicator) this.glissandoIndicator.style.display = 'flex';
            // Update flip based on direction
            if (this.glissandoNotesImg) {
                if (this.glissandoDirection === 'down') {
                    this.glissandoNotesImg.classList.add('flipped');
                } else {
                    this.glissandoNotesImg.classList.remove('flipped');
                }
            }
        } else {
            if (this.glissandoIndicator) this.glissandoIndicator.style.display = 'none';
        }
    }

    renderCurrentStep() {
        const currentExercise = this.exercises[this.currentExerciseIndex];
        const totalSteps = currentExercise.steps.length;
        const currentStep = currentExercise.steps[this.currentStepIndex];

        // Calculate prev/next step indices (with wrapping)
        const prevStepIndex = (this.currentStepIndex - 1 + totalSteps) % totalSteps;
        const nextStepIndex = (this.currentStepIndex + 1) % totalSteps;

        const prevStep = currentExercise.steps[prevStepIndex];
        const nextStep = currentExercise.steps[nextStepIndex];

        // Update instruction carousel
        // Check if we should use alternate instructions based on glissando direction
        const getInstruction = (step) => {
            if (this.glissandoDirection === 'down' && step.instructionDown) {
                return step.instructionDown;
            }
            return step.instruction;
        };

        if (this.instructionPrev) {
            this.instructionPrev.textContent = getInstruction(prevStep);
        }
        if (this.instructionCurrent) {
            this.instructionCurrent.textContent = getInstruction(currentStep);
        }
        if (this.instructionNext) {
            this.instructionNext.textContent = getInstruction(nextStep);
        }

        // Update step indicator
        if (this.stepIndicator) {
            this.stepIndicator.textContent = `Step ${this.currentStepIndex + 1} of ${totalSteps}`;
        }

        // Check if this is the last step
        const isLastStep = this.currentStepIndex === totalSteps - 1;

        // Update prev/current/next action button labels
        if (this.actionPrevBtn) {
            this.actionPrevBtn.textContent = prevStep.actionButtonLabel || 'Action';
        }
        if (this.actionCurrentBtn) {
            // If last step, button should say "Finish"
            this.actionCurrentBtn.textContent = isLastStep ? 'Finish' : (currentStep.actionButtonLabel || 'Continue');
        }
        if (this.actionNextBtn) {
            this.actionNextBtn.textContent = nextStep.actionButtonLabel || 'Action';
        }

        // Hide previous step card when on first step, but maintain spacing
        if (this.stepPrevCard) {
            if (this.currentStepIndex === 0) {
                this.stepPrevCard.style.visibility = 'hidden';
            } else {
                this.stepPrevCard.style.visibility = 'visible';
            }
        }

        // Hide next step card when on last step, but maintain spacing
        if (this.stepNextCard) {
            if (isLastStep) {
                this.stepNextCard.style.visibility = 'hidden';
            } else {
                this.stepNextCard.style.visibility = 'visible';
            }
        }

        // Trigger progressive animation (instruction first, then button)
        this.triggerStepAnimation();

        // Update glissando note pulsing based on step
        this.updateGlissandoPulse();

        // Auto-play audio based on step's audioState
        this.applyAudioState(currentStep.audioState);
    }

    triggerStepAnimation() {
        // Remove animation class if present
        if (this.stepCurrentCard) {
            this.stepCurrentCard.classList.remove('step-animating');
        }

        // Trigger reflow to restart animation
        void this.stepCurrentCard.offsetWidth;

        // Add animation class
        if (this.stepCurrentCard) {
            this.stepCurrentCard.classList.add('step-animating');
        }

        // Remove animation class after it completes (0.8s + 0.9s delay + 0.8s = 2.5s total)
        setTimeout(() => {
            if (this.stepCurrentCard) {
                this.stepCurrentCard.classList.remove('step-animating');
            }
        }, 2500);
    }

    updateGlissandoPulse() {
        // Gradient animation is now handled by CSS and runs continuously
        // No step-based logic needed since we replaced the pulse effects
        // Keeping this method for future enhancements if needed
    }

    async applyAudioState(audioState) {
        // Stop all audio first
        this.stopAll();

        // Ensure audio context is ready
        await this.toneGenerator.ensureAudioContext();

        // Apply the new audio state
        switch (audioState) {
            case 'root':
                await this.playRoot();
                this.rootPlaying = true;
                break;
            case 'interval':
                if (!this.isUnison) {
                    await this.playInterval();
                    this.intervalPlaying = true;
                }
                break;
            case 'both':
                if (!this.isUnison) {
                    await this.playRoot();
                    await this.playInterval();
                    this.rootPlaying = true;
                    this.intervalPlaying = true;
                }
                break;
            case 'none':
            default:
                // Already stopped all
                break;
        }

        this.updateButtonStates();
    }

    async playRoot() {
        await this.toneGenerator.ensureAudioContext();
        const audioContext = window.audioManager.getAudioContext();

        if (!audioContext) {
            console.error('AudioContext not available');
            return;
        }

        // Create gain node
        this.rootGainNode = audioContext.createGain();
        this.rootGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        this.rootGainNode.connect(audioContext.destination);

        // Create and start oscillator
        this.rootOscillator = audioContext.createOscillator();
        this.rootOscillator.type = 'sine';
        this.rootOscillator.frequency.setValueAtTime(this.rootFrequency, audioContext.currentTime);
        this.rootOscillator.connect(this.rootGainNode);
        this.rootOscillator.start(audioContext.currentTime);
    }

    stopRoot() {
        if (this.rootOscillator) {
            try {
                const audioContext = window.audioManager.getAudioContext();
                if (!audioContext) return;

                const currentTime = audioContext.currentTime;

                // Fade out
                if (this.rootGainNode) {
                    this.rootGainNode.gain.setValueAtTime(this.rootGainNode.gain.value, currentTime);
                    this.rootGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
                    this.rootOscillator.stop(currentTime + 0.05);
                } else {
                    this.rootOscillator.stop();
                }
                this.rootOscillator.disconnect();
            } catch (e) {
                console.warn('Error stopping root oscillator:', e);
            }
            this.rootOscillator = null;
        }
        if (this.rootGainNode) {
            this.rootGainNode.disconnect();
            this.rootGainNode = null;
        }
    }

    async playInterval() {
        await this.toneGenerator.ensureAudioContext();
        const audioContext = window.audioManager.getAudioContext();

        if (!audioContext) {
            console.error('AudioContext not available');
            return;
        }

        // Create gain node
        this.intervalGainNode = audioContext.createGain();
        this.intervalGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        this.intervalGainNode.connect(audioContext.destination);

        // Create and start oscillator
        this.intervalOscillator = audioContext.createOscillator();
        this.intervalOscillator.type = 'sine';
        this.intervalOscillator.frequency.setValueAtTime(this.intervalFrequency, audioContext.currentTime);
        this.intervalOscillator.connect(this.intervalGainNode);
        this.intervalOscillator.start(audioContext.currentTime);
    }

    stopInterval() {
        if (this.intervalOscillator) {
            try {
                const audioContext = window.audioManager.getAudioContext();
                if (!audioContext) return;

                const currentTime = audioContext.currentTime;

                // Fade out
                if (this.intervalGainNode) {
                    this.intervalGainNode.gain.setValueAtTime(this.intervalGainNode.gain.value, currentTime);
                    this.intervalGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
                    this.intervalOscillator.stop(currentTime + 0.05);
                } else {
                    this.intervalOscillator.stop();
                }
                this.intervalOscillator.disconnect();
            } catch (e) {
                console.warn('Error stopping interval oscillator:', e);
            }
            this.intervalOscillator = null;
        }
        if (this.intervalGainNode) {
            this.intervalGainNode.disconnect();
            this.intervalGainNode = null;
        }
    }

    handleCurrentAction() {
        // Action button advances to next step
        this.navigateToNext();
    }

    navigateToPrev() {
        // Navigate to previous step (with wrapping)
        const currentExercise = this.exercises[this.currentExerciseIndex];
        const totalSteps = currentExercise.steps.length;
        this.currentStepIndex = (this.currentStepIndex - 1 + totalSteps) % totalSteps;
        this.renderCurrentStep();
    }

    navigateToNext() {
        // Navigate to next step (with wrapping)
        const currentExercise = this.exercises[this.currentExerciseIndex];
        const totalSteps = currentExercise.steps.length;
        this.currentStepIndex = (this.currentStepIndex + 1) % totalSteps;
        this.renderCurrentStep();
    }

    async toggleRoot() {
        if (this.rootPlaying) {
            // Stop root if it's playing
            this.stopRoot();
            this.rootPlaying = false;
        } else {
            // Play root if it's stopped
            await this.playRoot();
            this.rootPlaying = true;
        }
        this.updateButtonStates();
    }

    async toggleInterval() {
        if (this.isUnison) return; // No interval for unison

        if (this.intervalPlaying) {
            // Stop interval if it's playing
            this.stopInterval();
            this.intervalPlaying = false;
        } else {
            // Play interval if it's stopped
            await this.playInterval();
            this.intervalPlaying = true;
        }
        this.updateButtonStates();
    }

    stopAll() {
        this.stopRoot();
        this.stopInterval();
        this.rootPlaying = false;
        this.intervalPlaying = false;
    }

    updateButtonStates() {
        // Update visual indicators
        if (this.rootIndicator) {
            if (this.rootPlaying) {
                this.rootIndicator.classList.add('playing');
            } else {
                this.rootIndicator.classList.remove('playing');
            }
        }

        if (this.intervalIndicator && !this.isUnison) {
            if (this.intervalPlaying) {
                this.intervalIndicator.classList.add('playing');
            } else {
                this.intervalIndicator.classList.remove('playing');
            }
        }
    }

    nextStep() {
        const currentExercise = this.exercises[this.currentExerciseIndex];

        if (this.currentStepIndex < currentExercise.steps.length - 1) {
            // Move to next step in current exercise
            this.currentStepIndex++;
            this.renderCurrentStep();
        } else {
            // Completed all steps in this exercise
            // Move to next exercise or next repetition
            this.completeCurrentExercise();
        }
    }

    completeCurrentExercise() {
        this.repetitionsCompleted++;

        if (this.repetitionsCompleted >= this.maxRepetitions) {
            // Completed all repetitions for this exercise

            // If not doing all exercises, return to menu
            if (!this.doAllExercises) {
                this.stopAll();
                this.container.style.display = 'none';
                document.getElementById('systemExerciseMenu').style.display = 'block';
                return;
            }

            // Otherwise, move to next exercise
            this.repetitionsCompleted = 0;
            this.currentExerciseIndex++;

            if (this.currentExerciseIndex >= this.exercises.length) {
                // Completed all exercises!
                this.showCompletionMessage();
                return;
            } else {
                // Move to next exercise
                this.currentStepIndex = 0;
                this.generateNewTones();
                this.updateDisplay();
                this.renderCurrentStep();
            }
        } else {
            // Same exercise, new tones
            this.currentStepIndex = 0;
            this.generateNewTones();
            this.updateDisplay();
            this.renderCurrentStep();
        }
    }

    skipExercise() {
        // For unison, this is "Next Note"
        if (this.isUnison) {
            this.repetitionsCompleted++;
            if (this.repetitionsCompleted >= this.maxRepetitions) {
                // If not doing all exercises, return to menu
                if (!this.doAllExercises) {
                    this.stopAll();
                    this.container.style.display = 'none';
                    document.getElementById('systemExerciseMenu').style.display = 'block';
                } else {
                    this.showCompletionMessage();
                }
            } else {
                this.currentStepIndex = 0;
                this.generateNewTones();
                this.updateDisplay();
                this.renderCurrentStep();
            }
            return;
        }

        // For intervals, skip to next exercise
        this.repetitionsCompleted = 0;
        this.currentExerciseIndex++;

        if (this.currentExerciseIndex >= this.exercises.length || !this.doAllExercises) {
            // Return to menu if we've reached the end OR if not doing all exercises
            this.stopAll();
            this.container.style.display = 'none';
            document.getElementById('systemExerciseMenu').style.display = 'block';
        } else {
            this.currentStepIndex = 0;
            this.generateNewTones();
            this.updateDisplay();
            this.renderCurrentStep();
        }
    }

    showCompletionMessage() {
        this.stopAll();
        alert(`Congratulations! You've completed all ${this.intervalName} system exercises!`);
        this.exit();
    }

    exit() {
        // Stop all audio
        this.stopAll();

        // Hide exercise screen
        this.container.style.display = 'none';

        // Show main app
        document.getElementById('appContainer').style.display = 'block';

        // Clear exercise from URL
        if (window.earTrainerApp && window.earTrainerApp.clearExerciseFromURL) {
            window.earTrainerApp.clearExerciseFromURL();
        }
    }
}
