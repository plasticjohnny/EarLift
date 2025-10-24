/**
 * Unison Overview
 *
 * Combines Interference Visualization and Wave Visualization with unified controls.
 * Based on Interval Overview but focused on unison exercises.
 *
 * Dependencies:
 * - InterferenceVisualization: WebGL interference pattern visualization
 * - WaveVisualizationExercise: 2D canvas wave form visualization
 * - DualToneAudioController: Shared audio playback
 */

const UNISON_SELECTORS = Object.freeze({
    exit: '[data-unison="exit"]',
    playBoth: '[data-unison="play-both"]',
    randomize: '[data-unison="randomize"]',
    tone1Slider: '[data-unison="tone1-slider"]',
    tone1Input: '[data-unison="tone1-input"]',
    tone2Slider: '[data-unison="tone2-slider"]',
    tone2Input: '[data-unison="tone2-input"]',
    solfegeButtons: '[data-unison-solfege]',
    toggleInterference: '[data-unison="toggle-interference"]',
    toggleWave: '[data-unison="toggle-wave"]',
    waveMode: '[data-unison="wave-mode"]',
    waveSettingsPanel: '[data-unison="wave-settings-panel"]',
    interferenceCanvas: '[data-unison="interference-canvas"]',
    waveCanvas: '[data-unison="wave-canvas"]',
    interferencePanel: '[data-unison-panel="interference"]',
    wavePanel: '[data-unison-panel="wave"]'
});

// Semitones for each interval (equal temperament)
const UNISON_SOLFEGE_SEMITONES = Object.freeze({
    'unison': 0,
    'minor-second': 1,
    'major-second': 2,
    'minor-third': 3,
    'major-third': 4,
    'fourth': 5,
    'tritone': 6,
    'fifth': 7,
    'minor-sixth': 8,
    'major-sixth': 9,
    'minor-seventh': 10,
    'major-seventh': 11,
    'octave': 12
});

class UnisonOverview {
    constructor(options = {}) {
        this.container = options.container || document.getElementById('unisonOverviewExercise');

        if (!this.container) {
            console.error('UnisonOverview: container not found');
            return;
        }

        // Collect DOM elements
        this.resolveElements();

        // Initialize state
        this.tone1Freq = 440;
        this.tone2Freq = 660;
        this.isPlaying = false;

        // Initialize components
        this.initializeAudio();
        this.initializeVisualizations();
        this.initializeControls();
        this.initializeSimplifiedControls();
        this.initializeTutorial();

        // Apply initial state
        this.syncAllControls();
        this.updateVisualizations();
        this.updateVisibility();
        this.updatePlayButtonState();
    }

    resolveElements() {
        const resolve = (selector) => this.container.querySelector(selector);
        const resolveAll = (selector) => Array.from(this.container.querySelectorAll(selector));

        this.exitBtn = resolve(UNISON_SELECTORS.exit);
        this.playBothBtn = resolve(UNISON_SELECTORS.playBoth);
        this.randomizeBtn = resolve(UNISON_SELECTORS.randomize);
        this.tone1Slider = resolve(UNISON_SELECTORS.tone1Slider);
        this.tone1Input = resolve(UNISON_SELECTORS.tone1Input);
        this.tone2Slider = resolve(UNISON_SELECTORS.tone2Slider);
        this.tone2Input = resolve(UNISON_SELECTORS.tone2Input);
        this.solfegeButtons = resolveAll(UNISON_SELECTORS.solfegeButtons);
        this.waveModeRadios = resolveAll(UNISON_SELECTORS.waveMode);
        this.waveSettingsPanel = resolve(UNISON_SELECTORS.waveSettingsPanel);
        this.interferenceCanvas = resolve(UNISON_SELECTORS.interferenceCanvas);
        this.waveCanvas = resolve(UNISON_SELECTORS.waveCanvas);
        this.interferencePanel = resolve(UNISON_SELECTORS.interferencePanel);
        this.wavePanel = resolve(UNISON_SELECTORS.wavePanel);
    }

    initializeAudio() {
        if (typeof DualToneAudioController !== 'function') {
            console.error('UnisonOverview: DualToneAudioController not available');
            return;
        }
        this.audioController = new DualToneAudioController();
    }

    initializeVisualizations() {
        // Initialize Interference Visualization
        if (typeof InterferenceVisualization === 'function' && this.interferenceCanvas) {
            try {
                this.interferenceViz = new InterferenceVisualization({
                    container: this.interferencePanel,
                    canvas: this.interferenceCanvas,
                    audioController: this.audioController,
                    alwaysShowWaves: true,
                    selectors: {
                        exit: null,
                        playBoth: null,
                        playTone1: null,
                        playTone2: null,
                        randomize: null,
                        tone1Slider: null,
                        tone1Input: null,
                        tone2Slider: null,
                        tone2Input: null,
                        solfegeButtons: null,
                        presetButtons: null,
                        rootCycleButtons: null,
                        rootSelect: null,
                        rootOctave: null,
                        colorSpectrum: null,
                        pianoSpectrum: null,
                        copySettings: null
                    }
                });

                // Apply preset interference settings
                if (this.interferenceViz?.settings) {
                    this.interferenceViz.settings.useBoundary = true;
                    this.interferenceViz.settings.useFoggyEdge = false;
                    // Scale boundary radius based on canvas height (the limiting dimension)
                    // Speakers at 1/3 from edges, radius should be 0.8 * (1/3 of width)
                    const canvasWidth = this.interferenceCanvas?.width || 1200;
                    this.interferenceViz.settings.boundaryRadius = Math.round(canvasWidth * (1/3) * 0.8);
                    this.interferenceViz.settings.gravityWell = true;
                    this.interferenceViz.settings.gravityStrength = 170;
                    this.interferenceViz.settings.gravityWellCount = 5;
                    this.interferenceViz.settings.gravityVariant5 = true;
                    this.interferenceViz.settings.rootIntensity = 1.0;
                    this.interferenceViz.settings.intervalIntensity = 0.8;
                    this.interferenceViz.settings.intersectionIntensity = 1.2;
                }

                this.interferenceViz.start();
            } catch (err) {
                console.error('UnisonOverview: failed to create InterferenceVisualization', err);
                this.interferenceViz = null;
            }
        }

        // Initialize Wave Visualization
        if (typeof WaveVisualizationExercise === 'function' && this.waveCanvas) {
            try {
                this.waveViz = new WaveVisualizationExercise({
                    container: this.wavePanel,
                    canvas: this.waveCanvas,
                    audioController: this.audioController,
                    tone1Freq: this.tone1Freq,
                    tone2Freq: this.tone2Freq,
                    viewMode: 'side-by-side',
                    selectors: {
                        exit: null,
                        playBoth: null,
                        playTone1: null,
                        playTone2: null,
                        randomize: null,
                        tone1Slider: null,
                        tone1Input: null,
                        tone2Slider: null,
                        tone2Input: null,
                        solfegeButtons: null
                    }
                });

                this.waveViz.start();
            } catch (err) {
                console.error('UnisonOverview: failed to create WaveVisualizationExercise', err);
                this.waveViz = null;
            }
        }
    }

    initializeControls() {
        // Exit button
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => this.handleExit());
        }

        // Play/Stop button
        if (this.playBothBtn) {
            this.playBothBtn.addEventListener('click', () => this.handlePlayStop());
        }

        // Randomize button
        if (this.randomizeBtn) {
            this.randomizeBtn.addEventListener('click', () => this.handleRandomize());
        }

        // Tone 1 controls
        if (this.tone1Slider) {
            this.tone1Slider.addEventListener('input', (e) => {
                this.handleTone1Change(parseFloat(e.target.value));
            });
        }

        if (this.tone1Input) {
            this.tone1Input.addEventListener('input', (e) => {
                const freq = parseFloat(e.target.value);
                if (!isNaN(freq) && freq > 0) {
                    this.handleTone1Change(freq);
                }
            });
            this.tone1Input.addEventListener('blur', () => {
                this.syncTone1Controls(this.tone1Freq);
            });
        }

        // Tone 2 controls
        if (this.tone2Slider) {
            this.tone2Slider.addEventListener('input', (e) => {
                this.handleTone2Change(parseFloat(e.target.value));
            });
        }

        if (this.tone2Input) {
            this.tone2Input.addEventListener('input', (e) => {
                const freq = parseFloat(e.target.value);
                if (!isNaN(freq) && freq > 0) {
                    this.handleTone2Change(freq);
                }
            });
            this.tone2Input.addEventListener('blur', () => {
                this.syncTone2Controls(this.tone2Freq);
            });
        }

        // Solfege buttons
        this.solfegeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const interval = btn.getAttribute('data-unison-solfege');
                this.handleSolfege(interval);
            });
        });

        // Visualization selection radio buttons
        const vizSelectRadios = Array.from(this.container.querySelectorAll('[data-viz-select]'));
        vizSelectRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateVisibility());
        });

        // Wave mode toggles
        this.waveModeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && this.waveViz) {
                    this.waveViz.setViewMode(e.target.value);
                }
            });
        });
    }

    handleTone1Change(freq) {
        this.tone1Freq = freq;
        this.syncTone1Controls(freq);
        this.updateVisualizations();
    }

    handleTone2Change(freq) {
        this.tone2Freq = freq;
        this.syncTone2Controls(freq);
        this.updateVisualizations();
    }

    syncTone1Controls(freq) {
        if (this.tone1Slider) this.tone1Slider.value = freq;
        if (this.tone1Input) this.tone1Input.value = Math.round(freq * 100) / 100;
    }

    syncTone2Controls(freq) {
        if (this.tone2Slider) this.tone2Slider.value = freq;
        if (this.tone2Input) this.tone2Input.value = Math.round(freq * 100) / 100;
    }

    syncAllControls() {
        this.syncTone1Controls(this.tone1Freq);
        this.syncTone2Controls(this.tone2Freq);
        this.syncSimplifiedControls();
    }

    updateVisualizations() {
        // Only show interference pattern when audio is playing
        const audioState = this.audioController ? this.audioController.getState() : null;
        const isAnyTonePlaying = audioState && (audioState.isPlayingTone1 || audioState.isPlayingTone2);

        if (this.interferenceViz && typeof this.interferenceViz.setFrequencies === 'function') {
            // Pass updateAudio: false to prevent audio playback from visualization
            this.interferenceViz.setFrequencies(this.tone1Freq, this.tone2Freq, { updateAudio: false });

            // Stop animation if no tones are playing
            if (!isAnyTonePlaying && typeof this.interferenceViz.stop === 'function') {
                this.interferenceViz.stop();
            }
        }

        if (this.waveViz && typeof this.waveViz.setFrequencies === 'function') {
            // Pass updateAudio: false to prevent audio playback from visualization
            this.waveViz.setFrequencies(this.tone1Freq, this.tone2Freq, { updateAudio: false });
        }

        if (this.isPlaying && this.audioController) {
            this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
        }

        // Update Hz labels for interference pattern
        const hzLabels = this.container.querySelector('[data-unison="interference-hz-labels"]');
        if (hzLabels) {
            hzLabels.textContent = `(${Math.round(this.tone1Freq)} Hz / ${Math.round(this.tone2Freq)} Hz)`;
        }
    }

    handlePlayStop() {
        if (!this.audioController) return;

        if (this.isPlaying) {
            this.audioController.stopBoth();
            this.isPlaying = false;
        } else {
            this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
            this.audioController.playBoth();
            this.isPlaying = true;
        }

        this.updatePlayButtonState();
    }

    updatePlayButtonState() {
        if (!this.playBothBtn) return;

        if (this.isPlaying) {
            this.playBothBtn.textContent = '⏸ Stop';
            this.playBothBtn.classList.add('playing');
        } else {
            this.playBothBtn.textContent = '▶ Play Both';
            this.playBothBtn.classList.remove('playing');
        }
    }

    handleRandomize() {
        // Generate random frequencies between 100-1000 Hz
        this.tone1Freq = Math.floor(Math.random() * 900) + 100;
        this.tone2Freq = Math.floor(Math.random() * 900) + 100;

        this.syncAllControls();
        this.updateVisualizations();
    }

    handleSolfege(interval) {
        const semitones = UNISON_SOLFEGE_SEMITONES[interval];
        if (semitones === undefined) {
            console.warn('UnisonOverview: unknown interval', interval);
            return;
        }

        // Calculate frequency using equal temperament: freq * 2^(semitones/12)
        this.tone2Freq = this.tone1Freq * Math.pow(2, semitones / 12);
        this.syncTone2Controls(this.tone2Freq);
        this.updateVisualizations();

        // Auto-play the interval
        if (this.audioController) {
            this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
            this.audioController.playBoth();
            this.isPlaying = true;
            this.updatePlayButtonState();
        }
    }

    updateVisibility() {
        // Get selected visualization from radio buttons
        const selectedViz = this.container.querySelector('[data-viz-select]:checked')?.dataset?.vizSelect || 'none';

        const showInterference = selectedViz === 'interference';
        const showWave = selectedViz === 'wave';

        // Toggle panel visibility (only one or none can be visible)
        if (this.interferencePanel) {
            this.interferencePanel.style.display = showInterference ? 'block' : 'none';
        }

        if (this.wavePanel) {
            this.wavePanel.style.display = showWave ? 'block' : 'none';
        }

        // Show/hide wave settings panel
        if (this.waveSettingsPanel) {
            this.waveSettingsPanel.style.display = showWave ? 'flex' : 'none';
        }

        // Trigger resize on visible visualizations
        setTimeout(() => {
            if (showInterference && this.interferenceViz && typeof this.interferenceViz.resize === 'function') {
                this.interferenceViz.resize();
                // Recalculate boundary radius after resize to ensure correct sizing
                this.updateInterferenceBoundary();
            }
            if (showWave && this.waveViz && typeof this.waveViz.resize === 'function') {
                this.waveViz.resize();
            }
        }, 100);
    }

    updateInterferenceBoundary() {
        if (!this.interferenceViz || !this.interferenceCanvas) return;

        // Speakers at 1/3 from edges, radius should be 0.8 * (1/3 of width)
        const canvasWidth = this.interferenceCanvas.width || 1200;
        const newBoundaryRadius = Math.round(canvasWidth * (1/3) * 0.8);

        if (this.interferenceViz.settings) {
            this.interferenceViz.settings.boundaryRadius = newBoundaryRadius;
        }
    }

    handleExit() {
        this.destroy();

        // Show the main app container
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.display = 'block';
        }

        // Hide this exercise container
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    destroy() {
        // Stop audio
        if (this.audioController) {
            this.audioController.stopBoth();
            if (typeof this.audioController.destroy === 'function') {
                this.audioController.destroy();
            }
        }

        // Destroy visualizations
        if (this.interferenceViz && typeof this.interferenceViz.destroy === 'function') {
            this.interferenceViz.destroy();
        }

        if (this.waveViz && typeof this.waveViz.destroy === 'function') {
            this.waveViz.destroy();
        }
    }

    // Chromatic Scale Logic
    nextChromaticFreq(freq, direction) {
        const A4 = 440;
        const semitones = Math.round(12 * Math.log2(freq / A4));
        const nextSemitones = semitones + direction; // +1 or -1
        return A4 * Math.pow(2, nextSemitones / 12);
    }

    // Initialize Simplified Controls
    initializeSimplifiedControls() {
        const resolve = (selector) => this.container.querySelector(selector);

        // Root is always 440Hz - no controls needed
        const playRoot = resolve('[data-simple="play-root"]');

        // Interval Controls
        const intervalValue = resolve('[data-simple="interval-value"]');
        const intervalUp = resolve('[data-simple="interval-up"]');
        const intervalDown = resolve('[data-simple="interval-down"]');
        const intervalSharp = resolve('[data-simple="interval-sharp"]');
        const intervalFlat = resolve('[data-simple="interval-flat"]');
        const playInterval = resolve('[data-simple="play-interval"]');

        // Play Root
        if (playRoot) {
            playRoot.addEventListener('click', () => {
                if (!this.audioController) return;

                if (playRoot.disabled || playRoot.classList.contains('tutorial-hidden')) return;

                const isTone1Playing = this.audioController.isTone1Playing?.();
                if (isTone1Playing) {
                    this.audioController.stopTone1();
                    playRoot.classList.remove('playing');
                } else {
                    this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
                    this.audioController.playTone1();
                    playRoot.classList.add('playing');
                }
            });
        }

        // Interval Arrows
        if (intervalUp) {
            intervalUp.addEventListener('click', () => {
                // Don't play if tones are already playing
                const isAnyTonePlaying = this.audioController && (
                    this.audioController.isTone1Playing?.() ||
                    this.audioController.isTone2Playing?.()
                );

                this.tone2Freq = Math.min(2000, this.tone2Freq + 1);
                this.syncAllControls();
                this.updateVisualizations();

                if (!isAnyTonePlaying) {
                    this.stopAllTones();
                }
            });
        }

        if (intervalDown) {
            intervalDown.addEventListener('click', () => {
                // Don't play if tones are already playing
                const isAnyTonePlaying = this.audioController && (
                    this.audioController.isTone1Playing?.() ||
                    this.audioController.isTone2Playing?.()
                );

                this.tone2Freq = Math.max(20, this.tone2Freq - 1);
                this.syncAllControls();
                this.updateVisualizations();

                if (!isAnyTonePlaying) {
                    this.stopAllTones();
                }
            });
        }

        // Interval Chromatic
        if (intervalSharp) {
            intervalSharp.addEventListener('click', () => {
                // Don't play if tones are already playing
                const isAnyTonePlaying = this.audioController && (
                    this.audioController.isTone1Playing?.() ||
                    this.audioController.isTone2Playing?.()
                );

                this.tone2Freq = Math.min(2000, this.nextChromaticFreq(this.tone2Freq, 1));
                this.syncAllControls();
                this.updateVisualizations();

                if (!isAnyTonePlaying) {
                    this.stopAllTones();
                }
            });
        }

        if (intervalFlat) {
            intervalFlat.addEventListener('click', () => {
                // Don't play if tones are already playing
                const isAnyTonePlaying = this.audioController && (
                    this.audioController.isTone1Playing?.() ||
                    this.audioController.isTone2Playing?.()
                );

                this.tone2Freq = Math.max(20, this.nextChromaticFreq(this.tone2Freq, -1));
                this.syncAllControls();
                this.updateVisualizations();

                if (!isAnyTonePlaying) {
                    this.stopAllTones();
                }
            });
        }

        // Play Interval
        if (playInterval) {
            playInterval.addEventListener('click', () => {
                if (!this.audioController) return;

                if (playInterval.disabled || playInterval.classList.contains('tutorial-hidden')) return;

                const isTone2Playing = this.audioController.isTone2Playing?.();
                if (isTone2Playing) {
                    this.audioController.stopTone2();
                    playInterval.classList.remove('playing');
                } else {
                    this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
                    this.audioController.playTone2();
                    playInterval.classList.add('playing');
                }
            });
        }
    }

    // Initialize Tutorial
    initializeTutorial() {
        const resolve = (selector) => this.container.querySelector(selector);

        const prevBtn = resolve('[data-tutorial="prev"]');
        const nextBtn = resolve('[data-tutorial="next"]');

        if (typeof TutorialController === 'function' && typeof UNISON_OVERVIEW_TUTORIAL !== 'undefined') {
            this.tutorialController = new TutorialController(this, UNISON_OVERVIEW_TUTORIAL);

            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from bubbling to global click handler
                    e.stopImmediatePropagation(); // Stop other handlers on same element

                    // Add visual flash effect
                    prevBtn.style.transition = 'filter 0.08s ease, transform 0.08s ease';
                    prevBtn.style.filter = 'brightness(2.0)';
                    prevBtn.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        prevBtn.style.filter = 'brightness(1)';
                        prevBtn.style.transform = 'scale(1)';
                    }, 80);

                    prevBtn.blur();
                    this.tutorialController.prev();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from bubbling to global click handler
                    e.stopImmediatePropagation(); // Stop other handlers on same element

                    // Add visual flash effect
                    nextBtn.style.transition = 'filter 0.08s ease, transform 0.08s ease';
                    nextBtn.style.filter = 'brightness(2.0)';
                    nextBtn.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        nextBtn.style.filter = 'brightness(1)';
                        nextBtn.style.transform = 'scale(1)';
                    }, 80);

                    nextBtn.blur();
                    this.tutorialController.next();
                });
            }

            // Auto-start tutorial
            this.tutorialController.start();
        } else {
            console.warn('UnisonOverview: TutorialController or tutorial data not available');
        }
    }

    // Sync simplified controls
    syncSimplifiedControls() {
        const playRoot = this.container.querySelector('[data-simple="play-root"]');
        const intervalValue = this.container.querySelector('[data-simple="interval-value"]');

        if (playRoot) {
            playRoot.textContent = `${Math.round(this.tone1Freq)} Hz`;
        }

        if (intervalValue) {
            intervalValue.textContent = Math.round(this.tone2Freq);
        }
    }

    // Stop all tones and update UI
    stopAllTones() {
        if (this.audioController) {
            this.audioController.stopBoth();
        }

        const playRoot = this.container.querySelector('[data-simple="play-root"]');
        const playInterval = this.container.querySelector('[data-simple="play-interval"]');

        if (playRoot) {
            playRoot.classList.remove('playing');
        }
        if (playInterval) {
            playInterval.classList.remove('playing');
        }

        this.isPlaying = false;
        this.updatePlayButtonState();
    }
}

// Global instance
let unisonOverviewInstance = null;

function showUnisonOverview() {
    // Hide the main app container
    const appContainer = document.getElementById('appContainer');
    if (appContainer) {
        appContainer.style.display = 'none';
    }

    // Show the exercise container
    const container = document.getElementById('unisonOverviewExercise');
    if (container) {
        container.style.display = 'block';

        // Always create a fresh instance to avoid stale state
        if (unisonOverviewInstance) {
            unisonOverviewInstance.destroy();
        }
        unisonOverviewInstance = new UnisonOverview();
        window.unisonOverviewInstance = unisonOverviewInstance;
    }
}
