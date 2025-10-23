/**
 * Tutorial Controller
 *
 * Manages tutorial flow and orchestrates UI/audio/visualization state changes
 * based on tutorial step data.
 */

class TutorialController {
    constructor(intervalOverviewInstance, tutorialData) {
        this.exercise = intervalOverviewInstance;
        this.steps = tutorialData;
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
    }

    start() {
        this.isActive = true;
        this.saveOriginalStates();
        this.goToStep(0);
        this.showTutorialUI();
    }

    stop() {
        this.isActive = false;
        this.restoreOriginalStates();
        this.hideTutorialUI();
    }

    goToStep(stepIndex, isBackNavigation = false) {
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

        this.currentStepIndex = stepIndex;
        const step = this.steps[stepIndex];

        this.clearAllStates();
        this.applyTextState(step.text);
        this.applyUIState(step.ui);
        this.applyVizState(step.viz);
        this.applyWaveModeState(step.waveMode);
        this.applyAudioState(step.audio);
        this.setupWaitForAction(step.waitForAction);
        this.updateTutorialNavigation();
    }

    next() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.goToStep(this.currentStepIndex + 1, false);
        } else {
            this.finish();
        }
    }

    prev() {
        if (this.currentStepIndex > 0) {
            // Pop the last state from history when going back
            if (this.stateHistory.length > 0) {
                this.stateHistory.pop();
            }
            this.goToStep(this.currentStepIndex - 1, true);
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
    }

    applyTextState(text) {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (textEl) {
            // Add fade-in animation class
            textEl.classList.add('tutorial-text-fade-in');

            textEl.innerHTML = text;

            // Set up inline button listeners
            this.setupInlineButtons();

            // Remove animation class after animation completes
            setTimeout(() => {
                textEl.classList.remove('tutorial-text-fade-in');
            }, 600);
        }
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
        const targetFreq = this.exercise.tone1Freq || 440;
        const minFreq = 400; // Allow going below unison for exploration

        if (this.exercise.tone2Freq > minFreq) {
            this.exercise.tone2Freq = Math.max(minFreq, this.exercise.tone2Freq - 1);
            this.exercise.syncAllControls();
            this.exercise.updateVisualizations();

            this.updateBeatFrequencyFeedback();

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

            // Check if we've reached unison (but don't disable buttons)
            if (this.exercise.tone2Freq <= targetFreq && !this.unisonReached) {
                // Mark that unison has been reached (only once)
                this.unisonReached = true;

                // Reveal the completion text
                this.revealText('stepped-down');

                // Complete the inline action
                this.completeInlineAction('step-down-to-unison-inline');
            }
        }
    }

    stepUpTone2() {
        // Increase tone2 frequency by 1 Hz
        const maxFreq = 500; // Allow exploration up to 500 Hz

        if (this.exercise.tone2Freq < maxFreq) {
            this.exercise.tone2Freq = Math.min(maxFreq, this.exercise.tone2Freq + 1);
            this.exercise.syncAllControls();
            this.exercise.updateVisualizations();

            this.updateBeatFrequencyFeedback();

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
        }
    }

    updateBeatFrequencyFeedback() {
        const textEl = this.exercise.container.querySelector('[data-tutorial="text"]');
        if (!textEl) return;

        // Update Hz display
        const displayEl = textEl.querySelector('[data-tutorial-tone2-display="step-down"]');
        if (displayEl) {
            displayEl.textContent = `${Math.round(this.exercise.tone2Freq)} Hz`;
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

        // Trigger the wait action completion
        this.completeInlineAction('show-interference-inline');
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
        // Play both tones at the same frequency (unison)
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

        // Disable the button after clicking
        this.disableInlineButton('play-unison');

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

        // Track action count for steps that require multiple plays (reuse step variable from above)
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

    applyAudioState(audioState) {
        if (!audioState || !this.exercise.audioController) return;

        const action = audioState.action;

        switch (action) {
            case 'stop':
                this.exercise.audioController.stopBoth();
                this.exercise.isPlaying = false;
                this.exercise.updatePlayButtonState();
                break;

            case 'set':
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
                if (audioState.tone1 !== undefined) {
                    this.exercise.tone1Freq = audioState.tone1;
                }
                if (audioState.tone2 !== undefined) {
                    this.exercise.tone2Freq = audioState.tone2;
                }
                this.exercise.audioController.setFrequencies(this.exercise.tone1Freq, this.exercise.tone2Freq);

                if (audioState.which === 'tone1') {
                    this.exercise.audioController.playTone1();
                } else if (audioState.which === 'tone2') {
                    this.exercise.audioController.playTone2();
                } else if (audioState.which === 'both') {
                    this.exercise.audioController.playBoth();
                }

                this.exercise.isPlaying = true;
                this.exercise.syncAllControls();
                this.exercise.updateVisualizations();
                this.exercise.updatePlayButtonState();
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
                break;
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
            nextBtn.textContent = isLastStep ? 'Finish' : 'Next →';

            // Special case for step 1: enable if tone is playing OR if not waiting for action
            if (this.currentStepIndex === 0) {
                const isTone1Playing = this.exercise.audioController?.isTone1Playing?.();
                nextBtn.disabled = this.waitingForAction && !isTone1Playing;
            } else {
                // Disable Next button if waiting for user action
                nextBtn.disabled = this.waitingForAction;
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

    showInterferencePattern() {
        // Switch to interference visualization
        const interferenceRadio = this.exercise.container.querySelector('[data-viz-select="interference"]');
        if (interferenceRadio) {
            interferenceRadio.checked = true;
            interferenceRadio.dispatchEvent(new Event('change'));
        }

        this.disableInlineButton('show-interference');
        this.completeInlineAction('show-interference-inline');
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
}
