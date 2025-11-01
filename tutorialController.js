/**
 * Tutorial Controller
 *
 * Manages tutorial flow and orchestrates UI/audio/visualization state changes
 * based on tutorial step data.
 */

class TutorialController {
    constructor(intervalOverviewInstance, tutorialData, tutorialName = null) {
        this.exercise = intervalOverviewInstance;
        this.steps = tutorialData;
        this.tutorialName = tutorialName; // For FTUE tracking
        this.currentStepIndex = 0;
        this.isActive = false;

        // Store original states for restoration
        this.originalStates = new Map();

        // Store state history for backward navigation
        this.stateHistory = [];

        // Track if waiting for user action
        this.waitingForAction = false;
        this.actionListener = null;

        // Track action counts for steps that require multiple actions
        this.actionCounts = {};

        // Initialize tutorial slider if available (only for Interval Overview, not Unison Overview)
        // Unison Overview uses the exercise's setupGlissandoSlider method instead
        const sliderContainer = intervalOverviewInstance.container?.querySelector('[data-tutorial-target="sliderGlissandoControls"]');
        if (sliderContainer && typeof UnisonTutorialSlider !== 'undefined' && tutorialName !== 'unisonOverview') {
            this.tutorialSlider = new UnisonTutorialSlider(sliderContainer);
            console.log('[TutorialController] Tutorial slider initialized');
        } else {
            this.tutorialSlider = null;
        }
    }

    async start() {
        this.isActive = true;
        this.saveOriginalStates();

        // Check for URL hash to jump to specific step
        let startStep = 0;
        if (typeof window !== 'undefined' && window.location.hash) {
            const hashMatch = window.location.hash.match(/^#step(\d+)$/);
            if (hashMatch) {
                const stepNum = parseInt(hashMatch[1], 10);
                // Convert from 1-based to 0-based index and validate
                const stepIndex = stepNum - 1;
                if (stepIndex >= 0 && stepIndex < this.steps.length) {
                    startStep = stepIndex;
                    console.log(`[TutorialController] Starting at step ${stepNum} from URL hash`);
                }
            }
        }

        await this.goToStep(startStep);
        this.showTutorialUI();
    }

    stop() {
        this.isActive = false;
        this.restoreOriginalStates();
        this.hideTutorialUI();
    }

    async goToStep(stepIndex, isBackNavigation = false) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            return;
        }

        // Save current state before moving to new step (only for forward navigation)
        if (!isBackNavigation && this.isActive) {
            this.saveCurrentState();
        }

        // Reset action counts when navigating to a new step
        this.actionCounts = {};
        this.uniqueFrequencies = new Set();
        this.unisonReached = false;
        this.targetReached = false; // Reset target reached flag
        this.unisonReachedInStep = false; // Reset unison detection for directional button logic

        this.currentStepIndex = stepIndex;
        const step = this.steps[stepIndex];

        this.clearAllStates();
        this.applyTextState(step.text);
        this.applyUIState(step.ui);
        this.applyVizState(step.viz);
        this.applyWaveModeState(step.waveMode);
        await this.applyAudioState(step.audio);
        this.handleCustomInteraction(step.customInteraction);
        this.setupWaitForAction(step.waitForAction);
        this.applyButtonDisabling(step);

        // Handle slider glissando configuration
        await this.applySliderConfig(step.sliderConfig);

        // Set up slider button callback for glissando steps
        this.setupSliderButtonCallback(step);

        // Apply initial directional button logic if requireUnison is set
        if (step.sliderConfig && step.sliderConfig.requireUnison) {
            this.checkUnisonAndUpdateButtons(step);
        }

        this.updateTutorialNavigation();

        // Update URL hash to allow direct linking to this step
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
            const stepNum = stepIndex + 1; // Use 1-based indexing for URLs
            window.history.replaceState(null, '', `#step${stepNum}`);
        }
    }

    next() {
        // Safety check: prevent stale event listeners from executing after destroy
        if (!this.isActive) {
            console.warn('[Tutorial] next() called on inactive tutorial controller - ignoring');
            return;
        }

        if (this.currentStepIndex < this.steps.length - 1) {
            this.goToStep(this.currentStepIndex + 1, false);
        } else {
            this.finish();
        }
    }

    prev() {
        // Safety check: prevent stale event listeners from executing after destroy
        if (!this.isActive) {
            console.warn('[Tutorial] prev() called on inactive tutorial controller - ignoring');
            return;
        }

        if (this.currentStepIndex > 0) {
            const targetStepIndex = this.currentStepIndex - 1;

            // Truncate history to only include states up to (but not including) target step
            // This ensures all forward state is discarded
            this.stateHistory = this.stateHistory.slice(0, targetStepIndex);

            this.goToStep(targetStepIndex, true);
        }
    }

    saveCurrentState() {
        // Save the current frequencies and playing state
        const state = {
            stepIndex: this.currentStepIndex,
            tone1Freq: this.exercise.tone1Freq,
            tone2Freq: this.exercise.tone2Freq,
            isPlaying: this.exercise.isPlaying
        };
        this.stateHistory.push(state);
    }

    setupWaitForAction(actionName) {
        // Clear any previous action listener
        if (this.actionListener) {
            this.actionListener.element.removeEventListener(this.actionListener.event, this.actionListener.handler);
            this.actionListener = null;
        }

        // Clear any existing pulse timeout
        if (this.pulseTimeout) {
            clearTimeout(this.pulseTimeout);
            this.pulseTimeout = null;
        }

        if (!actionName) {
            this.waitingForAction = false;
            this.updateTutorialNavigation();
            return;
        }

        this.waitingForAction = true;
        this.updateTutorialNavigation();

        // Check if this is an inline action (ends with -inline)
        if (actionName.endsWith('-inline')) {
            // For inline actions, the completion is handled by the action itself
            // Set up pulse timeout for inline buttons
            this.pulseTimeout = setTimeout(() => {
                this.addPulseToActionButton(actionName);
            }, 5000);
            return;
        }

        // Set up listener for the specific action (for data-simple elements)
        const element = this.exercise.container.querySelector(`[data-simple="${actionName}"]`);
        if (!element) {
            console.warn('TutorialController: Action element not found:', actionName);
            this.waitingForAction = false;
            this.updateTutorialNavigation();
            return;
        }

        const handler = () => {
            this.waitingForAction = false;
            this.updateTutorialNavigation();

            // Remove the listener after it fires
            if (this.actionListener) {
                this.actionListener.element.removeEventListener(this.actionListener.event, this.actionListener.handler);
                this.actionListener = null;
            }
        };

        element.addEventListener('click', handler);
        this.actionListener = { element, event: 'click', handler };
    }

    skip() {
        this.stop();
    }

    finish() {
        this.stop();

        // Trigger FTUE completion if this is an FTUE tutorial
        if (this.tutorialName && window.ftueManager) {
            console.log(`[TutorialController] Tutorial ${this.tutorialName} completed, notifying FTUE system`);

            // Check if this tutorial completion should trigger FTUE unlock
            if (window.handleTutorialCompletion) {
                window.handleTutorialCompletion(this.tutorialName);
            }
        }

        // Return to main menu
        if (this.exercise && typeof this.exercise.handleExit === 'function') {
            this.exercise.handleExit();
        }
    }

    saveOriginalStates() {
        // Save the current state of key UI elements
        const elements = this.exercise.container.querySelectorAll('[data-tutorial-target]');
        elements.forEach(el => {
            this.originalStates.set(el, {
                visibility: el.style.visibility,
                opacity: el.style.opacity,
                pointerEvents: el.style.pointerEvents,
                classList: Array.from(el.classList)
            });
        });
    }

    restoreOriginalStates() {
        this.originalStates.forEach((state, el) => {
            el.style.visibility = state.visibility;
            el.style.opacity = state.opacity;
            el.style.pointerEvents = state.pointerEvents;
            el.className = state.classList.join(' ');
        });
        this.originalStates.clear();
    }

    clearAllStates() {
        // Remove all tutorial-specific classes and inline styles from tutorial-managed elements
        const elements = this.exercise.container.querySelectorAll('[data-tutorial-target]');
        elements.forEach(el => {
            el.classList.remove('tutorial-hidden', 'tutorial-disabled', 'tutorial-highlight');
            el.style.visibility = '';
            el.style.opacity = '';
            el.style.pointerEvents = '';
        });

        // Clean up slider if active
        if (this.tutorialSlider) {
            this.tutorialSlider.cleanup();
        }
    }

    applyTextState(text) {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (textEl) {
            // Process text for helper definitions
            let processedText = text;
            if (window.helperDefinitionsManager) {
                processedText = window.helperDefinitionsManager.processTextForHelperTerms(text);
            }

            // Only update if text has changed (prevents double animation during glissando)
            if (textEl.innerHTML === processedText) {
                return;
            }

            // Add fade-in animation class
            textEl.classList.add('tutorial-text-fade-in');

            textEl.innerHTML = processedText;

            // Set up inline button listeners
            this.setupInlineButtons();

            // Remove animation class after animation completes
            setTimeout(() => {
                textEl.classList.remove('tutorial-text-fade-in');
            }, 600);
        }
    }

    /**
     * Update text dynamically based on frequency ranges
     * Used for steps with dynamicTextRanges configuration
     */
    updateDynamicText(frequency, dynamicTextRanges) {
        // Find the appropriate text range for the current frequency
        for (const range of dynamicTextRanges) {
            const { minFreq, maxFreq, text } = range;

            // Check if frequency is within this range
            if (frequency >= minFreq && frequency <= maxFreq) {
                // Update text using the existing applyTextState method
                this.applyTextState(text);
                return;
            }
        }

        // If no range matches, log warning but don't update
        console.warn('[TutorialController] No dynamic text range found for frequency:', frequency);
    }

    setupInlineButtons() {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        // Find all inline action buttons
        const actionButtons = textEl.querySelectorAll('[data-tutorial-action]');
        actionButtons.forEach(button => {
            const action = button.dataset.tutorialAction;

            button.addEventListener('click', () => {
                this.handleInlineAction(action);
            });
        });

        // Set up tutorial sliders
        const sliders = textEl.querySelectorAll('[data-tutorial-slider]');
        sliders.forEach(slider => {
            const sliderId = slider.dataset.tutorialSlider;

            slider.addEventListener('input', (e) => {
                this.handleSliderChange(sliderId, parseFloat(e.target.value));
            });

            // Apply color gradient to slider
            this.applySliderGradient(slider);
        });
    }

    applySliderGradient(slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const rootFreq = this.exercise.tone1Freq || 440;

        // Generate gradient stops
        const numStops = 50;
        const gradientStops = [];

        for (let i = 0; i <= numStops; i++) {
            const t = i / numStops;
            const freq = min + (max - min) * t;
            const color = this.getFrequencyColorPiano(freq, rootFreq);
            gradientStops.push(`${color} ${t * 100}%`);
        }

        const gradient = `linear-gradient(to right, ${gradientStops.join(', ')})`;

        // Apply gradient as background
        slider.style.background = gradient;
    }

    handleSliderChange(sliderId, frequency) {
        // Update tone2 frequency
        this.exercise.tone2Freq = frequency;
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();

        // Update audio if playing
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            const state = this.exercise.audioController.getState();
            if (state.isPlayingTone1 || state.isPlayingTone2) {
                this.exercise.audioController.updatePlayingFrequencies();
            }
        }

        // Provide feedback based on how close to unison
        this.updateSliderFeedback(sliderId, frequency);
    }

    getFrequencyColorPiano(freq, rootFreq) {
        // Define equal temperament chromatic scale colors
        const chromaticNotes = [
            { semitone: 0, hue: 180 },      // Unison - cyan
            { semitone: 1, hue: 0 },        // Minor 2nd - red
            { semitone: 2, hue: 40 },       // Major 2nd - orange
            { semitone: 3, hue: 120 },      // Minor 3rd - green
            { semitone: 4, hue: 160 },      // Major 3rd - cyan-green
            { semitone: 5, hue: 200 },      // Perfect 4th - blue
            { semitone: 6, hue: 0 },        // Tritone - red
            { semitone: 7, hue: 220 },      // Perfect 5th - bright blue
            { semitone: 8, hue: 280 },      // Minor 6th - purple
            { semitone: 9, hue: 300 },      // Major 6th - magenta
            { semitone: 10, hue: 30 },      // Minor 7th - orange
            { semitone: 11, hue: 15 }       // Major 7th - red-orange
        ];

        // Calculate frequency ratio
        const ratio = freq / rootFreq;
        const cents = 1200 * Math.log2(ratio);
        const normalizedCents = ((cents % 1200) + 1200) % 1200;

        // Find which semitone we're closest to
        const semitonesFromRoot = normalizedCents / 100;
        const lowerSemitone = Math.floor(semitonesFromRoot);
        const upperSemitone = Math.ceil(semitonesFromRoot) % 12;
        const blendFactor = semitonesFromRoot - Math.floor(semitonesFromRoot);

        const lower = chromaticNotes[lowerSemitone];
        const upper = chromaticNotes[upperSemitone];

        // Blend between the two hues
        let hue = lower.hue + (upper.hue - lower.hue) * blendFactor;

        // Handle wraparound for red (0/360)
        if (Math.abs(upper.hue - lower.hue) > 180) {
            if (lower.hue < upper.hue) {
                hue = lower.hue + ((upper.hue - 360 - lower.hue) * blendFactor);
            } else {
                hue = lower.hue + ((upper.hue + 360 - lower.hue) * blendFactor);
            }
        }

        hue = ((hue % 360) + 360) % 360;

        return `hsl(${hue}, 100%, 50%)`;
    }

    updateSliderFeedback(sliderId, frequency) {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        const feedbackEl = textEl.querySelector(`[data-tutorial-feedback="${sliderId}"]`);
        if (!feedbackEl) return;

        const targetFreq = this.exercise.tone1Freq || 440;
        const diff = Math.abs(frequency - targetFreq);

        let feedbackText = '';

        if (diff < 2) {
            feedbackText = '🎯 You found it! The beat frequency has disappeared — this is unison!';
        } else if (diff < 5) {
            feedbackText = `Very close! Only ${Math.round(diff)} Hz away. Listen for the slow pulse.`;
        } else if (diff < 10) {
            feedbackText = `Getting closer! About ${Math.round(diff)} Hz away. The pulse is slowing down.`;
        } else if (diff < 20) {
            feedbackText = `${Math.round(diff)} Hz away. Listen for the beat frequency to guide you.`;
        } else {
            feedbackText = `Keep exploring! You're ${Math.round(diff)} Hz away from unison.`;
        }

        feedbackEl.textContent = feedbackText;
    }

    handleInlineAction(action) {
        switch (action) {
            case 'play-random':
                this.playRandomTone();
                break;
            case 'play-random-tone2':
                this.playRandomTone2();
                break;
            case 'play-tone':
                this.playTone();
                break;
            case 'show-wave':
                this.showWave();
                break;
            case 'show-hertz':
                this.showHertz();
                break;
            case 'play-second-tone':
                this.playSecondTone();
                break;
            case 'combine-waves':
                this.combineWaves();
                break;
            case 'show-interference':
                this.showInterference();
                break;
            case 'play-random-major':
                this.playRandomMajor();
                break;
            case 'step-down-to-unison':
                this.stepDownToUnison();
                break;
            case 'step-up-tone2':
                this.stepUpTone2();
                break;
            case 'play-unison':
                this.playUnison();
                break;
            case 'play-interval':
                this.playInterval();
                break;
            case 'play-root-only':
                this.playRootOnly();
                break;
            case 'play-interval-only':
                this.playIntervalOnly();
                break;
            case 'play-both':
                this.playBothTones();
                break;
            case 'overlay-waves':
                this.overlayWaves();
                break;
            case 'overlay-waves-unison':
                this.overlayWavesUnison();
                break;
            case 'show-interference':
                this.showInterferencePattern();
                break;
            case 'play-interval-1':
                this.playInterval1();
                break;
            case 'play-interval-2':
                this.playInterval2();
                break;
            case 'play-interval-3':
                this.playInterval3();
                break;
            case 'toggle-root':
                this.toggleRoot();
                break;
            case 'toggle-interval':
                this.toggleInterval();
                break;
            case 'randomize-root':
                this.randomizeRoot();
                break;
            case 'play-random-interval':
                this.playRandomInterval();
                break;
            case 'move-closer-pitch':
            case 'continue-bringing-together':
            case 'move-even-closer':
            case 'bring-closer-still':
            case 'reach-perfect-unison':
                this.handleBeatFrequencyGlissando(action);
                break;
            case 'repeat-beat-frequency':
                this.handleRepeatBeatFrequency();
                break;
            default:
                console.warn('Unknown tutorial action:', action);
        }
    }

    playRandomMajor() {
        // Major scale intervals (in semitones from root): 0, 2, 4, 5, 7, 9, 11, 12
        // One octave above 440 Hz = 880 Hz base
        // Calculate frequencies for major scale one octave above root
        const rootFreq = this.exercise.tone1Freq || 440;
        const octaveAbove = rootFreq * 2; // One octave above

        // Major scale intervals in semitones: Whole, Whole, Half, Whole, Whole, Whole, Half
        // From root: 0, 2, 4, 5, 7, 9, 11, 12
        const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11, 12];

        // Pick a random note from the major scale (excluding root/octave for variety)
        const scaleIndex = Math.floor(Math.random() * 7) + 1; // 1-7 (skip 0)
        const semitones = majorScaleIntervals[scaleIndex];

        // Calculate frequency using equal temperament: f = f0 * 2^(n/12)
        const randomFreq = octaveAbove * Math.pow(2, semitones / 12);

        // Set the interval frequency
        this.exercise.tone2Freq = randomFreq;
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();

        // Flash the changing elements
        this.flashElement('[data-tutorial-target="intervalDisplay"]');
        this.flashElement('[data-tutorial-target="interferencePanel"]');

        // Play both tones
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playBoth();

            // Update UI
            const playRoot = this.exercise.container.querySelector('[data-simple="play-root"]');
            const playInterval = this.exercise.container.querySelector('[data-simple="play-interval"]');
            if (playRoot) {
                playRoot.classList.add('playing');
            }
            if (playInterval) {
                playInterval.classList.add('playing');
            }
        }

        this.updateNoSoundMode();
        // Update dynamic text if current step has it
        this.updateDynamicText();
    }

    stepDownToUnison() {
        // Decrease tone2 frequency by 1 Hz
        const step = this.steps[this.currentStepIndex];
        const targetFreq = step.stepDownTarget || this.exercise.tone1Freq || 440;
        const minFreq = 400; // Allow going below unison for exploration

        if (this.exercise.tone2Freq > minFreq) {
            this.exercise.tone2Freq = Math.max(minFreq, this.exercise.tone2Freq - 1);
            this.exercise.syncAllControls();
            this.exercise.updateVisualizations();

            this.updateBeatFrequencyFeedback();

            // Flash the frequency display to show what's changing
            this.flashFrequencyDisplay();

            // Flash the interference panel to draw attention
            this.flashElement('[data-unison-panel="interference"]');

            // Update the audio if playing
            if (this.exercise.audioController) {
                this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
                const state = this.exercise.audioController.getState();
                if (state.isPlayingTone1 || state.isPlayingTone2) {
                    this.exercise.audioController.updatePlayingFrequencies();
                }
            }

            // Check if we've reached the target
            if (this.exercise.tone2Freq <= targetFreq && !this.targetReached) {
                this.targetReached = true;

                // Reveal dynamic text if unison was reached
                if (targetFreq === (this.exercise.tone1Freq || 440)) {
                    this.revealText('reached-unison');
                }

                // Complete the appropriate inline action
                if (step.waitForAction === 'reached-unison-from-441') {
                    this.completeInlineAction('reached-unison-from-441');
                } else if (step.waitForAction === 'step-down-to-unison-inline') {
                    this.revealText('stepped-down');
                    this.completeInlineAction('step-down-to-unison-inline');
                }
            }
        }
    }

    stepUpTone2() {
        // Increase tone2 frequency by 1 Hz
        const step = this.steps[this.currentStepIndex];
        const targetFreq = step.stepUpTarget || 500;
        const maxFreq = 500; // Allow exploration up to 500 Hz

        if (this.exercise.tone2Freq < maxFreq) {
            this.exercise.tone2Freq = Math.min(maxFreq, this.exercise.tone2Freq + 1);
            this.exercise.syncAllControls();
            this.exercise.updateVisualizations();

            this.updateBeatFrequencyFeedback();

            // Flash the frequency display to show what's changing
            this.flashFrequencyDisplay();

            // Flash the interference panel to draw attention
            this.flashElement('[data-unison-panel="interference"]');

            // Update the audio if playing
            if (this.exercise.audioController) {
                this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
                const state = this.exercise.audioController.getState();
                if (state.isPlayingTone1 || state.isPlayingTone2) {
                    this.exercise.audioController.updatePlayingFrequencies();
                }
            }

            // Check if we've reached the target
            if (this.exercise.tone2Freq >= targetFreq && !this.targetReached) {
                this.targetReached = true;

                // Complete the appropriate inline action
                if (step.waitForAction === 'reached-452') {
                    this.completeInlineAction('reached-452');
                }
            }
        }
    }

    updateBeatFrequencyFeedback() {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        // Update Hz display - check all possible display modes
        const displayModes = ['step-down', 'step-up', 'free-play'];
        for (const mode of displayModes) {
            const displayEl = textEl.querySelector(`[data-tutorial-tone2-display="${mode}"]`);
            if (displayEl) {
                displayEl.textContent = `${Math.round(this.exercise.tone2Freq)} Hz`;
            }
        }

        // Update feedback text based on frequency
        const feedbackEl = textEl.querySelector('[data-tutorial-feedback="beat-freq"]');
        if (!feedbackEl) return;

        const targetFreq = this.exercise.tone1Freq || 440;
        const diff = Math.abs(this.exercise.tone2Freq - targetFreq);
        const currentFreq = Math.round(this.exercise.tone2Freq);

        let feedbackText = '';

        if (currentFreq === 441) {
            feedbackText = `Just 1 Hz away! Listen carefully — this creates a very distinct <strong>wah-wah-wah</strong> sound. This slow pulse is your signal that you're extremely close to unison.`;
        } else if (currentFreq === 442 || currentFreq === 443) {
            feedbackText = `Only ${diff} Hz away! The pulse is getting very slow now. You're almost at unison — keep going!`;
        } else if (currentFreq === 444 || currentFreq === 445) {
            feedbackText = `At ${diff} Hz difference, notice how the pulse is getting slower. The beat frequency is decreasing as you approach unison.`;
        } else if (currentFreq === 440) {
            feedbackText = `Perfect! You've reached unison at 440 Hz. Notice how the pulsing has completely disappeared — the two tones are now unified.`;
        } else if (diff <= 5) {
            feedbackText = `${diff} Hz difference — the pulse is quite slow now. Getting very close to unison!`;
        } else if (diff <= 10) {
            feedbackText = `${diff} Hz difference creating ${diff} beats per second. Keep exploring to hear how the pulse changes.`;
        } else {
            feedbackText = `${diff} Hz difference creating ${diff} beats per second. Use the buttons to explore the beat frequency around 440 Hz.`;
        }

        feedbackEl.innerHTML = feedbackText;
    }

    showInterference() {
        // Switch to interference visualization
        const interferenceRadio = this.exercise.container.querySelector('[data-viz-select="interference"]');
        if (interferenceRadio) {
            interferenceRadio.checked = true;
            if (this.exercise.updateVisibility) {
                this.exercise.updateVisibility();
            }
        }

        // Disable the button after clicking
        this.disableInlineButton('show-interference');

        // Auto-advance to next step
        setTimeout(() => {
            this.next();
        }, 100);
    }

    combineWaves() {
        // Switch to overlay mode for waveforms
        const waveViz = this.exercise.waveViz;
        if (waveViz && waveViz.setViewMode) {
            waveViz.setViewMode('overlay');
            // Also check the radio button
            const overlayRadio = this.exercise.container.querySelector('[data-wave-viz="view-overlay"]');
            if (overlayRadio) {
                overlayRadio.checked = true;
            }
        }

        // Disable the button after clicking
        this.disableInlineButton('combine-waves');

        // Trigger the wait action completion
        this.completeInlineAction('combine-waves-inline');
    }

    playSecondTone() {
        // Show the interval display and controls
        const intervalDisplay = this.exercise.container.querySelector('[data-tutorial-target="intervalDisplay"]');
        if (intervalDisplay) {
            intervalDisplay.classList.remove('tutorial-hidden');
            intervalDisplay.disabled = false;
        }

        const intervalArrows = this.exercise.container.querySelectorAll('[data-tutorial-target="intervalArrows"]');
        intervalArrows.forEach(arrow => {
            arrow.classList.remove('tutorial-hidden');
            arrow.disabled = false;
        });

        const controlsDivider = this.exercise.container.querySelector('[data-tutorial-target="controlsDivider"]');
        if (controlsDivider) {
            controlsDivider.classList.remove('tutorial-hidden');
        }

        // Add second tone without restarting the first tone's visual
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);

            // Check if tone1 is already playing
            const state = this.exercise.audioController.getState();
            if (state.isPlayingTone1) {
                // Tone1 is already playing, only add tone2 without resetting timing
                this.exercise.audioController.playTone2(false); // false = don't reset timing
            } else {
                // Tone1 not playing, start both
                this.exercise.audioController.playBoth();
            }

            // Update UI
            const playRoot = this.exercise.container.querySelector('[data-simple="play-root"]');
            const playInterval = this.exercise.container.querySelector('[data-simple="play-interval"]');
            if (playRoot) {
                playRoot.classList.add('playing');
            }
            if (playInterval) {
                playInterval.classList.add('playing');
            }
        }

        this.updateNoSoundMode();

        // Reveal the "same frequency" text
        this.revealText('same-freq-shown');

        // Disable the button after clicking
        this.disableInlineButton('play-second-tone');

        // Trigger the wait action completion
        this.completeInlineAction('play-second-tone-inline');
    }

    showHertz() {
        // Show and enable the root Hz display
        const rootDisplay = this.exercise.container.querySelector('[data-tutorial-target="rootDisplay"]');
        if (rootDisplay) {
            rootDisplay.classList.remove('tutorial-hidden');
            rootDisplay.disabled = false;

            // Flash the Hz display to draw attention
            this.flashElement('[data-tutorial-target="rootDisplay"]');
        }

        // Disable the button after clicking
        this.disableInlineButton('show-hertz');

        // Trigger the wait action completion
        this.completeInlineAction('show-hertz-inline');
    }

    playTone() {
        // Play the current root tone
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playTone1();

            // Update UI
            const playRoot = this.exercise.container.querySelector('[data-simple="play-root"]');
            if (playRoot) {
                playRoot.classList.add('playing');
            }
        }

        this.updateNoSoundMode();

        // Show wave visualization
        this.applyVizState('wave');

        // Reveal the waveform explanation text
        this.revealText('tone-played');

        // Disable the button after clicking
        this.disableInlineButton('play-tone');

        // Update navigation to enable Next button (for step 1)
        this.updateTutorialNavigation();

        // Trigger the wait action completion
        this.completeInlineAction('play-tone-inline');
    }

    playUnison() {
        // Switch to interference visualization to show unison pattern
        const interferenceRadio = this.exercise.container.querySelector('[data-viz-select="interference"]');
        if (interferenceRadio) {
            interferenceRadio.checked = true;
            if (this.exercise.updateVisibility) {
                this.exercise.updateVisibility();
            }
        }

        // Add second tone without restarting the root tone's visual
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);

            // Check if tone1 is already playing
            const state = this.exercise.audioController.getState();
            if (state.isPlayingTone1) {
                // Tone1 is already playing, only add tone2 without resetting timing
                this.exercise.audioController.playTone2(false); // false = don't reset timing
            } else {
                // Tone1 not playing, start both
                this.exercise.audioController.playBoth();
            }

            // Update UI
            const playRoot = this.exercise.container.querySelector('[data-simple="play-root"]');
            const playInterval = this.exercise.container.querySelector('[data-simple="play-interval"]');
            if (playRoot) {
                playRoot.classList.add('playing');
            }
            if (playInterval) {
                playInterval.classList.add('playing');
            }
        }

        this.updateNoSoundMode();

        // Update text: remove "Right now..." sentence and replace button with new text
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (textEl) {
            // Remove the "Right now, you're hearing just the root note at 440 Hz." text
            let htmlContent = textEl.innerHTML;
            htmlContent = htmlContent.replace(/Right now, you're hearing just the root note at 440 Hz\./g, '');

            // Find and remove the button and its container div
            const button = textEl.querySelector('[data-tutorial-action="play-unison"]');
            if (button) {
                // Remove the entire button container div
                const buttonContainer = button.closest('div[style*="text-align: center"]');
                if (buttonContainer) {
                    // Replace button container with new text paragraph
                    const newText = document.createElement('p');
                    newText.style.marginTop = '16px';
                    newText.style.textAlign = 'center';
                    newText.style.fontWeight = '500';
                    newText.innerHTML = "Now you're hearing two of the same notes played at the same time.";
                    buttonContainer.parentNode.replaceChild(newText, buttonContainer);
                } else {
                    // Fallback: just remove the button
                    button.remove();
                }
            }
        }

        // Update text to reflect that unison is now playing (reveal any dynamic text)
        this.revealText('unison-played');

        // Trigger the wait action completion
        this.completeInlineAction('play-unison-inline');
    }

    showWave() {
        // Show the wave visualization
        const waveRadio = this.exercise.container.querySelector('[data-viz-select="wave"]');
        if (waveRadio) {
            waveRadio.checked = true;
            if (this.exercise.updateVisibility) {
                this.exercise.updateVisibility();
            }
        }

        // Play the tone if not already playing
        if (this.exercise.audioController) {
            const state = this.exercise.audioController.getState();
            if (!state.isPlayingTone1) {
                this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
                this.exercise.audioController.playTone1();

                // Update UI
                const playRoot = this.exercise.container.querySelector('[data-simple="play-root"]');
                if (playRoot) {
                    playRoot.classList.add('playing');
                }

                this.updateNoSoundMode();
            }
        }

        // Reveal the hidden text
        this.revealText('wave-shown');

        // Update dynamic text to show current frequency
        this.updateDynamicText();

        // Disable the button after clicking
        this.disableInlineButton('show-wave');

        // Trigger the wait action completion
        this.completeInlineAction('show-wave-inline');
    }

    completeInlineAction(actionName) {
        // Check if we're waiting for this specific action
        if (this.waitingForAction) {
            const step = this.steps[this.currentStepIndex];
            if (step && step.waitForAction === actionName) {
                this.waitingForAction = false;
                this.updateTutorialNavigation();

                // Clean up the listener if it exists
                if (this.actionListener) {
                    this.actionListener.element.removeEventListener(this.actionListener.event, this.actionListener.handler);
                    this.actionListener = null;
                }
            }
        }
    }

    playRandomTone() {
        // Generate chromatic scale frequencies within +/- one octave of 440 Hz
        const referenceFreq = 440;
        const minFreq = referenceFreq / 2; // 220 Hz (one octave below)
        const maxFreq = referenceFreq * 2; // 880 Hz (one octave above)
        const chromaticFrequencies = [];

        // Generate frequencies for chromatic scale (12 semitones per octave)
        // Within +/- one octave range
        for (let semitone = -12; semitone <= 12; semitone++) {
            const freq = referenceFreq * Math.pow(2, semitone / 12);
            chromaticFrequencies.push(Math.round(freq * 100) / 100); // Round to 2 decimal places
        }

        // Track whether we should go above or below 440 Hz
        if (this.randomToneAbove === undefined) {
            this.randomToneAbove = false; // Start with below on first click
        }

        let randomFreq;
        if (this.randomToneAbove) {
            // Select from frequencies above 440 Hz
            const aboveFreqs = chromaticFrequencies.filter(f => f >= referenceFreq);
            randomFreq = aboveFreqs[Math.floor(Math.random() * aboveFreqs.length)];
        } else {
            // Select from frequencies below 440 Hz
            const belowFreqs = chromaticFrequencies.filter(f => f < referenceFreq);
            randomFreq = belowFreqs[Math.floor(Math.random() * belowFreqs.length)];
        }

        // Toggle for next time
        this.randomToneAbove = !this.randomToneAbove;

        // Set the root frequency to the random value
        this.exercise.tone1Freq = randomFreq;
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();

        // Flash the changing elements to draw attention
        this.flashElement('[data-tutorial-target="rootDisplay"]');

        // Flash the left wave panel (tone 1)
        this.flashElement('[data-tutorial-target="waveFlashLeft"]');

        // Play the tone
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playTone1();

            // Update UI
            const playRoot = this.exercise.container.querySelector('[data-simple="play-root"]');
            if (playRoot) {
                playRoot.classList.add('playing');
            }
        }

        // Update dynamic text if current step has it
        this.updateDynamicText();

        // Track action count for steps that require multiple plays
        const step = this.steps[this.currentStepIndex];
        if (step && step.waitForAction === 'play-random-3x') {
            // Track unique frequencies played
            if (!this.uniqueFrequencies) {
                this.uniqueFrequencies = new Set();
            }

            this.uniqueFrequencies.add(randomFreq);
            const uniqueCount = this.uniqueFrequencies.size;

            this.updateActionCounter('random-count', Math.max(0, 3 - uniqueCount));

            if (uniqueCount >= 3) {
                this.completeInlineAction('play-random-3x');
            }
        }

        // Track action count for steps that require 4 plays (Unison Overview Step 2)
        if (step && step.waitForAction === 'play-random-4x') {
            // Track unique frequencies played
            if (!this.uniqueFrequencies) {
                this.uniqueFrequencies = new Set();
            }

            this.uniqueFrequencies.add(randomFreq);
            const uniqueCount = this.uniqueFrequencies.size;

            this.updateActionCounter('random-count-unison', Math.max(0, 4 - uniqueCount));

            // Reveal completion message when done
            if (uniqueCount >= 4) {
                this.revealText('random-complete');
                this.completeInlineAction('play-random-4x');
            }
        }
    }

    playRandomTone2() {
        // Generate chromatic scale frequencies within +/- one octave of 440 Hz
        const referenceFreq = 440;
        const minFreq = referenceFreq / 2; // 220 Hz (one octave below)
        const maxFreq = referenceFreq * 2; // 880 Hz (one octave above)
        const chromaticFrequencies = [];

        // Generate frequencies for chromatic scale (12 semitones per octave)
        // Within +/- one octave range
        for (let semitone = -12; semitone <= 12; semitone++) {
            const freq = referenceFreq * Math.pow(2, semitone / 12);
            chromaticFrequencies.push(Math.round(freq * 100) / 100); // Round to 2 decimal places
        }

        // Track whether we should go above or below 440 Hz for tone 2
        if (this.randomTone2Above === undefined) {
            this.randomTone2Above = false; // Start with below on first click
        }

        let randomFreq;
        if (this.randomTone2Above) {
            // Select from frequencies above 440 Hz
            const aboveFreqs = chromaticFrequencies.filter(f => f >= referenceFreq);
            randomFreq = aboveFreqs[Math.floor(Math.random() * aboveFreqs.length)];
        } else {
            // Select from frequencies below 440 Hz
            const belowFreqs = chromaticFrequencies.filter(f => f < referenceFreq);
            randomFreq = belowFreqs[Math.floor(Math.random() * belowFreqs.length)];
        }

        // Toggle for next time
        this.randomTone2Above = !this.randomTone2Above;

        // Set the interval frequency to the random value
        this.exercise.tone2Freq = randomFreq;
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();

        // Flash the changing elements to draw attention
        this.flashElement('[data-tutorial-target="intervalDisplay"]');

        // Check if this is step 8 (overlay mode) - flash whole wave panel
        // Otherwise flash right side and interference panel
        const step = this.steps[this.currentStepIndex];
        if (step && step.waveMode === 'overlay' && step.waitForAction === 'play-random-tone2-step8-3x') {
            // Step 8: Flash whole wave panel since tones are overlaid
            this.flashElement('[data-tutorial-target="wavePanel"]');
        } else {
            // Other steps: Flash right side for tone 2
            this.flashElement('[data-tutorial-target="waveFlashRight"]');
            this.flashElement('[data-tutorial-target="interferencePanel"]');
        }

        // Play both tones
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playBoth();

            // Update UI
            const playRoot = this.exercise.container.querySelector('[data-simple="play-root"]');
            const playInterval = this.exercise.container.querySelector('[data-simple="play-interval"]');
            if (playRoot) {
                playRoot.classList.add('playing');
            }
            if (playInterval) {
                playInterval.classList.add('playing');
            }
        }

        // Update dynamic text if current step has it
        this.updateDynamicText();

        // Track action count for steps that require multiple plays
        if (step && step.waitForAction === 'play-random-tone2-3x') {
            this.actionCounts['play-random-tone2'] = (this.actionCounts['play-random-tone2'] || 0) + 1;
            this.updateActionCounter('random-count-2', 3 - this.actionCounts['play-random-tone2']);

            if (this.actionCounts['play-random-tone2'] >= 3) {
                this.completeInlineAction('play-random-tone2-3x');
            }
        }

        // Track action count for step 8 (play-random-tone2-step8-3x)
        if (step && step.waitForAction === 'play-random-tone2-step8-3x') {
            this.actionCounts['play-random-tone2-step8'] = (this.actionCounts['play-random-tone2-step8'] || 0) + 1;
            const count = this.actionCounts['play-random-tone2-step8'];

            // Reveal wave intersection text on first play
            if (count === 1) {
                this.revealText('wave-intersection-shown');
            }

            this.updateActionCounter('random-count-3', 3 - count);

            if (count >= 3) {
                this.completeInlineAction('play-random-tone2-step8-3x');
            }
        }

        // Track action count for step 13 (play-random-tone2-step13-3x)
        if (step && step.waitForAction === 'play-random-tone2-step13-3x') {
            this.actionCounts['play-random-tone2-step13'] = (this.actionCounts['play-random-tone2-step13'] || 0) + 1;
            const count = this.actionCounts['play-random-tone2-step13'];

            // Reveal interaction text on first play
            if (count === 1) {
                this.revealText('interval-interaction-shown');
            }

            this.updateActionCounter('random-count-4', 3 - count);

            if (count >= 3) {
                this.completeInlineAction('play-random-tone2-step13-3x');
            }
        }
    }

    updateDynamicText() {
        const step = this.steps[this.currentStepIndex];
        if (!step || !step.dynamicText) return;

        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        // Update all dynamic text elements
        const dynamicElements = textEl.querySelectorAll('[data-tutorial-dynamic="root-freq"]');
        dynamicElements.forEach(el => {
            el.textContent = Math.round(this.exercise.tone1Freq);
        });
    }

    updateActionCounter(counterId, remaining) {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        const counterEl = textEl.querySelector(`[data-tutorial-counter="${counterId}"]`);
        if (counterEl) {
            if (remaining <= 0) {
                counterEl.style.display = 'none';
            } else {
                counterEl.textContent = `(${remaining})`;
            }
        }
    }

    disableInlineButton(actionName) {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        const button = textEl.querySelector(`[data-tutorial-action="${actionName}"]`);
        if (button) {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        }
    }

    revealText(revealId) {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        const revealEl = textEl.querySelector(`[data-tutorial-reveal="${revealId}"]`);
        if (revealEl) {
            revealEl.style.display = 'block';
            revealEl.style.visibility = 'visible';
        }
    }

    addPulseToActionButton(actionName) {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        // Extract the action type from the -inline suffix
        const baseAction = actionName.replace('-inline', '').replace('-3x', '');
        const button = textEl.querySelector(`[data-tutorial-action="${baseAction}"]`);

        if (button && !button.disabled) {
            button.classList.add('tutorial-btn-pulse');
        }
    }

    applyUIState(uiState) {
        if (!uiState) return;

        for (const [targetName, state] of Object.entries(uiState)) {
            const elements = this.exercise.container.querySelectorAll(`[data-tutorial-target="${targetName}"]`);

            elements.forEach(el => {
                // Handle visibility
                if (state.visible === false) {
                    el.classList.add('tutorial-hidden');
                } else if (state.visible === true) {
                    el.classList.remove('tutorial-hidden');
                    // Add fade-in effect when showing element
                    el.classList.add('tutorial-ui-fade-in');
                    setTimeout(() => {
                        el.classList.remove('tutorial-ui-fade-in');
                    }, 400);
                }

                // Handle enabled/disabled
                if (state.enabled === false) {
                    el.classList.add('tutorial-disabled');
                    el.disabled = true;
                } else if (state.enabled === true) {
                    el.classList.remove('tutorial-disabled');
                    el.disabled = false;
                }

                // Handle highlight
                if (state.highlight === true) {
                    el.classList.add('tutorial-highlight');
                } else if (state.highlight === false) {
                    el.classList.remove('tutorial-highlight');
                }
            });
        }
    }

    applyVizState(vizState) {
        if (!vizState) return;

        // Set the appropriate radio button based on viz state
        const radioButtons = this.exercise.container.querySelectorAll('[data-viz-select]');
        radioButtons.forEach(radio => {
            if (radio.dataset.vizSelect === vizState) {
                radio.checked = true;
            }
        });

        // Trigger visibility update in the exercise
        if (this.exercise.updateVisibility) {
            this.exercise.updateVisibility();
        }
    }

    applyWaveModeState(waveMode) {
        if (!waveMode) return;

        // Set the wave visualization mode
        const waveViz = this.exercise.waveViz;
        if (waveViz && waveViz.setViewMode) {
            waveViz.setViewMode(waveMode);

            // Also update the radio button
            const radioButtons = this.exercise.container.querySelectorAll('[data-wave-viz]');
            radioButtons.forEach(radio => {
                if (radio.value === waveMode) {
                    radio.checked = true;
                }
            });
        }
    }

    async applyAudioState(audioState) {
        if (!audioState || !this.exercise || !this.exercise.audioController) {
            console.warn('[Tutorial] applyAudioState skipped - missing audioState or audioController');
            return;
        }

        // Additional safety check: ensure audio controller tone generators exist
        if (!this.exercise.audioController.toneGen1 || !this.exercise.audioController.toneGen2) {
            console.error('[Tutorial] Audio controller tone generators not initialized - skipping audio action');
            return;
        }

        const action = audioState.action;
        console.log('[Tutorial] applyAudioState called, action:', action, 'audioState:', audioState);

        switch (action) {
            case 'stop':
                console.log('[Tutorial] Stopping audio');
                this.exercise.audioController.stopBoth();
                this.exercise.isPlaying = false;
                this.exercise.updatePlayButtonState();
                this.updateNoSoundMode();
                break;

            case 'set':
                console.log('[Tutorial] Setting frequencies without playing');
                if (audioState.tone1 !== undefined) {
                    this.exercise.tone1Freq = audioState.tone1;
                }
                if (audioState.tone2 !== undefined) {
                    this.exercise.tone2Freq = audioState.tone2;
                }
                this.exercise.syncAllControls();
                this.exercise.updateVisualizations();
                break;

            case 'play':
                console.log('[Tutorial] PLAYING audio - tone1:', audioState.tone1, 'tone2:', audioState.tone2, 'which:', audioState.which);

                // Get current audio state
                const currentState = this.exercise.audioController.getState();
                const currentTone1Freq = currentState.tone1Freq;
                const currentTone2Freq = currentState.tone2Freq;
                const currentlyPlayingTone1 = currentState.isPlayingTone1;
                const currentlyPlayingTone2 = currentState.isPlayingTone2;

                // Determine requested frequencies
                const requestedTone1Freq = audioState.tone1 !== undefined ? audioState.tone1 : this.exercise.tone1Freq;
                const requestedTone2Freq = audioState.tone2 !== undefined ? audioState.tone2 : this.exercise.tone2Freq;

                // Determine what should be playing
                const shouldPlayTone1 = audioState.which === 'tone1' || audioState.which === 'both';
                const shouldPlayTone2 = audioState.which === 'tone2' || audioState.which === 'both';

                // Check if restart is needed
                const frequenciesChanged = currentTone1Freq !== requestedTone1Freq || currentTone2Freq !== requestedTone2Freq;
                const whichChanged = (currentlyPlayingTone1 !== shouldPlayTone1) || (currentlyPlayingTone2 !== shouldPlayTone2);
                const needsRestart = !this.exercise.isPlaying || frequenciesChanged || whichChanged;

                console.log('[Tutorial] Restart check:', {
                    isPlaying: this.exercise.isPlaying,
                    frequenciesChanged,
                    whichChanged,
                    needsRestart
                });

                // Update stored frequencies
                if (audioState.tone1 !== undefined) {
                    this.exercise.tone1Freq = audioState.tone1;
                }
                if (audioState.tone2 !== undefined) {
                    this.exercise.tone2Freq = audioState.tone2;
                }

                // Resume audio context if suspended (needed for browser autoplay policy)
                if (window.audioManager && window.audioManager.audioContext) {
                    if (window.audioManager.audioContext.state === 'suspended') {
                        try {
                            await window.audioManager.audioContext.resume();
                            console.log('[Tutorial] Audio context resumed successfully');
                        } catch (err) {
                            console.warn('[Tutorial] Failed to resume audio context:', err);
                        }
                    }
                }

                // NEW: If preventExpansion is true and audio is already playing with correct "which",
                // just update frequencies smoothly without restarting (prevents audio pops on Steps 7-9)
                if (audioState.preventExpansion && this.exercise.isPlaying && !whichChanged && frequenciesChanged) {
                    console.log('[Tutorial] Smoothly updating frequencies without restart (preventExpansion mode)');
                    // Use setTone1Frequency/setTone2Frequency with updateIfPlaying=true to actually change the oscillators
                    this.exercise.audioController.setTone1Frequency(this.exercise.tone1Freq, true);
                    this.exercise.audioController.setTone2Frequency(this.exercise.tone2Freq, true);
                    this.exercise.syncAllControls();
                    this.exercise.updateVisualizations();
                    this.updateNoSoundMode();
                    break;  // Exit early, don't restart
                }

                // Only stop and restart if something changed
                if (needsRestart) {
                    console.log('[Tutorial] Stopping and restarting audio (something changed)');
                    this.exercise.audioController.stopBoth();
                    this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);

                    // Check if we should prevent expansion animation
                    const preventExpansion = audioState.preventExpansion === true;
                    const resetTiming = !preventExpansion;

                    console.log('[Tutorial] resetTiming:', resetTiming, 'preventExpansion:', preventExpansion);

                    if (audioState.which === 'tone1') {
                        this.exercise.audioController.playTone1(resetTiming);
                    } else if (audioState.which === 'tone2') {
                        this.exercise.audioController.playTone2(resetTiming);
                    } else if (audioState.which === 'both') {
                        this.exercise.audioController.playBoth(resetTiming);
                    }
                } else {
                    console.log('[Tutorial] Audio already playing with correct state - continuing smoothly');
                }

                this.exercise.isPlaying = true;
                this.exercise.syncAllControls();
                this.exercise.updateVisualizations();
                this.exercise.updatePlayButtonState();
                this.updateNoSoundMode();
                break;

            case 'keep':
                // Don't change audio state, just update frequencies if needed
                if (audioState.tone1 !== undefined) {
                    this.exercise.tone1Freq = audioState.tone1;
                }
                if (audioState.tone2 !== undefined) {
                    this.exercise.tone2Freq = audioState.tone2;
                }
                if (this.exercise.isPlaying) {
                    this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
                }
                this.exercise.syncAllControls();
                this.exercise.updateVisualizations();
                this.updateNoSoundMode();
                break;

            case 'animated-unison-entrance':
                // Animated entrance with staggered pattern expansion and audio fade-in
                console.log('[Tutorial] ANIMATED UNISON ENTRANCE - tone1:', audioState.tone1, 'tone2:', audioState.tone2);
                await this.handleAnimatedUnisonEntrance(audioState);
                break;

            case 'glissando':
                // Smooth frequency transition with reveal radius expansion
                console.log('[Tutorial] GLISSANDO - tone1:', audioState.tone1, 'tone2:', audioState.tone2, 'duration:', audioState.duration);
                await this.handleGlissando(audioState);
                break;
        }
    }

    async handleAnimatedUnisonEntrance(audioState) {
        // Stop any existing audio
        this.exercise.audioController.stopBoth();

        // Set frequencies
        const tone1Freq = audioState.tone1 || 440;
        const tone2Freq = audioState.tone2 || 440;
        this.exercise.tone1Freq = tone1Freq;
        this.exercise.tone2Freq = tone2Freq;
        this.exercise.audioController.setFrequencies(tone1Freq, tone2Freq);

        // Resume audio context if suspended
        if (window.audioManager?.audioContext?.state === 'suspended') {
            await window.audioManager.audioContext.resume();
        }

        // Get the interference visualization state
        const interferenceState = this.exercise.interferenceViz?.audioController?.getState();
        if (!interferenceState) {
            console.warn('[Tutorial] No interference visualization state available');
            return;
        }

        // Check if we should prevent expansion animation
        const preventExpansion = audioState.preventExpansion === true;

        // Phase 1: Start tone 1 with reveal radius expansion (unless prevented)
        const audioController = this.exercise.audioController;

        // Only set start time if we want the expansion animation
        if (!preventExpansion) {
            audioController.tone1StartTime = performance.now();
        }
        audioController.playTone1(false); // Don't reset timing, we already set it

        // Mark as playing in exercise
        this.exercise.isPlaying = true;
        this.exercise.updatePlayButtonState();

        // Phase 2: After delay, start tone 2
        const delayTone2 = audioState.delayTone2 || 2000;
        setTimeout(() => {
            // Only set start time if we want the expansion animation
            if (!preventExpansion) {
                audioController.tone2StartTime = performance.now();
            }
            audioController.playTone2(false); // Don't reset timing

            this.exercise.updatePlayButtonState();
        }, delayTone2);

        // Update UI
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();
        this.updateNoSoundMode();
    }

    async handleGlissando(audioState) {
        const audioController = this.exercise.audioController;
        const duration = audioState.duration !== undefined ? audioState.duration : 2.5;

        // Resume audio context if suspended
        if (window.audioManager?.audioContext?.state === 'suspended') {
            await window.audioManager.audioContext.resume();
        }

        // Determine which tones to glissando
        const glissandoTone1 = audioState.tone1 !== undefined;
        const glissandoTone2 = audioState.tone2 !== undefined;

        // If not playing, start playing first
        if (!audioController.isAnyPlaying()) {
            console.log('[Tutorial] Starting tones before glissando');

            // Set initial frequencies (use current if not specified)
            const tone1Freq = audioState.tone1 || this.exercise.tone1Freq;
            const tone2Freq = audioState.tone2 || this.exercise.tone2Freq;

            audioController.setFrequencies(tone1Freq, tone2Freq);
            audioController.playBoth();

            this.exercise.isPlaying = true;
            this.exercise.updatePlayButtonState();
        } else {
            // Glissando to new frequencies
            console.log('[Tutorial] Glissando from current frequencies to:', {
                tone1: audioState.tone1,
                tone2: audioState.tone2,
                duration
            });

            if (glissandoTone1 && glissandoTone2) {
                audioController.glissandoBothToFrequencies(audioState.tone1, audioState.tone2, duration);
            } else if (glissandoTone1) {
                audioController.glissandoTone1ToFrequency(audioState.tone1, duration);
            } else if (glissandoTone2) {
                audioController.glissandoTone2ToFrequency(audioState.tone2, duration);
            }

            // Update exercise frequencies
            if (audioState.tone1 !== undefined) {
                this.exercise.tone1Freq = audioState.tone1;
            }
            if (audioState.tone2 !== undefined) {
                this.exercise.tone2Freq = audioState.tone2;
            }
        }

        // Update UI
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();
        this.updateNoSoundMode();
    }

    async applySliderConfig(sliderConfig) {
        if (!sliderConfig) return;

        // Skip slider config if we're in the middle of a glissando animation
        if (this.skipSliderReset) {
            console.log('[TutorialController] Skipping slider reset during glissando');
            return;
        }

        console.log('[TutorialController] Applying slider config:', sliderConfig);

        // Use exercise's setupGlissandoSlider if available (for Unison Overview)
        if (this.exercise.setupGlissandoSlider) {
            this.exercise.setupGlissandoSlider(sliderConfig);
            return;
        }

        // Otherwise use legacy tutorialSlider (for other tutorials)
        if (this.tutorialSlider) {
            await this.tutorialSlider.initialize(sliderConfig, (isComplete) => {
                this.handleSliderCompletion(isComplete);
            });
        }
    }

    setupSliderButtonCallback(step) {
        // Always clear any existing callback first
        if (this.exercise.clearSliderButtonCallback) {
            this.exercise.clearSliderButtonCallback();
        }

        // Set up callback if step has a glissandoTarget OR exploration mode
        const hasGlissandoTarget = !!step.glissandoTarget;
        const isExplorationMode = step.sliderConfig?.explorationMode;

        if (!hasGlissandoTarget && !isExplorationMode) {
            console.log('[TutorialController] No glissandoTarget or exploration mode - slider buttons disabled');
            return;
        }

        // Set up callback for slider buttons
        if (this.exercise.setSliderButtonCallback) {
            this.exercise.setSliderButtonCallback(async (direction, size) => {
                // Prevent multiple glissandos from running simultaneously
                if (this.glissandoInProgress) {
                    console.log('[TutorialController] Glissando already in progress, ignoring click');
                    return;
                }

                console.log('[TutorialController] Slider button clicked:', { direction, size, isExplorationMode });
                this.glissandoInProgress = true;

                // Calculate glissando target
                let glissandoTarget;
                if (isExplorationMode) {
                    // Exploration mode: calculate relative target based on button
                    const currentTone2 = this.exercise.tone2Freq;

                    let clampedTone2;

                    // If hashMarks are defined, move to the next hash mark in the direction
                    if (step.sliderConfig?.hashMarks && step.sliderConfig.hashMarks.length > 0) {
                        const hashMarks = step.sliderConfig.hashMarks;
                        // Find current position in hash marks
                        const currentIndex = hashMarks.findIndex(mark => Math.abs(mark - currentTone2) < 0.5);

                        if (currentIndex !== -1) {
                            // Move to next hash mark in the direction
                            const nextIndex = currentIndex + (direction > 0 ? 1 : -1);
                            if (nextIndex >= 0 && nextIndex < hashMarks.length) {
                                clampedTone2 = hashMarks[nextIndex];
                                console.log('[TutorialController] Moving to next hash mark:', clampedTone2);
                            } else {
                                // At boundary, stay at current position
                                clampedTone2 = currentTone2;
                                console.log('[TutorialController] At boundary, staying at:', clampedTone2);
                            }
                        } else {
                            // Not at a hash mark, snap to nearest
                            clampedTone2 = hashMarks.reduce((prev, curr) =>
                                Math.abs(curr - currentTone2) < Math.abs(prev - currentTone2) ? curr : prev
                            );
                            console.log('[TutorialController] Snapping to nearest hash mark:', clampedTone2);
                        }
                    } else {
                        // No hash marks: use button size
                        const stepSize = size === 'big' ? 100 : size === 'medium' ? 50 : 20;
                        const newTone2 = currentTone2 + (direction * stepSize);
                        clampedTone2 = Math.max(220, Math.min(880, newTone2));
                    }

                    glissandoTarget = {
                        tone1: this.exercise.tone1Freq,  // Keep tone1 constant
                        tone2: clampedTone2,
                        duration: 5.0  // Slowed down from 3.0 to 5.0 seconds
                    };
                    console.log('[TutorialController] Exploration mode target:', glissandoTarget);
                } else {
                    // Progressive mode: use step's fixed target
                    glissandoTarget = step.glissandoTarget;
                }

                // Don't trigger flash effect - tones are already playing
                // Resetting tone2StartTime would cause unwanted expansion of interference visualization

                // Update text to show next step's text (without advancing step)
                // But only if this step requires progression (has disableNext flag)
                // For exploration steps, keep the current text
                if (step.disableNext && this.currentStepIndex < this.steps.length - 1 && !isExplorationMode) {
                    const nextStep = this.steps[this.currentStepIndex + 1];
                    if (nextStep && nextStep.text) {
                        this.applyTextState(nextStep.text);
                    }
                }

                // Start the glissando animation (audio + slider)
                await this.playForwardGlissando(glissandoTarget);

                // Clean up button states after glissando completes
                this.cleanupButtonStates();

                // Check for unison detection and update button states
                if (step.sliderConfig && step.sliderConfig.requireUnison) {
                    this.checkUnisonAndUpdateButtons(step);
                }

                // After glissando completes, advance to next step
                // But only if the current step has disableNext AND is NOT exploration mode
                // Exploration mode steps should allow multiple button clicks without auto-advancing
                if (this.currentStepIndex < this.steps.length - 1 && step.disableNext && !isExplorationMode) {
                    this.goToStep(this.currentStepIndex + 1, false);
                }

                this.glissandoInProgress = false;
            });
        }
    }

    handleSliderCompletion(isComplete) {
        // Enable/disable next button based on completion criteria
        const nextBtn = this.exercise.container.querySelector('[data-tutorial="next"]');
        if (!nextBtn) return;

        if (isComplete) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
            console.log('[TutorialController] Slider completion criteria met - Next button enabled');
        } else {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
            console.log('[TutorialController] Slider completion criteria not met - Next button disabled');
        }
    }

    applyButtonDisabling(step) {
        if (!step) return;

        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        // Find step-down and step-up buttons
        const stepDownBtn = textEl.querySelector('[data-tutorial-action="step-down-to-unison"]');
        const stepUpBtn = textEl.querySelector('[data-tutorial-action="step-up-tone2"]');

        // Enable all buttons by default
        if (stepDownBtn) {
            stepDownBtn.disabled = false;
            stepDownBtn.style.opacity = '1';
            stepDownBtn.style.cursor = 'pointer';
        }
        if (stepUpBtn) {
            stepUpBtn.disabled = false;
            stepUpBtn.style.opacity = '1';
            stepUpBtn.style.cursor = 'pointer';
        }

        // Apply specific disabling based on step properties
        if (step.disableUpButton && stepUpBtn) {
            stepUpBtn.disabled = true;
            stepUpBtn.style.opacity = '0.3';
            stepUpBtn.style.cursor = 'not-allowed';
        }

        if (step.disableDownButton && stepDownBtn) {
            stepDownBtn.disabled = true;
            stepDownBtn.style.opacity = '0.3';
            stepDownBtn.style.cursor = 'not-allowed';
        }
    }

    cleanupButtonStates() {
        // Clean up all glissando button states to prevent visual sticking
        const buttonSelectors = [
            '[data-glissando-slider="jump-up-big"]',
            '[data-glissando-slider="jump-up-medium"]',
            '[data-glissando-slider="jump-up-small"]',
            '[data-glissando-slider="jump-down-big"]',
            '[data-glissando-slider="jump-down-medium"]',
            '[data-glissando-slider="jump-down-small"]'
        ];

        buttonSelectors.forEach(selector => {
            const button = this.exercise.container.querySelector(selector);
            if (button) {
                // Force blur to remove focus
                button.blur();

                // Remove any active classes
                button.classList.remove('active');

                // Force repaint to clear :active pseudo-class
                void button.offsetHeight;
            }
        });
    }

    checkUnisonAndUpdateButtons(step) {
        const sliderConfig = step.sliderConfig;
        if (!sliderConfig || !sliderConfig.targetFrequency) return;

        const targetFreq = sliderConfig.targetFrequency;
        const currentFreq = this.exercise.tone2Freq;
        const unisonThreshold = 2; // Within 2 Hz is considered unison

        const isAtUnison = Math.abs(currentFreq - targetFreq) < unisonThreshold;

        // Check if this is the first time reaching unison
        if (isAtUnison && !this.unisonReachedInStep) {
            console.log('[TutorialController] Unison reached for the first time!');
            this.unisonReachedInStep = true;

            // Enable Next button
            const nextBtn = this.exercise.container.querySelector('[data-tutorial="next"]');
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
            }

            // Unlock all buttons for free exploration
            if (this.exercise.configureGlissandoButtons) {
                this.exercise.configureGlissandoButtons([
                    'big-up', 'medium-up', 'small-up',
                    'big-down', 'medium-down', 'small-down'
                ]);
            }

            // Show success message (optional)
            console.log('[TutorialController] All buttons now unlocked for exploration');
        } else if (!this.unisonReachedInStep) {
            // Not at unison yet - only enable buttons that move toward unison
            const enabledButtons = [];

            if (currentFreq < targetFreq) {
                // Need to go UP to reach unison
                enabledButtons.push('small-up');
                // Also allow the initially configured buttons if they move up
                if (sliderConfig.enabledButtons.includes('medium-up')) {
                    enabledButtons.push('medium-up');
                }
                if (sliderConfig.enabledButtons.includes('big-up')) {
                    enabledButtons.push('big-up');
                }
            } else if (currentFreq > targetFreq) {
                // Need to go DOWN to reach unison
                enabledButtons.push('small-down');
                // Also allow the initially configured buttons if they move down
                if (sliderConfig.enabledButtons.includes('medium-down')) {
                    enabledButtons.push('medium-down');
                }
                if (sliderConfig.enabledButtons.includes('big-down')) {
                    enabledButtons.push('big-down');
                }
            }

            // Update button states
            if (this.exercise.configureGlissandoButtons && enabledButtons.length > 0) {
                this.exercise.configureGlissandoButtons(enabledButtons);
            }
        }
    }

    showTutorialUI() {
        const tutorialPanel = this.exercise.container.querySelector('[data-tutorial="panel"]');
        if (tutorialPanel) {
            tutorialPanel.style.display = 'block';
        }
    }

    hideTutorialUI() {
        const tutorialPanel = this.exercise.container.querySelector('[data-tutorial="panel"]');
        if (tutorialPanel) {
            tutorialPanel.style.display = 'none';
        }
    }

    updateTutorialNavigation() {
        const prevBtn = this.exercise.container.querySelector('[data-tutorial="prev"]');
        const nextBtn = this.exercise.container.querySelector('[data-tutorial="next"]');
        const progressEl = this.exercise.container.querySelector('[data-tutorial="progress"]');

        if (prevBtn) {
            prevBtn.disabled = this.currentStepIndex === 0;
        }

        if (nextBtn) {
            const isLastStep = this.currentStepIndex === this.steps.length - 1;

            // Get current step
            const currentStep = this.steps[this.currentStepIndex];

            // Check for custom button text first, then default to Finish/Next
            if (currentStep && currentStep.customNextButtonText) {
                nextBtn.textContent = currentStep.customNextButtonText;
            } else {
                nextBtn.textContent = isLastStep ? 'Finish' : 'Next →';
            }

            // Check if current step has disableNext flag and waitForAction
            const hasDisableNext = currentStep && currentStep.disableNext === true;
            const hasWaitForAction = currentStep && currentStep.waitForAction;

            // Special case for step 1: enable if tone is playing OR if not waiting for action
            if (this.currentStepIndex === 0) {
                const isTone1Playing = this.exercise.audioController?.isTone1Playing?.();
                nextBtn.disabled = (this.waitingForAction && !isTone1Playing) || (hasDisableNext && !hasWaitForAction);
            } else {
                // If step has waitForAction, only check waitingForAction (disableNext is just for initial state)
                // Otherwise, use the disableNext flag directly
                if (hasWaitForAction) {
                    nextBtn.disabled = this.waitingForAction;
                } else {
                    nextBtn.disabled = hasDisableNext;
                }
            }

            // Add no-sound class to Next button if any tones are playing
            const isTone1Playing = this.exercise.audioController?.isTone1Playing?.() || false;
            const isTone2Playing = this.exercise.audioController?.isTone2Playing?.() || false;
            if (isTone1Playing || isTone2Playing) {
                if (!nextBtn.classList.contains('no-sound')) {
                    nextBtn.classList.add('no-sound');
                }
            } else {
                nextBtn.classList.remove('no-sound');
            }
        }

        if (progressEl) {
            progressEl.textContent = `${this.currentStepIndex + 1} / ${this.steps.length}`;
        }
    }

    flashElement(selector) {
        const element = this.exercise.container.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-flash');
            setTimeout(() => {
                element.classList.remove('tutorial-flash');
            }, 600);
        }
    }

    flashFrequencyDisplay() {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        // Flash all possible frequency display modes
        const displayModes = ['step-down', 'step-up', 'free-play'];
        for (const mode of displayModes) {
            const displayEl = textEl.querySelector(`[data-tutorial-tone2-display="${mode}"]`);
            if (displayEl) {
                displayEl.classList.add('tutorial-flash');
                setTimeout(() => {
                    displayEl.classList.remove('tutorial-flash');
                }, 600);
            }
        }
    }

    // General Interval Overview Tutorial Actions
    playInterval() {
        // Play the interval tone (tone2)
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playTone2();

            const playInterval = this.exercise.container.querySelector('[data-simple="play-interval"]');
            if (playInterval) {
                playInterval.classList.add('playing');
            }
        }

        this.updateNoSoundMode();
        this.disableInlineButton('play-interval');
        this.completeInlineAction('play-interval-inline');
    }

    playRootOnly() {
        // Toggle root tone (tone1)
        if (!this.exercise.audioController) return;

        const isTone1Playing = this.exercise.audioController.isTone1Playing?.();

        if (isTone1Playing) {
            // Stop tone1
            this.exercise.audioController.stopTone1();
        } else {
            // Play tone1
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playTone1();
        }

        // Update inline button text
        this.updateInlinePlayButton('play-root-only', !isTone1Playing);

        this.updateNoSoundMode();
    }

    playIntervalOnly() {
        // Play only the interval tone (tone2)
        if (this.exercise.audioController) {
            this.exercise.audioController.stopBoth();
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playTone2();

            const playRoot = this.exercise.container.querySelector('[data-simple="play-root"]');
            const playInterval = this.exercise.container.querySelector('[data-simple="play-interval"]');
            if (playRoot) {
                playRoot.classList.remove('playing');
            }
            if (playInterval) {
                playInterval.classList.add('playing');
            }
        }

        this.updateNoSoundMode();
    }

    playBothTones() {
        // Play both tones together
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playBoth();

            const playRoot = this.exercise.container.querySelector('[data-simple="play-root"]');
            const playInterval = this.exercise.container.querySelector('[data-simple="play-interval"]');
            if (playRoot) {
                playRoot.classList.add('playing');
            }
            if (playInterval) {
                playInterval.classList.add('playing');
            }
        }

        this.updateNoSoundMode();
        this.disableInlineButton('play-both');
        this.completeInlineAction('play-both-inline');
    }

    overlayWaves() {
        // Switch to overlay wave mode
        const overlayRadio = this.exercise.container.querySelector('[data-interval="wave-mode"][value="overlay"]');
        if (overlayRadio) {
            overlayRadio.checked = true;
            overlayRadio.dispatchEvent(new Event('change'));
        }

        // Show reveal text
        const revealEl = this.exercise.container.querySelector('[data-tutorial-reveal="waves-overlaid"]');
        if (revealEl) {
            revealEl.style.display = 'block';
            setTimeout(() => {
                revealEl.style.visibility = 'visible';
            }, 100);
        }

        this.disableInlineButton('overlay-waves');
        this.completeInlineAction('overlay-waves-inline');
    }

    overlayWavesUnison() {
        // Switch to overlay wave mode for unison exercise
        const overlayRadio = this.exercise.container.querySelector('[data-unison="wave-mode"][value="overlay"]');
        if (overlayRadio) {
            overlayRadio.checked = true;
            overlayRadio.dispatchEvent(new Event('change'));
        }

        // Also update via waveViz if available
        const waveViz = this.exercise.waveViz;
        if (waveViz && waveViz.setViewMode) {
            waveViz.setViewMode('overlay');
        }

        // Remove button and replace with new text
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (textEl) {
            const button = textEl.querySelector('[data-tutorial-action="overlay-waves-unison"]');
            if (button) {
                // Replace button with new text
                const newText = document.createElement('span');
                newText.innerHTML = "When the same waves overlap it creates a slight amplification effect, but otherwise feels the same.";
                button.parentNode.replaceChild(newText, button);
            }
        }

        this.completeInlineAction('overlay-waves-unison-inline');
    }

    showInterferencePattern() {
        // Switch to interference visualization
        const interferenceRadio = this.exercise.container.querySelector('[data-viz-select="interference"]');
        if (interferenceRadio) {
            interferenceRadio.checked = true;
            interferenceRadio.dispatchEvent(new Event('change'));
        }

        this.disableInlineButton('show-interference');

        // Auto-advance to next step
        setTimeout(() => {
            this.next();
        }, 100);
    }

    playInterval1() {
        // Play the first comparison interval (already set in tutorial step)
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playBoth();
        }

        this.updateNoSoundMode();
        this.disableInlineButton('play-interval-1');
        this.completeInlineAction('play-interval-1-inline');
    }

    playInterval2() {
        // Play the second comparison interval (target interval)
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playBoth();
        }

        // Show reveal text
        const revealEl = this.exercise.container.querySelector('[data-tutorial-reveal="target-found"]');
        if (revealEl) {
            revealEl.style.display = 'block';
            setTimeout(() => {
                revealEl.style.visibility = 'visible';
            }, 100);
        }

        this.updateNoSoundMode();
        this.disableInlineButton('play-interval-2');
        this.completeInlineAction('play-interval-2-inline');
    }

    playInterval3() {
        // Play the third comparison interval
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playBoth();
        }

        // Show reveal text
        const revealEl = this.exercise.container.querySelector('[data-tutorial-reveal="comparison-found"]');
        if (revealEl) {
            revealEl.style.display = 'block';
            setTimeout(() => {
                revealEl.style.visibility = 'visible';
            }, 100);
        }

        this.updateNoSoundMode();
        this.disableInlineButton('play-interval-3');
        this.completeInlineAction('play-interval-3-inline');
    }

    toggleRoot() {
        // Toggle root tone (tone1) on/off
        if (!this.exercise.audioController) return;

        const isTone1Playing = this.exercise.audioController.isTone1Playing?.();

        if (isTone1Playing) {
            // Stop tone1
            this.exercise.audioController.stopTone1();
        } else {
            // Play tone1
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playTone1();
        }

        // Update button text
        this.updateToggleButtonText('toggle-root', !isTone1Playing);
        this.updateNoSoundMode();
    }

    toggleInterval() {
        // Toggle interval tone (tone2) on/off
        if (!this.exercise.audioController) return;

        const isTone2Playing = this.exercise.audioController.isTone2Playing?.();

        if (isTone2Playing) {
            // Stop tone2
            this.exercise.audioController.stopTone2();
        } else {
            // Play tone2
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            this.exercise.audioController.playTone2();
        }

        // Update button text
        this.updateToggleButtonText('toggle-interval', !isTone2Playing);
        this.updateNoSoundMode();
    }

    randomizeRoot() {
        // Randomize the root note and maintain the interval
        const minFreq = 220; // A3
        const maxFreq = 660; // E5
        const newRootFreq = Math.floor(Math.random() * (maxFreq - minFreq + 1)) + minFreq;

        // Calculate the interval in semitones
        const semitones = Math.round(12 * Math.log2(this.exercise.tone2Freq / this.exercise.tone1Freq));

        // Update frequencies maintaining the interval
        this.exercise.tone1Freq = newRootFreq;
        this.exercise.tone2Freq = newRootFreq * Math.pow(2, semitones / 12);

        // Update UI and visualizations
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();

        // If tones are playing, update them
        if (this.exercise.audioController) {
            const isTone1Playing = this.exercise.audioController.isTone1Playing?.();
            const isTone2Playing = this.exercise.audioController.isTone2Playing?.();

            if (isTone1Playing || isTone2Playing) {
                this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
                if (isTone1Playing && !isTone2Playing) {
                    this.exercise.audioController.stopBoth();
                    this.exercise.audioController.playTone1();
                } else if (!isTone1Playing && isTone2Playing) {
                    this.exercise.audioController.stopBoth();
                    this.exercise.audioController.playTone2();
                } else if (isTone1Playing && isTone2Playing) {
                    this.exercise.audioController.stopBoth();
                    this.exercise.audioController.playBoth();
                }
            }
        }

        // Update button text with new frequencies
        this.updateDynamicButtonText();
    }

    playRandomInterval() {
        // Get the practice config from current step
        const currentStep = this.steps[this.currentStepIndex];
        if (!currentStep || !currentStep.practiceConfig) {
            console.warn('playRandomInterval: No practiceConfig found in current step');
            return;
        }

        const config = currentStep.practiceConfig;
        const targetProbability = config.targetProbability || 0.35;

        // Decide if this should be the target interval or a comparison
        const isTarget = Math.random() < targetProbability;

        let intervalFreq;
        if (isTarget) {
            intervalFreq = config.targetInterval;
        } else {
            // Choose a random comparison interval
            if (config.comparisonIntervals && config.comparisonIntervals.length > 0) {
                const randomIndex = Math.floor(Math.random() * config.comparisonIntervals.length);
                intervalFreq = config.comparisonIntervals[randomIndex].freq;
            } else {
                // Fallback if no comparisons available
                intervalFreq = config.targetInterval;
            }
        }

        // Set and play the interval
        this.exercise.tone2Freq = intervalFreq;

        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, intervalFreq);
            this.exercise.audioController.playBoth();
        }

        // Update UI and visualizations
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();
        this.updateNoSoundMode();
    }

    updateToggleButtonText(actionName, isPlaying) {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        const button = textEl.querySelector(`[data-tutorial-action="${actionName}"]`);
        if (button) {
            const currentText = button.textContent;
            if (isPlaying) {
                button.textContent = currentText.replace('▶', '⏸');
            } else {
                button.textContent = currentText.replace('⏸', '▶');
            }
        }
    }

    updateDynamicButtonText() {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        const toggleRootBtn = textEl.querySelector('[data-tutorial-action="toggle-root"]');
        const toggleIntervalBtn = textEl.querySelector('[data-tutorial-action="toggle-interval"]');

        if (toggleRootBtn) {
            const isPlaying = this.exercise.audioController?.isTone1Playing?.();
            const symbol = isPlaying ? '⏸' : '▶';
            toggleRootBtn.textContent = `${symbol} Root (${Math.round(this.exercise.tone1Freq)} Hz)`;
        }

        if (toggleIntervalBtn) {
            const isPlaying = this.exercise.audioController?.isTone2Playing?.();
            const symbol = isPlaying ? '⏸' : '▶';
            // Get interval name from exercise if available
            const intervalName = this.exercise.intervalName || 'Interval';
            toggleIntervalBtn.textContent = `${symbol} ${intervalName} (${Math.round(this.exercise.tone2Freq)} Hz)`;
        }
    }

    // Helper methods to manage no-sound class on buttons when tones are playing
    enableNoSoundMode() {
        // Add no-sound class to all buttons in the container to prevent click sounds
        const buttons = this.exercise.container.querySelectorAll('button');
        buttons.forEach(btn => {
            if (!btn.classList.contains('no-sound')) {
                btn.classList.add('no-sound');
                btn.dataset.tutorialNoSound = 'true'; // Track that we added it
            }
        });
    }

    disableNoSoundMode() {
        // Remove no-sound class only from buttons we added it to
        const buttons = this.exercise.container.querySelectorAll('button[data-tutorial-no-sound="true"]');
        buttons.forEach(btn => {
            btn.classList.remove('no-sound');
            delete btn.dataset.tutorialNoSound;
        });
    }

    updateNoSoundMode() {
        // Enable no-sound if any tone is playing, disable if none are playing
        if (!this.exercise.audioController) return;

        const isTone1Playing = this.exercise.audioController.isTone1Playing?.() || false;
        const isTone2Playing = this.exercise.audioController.isTone2Playing?.() || false;

        if (isTone1Playing || isTone2Playing) {
            this.enableNoSoundMode();
        } else {
            this.disableNoSoundMode();
        }
    }

    // ===========================
    // Glissando Slider Custom Interaction
    // ===========================

    handleCustomInteraction(interactionType) {
        if (!interactionType) return;

        if (interactionType === 'glissando-slider') {
            this.setupGlissandoSliderInteraction();
        }
    }

    setupGlissandoSliderInteraction() {
        // Initialize random starting frequency
        const targetFreq = 440;
        const minFreq = targetFreq / 2;  // 220 Hz (one octave below)
        const maxFreq = targetFreq * 2;  // 880 Hz (one octave above)

        // Calculate the middle 25% range where target can be
        const rangeSize = maxFreq - minFreq;
        const middleStart = minFreq + rangeSize * 0.375;  // 37.5% from bottom
        const middleEnd = minFreq + rangeSize * 0.625;    // 62.5% from bottom

        // Random starting position within valid range (avoiding the target middle 25%)
        let startingFreq;
        if (Math.random() < 0.5) {
            // Start in lower range (below middle 25%)
            startingFreq = minFreq + Math.random() * (middleStart - minFreq);
        } else {
            // Start in upper range (above middle 25%)
            startingFreq = middleEnd + Math.random() * (maxFreq - middleEnd);
        }

        // Set tone2 to starting frequency
        this.exercise.tone2Freq = startingFreq;
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();

        // Update slider position
        const slider = this.exercise.container.querySelector('[data-glissando-slider="frequency"]');
        if (slider) {
            slider.value = startingFreq;
        }

        // Set up button event listeners
        const buttons = [
            { selector: '[data-glissando-slider="jump-up-big"]', direction: 1, size: 'big' },
            { selector: '[data-glissando-slider="jump-up-small"]', direction: 1, size: 'small' },
            { selector: '[data-glissando-slider="jump-down-big"]', direction: -1, size: 'big' },
            { selector: '[data-glissando-slider="jump-down-small"]', direction: -1, size: 'small' }
        ];

        buttons.forEach(({ selector, direction, size }) => {
            const button = this.exercise.container.querySelector(selector);
            if (button) {
                button.addEventListener('click', () => {
                    this.handleGlissandoJump(direction, size);
                });
            }
        });

        // Set up slider event listener for manual adjustment
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.handleGlissandoSliderChange(parseFloat(e.target.value));
            });
        }
    }

    handleGlissandoJump(direction, size) {
        const currentFreq = this.exercise.tone2Freq;
        const targetFreq = 440;
        const jumpAmount = this.calculateGlissandoJumpAmount(size, currentFreq, targetFreq);
        const newFreq = Math.max(220, Math.min(880, currentFreq + (direction * jumpAmount)));

        // Disable all jump buttons during glissando
        this.setGlissandoButtonsEnabled(false);

        // Perform glissando to new frequency
        this.performSliderGlissando(currentFreq, newFreq, () => {
            // Re-enable buttons after glissando completes
            this.setGlissandoButtonsEnabled(true);
        });
    }

    calculateGlissandoJumpAmount(size, currentFreq, targetFreq) {
        const distanceToTarget = Math.abs(currentFreq - targetFreq);

        switch (size) {
            case 'big':
                // Random 6-10 semitones
                const bigSemitones = 6 + Math.floor(Math.random() * 5);
                return currentFreq * (Math.pow(2, bigSemitones / 12) - 1);

            case 'medium':
                // Random 1-3 semitones
                const mediumSemitones = 1 + Math.floor(Math.random() * 3);
                return currentFreq * (Math.pow(2, mediumSemitones / 12) - 1);

            case 'small':
                // Half-step down to 1 Hz, getting progressively smaller
                const halfStep = currentFreq * (Math.pow(2, 1 / 12) - 1);
                const minJump = 1;

                // Scale based on distance to target (closer = smaller jumps)
                if (distanceToTarget < 5) {
                    return Math.max(minJump, distanceToTarget * 0.5);
                } else if (distanceToTarget < 20) {
                    return Math.max(minJump, halfStep * 0.3);
                } else {
                    return halfStep;
                }

            default:
                return 0;
        }
    }

    performSliderGlissando(startFreq, endFreq, onComplete) {
        const frequencyDiff = Math.abs(endFreq - startFreq);

        // Calculate duration: 5ms per Hz difference, min 200ms, max 2000ms
        const baseDuration = Math.min(2000, Math.max(200, frequencyDiff * 5));

        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / baseDuration);

            // Ease-in-out curve for smooth glissando
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            const currentFreq = startFreq + (endFreq - startFreq) * eased;

            // Update tone2 frequency
            this.exercise.tone2Freq = currentFreq;
            this.exercise.syncAllControls();
            this.exercise.updateVisualizations();

            // Update slider position
            const slider = this.exercise.container.querySelector('[data-glissando-slider="frequency"]');
            if (slider) {
                slider.value = currentFreq;
            }

            // Update audio
            if (this.exercise.audioController) {
                this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, currentFreq);
                this.exercise.audioController.updatePlayingFrequencies();
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Final update
                this.exercise.tone2Freq = endFreq;
                this.exercise.syncAllControls();
                this.exercise.updateVisualizations();

                if (slider) {
                    slider.value = endFreq;
                }

                if (this.exercise.audioController) {
                    this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, endFreq);
                    this.exercise.audioController.updatePlayingFrequencies();
                }

                if (onComplete) {
                    onComplete();
                }
            }
        };

        requestAnimationFrame(animate);
    }

    handleGlissandoSliderChange(frequency) {
        // Update tone2 frequency
        this.exercise.tone2Freq = frequency;
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();

        // Update audio if playing
        if (this.exercise.audioController) {
            this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);
            const state = this.exercise.audioController.getState();
            if (state.isPlayingTone1 || state.isPlayingTone2) {
                this.exercise.audioController.updatePlayingFrequencies();
            }
        }

        // Handle dynamic text updates based on frequency ranges
        const currentStep = this.steps[this.currentStepIndex];
        if (currentStep && currentStep.dynamicTextRanges) {
            this.updateDynamicText(frequency, currentStep.dynamicTextRanges);
        }
    }

    /**
     * Handle listen-glissando actions for beat frequency exploration steps
     * @param {string} action - The action name (e.g., 'listen-glissando-12')
     */
    async handleListenGlissando(action) {
        const currentStep = this.steps[this.currentStepIndex];
        if (!currentStep || !currentStep.glissandoTarget) {
            console.warn('[TutorialController] No glissandoTarget found for step');
            return;
        }

        // Initialize glissando state tracking if needed
        if (!this.glissandoStates) {
            this.glissandoStates = {};
        }

        const stepKey = `step-${this.currentStepIndex}`;
        const hasPlayed = this.glissandoStates[stepKey] || false;

        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        const button = textEl?.querySelector(`[data-tutorial-action="${action}"]`);

        if (!hasPlayed) {
            // First play: Forward glissando
            await this.playForwardGlissando(currentStep.glissandoTarget);

            // Update button text to "Listen again"
            if (button) {
                button.textContent = 'Listen again';
                button.classList.remove('tutorial-btn-pulse');
            }

            // Enable Next button
            const nextBtn = this.exercise.container.querySelector('[data-tutorial="next"]');
            if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
            }

            // Mark as played
            this.glissandoStates[stepKey] = true;
        } else {
            // Subsequent plays: Reverse then forward
            this.playReverseAndForwardGlissando(currentStep);
        }
    }

    /**
     * Handle beat frequency glissando actions (new simplified version)
     */
    async handleBeatFrequencyGlissando(action) {
        const currentStep = this.steps[this.currentStepIndex];
        if (!currentStep || !currentStep.glissandoTarget) {
            console.warn('[TutorialController] No glissandoTarget found for step');
            return;
        }

        // Disable the button during glissando
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        const button = textEl?.querySelector(`[data-tutorial-action="${action}"]`);
        if (button) {
            button.disabled = true;
        }

        // Play the glissando
        await this.playForwardGlissando(currentStep.glissandoTarget);

        // Complete the inline action to enable next
        this.completeInlineAction(`${action}-inline`);
    }

    /**
     * Handle repeat beat frequency action - jump back to step 11 (index 10)
     */
    handleRepeatBeatFrequency() {
        console.log('[TutorialController] Repeating beat frequency demo from step 11');
        // Jump to step 11 (index 10 - the first beat frequency step)
        this.goToStep(10);
    }

    /**
     * Play forward glissando
     * @param {Object} glissandoTarget - Target config with tone1, tone2, duration
     */
    async playForwardGlissando(glissandoTarget) {
        const audioController = this.exercise.audioController;
        const { tone1, tone2, duration } = glissandoTarget;

        console.log('[Tutorial] Playing forward glissando:', { tone1, tone2, duration });

        // Check if tones are already playing
        const isPlaying = audioController.isAnyPlaying();

        // Get current step to access starting frequency
        const currentStep = this.steps[this.currentStepIndex];
        // If already playing, start from current frequency; otherwise use step config
        const startTone2 = isPlaying ? this.exercise.tone2Freq : (currentStep.audio?.tone2 || currentStep.sliderConfig?.initialFrequency || tone2);

        if (!isPlaying) {
            // Get starting frequencies from current step's audio config
            const startTone1 = currentStep.audio?.tone1 || tone1;

            console.log('[Tutorial] Starting tones before glissando:', { startTone1, startTone2 });

            // Start tones at starting frequency
            audioController.setFrequencies(startTone1, startTone2);
            audioController.playBoth();

            // Update exercise state
            this.exercise.isPlaying = true;
            this.exercise.updatePlayButtonState();
            this.updateNoSoundMode();

            // Wait briefly for tones to stabilize before glissando
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Now do the glissando
        audioController.glissandoBothToFrequencies(tone1, tone2, duration);

        // Animate slider during glissando
        this.animateSlider(startTone2, tone2, duration);

        // Wait for glissando to complete, then update exercise frequencies
        await new Promise(resolve => {
            setTimeout(() => {
                this.exercise.tone1Freq = tone1;
                this.exercise.tone2Freq = tone2;
                this.exercise.syncAllControls();
                this.exercise.updateVisualizations();
                resolve();
            }, duration * 1000);
        });
    }

    /**
     * Animate slider position during glissando
     * @param {number} startFreq - Starting frequency
     * @param {number} endFreq - Ending frequency
     * @param {number} duration - Duration in seconds
     */
    animateSlider(startFreq, endFreq, duration) {
        const slider = this.exercise.container.querySelector('[data-glissando-slider="frequency"]');
        if (!slider) return;

        const startTime = Date.now();
        const durationMs = duration * 1000;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / durationMs);

            // Linear interpolation for smooth animation
            const currentFreq = startFreq + (endFreq - startFreq) * progress;

            // Update slider position
            slider.value = currentFreq;

            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Play reverse glissando then forward glissando
     * @param {Object} currentStep - Current step object
     */
    async playReverseAndForwardGlissando(currentStep) {
        const audioController = this.exercise.audioController;
        const { glissandoTarget, audio } = currentStep;

        if (!audio || !glissandoTarget) return;

        const startTone1 = audio.tone1;
        const startTone2 = audio.tone2;
        const endTone1 = glissandoTarget.tone1;
        const endTone2 = glissandoTarget.tone2;
        const duration = glissandoTarget.duration;

        console.log('[Tutorial] Playing reverse + forward glissando');

        // Phase 1: Reverse to start
        audioController.glissandoBothToFrequencies(startTone1, startTone2, duration);
        this.exercise.tone1Freq = startTone1;
        this.exercise.tone2Freq = startTone2;
        this.exercise.syncAllControls();
        this.exercise.updateVisualizations();

        // Phase 2: Wait for reverse to complete, then forward
        setTimeout(() => {
            audioController.glissandoBothToFrequencies(endTone1, endTone2, duration);
            this.exercise.tone1Freq = endTone1;
            this.exercise.tone2Freq = endTone2;
            this.exercise.syncAllControls();
            this.exercise.updateVisualizations();
        }, duration * 1000 + 100); // Duration in ms + small buffer
    }

    setGlissandoButtonsEnabled(enabled) {
        const buttons = this.exercise.container.querySelectorAll('.glissando-jump-btn');
        buttons.forEach(button => {
            button.disabled = !enabled;
        });
    }
}
