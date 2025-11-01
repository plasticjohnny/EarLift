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
        this.isTutorial = this.intervalType === 'tutorial';

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

        // Continuous glissando state
        this.continuousGlissando = {
            active: false,
            direction: null, // 'up' or 'down'
            size: null, // 'big' or 'medium'
            speed: null, // Hz per frame (1 for big, 0.5 for medium)
            animationId: null
        };

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

        // Flow layout elements
        this.commandElement = this.container.querySelector('[data-system-exercise="command"]');
        this.instructionElement = this.container.querySelector('[data-system-exercise="instruction"]');
        this.actionButton = this.container.querySelector('[data-system-exercise="action"]');
        this.flowInstructionCard = this.container.querySelector('.flow-instruction-card');

        // Control buttons
        this.skipExerciseBtn = this.container.querySelector('[data-system-exercise="skip-exercise"]');
        this.exitBtn = this.container.querySelector('[data-system-exercise="exit"]');
        this.helpBtn = this.container.querySelector('[data-system-exercise="help"]');

        // Visual indicators
        this.rootIndicator = this.container.querySelector('[data-system-exercise="root-indicator"]');
        this.intervalIndicator = this.container.querySelector('[data-system-exercise="interval-indicator"]');
        this.glissandoIndicator = this.container.querySelector('[data-system-exercise="glissando-indicator"]');
        this.glissandoNotesImg = this.glissandoIndicator ? this.glissandoIndicator.querySelector('.glissando-notes') : null;
        this.middleIconsContainer = this.container.querySelector('[data-system-exercise="middle-icons"]');
        this.rootSolfegeLabel = this.container.querySelector('[data-system-exercise="root-solfege"]');
        this.intervalSolfegeLabel = this.container.querySelector('[data-system-exercise="interval-solfege"]');
        this.intervalLabelText = this.container.querySelector('[data-system-exercise="interval-label-text"]');
        this.intervalPlayPauseBtn = this.container.querySelector('[data-system-exercise="interval-play-pause"]');
        this.playIcon = this.intervalPlayPauseBtn ? this.intervalPlayPauseBtn.querySelector('.play-icon') : null;
        this.pauseIcon = this.intervalPlayPauseBtn ? this.intervalPlayPauseBtn.querySelector('.pause-icon') : null;
        this.sliderInstruction = this.container.querySelector('[data-system-exercise="slider-instruction"]');

        // Unison rating UI
        this.unisonRatingContainer = this.container.querySelector('[data-system-exercise="unison-rating"]');
        this.unisonRatingButtons = this.container.querySelectorAll('.unison-rating-btn');
    }

    attachEventListeners() {
        // Command button - go back to previous step (if not on step 1)
        if (this.commandElement) {
            this.commandElement.addEventListener('click', () => {
                if (this.currentStepIndex > 0) {
                    this.navigateToPrev();
                }
            });
        }

        // Action button
        if (this.actionButton) {
            this.actionButton.addEventListener('click', () => this.handleCurrentAction());
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
        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', () => this.showHelpModal());
        }

        // Unison rating buttons
        if (this.unisonRatingButtons) {
            this.unisonRatingButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const rating = e.currentTarget.dataset.rating;
                    this.handleUnisonRating(rating);
                });
            });
        }

        // Update card width and triangle sizes on window resize
        window.addEventListener('resize', () => {
            this.calculateOptimalCardWidth();
            this.updateTriangleSizes();
        });
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

        // Add full-screen class for unison exercises
        if (this.isUnison) {
            this.container.classList.add('unison-fullscreen');
        } else {
            this.container.classList.remove('unison-fullscreen');
        }

        // Show Match the Tone modal EVERY TIME for exerciseIndex 0
        if (this.isUnison && this.currentExerciseIndex === 0) {
            this.showMatchTheToneModal();
        }

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
        // Check if custom root frequency is set (from training mode)
        if (this.customRootFrequency) {
            console.log('[SystemExercise] Using customRootFrequency:', this.customRootFrequency);
            this.rootFrequency = this.customRootFrequency;

            // For Slider Glissando, round to whole Hz to enable exact matching
            const currentExercise = this.exercises[this.currentExerciseIndex];
            if (currentExercise?.useGlissandoSlider) {
                this.rootFrequency = Math.round(this.rootFrequency);
                console.log('[SystemExercise] Rounded custom root frequency for Slider Glissando:', this.rootFrequency);
            }

            // Calculate interval frequency based on custom root
            if (this.isUnison || this.isTutorial) {
                this.intervalFrequency = this.rootFrequency;
            } else {
                const semitones = this.intervalConfig.semitones;
                const intervalRatio = Math.pow(2, semitones / 12);
                this.intervalFrequency = this.rootFrequency * intervalRatio;
            }

            // Clear custom frequency so next repetition uses random
            this.customRootFrequency = null;
        } else {
            // Check if current exercise uses glissando slider (Slider Glissando)
            const currentExercise = this.exercises[this.currentExerciseIndex];
            const usesPianoRange = currentExercise?.useGlissandoSlider;

            let lowFreq, highFreq;

            if (usesPianoRange) {
                // Slider Glissando: Use fixed piano range A3 to C6
                lowFreq = 220.00;     // A3
                highFreq = 1046.50;   // C6
                console.log('[SystemExercise] Using fixed piano range for Slider Glissando:', lowFreq, '-', highFreq, 'Hz');
            } else {
                // Other exercises: Use vocal range
                lowFreq = this.vocalRange.low.frequency;
                highFreq = this.vocalRange.high.frequency;
            }

            // For intervals, ensure both root and interval fit in range
            if (this.isUnison || this.isTutorial) {
                this.rootFrequency = Math.random() * (highFreq - lowFreq) + lowFreq;

                // For Slider Glissando, round to whole Hz to enable exact matching
                if (currentExercise?.useGlissandoSlider) {
                    this.rootFrequency = Math.round(this.rootFrequency);
                    console.log('[SystemExercise] Rounded root frequency for Slider Glissando:', this.rootFrequency);
                }

                this.intervalFrequency = this.rootFrequency; // Same as root for unison/tutorial
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

        // Show help button for Match the Tone and Slider Glissando exercises
        if (this.helpBtn) {
            if ((this.isUnison && currentExercise.name === "Match the Tone") || currentExercise.useGlissandoSlider) {
                this.helpBtn.classList.add('visible');
            } else {
                this.helpBtn.classList.remove('visible');
            }
        }

        // Hide interval controls for unison (except for Slider Glissando which needs both indicators)
        if (this.isUnison && !currentExercise.useGlissandoSlider) {
            if (this.intervalIndicator) this.intervalIndicator.style.display = 'none';

            // Hide middle icon container to center the root indicator
            const middleIconContainer = this.container.querySelector('.middle-icon-container');
            if (middleIconContainer) middleIconContainer.style.display = 'none';

            if (this.skipExerciseBtn) {
                this.skipExerciseBtn.textContent = 'Skip';
            }
        }

        // For Slider Glissando, ensure both indicators are visible
        if (currentExercise.useGlissandoSlider) {
            if (this.intervalIndicator) this.intervalIndicator.style.display = '';
            const middleIconContainer = this.container.querySelector('.middle-icon-container');
            if (middleIconContainer) middleIconContainer.style.display = '';

            // Change label to "Matching Note" and hide solfege
            if (this.intervalLabelText) {
                this.intervalLabelText.textContent = 'Matching Note';
            }
            if (this.intervalSolfegeLabel) {
                this.intervalSolfegeLabel.style.display = 'none';
            }

            // Show play/pause button
            if (this.intervalPlayPauseBtn) {
                this.intervalPlayPauseBtn.style.display = 'flex';
            }

            // Update play/pause icon based on current state
            this.updatePlayPauseIcon();
        } else {
            // Hide play/pause button and instruction arrow for non-slider exercises
            if (this.intervalPlayPauseBtn) {
                this.intervalPlayPauseBtn.style.display = 'none';
            }
            if (this.sliderInstruction) {
                this.sliderInstruction.style.display = 'none';
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

        // Check if this exercise uses glissando slider
        if (currentExercise.useGlissandoSlider) {
            // Hide carousel and unison rating UI
            const flowContainer = this.container.querySelector('.carousel-step-flow');
            if (flowContainer) {
                flowContainer.style.display = 'none';
            }
            if (this.unisonRatingContainer) {
                this.unisonRatingContainer.style.display = 'none';
            }

            // Show glissando slider controls
            const sliderSection = this.container.querySelector('[data-system-exercise="glissando-slider-controls"]');
            if (sliderSection) {
                sliderSection.style.display = 'block';
            }

            // Initialize glissando slider (only once per exercise start)
            if (!this.glissandoSliderInitialized) {
                this.setupGlissandoSlider();
                this.glissandoSliderInitialized = true;
            }

            // Update command/instruction display
            if (this.commandElement) {
                this.commandElement.textContent = currentStep.command;
            }
            if (this.instructionElement) {
                this.instructionElement.textContent = currentStep.instruction;
            }

            // Update Skip button text for Slider Glissando
            if (this.skipExerciseBtn) {
                this.skipExerciseBtn.textContent = "Can't Find It!";
            }

            // Apply audio state (play root tone)
            this.applyAudioState(currentStep.audioState);
            return;
        }

        // Check if this is a simplified unison exercise
        if (this.isUnison && currentStep.simplifiedRating) {
            // Hide carousel, show unison rating UI
            const flowContainer = this.container.querySelector('.carousel-step-flow');
            if (flowContainer) {
                flowContainer.style.display = 'none';
            }

            // Update rating labels for regular unison (not Slider Glissando)
            this.updateRatingLabels(false);

            if (this.unisonRatingContainer) {
                this.unisonRatingContainer.style.display = 'flex';
            }

            // Apply audio state (play root tone)
            this.applyAudioState(currentStep.audioState);
            return;
        }

        // Normal carousel rendering for intervals...
        // Hide flow container FIRST, before any text updates or DOM changes
        const flowContainer = this.container.querySelector('.carousel-step-flow');
        if (flowContainer) {
            flowContainer.style.visibility = 'hidden';
            flowContainer.style.opacity = '0';
            flowContainer.style.display = '';
        }

        // Hide unison rating UI
        if (this.unisonRatingContainer) {
            this.unisonRatingContainer.style.display = 'none';
        }

        // Calculate prev/next step indices (with wrapping)
        const prevStepIndex = (this.currentStepIndex - 1 + totalSteps) % totalSteps;
        const nextStepIndex = (this.currentStepIndex + 1) % totalSteps;

        const prevStep = currentExercise.steps[prevStepIndex];
        const nextStep = currentExercise.steps[nextStepIndex];

        // Helper function to get instruction based on glissando direction
        const getInstruction = (step) => {
            if (this.glissandoDirection === 'down' && step.instructionDown) {
                return step.instructionDown;
            }
            return step.instruction;
        };

        // Helper function to get command based on glissando direction
        const getCommand = (step) => {
            // For glissando, command doesn't change based on direction
            return step.command;
        };

        // Update command element
        if (this.commandElement) {
            this.commandElement.textContent = getCommand(currentStep);

            // Make command button clickable if not on first step
            if (this.currentStepIndex > 0) {
                this.commandElement.classList.add('clickable');
                this.commandElement.style.cursor = 'pointer';
            } else {
                this.commandElement.classList.remove('clickable');
                this.commandElement.style.cursor = 'default';
            }
        }

        // Update instruction element
        if (this.instructionElement) {
            this.instructionElement.textContent = getInstruction(currentStep);
        }

        // Update action button - dynamically generate label from next step's command
        if (this.actionButton) {
            const isLastStep = this.currentStepIndex === totalSteps - 1;
            if (isLastStep) {
                this.actionButton.textContent = 'Finish';
            } else {
                const nextStep = currentExercise.steps[this.currentStepIndex + 1];
                const nextCommand = nextStep.command.toLowerCase();
                this.actionButton.textContent = `then ${nextCommand}`;
            }
        }

        // Update glissando note pulsing based on step
        this.updateGlissandoPulse();

        // Render step icons (visual representation of singing/listening)
        this.renderStepIcons(currentStep);

        // Calculate optimal card width
        this.calculateOptimalCardWidth();

        // Force layout recalculation before positioning
        if (this.flowInstructionCard) {
            this.flowInstructionCard.offsetHeight;
        }

        // Position buttons based on calculated width
        this.updateTriangleSizes();

        // Auto-play audio based on step's audioState
        this.applyAudioState(currentStep.audioState);
    }

    triggerStepAnimation() {
        // Remove animation classes if present
        if (this.flowInstructionCard) {
            this.flowInstructionCard.classList.remove('step-animating');
        }
        if (this.actionButton) {
            this.actionButton.classList.remove('step-animating');
        }

        // Trigger reflow to restart animation
        if (this.flowInstructionCard) {
            void this.flowInstructionCard.offsetWidth;
        }

        // Add animation classes
        if (this.flowInstructionCard) {
            this.flowInstructionCard.classList.add('step-animating');
        }
        if (this.actionButton) {
            this.actionButton.classList.add('step-animating');
        }

        // Remove animation classes after they complete (0.8s + 0.9s delay + 0.8s = 2.5s total)
        setTimeout(() => {
            if (this.flowInstructionCard) {
                this.flowInstructionCard.classList.remove('step-animating');
            }
            if (this.actionButton) {
                this.actionButton.classList.remove('step-animating');
            }
        }, 2500);
    }

    updateGlissandoPulse() {
        // Gradient animation is now handled by CSS and runs continuously
        // No step-based logic needed since we replaced the pulse effects
        // Keeping this method for future enhancements if needed
    }

    getSolfegeLabel(semitones, isGoingUp = true) {
        const solfegeMap = {
            0: 'Do',
            1: 'Ra',
            2: 'Re',
            3: 'Me',
            4: 'Mi',
            5: 'Fa',
            6: 'Fi',
            7: 'Sol',
            8: 'Le',
            9: 'La',
            10: 'Te',
            11: 'Ti',
            12: isGoingUp ? 'Do↑' : 'Do↓'
        };
        return solfegeMap[semitones] || 'Do';
    }

    renderStepIcons(step) {
        if (!this.middleIconsContainer) return;

        // For Unison Glissando exercise, hide middle icons (uses separate indicator)
        const currentExercise = this.exercises[this.currentExerciseIndex];
        if (currentExercise.name === 'Glissando') {
            this.middleIconsContainer.innerHTML = '';
            this.middleIconsContainer.style.display = 'none';
            return;
        }

        this.middleIconsContainer.style.display = 'flex';

        const { userAction, audioState } = step;
        const isUnison = this.isUnison;
        const intervalSemitones = this.intervalConfig?.semitones || 0;
        const intervalSolfege = this.getSolfegeLabel(intervalSemitones, this.goingUp);

        // Update solfege labels in circles
        if (this.rootSolfegeLabel) {
            this.rootSolfegeLabel.textContent = 'Do';
        }
        if (this.intervalSolfegeLabel && !isUnison) {
            this.intervalSolfegeLabel.textContent = intervalSolfege;
        }

        // Build middle icons HTML (face/ear only, no speakers)
        let iconsHTML = '';

        const showFace = ['match-root', 'match-interval', 'sing-root', 'sing-interval'].includes(userAction);
        const showEar = userAction === 'listen';

        const faceTowardsInterval = ['match-interval', 'sing-interval'].includes(userAction);

        // Ear only shows for pure "listen" actions (no singing)
        if (showEar) {
            iconsHTML += `
                <img src="images/earwithsound.png" alt="Listening" class="icon-ear">
            `;
        }
        // Face shows when user is singing/matching (with or without audio)
        else if (showFace) {
            const faceFlippedClass = faceTowardsInterval ? '' : ' flipped';
            iconsHTML += `
                <img src="images/facesinging.png" alt="Singing" class="icon-face${faceFlippedClass}">
            `;
        }

        this.middleIconsContainer.innerHTML = iconsHTML;
    }

    calculateOptimalCardWidth() {
        if (!this.instructionElement || !this.flowInstructionCard) return;

        const text = this.instructionElement.textContent;
        if (!text) return;

        // Create temporary element to measure text width without wrapping
        const tempSpan = document.createElement('span');
        tempSpan.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: nowrap;
            font-size: 1.5rem;
            font-weight: 600;
            font-family: inherit;
        `;
        tempSpan.textContent = text;
        document.body.appendChild(tempSpan);
        const fullTextWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);

        // Measure actual button widths and calculate clearances dynamically
        let firstLineIndent = 60; // fallback
        let lastLineFloatWidth = 100; // fallback

        // Calculate first line clearance from Command button
        if (this.commandElement) {
            const commandWidth = this.commandElement.offsetWidth || 0;
            const triangleWidth = 12;
            const clearanceGap = 10;
            firstLineIndent = commandWidth + triangleWidth + clearanceGap;
        }

        // Calculate last line clearance from ThenAction button
        if (this.actionButton) {
            const actionWidth = this.actionButton.offsetWidth || 0;
            const buttonOverhang = 20; // button extends 20px outside card
            const visibleWidth = actionWidth - buttonOverhang;
            const clearanceGap = 10;
            lastLineFloatWidth = visibleWidth + clearanceGap;
        }

        const horizontalClearance = firstLineIndent + lastLineFloatWidth;

        // Aim for ~2.5 lines of text for good visual balance
        const idealLineWidth = (fullTextWidth / 2.5) + horizontalClearance;

        // Constrain between reasonable min/max values
        const minWidth = 350; // prevent too narrow
        const maxWidth = 700; // prevent too wide
        const optimalWidth = Math.min(Math.max(idealLineWidth, minWidth), maxWidth);

        this.flowInstructionCard.style.maxWidth = optimalWidth + 'px';
    }

    updateTriangleSizes() {
        // Force browser to apply all pending layouts including CSS transforms
        // This ensures getBoundingClientRect returns accurate positions
        if (this.flowInstructionCard) {
            this.flowInstructionCard.offsetHeight; // Reading offsetHeight forces reflow
        }

        // Calculate actual button heights
        const commandHeight = this.commandElement?.offsetHeight || 0;
        const actionHeight = this.actionButton?.offsetHeight || 0;

        // Triangle borders should be half the button height (top + bottom = full height)
        const commandTriangleSize = commandHeight / 2;
        const actionTriangleSize = actionHeight / 2;

        // Update triangle sizes using CSS custom properties
        if (this.commandElement && commandHeight > 0) {
            this.commandElement.style.setProperty('--command-triangle-size', `${commandTriangleSize}px`);
        }

        if (this.actionButton && actionHeight > 0) {
            this.actionButton.style.setProperty('--action-triangle-size', `${actionTriangleSize}px`);
        }

        // Position Command button to left of instruction card
        if (this.commandElement && this.flowInstructionCard) {
            try {
                const cardRect = this.flowInstructionCard.getBoundingClientRect();
                const containerRect = this.container.querySelector('.carousel-step-flow').getBoundingClientRect();

                // Fixed overhang - button extends this far outside card (left side)
                // Button grows RIGHTWARD (into card) as text gets longer
                const buttonOverhang = 20; // static overhang distance

                // Position button's left edge at fixed distance from card's left edge
                const buttonLeft = (cardRect.left - containerRect.left) - buttonOverhang;

                // Align vertically with card's text area (card top + padding)
                const cardPaddingTop = 20; // from CSS padding-top
                const buttonTop = (cardRect.top - containerRect.top) + cardPaddingTop;

                this.commandElement.style.left = buttonLeft + 'px';
                this.commandElement.style.top = buttonTop + 'px';
            } catch (e) {
                console.warn('Could not calculate command button position:', e);
            }
        }

        // Calculate and set instruction padding to prevent text overlap
        if (this.flowInstructionCard && this.instructionElement) {
            // FIRST LINE ONLY - use text-indent to clear Command button
            if (this.commandElement) {
                try {
                    // Get actual pixel positions to account for all margins/positioning
                    const buttonRect = this.commandElement.getBoundingClientRect();
                    const cardRect = this.flowInstructionCard.getBoundingClientRect();

                    // Calculate how far button extends past card's left edge
                    const triangleWidth = 12; // triangle extends 12px beyond button
                    const clearanceGap = 10; // gap between triangle and text
                    const cardPaddingLeft = 10; // current padding-left on card

                    // Button right edge + triangle - card left edge = overlap into card space
                    const buttonRightWithTriangle = buttonRect.right + triangleWidth;
                    const overlapIntoCard = buttonRightWithTriangle - cardRect.left;

                    // Text-indent needed: overlap - existing padding + clearance
                    const firstLineIndent = Math.max(0, overlapIntoCard - cardPaddingLeft + clearanceGap);
                    this.instructionElement.style.textIndent = firstLineIndent + 'px';
                } catch (e) {
                    console.warn('Could not calculate first line indent:', e);
                    // Fallback to safe default
                    this.instructionElement.style.textIndent = '90px';
                }
            }

            // LEFT: Minimal padding for middle lines (first line uses text-indent)
            this.flowInstructionCard.style.paddingLeft = '10px';

            // RIGHT: Minimal padding (button extends past card)
            this.flowInstructionCard.style.paddingRight = '10px';

            // Keep top/bottom padding consistent
            this.flowInstructionCard.style.paddingTop = '20px';
            this.flowInstructionCard.style.paddingBottom = '8px'; // Reduced for tight button fit
        }

        // Show flow container after all positioning is complete
        const flowContainer = this.container.querySelector('.carousel-step-flow');
        if (flowContainer) {
            flowContainer.style.visibility = 'visible';
            flowContainer.style.opacity = '1';
        }

        // Trigger animation AFTER showing
        this.triggerStepAnimation();

        // Restore Skip button text for non-slider exercises
        if (this.skipExerciseBtn) {
            this.skipExerciseBtn.textContent = 'Skip Exercise';
        }
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
        console.log('playRoot called', { rootFrequency: this.rootFrequency, rootOscillator: this.rootOscillator });

        // Stop existing oscillator if already playing
        if (this.rootOscillator) {
            console.log('Stopping existing root oscillator before creating new one');
            this.stopRoot();
        }

        await this.toneGenerator.ensureAudioContext();
        const audioContext = window.audioManager.getAudioContext();

        if (!audioContext) {
            console.error('AudioContext not available');
            return;
        }

        console.log('Creating root oscillator at', this.rootFrequency, 'Hz');

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
        console.log('Root oscillator started');
    }

    stopRoot() {
        console.log('stopRoot called', { rootOscillator: this.rootOscillator, rootGainNode: this.rootGainNode });
        if (this.rootOscillator) {
            try {
                const audioContext = window.audioManager.getAudioContext();
                if (!audioContext) {
                    console.log('No audio context in stopRoot');
                    return;
                }

                const currentTime = audioContext.currentTime;

                // Fade out
                if (this.rootGainNode) {
                    this.rootGainNode.gain.setValueAtTime(this.rootGainNode.gain.value, currentTime);
                    this.rootGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
                    this.rootOscillator.stop(currentTime + 0.05);
                    console.log('Root oscillator scheduled to stop at', currentTime + 0.05);
                } else {
                    this.rootOscillator.stop();
                    console.log('Root oscillator stopped immediately');
                }
                this.rootOscillator.disconnect();
            } catch (e) {
                console.warn('Error stopping root oscillator:', e);
            }
            this.rootOscillator = null;
        } else {
            console.log('No root oscillator to stop');
        }
        if (this.rootGainNode) {
            this.rootGainNode.disconnect();
            this.rootGainNode = null;
        }
        console.log('stopRoot complete');
    }

    async playInterval() {
        console.log('playInterval called', { intervalFrequency: this.intervalFrequency, intervalOscillator: this.intervalOscillator });

        // Stop existing oscillator if already playing
        if (this.intervalOscillator) {
            console.log('Stopping existing interval oscillator before creating new one');
            this.stopInterval();
        }

        await this.toneGenerator.ensureAudioContext();
        const audioContext = window.audioManager.getAudioContext();

        if (!audioContext) {
            console.error('AudioContext not available');
            return;
        }

        console.log('Creating interval oscillator at', this.intervalFrequency, 'Hz');

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
        console.log('Interval oscillator started');
    }

    stopInterval() {
        console.log('stopInterval called', { intervalOscillator: this.intervalOscillator, intervalGainNode: this.intervalGainNode });
        if (this.intervalOscillator) {
            try {
                const audioContext = window.audioManager.getAudioContext();
                if (!audioContext) {
                    console.log('No audio context in stopInterval');
                    return;
                }

                const currentTime = audioContext.currentTime;

                // Fade out
                if (this.intervalGainNode) {
                    this.intervalGainNode.gain.setValueAtTime(this.intervalGainNode.gain.value, currentTime);
                    this.intervalGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
                    this.intervalOscillator.stop(currentTime + 0.05);
                    console.log('Interval oscillator scheduled to stop at', currentTime + 0.05);
                } else {
                    this.intervalOscillator.stop();
                    console.log('Interval oscillator stopped immediately');
                }
                this.intervalOscillator.disconnect();
            } catch (e) {
                console.warn('Error stopping interval oscillator:', e);
            }
            this.intervalOscillator = null;
        } else {
            console.log('No interval oscillator to stop');
        }
        if (this.intervalGainNode) {
            this.intervalGainNode.disconnect();
            this.intervalGainNode = null;
        }
        console.log('stopInterval complete');
    }

    handleCurrentAction() {
        // Action button advances to next step
        const currentExercise = this.exercises[this.currentExerciseIndex];
        const totalSteps = currentExercise.steps.length;
        const isLastStep = this.currentStepIndex === totalSteps - 1;

        if (isLastStep) {
            // On last step, clicking "Finish" should complete the exercise
            this.nextStep();
        } else {
            // Otherwise, navigate with animation to next step
            this.navigateToNext();
        }
    }

    navigateToPrev() {
        // Navigate to previous step (with wrapping)
        const currentExercise = this.exercises[this.currentExerciseIndex];
        const totalSteps = currentExercise.steps.length;
        this.currentStepIndex = (this.currentStepIndex - 1 + totalSteps) % totalSteps;
        this.renderCurrentStep();
    }

    getStepIconType(step) {
        // Helper function to determine what icon a step should show
        const { userAction } = step;
        if (userAction === 'listen') {
            return 'ear';
        } else if (['match-root', 'match-interval', 'sing-root', 'sing-interval'].includes(userAction)) {
            const faceDirection = ['match-interval', 'sing-interval'].includes(userAction) ? 'right' : 'left';
            return `face-${faceDirection}`;
        }
        return 'none';
    }

    navigateToNext() {
        // Navigate to next step (with wrapping)
        const currentExercise = this.exercises[this.currentExerciseIndex];
        const totalSteps = currentExercise.steps.length;

        // Get current and next step
        const oldStep = currentExercise.steps[this.currentStepIndex];
        this.currentStepIndex = (this.currentStepIndex + 1) % totalSteps;
        const newStep = currentExercise.steps[this.currentStepIndex];

        // Check if icons need to change
        const oldIconType = this.getStepIconType(oldStep);
        const newIconType = this.getStepIconType(newStep);
        const iconsChanging = oldIconType !== newIconType;

        // Stage 1: Immediately hide all buttons and fade out text
        if (this.actionButton) {
            this.actionButton.style.opacity = '0';
        }
        if (this.commandElement) {
            this.commandElement.style.opacity = '0';
        }
        if (this.instructionElement) {
            this.instructionElement.classList.add('text-fade-out');
        }

        // Stage 1: Immediately update icons if they're changing
        if (iconsChanging && this.middleIconsContainer) {
            this.renderStepIcons(newStep);
        }

        // Stage 2: Update Command button text and show with animation when old text is fully faded (200ms)
        setTimeout(() => {
            if (this.commandElement) {
                this.commandElement.textContent = newStep.command;
                this.commandElement.style.opacity = '1';
                this.commandElement.classList.add('spotlight-animation');

                // Recalculate text-indent to account for new Command button width
                requestAnimationFrame(() => {
                    this.updateTriangleSizes();
                });
            }
        }, 200);

        // Stage 3: Update remaining content (300ms delay)
        setTimeout(() => {
            // Update text content (will fade in)
            if (this.instructionElement) {
                // Remove fade-out, add fade-in
                this.instructionElement.classList.remove('text-fade-out');
                this.instructionElement.textContent = newStep.instruction;
                this.instructionElement.classList.add('text-fade-in');
            }

            // Update action button text and show it again with fade-in
            if (this.actionButton) {
                const isLastStep = this.currentStepIndex === totalSteps - 1;
                if (isLastStep) {
                    this.actionButton.textContent = 'Finish';
                } else {
                    const nextStep = currentExercise.steps[this.currentStepIndex + 1];
                    this.actionButton.textContent = `then ${nextStep.command.toLowerCase()}`;
                }
                this.actionButton.classList.add('button-fade-in');
            }

            // Update other step elements
            this.updateGlissandoPulse();
            this.applyAudioState(newStep.audioState);

            // Recalculate triangle sizes to ensure proper spacing
            this.updateTriangleSizes();
        }, 300);

        // Cleanup: Remove all animation classes (1600ms total)
        setTimeout(() => {
            if (this.instructionElement) {
                this.instructionElement.classList.remove('text-fade-out', 'text-fade-in');
            }
            if (this.commandElement) {
                this.commandElement.classList.remove('spotlight-animation');
            }
            if (this.actionButton) {
                this.actionButton.classList.remove('button-fade-in');
            }
        }, 1600);
    }

    async toggleRoot() {
        console.log('toggleRoot called', { rootPlaying: this.rootPlaying });
        if (this.rootPlaying) {
            // Stop root if it's playing
            console.log('Stopping root');
            this.stopRoot();
            this.rootPlaying = false;
        } else {
            // Play root if it's stopped
            console.log('Starting root');
            await this.playRoot();
            this.rootPlaying = true;
        }
        this.updateButtonStates();
    }

    async toggleInterval() {
        // Allow toggling for Slider Glissando (useGlissandoSlider), but not for regular unison exercises
        const currentExercise = this.exercises[this.currentExerciseIndex];
        if (this.isUnison && !currentExercise?.useGlissandoSlider) return; // No interval for unison (except Slider Glissando)

        console.log('toggleInterval called', {
            intervalPlaying: this.intervalPlaying,
            intervalFrequency: this.intervalFrequency,
            isUnison: this.isUnison,
            useGlissandoSlider: currentExercise?.useGlissandoSlider
        });

        if (this.intervalPlaying) {
            // Stop interval if it's playing
            this.stopInterval();
            this.intervalPlaying = false;
        } else {
            // Play interval if it's stopped
            await this.playInterval();
            this.intervalPlaying = true;

            // Hide instruction arrow after first play (for Slider Glissando)
            if (currentExercise?.useGlissandoSlider && !this.sliderInstructionShown) {
                if (this.sliderInstruction) {
                    this.sliderInstruction.style.display = 'none';
                }
                this.sliderInstructionShown = true;
            }
        }
        this.updateButtonStates();
    }

    stopAll() {
        console.log('stopAll called');
        this.stopRoot();
        this.stopInterval();
        this.rootPlaying = false;
        this.intervalPlaying = false;
        console.log('stopAll complete - all flags reset');
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

        // Update interval indicator playing state (including for Slider Glissando)
        const currentExercise = this.exercises[this.currentExerciseIndex];
        const shouldShowIntervalPlaying = !this.isUnison || currentExercise?.useGlissandoSlider;

        if (this.intervalIndicator && shouldShowIntervalPlaying) {
            if (this.intervalPlaying) {
                this.intervalIndicator.classList.add('playing');
            } else {
                this.intervalIndicator.classList.remove('playing');
            }
        }

        // Update play/pause icon for Slider Glissando
        this.updatePlayPauseIcon();

        // Update glissando button states (enable/disable based on interval playing)
        if (currentExercise && currentExercise.useGlissandoSlider) {
            this.setGlissandoButtonsDisabled(!this.intervalPlaying);
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
                // Call exit() so training mode can intercept and show rating UI
                this.exit();
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

    handleUnisonRating(rating) {
        console.log('[Unison] User rated:', rating);

        this.repetitionsCompleted++;

        // Map rating to spaced repetition difficulty
        const difficultyMap = {
            'easy': 'easy',
            'medium': 'medium',
            'hard': 'hard',
            'failed': 'failed'
        };

        const difficulty = difficultyMap[rating];

        // Store the rating for training system to use
        this.lastUnisonRating = difficulty;

        // Check if we've completed all reps for this exercise
        if (this.repetitionsCompleted >= this.maxRepetitions) {
            // Complete exercise and let training mode handle it
            console.log('[Unison] Completed all reps, exiting');
            this.exit();
        } else {
            // Generate new note and continue
            console.log('[Unison] Generating new note for next rep');
            this.generateNewTones();
            this.updateDisplay();
        }
    }

    skipExercise() {
        // If in training mode, let training mode handle the skip
        if (window.trainingUI && window.trainingUI.isInTrainingMode) {
            console.log('[System Exercise] Skip pressed during training mode, calling exit');
            this.exit();
            return;
        }

        // For unison, this is "Skip"
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
        console.log('exit() called - stopping all audio');
        // Stop all audio
        this.stopAll();

        // Remove full-screen class
        this.container.classList.remove('unison-fullscreen');

        // Hide exercise screen
        this.container.style.display = 'none';

        // Show main app
        document.getElementById('appContainer').style.display = 'block';

        // Clear exercise from URL
        if (window.earTrainerApp && window.earTrainerApp.clearExerciseFromURL) {
            window.earTrainerApp.clearExerciseFromURL();
        }
    }

    // ===========================
    // Glissando Slider Methods
    // ===========================

    setupGlissandoSlider(config = {}) {
        console.log('setupGlissandoSlider called', { rootFrequency: this.rootFrequency, config });

        // Show help modal on first time this session
        const HELP_SHOWN_KEY = 'sliderGlissandoHelpShown';
        if (!sessionStorage.getItem(HELP_SHOWN_KEY)) {
            this.showSliderGlissandoHelpModal();
            sessionStorage.setItem(HELP_SHOWN_KEY, 'true');
        }

        // Optional config:
        // - targetFrequency: override default rootFrequency
        // - hashMarks: array of frequencies to mark [740, 460, 450, 442, 441, 440]
        // - showTargetLabel: show "Target: XXX Hz" label
        // - initialFrequency: specific starting frequency (override random)

        const targetFreq = config.targetFrequency || this.rootFrequency;
        const minFreq = targetFreq / 2;  // 220 Hz (one octave below)
        const maxFreq = targetFreq * 2;  // 880 Hz (one octave above)

        // Calculate the middle 25% range where target should be
        const rangeSize = maxFreq - minFreq;
        const middleStart = minFreq + rangeSize * 0.375;  // 37.5% from bottom
        const middleEnd = minFreq + rangeSize * 0.625;    // 62.5% from bottom

        // Determine starting frequency
        let startingFreq;
        if (config.initialFrequency !== undefined) {
            // Use specified initial frequency
            startingFreq = config.initialFrequency;
        } else {
            // Random starting position within valid range (avoiding the target middle 25%)
            if (Math.random() < 0.5) {
                // Start in lower range (below middle 25%)
                startingFreq = minFreq + Math.random() * (middleStart - minFreq);
            } else {
                // Start in upper range (above middle 25%)
                startingFreq = middleEnd + Math.random() * (maxFreq - middleEnd);
            }
        }

        // Round to whole Hz for consistency with button movements
        startingFreq = Math.round(startingFreq);

        // Store the interval frequency (user's adjustable tone)
        this.intervalFrequency = startingFreq;
        console.log('Slider setup complete', {
            intervalFrequency: this.intervalFrequency,
            minFreq,
            maxFreq
        });

        // Update slider position
        const slider = this.container.querySelector('[data-glissando-slider="frequency"]');
        if (slider) {
            slider.min = minFreq;
            slider.max = maxFreq;
            slider.value = startingFreq;
        }

        // Set up button event listeners
        const buttons = [
            { selector: '[data-glissando-slider="jump-up-big"]', direction: 1, size: 'big' },
            { selector: '[data-glissando-slider="jump-up-medium"]', direction: 1, size: 'medium' },
            { selector: '[data-glissando-slider="jump-up-small"]', direction: 1, size: 'small' },
            { selector: '[data-glissando-slider="jump-down-big"]', direction: -1, size: 'big' },
            { selector: '[data-glissando-slider="jump-down-medium"]', direction: -1, size: 'medium' },
            { selector: '[data-glissando-slider="jump-down-small"]', direction: -1, size: 'small' }
        ];

        buttons.forEach(({ selector, direction, size }) => {
            const button = this.container.querySelector(selector);
            if (button) {
                button.addEventListener('click', () => {
                    this.handleGlissandoJump(direction, size);
                });
            }
        });

        // Set up Next button
        const nextBtn = this.container.querySelector('[data-glissando-slider="next"]');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.handleGlissandoSliderNext();
            });
        }

        // Don't call playRoot() here - applyAudioState() will handle it based on the step's audioState
        // This prevents duplicate oscillators from being created

        // Set buttons to disabled initially (enabled when interval plays)
        this.setGlissandoButtonsDisabled(true);

        // Show instruction arrow (will be hidden after first play)
        if (this.sliderInstruction) {
            this.sliderInstruction.style.display = 'flex';
        }

        // Track if instruction has been shown (reset for each exercise)
        this.sliderInstructionShown = false;

        // Render hash marks if provided
        if (config.hashMarks && config.hashMarks.length > 0) {
            this.renderGlissandoHashMarks(config.hashMarks, minFreq, maxFreq);
        }

        // Show target label if requested
        if (config.showTargetLabel) {
            this.showGlissandoTargetLabel(targetFreq);
        }

        // Show "Found it!" button immediately (always visible)
        this.showGlissandoNextButton();
    }

    renderGlissandoHashMarks(frequencies, minFreq, maxFreq) {
        const sliderWrapper = this.container.querySelector('.glissando-slider-wrapper');
        if (!sliderWrapper) return;

        // Create container for hash marks if it doesn't exist
        let hashContainer = this.container.querySelector('.glissando-hash-marks');
        if (!hashContainer) {
            hashContainer = document.createElement('div');
            hashContainer.className = 'glissando-hash-marks';
            sliderWrapper.appendChild(hashContainer);
        } else {
            hashContainer.innerHTML = ''; // Clear existing
        }

        const range = maxFreq - minFreq;
        const isMobile = window.innerWidth <= 768;
        const sliderWidth = isMobile ? 300 : 400;
        const thumbWidth = isMobile ? 35 : 40;

        frequencies.forEach(freq => {
            if (freq < minFreq || freq > maxFreq) return;

            // Calculate position accounting for thumb offset
            // Range inputs position thumb center from (thumbWidth/2) to (sliderWidth - thumbWidth/2)
            const percentage = (freq - minFreq) / range;
            const thumbOffset = thumbWidth / 2;
            const availableTravel = sliderWidth - thumbWidth;
            const position = thumbOffset + (percentage * availableTravel);

            const mark = document.createElement('div');
            mark.className = 'glissando-hash-mark';
            mark.style.left = `${position}px`;
            hashContainer.appendChild(mark);
        });

        console.log(`[Slider Glissando] Rendered ${frequencies.length} hash marks`);
    }

    showGlissandoTargetLabel(targetFreq) {
        const sliderContainer = this.container.querySelector('.glissando-slider-container');
        if (!sliderContainer) return;

        let label = this.container.querySelector('.glissando-target-label');
        if (!label) {
            label = document.createElement('div');
            label.className = 'glissando-target-label';
            sliderContainer.appendChild(label);
        }
        label.textContent = `Target: ${Math.round(targetFreq)} Hz`;
        label.style.display = 'block';

        console.log(`[Slider Glissando] Showing target label: ${Math.round(targetFreq)} Hz`);
    }

    handleGlissandoJump(direction, size) {
        // Check if interval is playing (buttons should be disabled if not)
        if (!this.intervalPlaying) return;

        // Check if clicking the same button that's currently active (for pause behavior)
        const directionStr = direction > 0 ? 'up' : 'down';
        const clickingSameButton = this.continuousGlissando.active &&
                                   this.continuousGlissando.direction === directionStr &&
                                   this.continuousGlissando.size === size;

        // Stop any active continuous movement
        if (this.continuousGlissando.active) {
            this.stopContinuousGlissando();
        }

        // If clicking the same button, just pause (don't restart)
        if (clickingSameButton) {
            return;
        }

        if (size === 'big' || size === 'medium') {
            // Big/Medium buttons: continuous glissando at different speeds
            this.startContinuousGlissando(directionStr, size);
        } else if (size === 'small') {
            // Small buttons: adaptive discrete steps (1-5 Hz based on distance to target)
            const currentFreq = this.intervalFrequency;
            const targetFreq = this.rootFrequency;
            const minFreq = targetFreq / 2;
            const maxFreq = targetFreq * 2;

            // Calculate distance to target
            const distanceToTarget = Math.abs(currentFreq - targetFreq);

            // Determine jump size based on distance:
            // 0-3 Hz: 1 Hz jump
            // 4-5 Hz: 2 Hz jump
            // 6-7 Hz: 3 Hz jump
            // 8-9 Hz: 4 Hz jump
            // 10+ Hz: 5 Hz jump
            let jumpSize;
            if (distanceToTarget <= 3) {
                jumpSize = 1;
            } else if (distanceToTarget <= 5) {
                jumpSize = 2;
            } else if (distanceToTarget <= 7) {
                jumpSize = 3;
            } else if (distanceToTarget <= 9) {
                jumpSize = 4;
            } else {
                jumpSize = 5;
            }

            // Round current position to nearest whole Hz, then move by adaptive jump size
            const roundedCurrent = Math.round(currentFreq);
            const newFreq = Math.max(minFreq, Math.min(maxFreq, roundedCurrent + (direction * jumpSize)));

            // Pulse the interval indicator border
            this.pulseIntervalIndicator();

            // Perform glissando to new frequency (no button disabling for rapid clicking)
            this.performSliderGlissando(currentFreq, newFreq, () => {
                // Show Next button after first interaction
                this.showGlissandoNextButton();
            });
        }
    }

    calculateGlissandoJumpAmount(size, currentFreq, targetFreq) {
        const distanceToTarget = Math.abs(currentFreq - targetFreq);

        switch (size) {
            case 'big':
                // Random 6-10 semitones, rounded to whole Hz
                const bigSemitones = 6 + Math.floor(Math.random() * 5);
                const bigJump = currentFreq * (Math.pow(2, bigSemitones / 12) - 1);
                return Math.round(bigJump);

            case 'medium':
                // Random 1-3 semitones, rounded to whole Hz
                const mediumSemitones = 1 + Math.floor(Math.random() * 3);
                const mediumJump = currentFreq * (Math.pow(2, mediumSemitones / 12) - 1);
                return Math.round(mediumJump);

            case 'small':
                // Small buttons always move by exactly 1 Hz to ensure whole integer positions
                // This allows precise matching of the root tone (unison)
                return 1;

            default:
                return 0;
        }
    }

    performSliderGlissando(startFreq, endFreq, onComplete) {
        const frequencyDiff = Math.abs(endFreq - startFreq);

        // Calculate duration: 11.25ms per Hz difference, min 450ms, max 4500ms (50% slower)
        const baseDuration = Math.min(4500, Math.max(450, frequencyDiff * 11.25));

        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / baseDuration);

            // Ease-in-out curve for smooth glissando
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            const currentFreq = startFreq + (endFreq - startFreq) * eased;

            // Update interval frequency
            this.intervalFrequency = currentFreq;

            // Update slider position
            const slider = this.container.querySelector('[data-glissando-slider="frequency"]');
            if (slider) {
                slider.value = currentFreq;
            }

            // Update audio
            if (this.intervalOscillator && this.intervalPlaying) {
                const audioContext = window.audioManager?.getAudioContext();
                if (audioContext) {
                    this.intervalOscillator.frequency.setValueAtTime(currentFreq, audioContext.currentTime);
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Final update
                this.intervalFrequency = endFreq;

                if (slider) {
                    slider.value = endFreq;
                }

                if (this.intervalOscillator && this.intervalPlaying) {
                    const audioContext = window.audioManager?.getAudioContext();
                    if (audioContext) {
                        this.intervalOscillator.frequency.setValueAtTime(endFreq, audioContext.currentTime);
                    }
                }

                if (onComplete) {
                    onComplete();
                }
            }
        };

        requestAnimationFrame(animate);
    }

    startContinuousGlissando(direction, size) {
        const targetFreq = this.rootFrequency;
        const minFreq = targetFreq / 2;
        const maxFreq = targetFreq * 2;
        const targetLimit = direction === 'up' ? maxFreq : minFreq;

        // Set speed based on size: big = 1 Hz/frame, medium = 0.5 Hz/frame
        const speed = size === 'big' ? 1 : 0.5;

        // Mark as active
        this.continuousGlissando.active = true;
        this.continuousGlissando.direction = direction;
        this.continuousGlissando.size = size;
        this.continuousGlissando.speed = speed;

        // Update button icon to pause
        const buttonSelector = direction === 'up'
            ? `[data-glissando-slider="jump-up-${size}"]`
            : `[data-glissando-slider="jump-down-${size}"]`;
        const button = this.container.querySelector(buttonSelector);
        if (button) {
            this.updateContinuousButtonIcon(button, true, size);
        }

        // Show Next button after first interaction
        this.showGlissandoNextButton();

        // Pulse the interval indicator border
        this.pulseIntervalIndicator();

        // Continuous glissando animation loop
        const animate = () => {
            if (!this.continuousGlissando.active) return;

            const currentFreq = this.intervalFrequency;

            // Check if we've reached the limit
            const reachedLimit = direction === 'up'
                ? currentFreq >= targetLimit
                : currentFreq <= targetLimit;

            if (reachedLimit) {
                // Stop at limit
                this.intervalFrequency = targetLimit;
                const slider = this.container.querySelector('[data-glissando-slider="frequency"]');
                if (slider) slider.value = targetLimit;

                if (this.intervalOscillator && this.intervalPlaying) {
                    const audioContext = window.audioManager?.getAudioContext();
                    if (audioContext) {
                        this.intervalOscillator.frequency.setValueAtTime(targetLimit, audioContext.currentTime);
                    }
                }

                this.stopContinuousGlissando();
                return;
            }

            // Move by speed Hz per frame (big = 1 Hz, medium = 0.5 Hz)
            const increment = direction === 'up' ? speed : -speed;
            const newFreq = Math.max(minFreq, Math.min(maxFreq, currentFreq + increment));

            // Update interval frequency
            this.intervalFrequency = newFreq;

            // Update slider position
            const slider = this.container.querySelector('[data-glissando-slider="frequency"]');
            if (slider) {
                slider.value = newFreq;
            }

            // Update audio
            if (this.intervalOscillator && this.intervalPlaying) {
                const audioContext = window.audioManager?.getAudioContext();
                if (audioContext) {
                    this.intervalOscillator.frequency.setValueAtTime(newFreq, audioContext.currentTime);
                }
            }

            // Continue animation
            this.continuousGlissando.animationId = requestAnimationFrame(animate);
        };

        // Start animation
        this.continuousGlissando.animationId = requestAnimationFrame(animate);
    }

    stopContinuousGlissando() {
        if (!this.continuousGlissando.active) return;

        // Cancel animation
        if (this.continuousGlissando.animationId) {
            cancelAnimationFrame(this.continuousGlissando.animationId);
            this.continuousGlissando.animationId = null;
        }

        // Restore button icon
        const direction = this.continuousGlissando.direction;
        const size = this.continuousGlissando.size;
        const buttonSelector = direction === 'up'
            ? `[data-glissando-slider="jump-up-${size}"]`
            : `[data-glissando-slider="jump-down-${size}"]`;
        const button = this.container.querySelector(buttonSelector);
        if (button) {
            this.updateContinuousButtonIcon(button, false, size);
        }

        // Mark as inactive
        this.continuousGlissando.active = false;
        this.continuousGlissando.direction = null;
        this.continuousGlissando.size = null;
        this.continuousGlissando.speed = null;
    }

    updateContinuousButtonIcon(button, showPause, size) {
        if (!button) return;

        // Determine direction from button's data attribute
        const isUp = button.hasAttribute('data-glissando-slider') &&
                    button.getAttribute('data-glissando-slider').includes('up');

        if (showPause) {
            // Replace with pause icon (two vertical bars) - size depends on button size
            if (size === 'big') {
                button.innerHTML = `
                    <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="10" y="4" width="4" height="16" fill="currentColor"/>
                        <rect x="18" y="4" width="4" height="16" fill="currentColor"/>
                    </svg>
                `;
            } else if (size === 'medium') {
                button.innerHTML = `
                    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="8" y="3" width="3" height="14" fill="currentColor"/>
                        <rect x="13" y="3" width="3" height="14" fill="currentColor"/>
                    </svg>
                `;
            }
        } else {
            // Restore original arrow icon based on size and direction
            if (size === 'big') {
                // Big buttons: Two triangles
                if (isUp) {
                    button.innerHTML = `
                        <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Two triangles pointing right -->
                            <path d="M18 12L10 6V9H2V15H10V18L18 12Z" fill="currentColor"/>
                            <path d="M30 12L22 6V9H14V15H22V18L30 12Z" fill="currentColor"/>
                        </svg>
                    `;
                } else {
                    button.innerHTML = `
                        <svg width="32" height="24" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Two triangles pointing left -->
                            <path d="M2 12L10 6V9H18V15H10V18L2 12Z" fill="currentColor"/>
                            <path d="M14 12L22 6V9H30V15H22V18L14 12Z" fill="currentColor"/>
                        </svg>
                    `;
                }
            } else if (size === 'medium') {
                // Medium buttons: Single triangle
                if (isUp) {
                    button.innerHTML = `
                        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Medium single triangle pointing right -->
                            <path d="M18 10L8 5V8H2V12H8V15L18 10Z" fill="currentColor"/>
                        </svg>
                    `;
                } else {
                    button.innerHTML = `
                        <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <!-- Medium single triangle pointing left -->
                            <path d="M6 10L16 5V8H22V12H16V15L6 10Z" fill="currentColor"/>
                        </svg>
                    `;
                }
            }
        }
    }

    handleGlissandoSliderChange(frequency) {
        // Update interval frequency
        this.intervalFrequency = frequency;

        // Update audio if playing
        if (this.intervalOscillator && this.intervalPlaying) {
            const audioContext = window.audioManager?.getAudioContext();
            if (audioContext) {
                this.intervalOscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            }
        }

        // Show Next button after first interaction
        this.showGlissandoNextButton();
    }

    setGlissandoButtonsEnabled(enabled) {
        const buttons = this.container.querySelectorAll('.glissando-jump-btn');
        buttons.forEach(button => {
            button.disabled = !enabled;
        });
    }

    showGlissandoNextButton() {
        const nextBtn = this.container.querySelector('[data-glissando-slider="next"]');
        if (nextBtn) {
            nextBtn.style.display = 'block';
        }
    }

    handleGlissandoSliderNext() {
        // Stop playing tones
        this.stopAll();

        // Increment repetitions
        this.repetitionsCompleted++;

        // Check if we've completed all reps for this exercise
        if (this.repetitionsCompleted >= this.maxRepetitions) {
            // Complete exercise and exit (training mode will handle it)
            console.log('[Slider Glissando] Completed all reps, exiting');
            this.exit();
        } else {
            // Generate new tones and continue
            console.log('[Slider Glissando] Generating new tones for next rep');

            // Reset for next rep
            this.glissandoSliderInitialized = false;

            // Generate new tones and re-render
            this.generateNewTones();
            this.updateDisplay();
            this.renderCurrentStep();
        }
    }

    updateRatingLabels(isSliderGlissando) {
        // Update rating button labels based on exercise type
        const ratingLabels = this.container.querySelectorAll('.rating-label');
        ratingLabels.forEach(label => {
            if (isSliderGlissando) {
                label.textContent = label.dataset.labelSlider;
            } else {
                label.textContent = label.dataset.labelDefault;
            }
        });
    }

    // Update play/pause icon based on interval playing state
    updatePlayPauseIcon() {
        if (!this.intervalPlayPauseBtn) return;

        if (this.intervalPlaying) {
            // Show pause icon
            if (this.playIcon) this.playIcon.style.display = 'none';
            if (this.pauseIcon) this.pauseIcon.style.display = 'block';
        } else {
            // Show play icon
            if (this.playIcon) this.playIcon.style.display = 'block';
            if (this.pauseIcon) this.pauseIcon.style.display = 'none';
        }
    }

    // Enable/disable glissando buttons
    setGlissandoButtonsDisabled(disabled) {
        const buttons = this.container.querySelectorAll('.glissando-jump-btn');
        buttons.forEach(button => {
            button.disabled = disabled;
        });
    }

    // Pulse interval indicator border
    pulseIntervalIndicator() {
        if (!this.intervalIndicator) return;

        // Add pulsing class
        this.intervalIndicator.classList.add('border-pulsing');

        // Remove after animation completes (300ms)
        setTimeout(() => {
            this.intervalIndicator.classList.remove('border-pulsing');
        }, 300);
    }

    /**
     * Show appropriate help modal based on current exercise
     */
    showHelpModal() {
        const currentExercise = this.exercises[this.currentExerciseIndex];

        if (currentExercise.useGlissandoSlider) {
            this.showSliderGlissandoHelpModal();
        } else if (this.isUnison && currentExercise.name === "Match the Tone") {
            this.showMatchTheToneModal();
        }
    }

    /**
     * Show Slider Glissando help modal
     */
    showSliderGlissandoHelpModal() {
        const modal = document.getElementById('sliderGlissandoHelpModal');
        if (!modal) {
            console.warn('Slider Glissando help modal not found');
            return;
        }

        // Show modal with animation
        modal.style.display = 'flex';
        // Force reflow for animation
        modal.offsetHeight;
        modal.classList.add('slider-help-visible');

        // Close button handler
        const closeBtn = modal.querySelector('.slider-help-close');
        const gotItBtn = modal.querySelector('.slider-help-got-it');
        const backdrop = modal.querySelector('.slider-help-backdrop');

        const closeModal = () => {
            modal.classList.remove('slider-help-visible');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };

        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        if (gotItBtn) {
            gotItBtn.onclick = closeModal;
        }
        if (backdrop) {
            backdrop.onclick = closeModal;
        }

        // Escape key handler
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Prevent content clicks from closing
        const content = modal.querySelector('.slider-help-content');
        if (content) {
            content.onclick = (e) => e.stopPropagation();
        }
    }

    /**
     * Show Match the Tone help modal
     * Shows EVERY TIME (no sessionStorage check)
     */
    showMatchTheToneModal() {
        const modal = document.getElementById('matchTheToneHelpModal');
        if (!modal) {
            console.warn('Match the Tone help modal not found');
            return;
        }

        // Show modal with animation
        modal.style.display = 'flex';
        // Force reflow for animation
        modal.offsetHeight;
        modal.classList.add('match-tone-help-visible');

        // Close button handler
        const closeBtn = modal.querySelector('.match-tone-help-close');
        const gotItBtn = modal.querySelector('.match-tone-help-got-it');
        const backdrop = modal.querySelector('.match-tone-help-backdrop');

        const closeModal = () => {
            modal.classList.remove('match-tone-help-visible');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };

        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        if (gotItBtn) {
            gotItBtn.onclick = closeModal;
        }
        if (backdrop) {
            backdrop.onclick = closeModal;
        }

        // Escape key handler
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Prevent content clicks from closing
        const content = modal.querySelector('.match-tone-help-content');
        if (content) {
            content.onclick = (e) => e.stopPropagation();
        }
    }
}
