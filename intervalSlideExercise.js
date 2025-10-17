// Interval Slide Exercise - Base Class
// Slide to match an interval above/below a root note

class IntervalSlideExercise {
    constructor(intervalName, intervalRatio, exerciseId, containerId) {
        this.intervalName = intervalName; // "Unison", "Half-Step", "Whole-Step", "Octave"
        this.intervalRatio = intervalRatio; // 1.0 for Unison, Math.pow(2, 1/12) for Half-Step, etc.
        this.exerciseId = exerciseId;
        this.containerId = containerId;
        this.isUnison = Math.abs(intervalRatio - 1.0) < 0.001; // Check if this is Unison (ratio ~= 1.0)

        // Full piano frequency range
        this.PIANO_MIN_FREQ = 27.5;  // A0
        this.PIANO_MAX_FREQ = 4186;  // C8

        // Calculate trimmed range (remove bottom 15% and top 15% of piano range)
        const pianoMinLog = Math.log(this.PIANO_MIN_FREQ);
        const pianoMaxLog = Math.log(this.PIANO_MAX_FREQ);
        const pianoRange = pianoMaxLog - pianoMinLog;

        // Trim 15% from bottom and 15% from top
        this.MIN_FREQ = Math.exp(pianoMinLog + pianoRange * 0.15);  // Start at 15%
        this.MAX_FREQ = Math.exp(pianoMinLog + pianoRange * 0.85);  // End at 85%

        // State
        this.rootFrequency = null;
        this.targetFrequency = null; // The interval note we're trying to match
        this.currentFrequency = null;
        this.isDragging = false;
        this.rootToneGenerator = new ToneGenerator(); // For root tone
        this.targetToneGenerator = new ToneGenerator(); // For target interval tone
        this.sliderToneGenerator = new ToneGenerator(); // For slider tone
        this.isPlayingRoot = false;
        this.isPlayingTarget = false;
        this.isPlayingSlider = false;
        this.toneHistory = []; // Store previous root tones for BACK button

        this.initializeInstructions();
        this.initializeElements();
        this.attachEventListeners();
        this.initializeButtons();
    }

    initializeInstructions() {
        let instructions;

        if (this.isUnison) {
            // Unison-specific instructions
            instructions = [
                "Use the slider to match the tone of the played note.",
                "This is both an exercise to help your ear - but also a test for your progress on Feel the Unison.",
                "If you're progressing at Feel the Unison with your voice - you'll progress with this!"
            ];
        } else {
            // Interval-based instructions
            instructions = [
                `Start with playing the root note to get a feel of the tone, then slide the slider to find the ${this.intervalName}.`,
                "If you're having trouble, turn on the target note at the same time as the root. Listen for how they react to each other.",
                "Turn off the target note and try to find it again. It's okay to go back.",
                "If you're having trouble, go up an exercise and work on Feel the Interval to get a better sense of feeling.",
                "Try not to match the slider to the target note - that won't help you - match it to the root note!"
            ];
        }

        this.instructions = new ExerciseInstructions(
            `${this.exerciseId}Instructions`,
            instructions
        );
    }

    initializeElements() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`IntervalSlideExercise: container '${this.containerId}' not found`);
        }

        this.exitBtn = document.getElementById(`${this.exerciseId}ExitBtn`);
        this.accuracyBox = document.getElementById(`${this.exerciseId}Accuracy`);
        this.accuracyValue = document.getElementById(`${this.exerciseId}AccuracyValue`);
        this.sliderContainer = document.getElementById(`${this.exerciseId}SliderContainer`);
        this.slider = document.getElementById(`${this.exerciseId}Slider`);
        this.knob = document.getElementById(`${this.exerciseId}Knob`);
        this.track = document.getElementById(`${this.exerciseId}Track`);
        this.nextBtn = document.getElementById(`${this.exerciseId}NextBtn`);
        this.backBtn = document.getElementById(`${this.exerciseId}BackBtn`);

        if (this.isUnison) {
            // Unison has a single "Play Tone" button
            this.playBtn = document.getElementById(`${this.exerciseId}PlayBtn`);
            this.playIcon = document.getElementById(`${this.exerciseId}PlayIcon`);
        } else {
            // Intervals have Root and Target buttons
            this.playRootBtn = document.getElementById(`${this.exerciseId}PlayRootBtn`);
            this.playTargetBtn = document.getElementById(`${this.exerciseId}PlayTargetBtn`);
            this.playRootIcon = document.getElementById(`${this.exerciseId}PlayRootIcon`);
            this.playTargetIcon = document.getElementById(`${this.exerciseId}PlayTargetIcon`);
        }
    }

    attachEventListeners() {
        // Exit button
        if (!this.exitBtn) {
            console.error(`IntervalSlideExercise: exitBtn not found for ${this.exerciseId}`);
            return;
        }
        this.exitBtn.addEventListener('click', () => this.exit());

        if (this.isUnison) {
            // Unison: Single play/stop toggle button
            if (this.playBtn) {
                this.playBtn.addEventListener('click', () => {
                    if (this.isPlayingTarget) {
                        this.stopTargetTone();
                        this.playIcon.textContent = '▶';
                    } else {
                        this.playTargetTone();
                        this.playIcon.textContent = '⏸';
                    }
                });
            } else {
                console.error(`IntervalSlideExercise: playBtn not found for ${this.exerciseId}`);
            }
        } else {
            // Intervals: Separate Root and Target buttons
            // Play/stop root tone toggle
            this.playRootBtn.addEventListener('click', () => {
                if (this.isPlayingRoot) {
                    this.stopRootTone();
                    this.playRootIcon.textContent = '▶';
                } else {
                    this.playRootTone();
                    this.playRootIcon.textContent = '⏸';
                }
            });

            // Play/stop target interval tone toggle
            this.playTargetBtn.addEventListener('click', () => {
                if (this.isPlayingTarget) {
                    this.stopTargetTone();
                    this.playTargetIcon.textContent = '▶';
                } else {
                    this.playTargetTone();
                    this.playTargetIcon.textContent = '⏸';
                }
            });
        }

        // Next tone
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.generateNewTarget());
        }

        // Back to previous tone
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => this.goBackToPreviousTone());
        }

        // Mouse events for slider
        if (this.knob) {
            this.knob.addEventListener('mousedown', (e) => this.startDrag(e));
        }
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', () => this.stopDrag());

        // Touch events for slider
        if (this.knob) {
            this.knob.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
            document.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
            document.addEventListener('touchend', () => this.stopDrag());
            document.addEventListener('touchcancel', () => this.stopDrag());
        }
    }

    initializeButtons() {
        if (this.isUnison) {
            if (this.playIcon) {
                this.playIcon.textContent = '▶';
            }
        } else {
            if (this.playRootIcon) {
                this.playRootIcon.textContent = '▶';
            }
            if (this.playTargetIcon) {
                this.playTargetIcon.textContent = '▶';
            }
        }
    }

    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.knob.style.transition = 'none';

        // Start playing slider tone
        this.updateKnobPosition(e);
        this.startSliderTone();
    }

    onDrag(e) {
        if (!this.isDragging) return;
        e.preventDefault();

        this.updateKnobPosition(e);
        this.updateSliderTone();
    }

    stopDrag() {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.knob.style.transition = '';
        this.stopSliderTone();
    }

    updateKnobPosition(e) {
        const trackRect = this.track.getBoundingClientRect();
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        // Calculate position relative to track
        let relativeY = clientY - trackRect.top;

        // Clamp to track bounds
        relativeY = Math.max(0, Math.min(trackRect.height, relativeY));

        // Convert to percentage (0 at top = highest note, 100 at bottom = lowest note)
        const percentage = (relativeY / trackRect.height) * 100;

        // Update knob position
        this.knob.style.top = `${percentage}%`;

        // Map slider position to frequency range
        const mappedPercentage = 100 - percentage;
        this.currentFrequency = this.percentageToFrequency(mappedPercentage);
    }

    percentageToFrequency(percentage) {
        const minLog = Math.log(this.MIN_FREQ);
        const maxLog = Math.log(this.MAX_FREQ);
        const scale = (maxLog - minLog) / 100;
        return Math.exp(minLog + scale * percentage);
    }

    frequencyToPercentage(frequency) {
        const minLog = Math.log(this.MIN_FREQ);
        const maxLog = Math.log(this.MAX_FREQ);
        const freqLog = Math.log(frequency);
        return ((freqLog - minLog) / (maxLog - minLog)) * 100;
    }

    startSliderTone() {
        if (this.isPlayingSlider) return;
        this.isPlayingSlider = true;
        this.sliderToneGenerator.playTone(this.currentFrequency, 0.3);
    }

    updateSliderTone() {
        if (!this.isPlayingSlider) return;

        if (this.sliderToneGenerator.oscillator && this.currentFrequency) {
            const audioContext = window.audioManager.getAudioContext();
            if (audioContext) {
                this.sliderToneGenerator.oscillator.frequency.setValueAtTime(
                    this.currentFrequency,
                    audioContext.currentTime
                );
            }
        }
    }

    stopSliderTone() {
        this.isPlayingSlider = false;
        this.sliderToneGenerator.stopTone();
    }

    calculateAccuracy() {
        if (!this.targetFrequency || !this.currentFrequency) {
            return null;
        }

        // Calculate cents difference
        const cents = 1200 * Math.log2(this.currentFrequency / this.targetFrequency);
        const centsDiff = Math.abs(cents);

        // Determine if high or low
        const direction = cents > 0 ? 'high' : 'low';

        // Return formatted accuracy message
        if (centsDiff < 5) {
            return '🎯 Perfect!';
        } else if (centsDiff < 10) {
            return `✨ ${centsDiff.toFixed(0)} cents ${direction}`;
        } else if (centsDiff < 25) {
            return `👍 ${centsDiff.toFixed(0)} cents ${direction}`;
        } else if (centsDiff < 50) {
            return `${centsDiff.toFixed(0)} cents ${direction}`;
        } else {
            return `${centsDiff.toFixed(0)} cents ${direction}`;
        }
    }

    showAccuracy() {
        const accuracy = this.calculateAccuracy();
        if (accuracy) {
            this.accuracyValue.textContent = accuracy;
            this.accuracyBox.style.display = 'block';
        }
    }

    generateNewTarget() {
        // Calculate and show accuracy for previous attempt
        if (this.targetFrequency && this.currentFrequency) {
            this.showAccuracy();

            if (this.isUnison) {
                // Unison: Save just the target frequency
                this.toneHistory.push(this.targetFrequency);
            } else {
                // Intervals: Save root and direction
                this.toneHistory.push({root: this.rootFrequency, goingUp: this.goingUp});
            }
        }

        const minLog = Math.log(this.MIN_FREQ);
        const maxLog = Math.log(this.MAX_FREQ);

        if (this.isUnison) {
            // Unison: Generate a single random frequency
            const randomLog = minLog + Math.random() * (maxLog - minLog);
            this.targetFrequency = Math.exp(randomLog);
            // For Unison, root = target (no interval)
            this.rootFrequency = this.targetFrequency;
        } else {
            // Intervals: Generate root and calculate interval
            // Randomly choose to go up or down
            this.goingUp = Math.random() < 0.5;

            let randomLog;
            if (this.goingUp) {
                // Make sure we have room for the interval above
                const maxRootLog = Math.log(this.MAX_FREQ / this.intervalRatio);
                randomLog = minLog + Math.random() * (maxRootLog - minLog);
            } else {
                // Make sure we have room for the interval below
                const minRootLog = Math.log(this.MIN_FREQ * this.intervalRatio);
                randomLog = minRootLog + Math.random() * (maxLog - minRootLog);
            }
            this.rootFrequency = Math.exp(randomLog);

            // Calculate target frequency (interval above or below root)
            this.targetFrequency = this.goingUp ?
                this.rootFrequency * this.intervalRatio :
                this.rootFrequency / this.intervalRatio;
        }

        // Reset knob to random starting position (top or bottom)
        if (!this.isDragging) {
            const startAtTop = Math.random() < 0.5;
            this.knob.style.top = startAtTop ? '0%' : '100%';

            const startPercentage = startAtTop ? 100 : 0;
            this.currentFrequency = this.percentageToFrequency(startPercentage);
        }

        // Start playing appropriate tones
        this.stopRootTone();
        this.stopTargetTone();

        if (this.isUnison) {
            // Unison: Play target tone automatically
            this.playTargetTone();
            this.playIcon.textContent = '⏸';
        } else {
            // Intervals: Play root tone automatically
            this.playRootTone();
            this.playRootIcon.textContent = '⏸';
            this.playTargetIcon.textContent = '▶';
        }
    }

    goBackToPreviousTone() {
        if (this.toneHistory.length === 0) {
            alert('No previous tone to go back to');
            return;
        }

        const previous = this.toneHistory.pop();

        if (this.isUnison) {
            // Unison: Restore target frequency
            this.targetFrequency = previous;
            this.rootFrequency = this.targetFrequency;
        } else {
            // Intervals: Restore root and recalculate target
            this.rootFrequency = previous.root;
            this.goingUp = previous.goingUp;
            this.targetFrequency = this.goingUp ?
                this.rootFrequency * this.intervalRatio :
                this.rootFrequency / this.intervalRatio;
        }

        // Reset knob to random starting position
        const startAtTop = Math.random() < 0.5;
        this.knob.style.top = startAtTop ? '0%' : '100%';

        const startPercentage = startAtTop ? 100 : 0;
        this.currentFrequency = this.percentageToFrequency(startPercentage);

        // Hide accuracy box when going back
        this.accuracyBox.style.display = 'none';

        // Start playing appropriate tone
        this.stopRootTone();
        this.stopTargetTone();

        if (this.isUnison) {
            // Unison: Play target tone
            this.playTargetTone();
            this.playIcon.textContent = '⏸';
        } else {
            // Intervals: Play root tone
            this.playRootTone();
            this.playRootIcon.textContent = '⏸';
            this.playTargetIcon.textContent = '▶';
        }
    }

    async playRootTone() {
        if (!this.rootFrequency) {
            this.generateNewTarget();
            return;
        }

        this.isPlayingRoot = true;
        await this.rootToneGenerator.playTone(this.rootFrequency, 0.3);
    }

    stopRootTone() {
        this.isPlayingRoot = false;
        this.rootToneGenerator.stopTone();
    }

    async playTargetTone() {
        if (!this.targetFrequency) {
            return;
        }

        this.isPlayingTarget = true;
        await this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
    }

    stopTargetTone() {
        this.isPlayingTarget = false;
        this.targetToneGenerator.stopTone();
    }

    stopAllTones() {
        this.stopRootTone();
        this.stopTargetTone();
        this.stopSliderTone();

        if (this.isUnison) {
            this.playIcon.textContent = '▶';
        } else {
            this.playRootIcon.textContent = '▶';
            this.playTargetIcon.textContent = '▶';
        }
    }

    async start() {
        // Hide main app
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.display = 'none';
        }

        // Show exercise
        this.container.style.display = 'flex';

        // Initialize audio (playback only - no microphone)
        await window.audioManager.initializePlaybackOnly();

        // Generate initial target (this will auto-play root)
        this.generateNewTarget();
    }

    exit() {
        this.container.style.display = 'none';

        // Stop all tones
        this.stopAllTones();

        this.isDragging = false;

        // Return to main menu
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.display = 'block';
        }
    }
}

// Initialize all Slide exercise variants when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Unison Slide
        window.toneSlideExercise = new IntervalSlideExercise(
            'Unison',
            1.0,
            'toneSlide',
            'toneSlideExercise'
        );

        // Half-Step Slide
        window.halfStepSlideExercise = new IntervalSlideExercise(
            'Half-Step',
            Math.pow(2, 1/12),
            'halfStepSlide',
            'halfStepSlideExercise'
        );

        // Whole-Step Slide
        window.wholeStepSlideExercise = new IntervalSlideExercise(
            'Whole-Step',
            Math.pow(2, 2/12),
            'wholeStepSlide',
            'wholeStepSlideExercise'
        );

        // Octave Slide
        window.octaveSlideExercise = new IntervalSlideExercise(
            'Octave',
            2.0,
            'octaveSlide',
            'octaveSlideExercise'
        );

        // Major Third Slide
        window.majorThirdSlideExercise = new IntervalSlideExercise(
            'Major Third',
            Math.pow(2, 4/12),
            'majorThirdSlide',
            'majorThirdSlideExercise'
        );

        // Perfect Fourth Slide
        window.perfectFourthSlideExercise = new IntervalSlideExercise(
            'Perfect Fourth',
            Math.pow(2, 5/12),
            'perfectFourthSlide',
            'perfectFourthSlideExercise'
        );

        // Perfect Fifth Slide
        window.perfectFifthSlideExercise = new IntervalSlideExercise(
            'Perfect Fifth',
            Math.pow(2, 7/12),
            'perfectFifthSlide',
            'perfectFifthSlideExercise'
        );

        // Major Sixth Slide
        window.majorSixthSlideExercise = new IntervalSlideExercise(
            'Major Sixth',
            Math.pow(2, 9/12),
            'majorSixthSlide',
            'majorSixthSlideExercise'
        );

        // Major Seventh Slide
        window.majorSeventhSlideExercise = new IntervalSlideExercise(
            'Major Seventh',
            Math.pow(2, 11/12),
            'majorSeventhSlide',
            'majorSeventhSlideExercise'
        );
    });
} else {
    // Unison Slide
    window.toneSlideExercise = new IntervalSlideExercise(
        'Unison',
        1.0,
        'toneSlide',
        'toneSlideExercise'
    );

    // Half-Step Slide
    window.halfStepSlideExercise = new IntervalSlideExercise(
        'Half-Step',
        Math.pow(2, 1/12),
        'halfStepSlide',
        'halfStepSlideExercise'
    );

    // Whole-Step Slide
    window.wholeStepSlideExercise = new IntervalSlideExercise(
        'Whole-Step',
        Math.pow(2, 2/12),
        'wholeStepSlide',
        'wholeStepSlideExercise'
    );

    // Octave Slide
    window.octaveSlideExercise = new IntervalSlideExercise(
        'Octave',
        2.0,
        'octaveSlide',
        'octaveSlideExercise'
    );

    // Major Third Slide
    window.majorThirdSlideExercise = new IntervalSlideExercise(
        'Major Third',
        Math.pow(2, 4/12),
        'majorThirdSlide',
        'majorThirdSlideExercise'
    );

    // Perfect Fourth Slide
    window.perfectFourthSlideExercise = new IntervalSlideExercise(
        'Perfect Fourth',
        Math.pow(2, 5/12),
        'perfectFourthSlide',
        'perfectFourthSlideExercise'
    );

    // Perfect Fifth Slide
    window.perfectFifthSlideExercise = new IntervalSlideExercise(
        'Perfect Fifth',
        Math.pow(2, 7/12),
        'perfectFifthSlide',
        'perfectFifthSlideExercise'
    );

    // Major Sixth Slide
    window.majorSixthSlideExercise = new IntervalSlideExercise(
        'Major Sixth',
        Math.pow(2, 9/12),
        'majorSixthSlide',
        'majorSixthSlideExercise'
    );

    // Major Seventh Slide
    window.majorSeventhSlideExercise = new IntervalSlideExercise(
        'Major Seventh',
        Math.pow(2, 11/12),
        'majorSeventhSlide',
        'majorSeventhSlideExercise'
    );
}
