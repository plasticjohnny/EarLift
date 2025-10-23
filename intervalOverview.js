/**
 * Interval Overview
 *
 * Combines Interference Visualization and Wave Visualization with unified controls.
 * Single set of tone controls, independent view toggles, and wave-specific settings.
 *
 * Dependencies:
 * - InterferenceVisualization: WebGL interference pattern visualization
 * - WaveVisualizationExercise: 2D canvas wave form visualization
 * - DualToneAudioController: Shared audio playback
 */

const CLAUDE_SELECTORS = Object.freeze({
    exit: '[data-claude="exit"]',
    playBoth: '[data-claude="play-both"]',
    randomize: '[data-claude="randomize"]',
    tone1Slider: '[data-claude="tone1-slider"]',
    tone1Input: '[data-claude="tone1-input"]',
    tone2Slider: '[data-claude="tone2-slider"]',
    tone2Input: '[data-claude="tone2-input"]',
    solfegeButtons: '[data-claude-solfege]',
    toggleInterference: '[data-claude="toggle-interference"]',
    toggleWave: '[data-claude="toggle-wave"]',
    waveMode: '[data-claude="wave-mode"]',
    waveSettingsPanel: '[data-claude="wave-settings-panel"]',
    interferenceCanvas: '[data-claude="interference-canvas"]',
    waveCanvas: '[data-claude="wave-canvas"]',
    interferencePanel: '[data-claude-panel="interference"]',
    wavePanel: '[data-claude-panel="wave"]',
    instructionContent: '[data-claude="instruction-content"]',
    instructionIndicator: '[data-claude="instruction-indicator"]',
    instructionPrev: '[data-claude="instruction-prev"]',
    instructionNext: '[data-claude="instruction-next"]'
});

const INSTRUCTIONS = [
    {
        title: "What are Musical Intervals?",
        content: "<p>A <strong>musical interval</strong> is the distance between two notes. When you play two notes together, the relationship between their frequencies creates the interval you hear.</p><p>The interval buttons below let you explore how different intervals sound and look in both visualizations.</p>"
    },
    {
        title: "Understanding Consonance & Dissonance",
        content: "<p><strong>Consonant intervals</strong> (like octaves, fifths, and fourths) have simple frequency ratios and sound stable and pleasant. Their interference patterns show regular, organized waves.</p><p><strong>Dissonant intervals</strong> (like tritones and minor seconds) have complex ratios and create tension. You'll see chaotic interference patterns with beating.</p>"
    },
    {
        title: "The Interference Visualization",
        content: "<p>The <strong>Interference Pattern</strong> shows how two sound waves interact in space. When waves overlap, they create areas of reinforcement (bright) and cancellation (dark).</p><p>Consonant intervals create beautiful, symmetric patterns. Dissonant intervals create complex, irregular patterns with visible beats.</p>"
    },
    {
        title: "The Wave Visualization",
        content: "<p>The <strong>Wave View</strong> shows the actual waveforms of each tone. You can toggle between:</p><p><strong>Side-by-Side:</strong> See each wave separately to compare their frequencies.</p><p><strong>Overlay:</strong> Watch how the waves combine, with brighter areas showing constructive interference.</p>"
    },
    {
        title: "Try It Yourself!",
        content: "<p>Click any interval button to hear and see that interval. Notice how:</p><p>• <strong>Perfect intervals</strong> (unison, octave, fifth) create simple, stable patterns</p><p>• <strong>Major/minor intervals</strong> create more complex but still regular patterns</p><p>• The <strong>tritone</strong> creates the most chaotic, unstable pattern</p><p>Experiment with the controls and observe how the visualizations change!</p>"
    }
];

// Semitones for each interval (equal temperament)
const SOLFEGE_SEMITONES = Object.freeze({
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

class IntervalOverview {
    constructor(options = {}) {
        this.container = options.container || document.getElementById('intervalOverviewExercise');

        if (!this.container) {
            console.error('IntervalOverview: container not found');
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
        // Note: initializeTutorial() is already called above (line 98)
        // Don't call initializeInstructions() - that's the old basic instruction system

        // Handle window resize
        this.handleResize = () => {
            if (this.interferenceViz && typeof this.interferenceViz.resize === 'function') {
                this.interferenceViz.resize();
            }
            if (this.waveViz && typeof this.waveViz.resize === 'function') {
                this.waveViz.resize();
            }
        };
        window.addEventListener('resize', this.handleResize);
    }

    resolveElements() {
        const resolve = (selector) => this.container.querySelector(selector);
        const resolveAll = (selector) => Array.from(this.container.querySelectorAll(selector));

        this.exitBtn = resolve(CLAUDE_SELECTORS.exit);
        this.playBothBtn = resolve(CLAUDE_SELECTORS.playBoth);
        this.randomizeBtn = resolve(CLAUDE_SELECTORS.randomize);
        this.tone1Slider = resolve(CLAUDE_SELECTORS.tone1Slider);
        this.tone1Input = resolve(CLAUDE_SELECTORS.tone1Input);
        this.tone2Slider = resolve(CLAUDE_SELECTORS.tone2Slider);
        this.tone2Input = resolve(CLAUDE_SELECTORS.tone2Input);
        this.solfegeButtons = resolveAll(CLAUDE_SELECTORS.solfegeButtons);
        this.waveModeRadios = resolveAll(CLAUDE_SELECTORS.waveMode);
        this.waveSettingsPanel = resolve(CLAUDE_SELECTORS.waveSettingsPanel);
        this.interferenceCanvas = resolve(CLAUDE_SELECTORS.interferenceCanvas);
        this.waveCanvas = resolve(CLAUDE_SELECTORS.waveCanvas);
        this.interferencePanel = resolve(CLAUDE_SELECTORS.interferencePanel);
        this.wavePanel = resolve(CLAUDE_SELECTORS.wavePanel);
        this.instructionContent = resolve(CLAUDE_SELECTORS.instructionContent);
        this.instructionIndicator = resolve(CLAUDE_SELECTORS.instructionIndicator);
        this.instructionPrev = resolve(CLAUDE_SELECTORS.instructionPrev);
        this.instructionNext = resolve(CLAUDE_SELECTORS.instructionNext);
    }

    initializeAudio() {
        if (typeof DualToneAudioController !== 'function') {
            console.error('IntervalOverview: DualToneAudioController not available');
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

                // Apply preset interference settings (use defaults for proper look)
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
                    // Use default intensity values for proper brightness
                    this.interferenceViz.settings.rootIntensity = 1.0;
                    this.interferenceViz.settings.intervalIntensity = 0.8;
                    this.interferenceViz.settings.intersectionIntensity = 1.2;
                }

                this.interferenceViz.start();
            } catch (err) {
                console.error('IntervalOverview: failed to create InterferenceVisualization', err);
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
                console.error('IntervalOverview: failed to create WaveVisualizationExercise', err);
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
                const interval = btn.getAttribute('data-claude-solfege');
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
        if (this.interferenceViz && typeof this.interferenceViz.setFrequencies === 'function') {
            this.interferenceViz.setFrequencies(this.tone1Freq, this.tone2Freq);
        }

        if (this.waveViz && typeof this.waveViz.setFrequencies === 'function') {
            this.waveViz.setFrequencies(this.tone1Freq, this.tone2Freq);
        }

        if (this.isPlaying && this.audioController) {
            this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
        }

        // Update Hz labels for interference pattern
        const hzLabels = this.container.querySelector('[data-claude="interference-hz-labels"]');
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
        const semitones = SOLFEGE_SEMITONES[interval];
        if (semitones === undefined) {
            console.warn('IntervalOverview: unknown interval', interval);
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
        // Disabled - we don't want to show the side-by-side/overlay radio buttons
        // if (this.waveSettingsPanel) {
        //     this.waveSettingsPanel.style.display = showWave ? 'flex' : 'none';
        // }

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
        // Remove window resize listener
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }

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

    initializeInstructions() {
        this.currentInstructionIndex = 0;

        // Set up navigation handlers
        if (this.instructionPrev) {
            this.instructionPrev.addEventListener('click', () => this.previousInstruction());
        }

        if (this.instructionNext) {
            this.instructionNext.addEventListener('click', () => this.nextInstruction());
        }

        // Display first instruction
        this.updateInstructionDisplay();
    }

    updateInstructionDisplay() {
        if (!this.instructionContent || !INSTRUCTIONS[this.currentInstructionIndex]) return;

        const instruction = INSTRUCTIONS[this.currentInstructionIndex];
        this.instructionContent.innerHTML = instruction.content;

        // Update indicator
        if (this.instructionIndicator) {
            this.instructionIndicator.textContent = `${this.currentInstructionIndex + 1} / ${INSTRUCTIONS.length}`;
        }

        // Update button states
        if (this.instructionPrev) {
            this.instructionPrev.disabled = this.currentInstructionIndex === 0;
        }

        if (this.instructionNext) {
            this.instructionNext.disabled = this.currentInstructionIndex === INSTRUCTIONS.length - 1;
        }
    }

    previousInstruction() {
        if (this.currentInstructionIndex > 0) {
            this.currentInstructionIndex--;
            this.updateInstructionDisplay();
        }
    }

    nextInstruction() {
        if (this.currentInstructionIndex < INSTRUCTIONS.length - 1) {
            this.currentInstructionIndex++;
            this.updateInstructionDisplay();
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

        // Interval Controls (display only, controlled by buttons)
        const intervalValue = resolve('[data-simple="interval-value"]');
        const intervalUp = resolve('[data-simple="interval-up"]');
        const intervalDown = resolve('[data-simple="interval-down"]');
        const intervalSharp = resolve('[data-simple="interval-sharp"]');
        const intervalFlat = resolve('[data-simple="interval-flat"]');
        const playInterval = resolve('[data-simple="play-interval"]');

        // Play Root (tone1 is always 440Hz) - clicking Hz display plays/pauses
        if (playRoot) {
            playRoot.addEventListener('click', () => {
                if (!this.audioController) return;

                // Don't respond if button is disabled or hidden
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
                this.tone2Freq = Math.min(2000, this.tone2Freq + 1);
                this.syncAllControls();
                this.updateVisualizations();
                this.stopAllTones();
            });
        }

        if (intervalDown) {
            intervalDown.addEventListener('click', () => {
                this.tone2Freq = Math.max(20, this.tone2Freq - 1);
                this.syncAllControls();
                this.updateVisualizations();
                this.stopAllTones();
            });
        }

        // Interval Chromatic
        if (intervalSharp) {
            intervalSharp.addEventListener('click', () => {
                this.tone2Freq = Math.min(2000, this.nextChromaticFreq(this.tone2Freq, 1));
                this.syncAllControls();
                this.updateVisualizations();
                this.stopAllTones();
            });
        }

        if (intervalFlat) {
            intervalFlat.addEventListener('click', () => {
                this.tone2Freq = Math.max(20, this.nextChromaticFreq(this.tone2Freq, -1));
                this.syncAllControls();
                this.updateVisualizations();
                this.stopAllTones();
            });
        }

        // Play Interval - clicking Hz display plays/pauses
        if (playInterval) {
            playInterval.addEventListener('click', () => {
                if (!this.audioController) return;

                // Don't respond if button is disabled or hidden
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

        if (typeof TutorialController === 'function' && typeof INTERVAL_OVERVIEW_TUTORIAL !== 'undefined') {
            this.tutorialController = new TutorialController(this, INTERVAL_OVERVIEW_TUTORIAL);

            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    prevBtn.blur();
                    this.tutorialController.prev();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    nextBtn.blur();
                    this.tutorialController.next();
                });
            }

            // Auto-start tutorial
            this.tutorialController.start();
        } else {
            console.warn('IntervalOverview: TutorialController or tutorial data not available');
        }
    }

    // Sync all controls (including simplified controls)
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

        // Remove playing class from both Hz displays
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
let intervalOverviewInstance = null;

function showIntervalOverview() {
    // Hide the main app container
    const appContainer = document.getElementById('appContainer');
    if (appContainer) {
        appContainer.style.display = 'none';
    }

    // Show the exercise container
    const container = document.getElementById('intervalOverviewExercise');
    if (container) {
        container.style.display = 'block';

        // Always create a fresh instance to avoid stale state
        if (intervalOverviewInstance) {
            intervalOverviewInstance.destroy();
        }
        intervalOverviewInstance = new IntervalOverview();
        // Make accessible globally for button sound check
        window.intervalOverviewInstance = intervalOverviewInstance;
    }
}

// Export to window
window.showIntervalOverview = showIntervalOverview;
