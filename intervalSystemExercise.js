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

        // Flow layout elements
        this.commandElement = this.container.querySelector('[data-system-exercise="command"]');
        this.instructionElement = this.container.querySelector('[data-system-exercise="instruction"]');
        this.actionButton = this.container.querySelector('[data-system-exercise="action"]');
        this.flowInstructionCard = this.container.querySelector('.flow-instruction-card');

        // Control buttons
        this.skipExerciseBtn = this.container.querySelector('[data-system-exercise="skip-exercise"]');
        this.exitBtn = this.container.querySelector('[data-system-exercise="exit"]');

        // Visual indicators
        this.rootIndicator = this.container.querySelector('[data-system-exercise="root-indicator"]');
        this.intervalIndicator = this.container.querySelector('[data-system-exercise="interval-indicator"]');
        this.glissandoIndicator = this.container.querySelector('[data-system-exercise="glissando-indicator"]');
        this.glissandoNotesImg = this.glissandoIndicator ? this.glissandoIndicator.querySelector('.glissando-notes') : null;
        this.iconsContainer = this.container.querySelector('[data-system-exercise="icons"]');
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

        // Hide flow container FIRST, before any text updates or DOM changes
        const flowContainer = this.container.querySelector('.carousel-step-flow');
        if (flowContainer) {
            flowContainer.style.visibility = 'hidden';
            flowContainer.style.opacity = '0';
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

        // Update action button
        if (this.actionButton) {
            this.actionButton.textContent = currentStep.actionButtonLabel || 'Continue';
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
        if (!this.iconsContainer) return;

        // For Unison Glissando exercise, don't show icons (uses separate indicator)
        const currentExercise = this.exercises[this.currentExerciseIndex];
        if (currentExercise.name === 'Glissando') {
            this.iconsContainer.innerHTML = '';
            this.iconsContainer.style.display = 'none';
            return;
        }

        this.iconsContainer.style.display = 'flex';

        const { userAction, audioState } = step;
        const isUnison = this.isUnison;
        const intervalSemitones = this.intervalConfig?.semitones || 0;
        const intervalSolfege = this.getSolfegeLabel(intervalSemitones, this.goingUp);

        let iconsHTML = '';

        // Determine which icons to show based on userAction and audioState
        const showRootSpeaker = ['root', 'both'].includes(audioState) ||
                                 ['sing-root', 'match-root'].includes(userAction);
        const showIntervalSpeaker = !isUnison && (['interval', 'both'].includes(audioState) ||
                                      ['sing-interval', 'match-interval'].includes(userAction));
        const rootSpeakerSilent = !['root', 'both'].includes(audioState);
        const intervalSpeakerSilent = !['interval', 'both'].includes(audioState);

        const showFace = ['match-root', 'match-interval', 'sing-root', 'sing-interval'].includes(userAction);
        const showEar = userAction === 'listen';

        const faceTowardsInterval = ['match-interval', 'sing-interval'].includes(userAction);
        const faceFlipped = !faceTowardsInterval; // Face right by default (towards root)

        // Build icons HTML
        // Layout: [Root Speaker] [Face/Ear] [Interval Speaker]

        // Root Speaker (left)
        if (showRootSpeaker) {
            const silentClass = rootSpeakerSilent ? ' silent' : '';
            iconsHTML += `
                <div class="icon-speaker-container">
                    <img src="images/roundspeaker.png" alt="Root note" class="icon-speaker${silentClass}">
                    <div class="speaker-label">Do</div>
                </div>
            `;
        }

        // Middle: Face or Ear
        if (showEar && audioState === 'both') {
            // Special case: listening to both notes with ear in middle
            iconsHTML += `
                <img src="images/earwithsound.png" alt="Listening" class="icon-ear">
            `;
        } else if (showEar && audioState === 'root') {
            // Listening to root only
            iconsHTML += `
                <img src="images/earwithsound.png" alt="Listening" class="icon-ear">
            `;
        } else if (showEar && audioState === 'interval') {
            // Listening to interval only
            iconsHTML += `
                <img src="images/earwithsound.png" alt="Listening" class="icon-ear">
            `;
        } else if (showFace && audioState !== 'none') {
            // Singing while audio plays (test/check scenario)
            // Face faces the tone being sung, ear on opposite side
            if (faceTowardsInterval) {
                // Singing interval: ear, then face (facing right towards interval)
                iconsHTML += `
                    <img src="images/earwithsound.png" alt="Listening" class="icon-ear">
                    <img src="images/facesinging.png" alt="Singing" class="icon-face">
                `;
            } else {
                // Singing root: face (facing left towards root), then ear
                iconsHTML += `
                    <img src="images/facesinging.png" alt="Singing" class="icon-face flipped">
                    <img src="images/earwithsound.png" alt="Listening" class="icon-ear">
                `;
            }
        } else if (showFace) {
            // Singing without audio (audioState = 'none')
            const faceFlippedClass = faceFlipped ? ' flipped' : '';
            iconsHTML += `
                <img src="images/facesinging.png" alt="Singing" class="icon-face${faceFlippedClass}">
            `;
        }

        // Interval Speaker (right) - only for non-unison
        if (showIntervalSpeaker) {
            const silentClass = intervalSpeakerSilent ? ' silent' : '';
            iconsHTML += `
                <div class="icon-speaker-container">
                    <img src="images/roundspeaker.png" alt="Interval note" class="icon-speaker${silentClass}">
                    <div class="speaker-label">${intervalSolfege}</div>
                </div>
            `;
        }

        this.iconsContainer.innerHTML = iconsHTML;
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

            // RIGHT: Minimal padding (float pseudo-element handles last line clearance)
            this.flowInstructionCard.style.paddingRight = '10px';

            // Calculate float width and height for last line clearance
            if (this.actionButton) {
                const actionButtonWidth = this.actionButton.offsetWidth || 120;
                const actionButtonHeight = this.actionButton.offsetHeight || 48;
                const buttonOverhang = 20; // button extends 20px outside card
                const visibleButtonWidth = actionButtonWidth - buttonOverhang;
                const clearanceGap = 10; // gap between text and button
                const floatWidth = visibleButtonWidth + clearanceGap;
                const floatHeight = actionButtonHeight + 10;

                // Set CSS custom properties for the ::after float element
                this.instructionElement.style.setProperty('--action-float-width', `${floatWidth}px`);
                this.instructionElement.style.setProperty('--action-float-height', `${floatHeight}px`);
            } else {
                // Fallback values
                this.instructionElement.style.setProperty('--action-float-width', '110px');
                this.instructionElement.style.setProperty('--action-float-height', '3em');
            }

            // Keep top/bottom padding consistent
            this.flowInstructionCard.style.paddingTop = '20px';
            this.flowInstructionCard.style.paddingBottom = '20px';
        }

        // Position ThenAction button to right of instruction card
        // Fixed overhang matching Command button - button extends this far outside card (right side)
        // Button grows LEFTWARD (into card) as text gets longer
        if (this.actionButton && this.flowInstructionCard) {
            try {
                const buttonOverhang = 20; // static overhang distance (matches Command button)

                // Position button's right edge at fixed distance from card's right edge
                // Negative value extends button to the right
                this.actionButton.style.right = -buttonOverhang + 'px';
            } catch (e) {
                console.warn('Could not calculate action button position:', e);
                // Fallback to default position
                this.actionButton.style.right = '-40px';
            }
        }

        // Show flow container after all positioning is complete
        const flowContainer = this.container.querySelector('.carousel-step-flow');
        if (flowContainer) {
            flowContainer.style.visibility = 'visible';
            flowContainer.style.opacity = '1';
        }

        // Trigger animation AFTER showing
        this.triggerStepAnimation();
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
