/**
 * Combined Visualization Exercise
 *
 * Hosts both the InterferenceVisualization and WaveVisualizationExercise
 * and synchronizes their tone controls inside a single exercise view.
 */

class CombinedVisualizationExercise {
    constructor() {
        this.container = document.getElementById('combinedVisualizationExercise');
        if (!this.container) {
            console.error('CombinedVisualizationExercise: container not found');
            return;
        }

        if (typeof InterferenceVisualization !== 'function' || typeof WaveVisualizationExercise !== 'function') {
            console.error('CombinedVisualizationExercise: required visualization classes are missing');
            return;
        }

        this.interferenceRoot = this.container.querySelector('[data-combined-panel="interference"]');
        this.waveRoot = this.container.querySelector('[data-combined-panel="wave"]');

        if (!this.interferenceRoot || !this.waveRoot) {
            console.error('CombinedVisualizationExercise: panel roots not found');
            return;
        }

        this.sharedControls = this.collectSharedControls();
        this.isRunning = false;
        this.audioController = (typeof DualToneAudioController === 'function')
            ? new DualToneAudioController()
            : null;

        this.interferenceViz = this.createInterferenceViz();
        this.waveViz = this.createWaveViz();

        this.currentFrequencies = {
            root: this.readInitialFrequency(this.sharedControls.tone1Input, this.sharedControls.tone1Slider, 440),
            interval: this.readInitialFrequency(this.sharedControls.tone2Input, this.sharedControls.tone2Slider, 660)
        };

        this.initializeSharedControls();
        this.setFrequencies(this.currentFrequencies.root, this.currentFrequencies.interval, { updateAudio: false });
        this.applyVisibilitySettings();
        this.updatePlayButtonState();

        this.exitBtn = this.container.querySelector('[data-combined="exit"]');
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => this.handleExit());
        }
    }

    collectSharedControls() {
        return {
            playBothBtn: this.container.querySelector('[data-combined-control="play-both"]'),
            randomizeBtn: this.container.querySelector('[data-combined-control="randomize"]'),
            tone1Slider: this.container.querySelector('[data-combined-control="tone1-slider"]'),
            tone1Input: this.container.querySelector('[data-combined-control="tone1-input"]'),
            tone2Slider: this.container.querySelector('[data-combined-control="tone2-slider"]'),
            tone2Input: this.container.querySelector('[data-combined-control="tone2-input"]'),
            toggleInterference: this.container.querySelector('[data-combined-control="toggle-interference"]'),
            toggleWave: this.container.querySelector('[data-combined-control="toggle-wave"]'),
            solfegeButtons: Array.from(this.container.querySelectorAll('[data-combined-solfege]'))
        };
    }

    createInterferenceViz() {
        try {
            const viz = new InterferenceVisualization({
                container: this.interferenceRoot,
                audioController: this.audioController || undefined,
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
            if (viz && viz.settings) {
                viz.settings.useBoundary = true;
                viz.settings.useFoggyEdge = false;
                viz.settings.boundaryRadius = 260;
                viz.settings.gravityWell = true;
                viz.settings.gravityStrength = 170;
                viz.settings.gravityWellCount = 5;
                viz.settings.gravityVariant5 = true;
                viz.settings.rootIntensity = 1.6;
                viz.settings.intervalIntensity = 1.3;
                viz.settings.intersectionIntensity = 1.9;
            }
            return viz;
        } catch (err) {
            console.error('CombinedVisualizationExercise: failed to create InterferenceVisualization', err);
            return null;
        }
    }

    createWaveViz() {
        try {
            return new WaveVisualizationExercise({
                container: this.waveRoot,
                audioController: this.audioController || undefined,
                selectors: {
                    exit: null,
                    playBoth: null,
                    randomize: null,
                    playTone1: null,
                    playTone2: null,
                    tone1Slider: null,
                    tone1Input: null,
                    tone2Slider: null,
                    tone2Input: null,
                    solfegeButtons: null
                }
            });
        } catch (err) {
            console.error('CombinedVisualizationExercise: failed to create WaveVisualizationExercise', err);
            return null;
        }
    }

    readInitialFrequency(numberInput, sliderInput, fallback) {
        const fromNumber = this.parseFrequency(numberInput ? numberInput.value : null);
        if (fromNumber) return fromNumber;
        const fromSlider = this.parseFrequency(sliderInput ? sliderInput.value : null);
        if (fromSlider) return fromSlider;
        return fallback;
    }

    initializeSharedControls() {
        const {
            tone1Slider,
            tone1Input,
            tone2Slider,
            tone2Input,
            playBothBtn,
            randomizeBtn,
            toggleInterference,
            toggleWave,
            solfegeButtons
        } = this.sharedControls;

        if (tone1Slider) {
            tone1Slider.addEventListener('input', (event) => {
                const value = this.parseFrequency(event.target.value);
                if (value) {
                    this.handleRootChange(value);
                }
            });
        }

        if (tone1Input) {
            tone1Input.addEventListener('input', (event) => {
                const value = this.parseFrequency(event.target.value);
                if (value && this.isWithinBounds(value, tone1Slider, tone1Input)) {
                    this.handleRootChange(value);
                }
            });
            tone1Input.addEventListener('blur', () => {
                this.updateControlValues(this.currentFrequencies.root, this.currentFrequencies.interval);
            });
        }

        if (tone2Slider) {
            tone2Slider.addEventListener('input', (event) => {
                const value = this.parseFrequency(event.target.value);
                if (value) {
                    this.handleIntervalChange(value);
                }
            });
        }

        if (tone2Input) {
            tone2Input.addEventListener('input', (event) => {
                const value = this.parseFrequency(event.target.value);
                if (value && this.isWithinBounds(value, tone2Slider, tone2Input)) {
                    this.handleIntervalChange(value);
                }
            });
            tone2Input.addEventListener('blur', () => {
                this.updateControlValues(this.currentFrequencies.root, this.currentFrequencies.interval);
            });
        }

        if (playBothBtn && this.audioController) {
            playBothBtn.addEventListener('click', () => {
                if (this.isAudioPlaying()) {
                    this.audioController.stopBoth();
                } else {
                    this.audioController.setFrequencies(
                        this.currentFrequencies.root,
                        this.currentFrequencies.interval
                    );
                    this.audioController.playBoth();
                }
                this.updatePlayButtonState();
            });
        }

        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                this.randomizeFrequencies();
            });
        }

        solfegeButtons.forEach((btn) => {
            btn.addEventListener('click', () => this.handleSolfegeSelection(btn));
        });

        if (toggleInterference) {
            toggleInterference.addEventListener('change', () => this.applyVisibilitySettings());
        }
        if (toggleWave) {
            toggleWave.addEventListener('change', () => this.applyVisibilitySettings());
        }
    }

    parseFrequency(value) {
        if (value === null || value === undefined || value === '') return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) || parsed <= 0 ? null : parsed;
    }

    isWithinBounds(value, sliderEl, numberEl) {
        const min = this.getNumericAttr(sliderEl, 'min') ?? this.getNumericAttr(numberEl, 'min');
        const max = this.getNumericAttr(sliderEl, 'max') ?? this.getNumericAttr(numberEl, 'max');
        if (min !== null && value < min) return false;
        if (max !== null && value > max) return false;
        return true;
    }

    getNumericAttr(el, attrName) {
        if (!el || !el.hasAttribute(attrName)) return null;
        const parsed = parseFloat(el.getAttribute(attrName));
        return isNaN(parsed) ? null : parsed;
    }

    handleRootChange(nextRoot) {
        const sanitized = this.sanitizeFrequency(
            nextRoot,
            this.currentFrequencies.root,
            this.sharedControls.tone1Slider,
            this.sharedControls.tone1Input
        );
        const updateAudio = this.isAudioPlaying();
        this.setFrequencies(sanitized, this.currentFrequencies.interval, { updateAudio });
        this.updatePlayButtonState();
    }

    handleIntervalChange(nextInterval) {
        const sanitized = this.sanitizeFrequency(
            nextInterval,
            this.currentFrequencies.interval,
            this.sharedControls.tone2Slider,
            this.sharedControls.tone2Input
        );
        const updateAudio = this.isAudioPlaying();
        this.setFrequencies(this.currentFrequencies.root, sanitized, { updateAudio });
        this.updatePlayButtonState();
    }

    sanitizeFrequency(value, fallback, sliderEl, numberEl) {
        let result = this.parseFrequency(value);
        if (!result) result = fallback;

        const min = this.getNumericAttr(sliderEl, 'min') ?? this.getNumericAttr(numberEl, 'min');
        const max = this.getNumericAttr(sliderEl, 'max') ?? this.getNumericAttr(numberEl, 'max');

        if (min !== null) result = Math.max(result, min);
        if (max !== null) result = Math.min(result, max);

        return result;
    }

    setFrequencies(rootFreq, intervalFreq, { updateAudio = true } = {}) {
        this.currentFrequencies.root = this.sanitizeFrequency(
            rootFreq,
            this.currentFrequencies.root,
            this.sharedControls.tone1Slider,
            this.sharedControls.tone1Input
        );
        this.currentFrequencies.interval = this.sanitizeFrequency(
            intervalFreq,
            this.currentFrequencies.interval,
            this.sharedControls.tone2Slider,
            this.sharedControls.tone2Input
        );

        this.updateControlValues(this.currentFrequencies.root, this.currentFrequencies.interval);

        if (this.interferenceViz && typeof this.interferenceViz.setFrequencies === 'function') {
            this.interferenceViz.setFrequencies(
                this.currentFrequencies.root,
                this.currentFrequencies.interval,
                { updateAudio }
            );
        }
        if (this.waveViz && typeof this.waveViz.setFrequencies === 'function') {
            this.waveViz.setFrequencies(
                this.currentFrequencies.root,
                this.currentFrequencies.interval,
                { updateAudio }
            );
        }
    }

    updateControlValues(rootFreq, intervalFreq) {
        const { tone1Slider, tone1Input, tone2Slider, tone2Input } = this.sharedControls;

        if (tone1Slider) tone1Slider.value = rootFreq;
        if (tone1Input) tone1Input.value = Number(rootFreq).toFixed(2);
        if (tone2Slider) tone2Slider.value = intervalFreq;
        if (tone2Input) tone2Input.value = Number(intervalFreq).toFixed(2);
    }

    randomizeFrequencies() {
        const rootRange = this.getRange(this.sharedControls.tone1Slider, 120, 880);
        const intervalRange = this.getRange(this.sharedControls.tone2Slider, 120, 1320);

        const newRoot = Math.random() * (rootRange.max - rootRange.min) + rootRange.min;
        const semitoneSpan = 24;
        const semitones = Math.floor(Math.random() * semitoneSpan);
        const rawInterval = newRoot * Math.pow(2, semitones / 12);
        const clampedInterval = Math.max(Math.min(rawInterval, intervalRange.max), intervalRange.min);

        const wasPlaying = this.isAudioPlaying();
        this.setFrequencies(newRoot, clampedInterval, { updateAudio: wasPlaying });

        if (!wasPlaying && this.audioController) {
            this.audioController.playBoth();
        }
        this.updatePlayButtonState();
    }

    getRange(sliderEl, fallbackMin, fallbackMax) {
        return {
            min: this.getNumericAttr(sliderEl, 'min') ?? fallbackMin,
            max: this.getNumericAttr(sliderEl, 'max') ?? fallbackMax
        };
    }

    handleSolfegeSelection(button) {
        if (!button || !button.dataset) return;
        const semitones = parseFloat(button.dataset.interval);
        if (isNaN(semitones)) return;

        const newInterval = this.currentFrequencies.root * Math.pow(2, semitones / 12);
        const wasPlaying = this.isAudioPlaying();
        this.setFrequencies(this.currentFrequencies.root, newInterval, { updateAudio: wasPlaying });

        if (!wasPlaying && this.audioController) {
            this.audioController.playBoth();
        }
        this.updatePlayButtonState();
    }

    isAudioPlaying() {
        return !!(this.audioController &&
            typeof this.audioController.isAnyPlaying === 'function' &&
            this.audioController.isAnyPlaying());
    }

    updatePlayButtonState() {
        const { playBothBtn } = this.sharedControls;
        if (!playBothBtn) return;
        playBothBtn.textContent = this.isAudioPlaying() ? '⏸️ Stop' : '▶️ Play Both';
    }

    applyVisibilitySettings() {
        const showInterference = !this.sharedControls.toggleInterference ||
            this.sharedControls.toggleInterference.checked;
        const showWave = !this.sharedControls.toggleWave ||
            this.sharedControls.toggleWave.checked;

        if (this.interferenceRoot) {
            this.interferenceRoot.style.display = showInterference ? '' : 'none';
        }
        if (this.waveRoot) {
            this.waveRoot.style.display = showWave ? '' : 'none';
        }

        if (this.interferenceViz) {
            if (this.isRunning && showInterference && typeof this.interferenceViz.start === 'function') {
                this.interferenceViz.start();
                if (typeof this.interferenceViz.resize === 'function') {
                    this.interferenceViz.resize();
                    requestAnimationFrame(() => {
                        if (this.interferenceViz && typeof this.interferenceViz.resize === 'function') {
                            this.interferenceViz.resize();
                        }
                    });
                }
            } else if (typeof this.interferenceViz.stop === 'function') {
                this.interferenceViz.stop();
            }
        }

        if (this.waveViz) {
            if (this.isRunning && showWave && typeof this.waveViz.start === 'function') {
                this.waveViz.start();
                if (typeof this.waveViz.resize === 'function') {
                    this.waveViz.resize();
                }
            } else if (typeof this.waveViz.stop === 'function') {
                this.waveViz.stop();
            }
        }
    }

    start() {
        this.isRunning = true;
        this.applyVisibilitySettings();
        this.updatePlayButtonState();
        this.setFrequencies(this.currentFrequencies.root, this.currentFrequencies.interval, { updateAudio: false });
    }

    stop() {
        this.isRunning = false;
        if (this.interferenceViz && typeof this.interferenceViz.stop === 'function') {
            this.interferenceViz.stop();
        }
        if (this.waveViz && typeof this.waveViz.stop === 'function') {
            this.waveViz.stop();
        }
        if (this.audioController && typeof this.audioController.stopBoth === 'function') {
            this.audioController.stopBoth();
        }
        this.updatePlayButtonState();
    }

    handleExit() {
        this.stop();
        this.container.style.display = 'none';
        const app = document.getElementById('appContainer');
        if (app) {
            app.style.display = 'block';
        }
    }
}
