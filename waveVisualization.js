/**
 * Wave Visualization Exercise
 *
 * Retro-inspired waveform viewer that shares tone controls with the Interval Visualization
 * while rendering animated sine waves using the same consonance-based color spectrum.
 */

const WAVE_DEFAULT_SELECTORS = Object.freeze({
    canvas: '[data-wave-viz="canvas"]',
    playBoth: '[data-wave-viz="play-both"]',
    randomize: '[data-wave-viz="randomize"]',
    playTone1: '[data-wave-viz="play-tone1"]',
    playTone2: '[data-wave-viz="play-tone2"]',
    tone1Slider: '[data-wave-viz="tone1-slider"]',
    tone1Input: '[data-wave-viz="tone1-input"]',
    tone2Slider: '[data-wave-viz="tone2-slider"]',
    tone2Input: '[data-wave-viz="tone2-input"]',
    viewSide: '[data-wave-viz="view-side"]',
    viewOverlay: '[data-wave-viz="view-overlay"]',
    tone1Label: '[data-wave-viz="tone1-label"]',
    tone2Label: '[data-wave-viz="tone2-label"]',
    diffLabel: '[data-wave-viz="difference-label"]',
    exit: '[data-wave-viz="exit"]',
    solfegeButtons: '[data-wave-viz-solfege]'
});

class WaveVisualizationExercise {
    constructor(options = {}) {
        if (typeof options === 'string') {
            options = { root: document.querySelector(options) || document.getElementById(options) };
        }

        this.options = options;
        this.root = options.root || document;
        this.container = options.container || document.getElementById('waveVisualizationExercise') || null;
        if (!options.root && this.container instanceof HTMLElement) {
            this.root = this.container;
        }

        this.selectors = Object.assign({}, WAVE_DEFAULT_SELECTORS, options.selectors || {});

        const defaultSelectors = WAVE_DEFAULT_SELECTORS;
        const tone1SliderFallback = this.selectors.tone1Slider === defaultSelectors.tone1Slider ? '#waveVizTone1Freq' : null;
        const tone1InputFallback = this.selectors.tone1Input === defaultSelectors.tone1Input ? '#waveVizTone1FreqNum' : null;
        const tone2SliderFallback = this.selectors.tone2Slider === defaultSelectors.tone2Slider ? '#waveVizTone2Freq' : null;
        const tone2InputFallback = this.selectors.tone2Input === defaultSelectors.tone2Input ? '#waveVizTone2FreqNum' : null;
        const playBothFallback = this.selectors.playBoth === defaultSelectors.playBoth ? '#waveVizPlayBothBtn' : null;
        const playTone1Fallback = this.selectors.playTone1 === defaultSelectors.playTone1 ? '#waveVizPlayTone1Btn' : null;
        const playTone2Fallback = this.selectors.playTone2 === defaultSelectors.playTone2 ? '#waveVizPlayTone2Btn' : null;
        const randomizeFallback = this.selectors.randomize === defaultSelectors.randomize ? '#waveVizRandomizeBtn' : null;

        this.canvas = this.resolveElement(options.canvas, this.selectors.canvas, '#waveVizCanvas');
        if (!this.canvas) {
            console.error('WaveVisualization: canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('WaveVisualization: 2D context unavailable');
            return;
        }

        this.ownsAudioController = !options.audioController;
        this.audioController = options.audioController || new DualToneAudioController();

        this.tone1Freq = options.tone1Freq || 440;
        this.tone2Freq = options.tone2Freq || 440;
        this.tone1Color = '#00ffff';
        this.tone2Color = '#00ffff';
        this.overlayColor = '#ffffff';
        this.overlayRgb = { r: 255, g: 255, b: 255 };
        this.viewMode = options.viewMode || 'side-by-side';

        this.animationId = null;
        this.phase1 = 0;  // Phase for tone 1
        this.phase2 = 0;  // Phase for tone 2
        this.pixelRatio = window.devicePixelRatio || 1;
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.isRunning = false;

        this.playBothBtn = this.resolveElement(options.playBothBtn, this.selectors.playBoth, playBothFallback);
        this.randomizeBtn = this.resolveElement(options.randomizeBtn, this.selectors.randomize, randomizeFallback);
        this.playTone1Btn = this.resolveElement(options.playTone1Btn, this.selectors.playTone1, playTone1Fallback);
        this.playTone2Btn = this.resolveElement(options.playTone2Btn, this.selectors.playTone2, playTone2Fallback);
        this.tone1Slider = this.resolveElement(options.tone1Slider, this.selectors.tone1Slider, tone1SliderFallback);
        this.tone1Input = this.resolveElement(options.tone1Input, this.selectors.tone1Input, tone1InputFallback);
        this.tone2Slider = this.resolveElement(options.tone2Slider, this.selectors.tone2Slider, tone2SliderFallback);
        this.tone2Input = this.resolveElement(options.tone2Input, this.selectors.tone2Input, tone2InputFallback);
        this.viewSideBySide = this.resolveElement(options.viewSideBySide, this.selectors.viewSide, '#waveVizViewSideBySide');
        this.viewOverlay = this.resolveElement(options.viewOverlay, this.selectors.viewOverlay, '#waveVizViewOverlay');
        this.tone1Label = this.resolveElement(options.tone1Label, this.selectors.tone1Label, '#waveVizTone1Label');
        this.tone2Label = this.resolveElement(options.tone2Label, this.selectors.tone2Label, '#waveVizTone2Label');
        this.diffLabel = this.resolveElement(options.diffLabel, this.selectors.diffLabel, '#waveVizDifferenceLabel');
        this.exitBtn = this.resolveElement(options.exitBtn, this.selectors.exit, this.selectors.exit ? '#waveVizExitBtn' : null);
        const solfegeFallback = this.selectors.solfegeButtons === defaultSelectors.solfegeButtons ? '.wave-viz-solfege-btn' : null;
        this.solfegeButtons = this.resolveAllElements(this.selectors.solfegeButtons, solfegeFallback);

        this.bindControls();
        this.resizeCanvas();
        this.updateColors();
        this.updateMeta();
    }

    resolveElement(provided, selector, fallbackSelector) {
        if (provided instanceof HTMLElement) {
            return provided;
        }
        if (typeof provided === 'string') {
            const fromRoot = this.root instanceof HTMLElement ? this.root.querySelector(provided) : null;
            if (fromRoot) return fromRoot;
            const fromDoc = document.querySelector(provided);
            if (fromDoc) return fromDoc;
        }
        if (selector) {
            const fromRoot = this.root instanceof HTMLElement ? this.root.querySelector(selector) : null;
            if (fromRoot) return fromRoot;
        }
        if (fallbackSelector) {
            const fromDoc = document.querySelector(fallbackSelector);
            if (fromDoc) return fromDoc;
        }
        return null;
    }

    resolveAllElements(selector, fallbackSelector) {
        const results = [];
        if (selector) {
            const rootEls = this.root instanceof HTMLElement ? this.root.querySelectorAll(selector) : null;
            if (rootEls && rootEls.length) {
                results.push(...rootEls);
            }
        }
        if (results.length === 0 && fallbackSelector) {
            const fallbackEls = document.querySelectorAll(fallbackSelector);
            if (fallbackEls.length) {
                results.push(...fallbackEls);
            }
        }
        return results;
    }

    bindControls() {
        if (this.playBothBtn) {
            this.playBothBtn.addEventListener('click', () => {
                if (this.audioController.isAnyPlaying()) {
                    this.audioController.stopBoth();
                    this.updatePlayButtonStates();
                } else {
                    this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
                    this.audioController.playBoth();
                    this.updatePlayButtonStates(true);
                }
            });
        }

        if (this.randomizeBtn) {
            this.randomizeBtn.addEventListener('click', () => {
                this.randomizeFrequencies();
            });
        }

        if (this.playTone1Btn) {
            this.playTone1Btn.addEventListener('click', () => {
                const state = this.audioController.getState();
                if (state.isPlayingTone1 && !state.isPlayingTone2) {
                    this.audioController.stopTone1();
                } else {
                    this.audioController.setTone1Frequency(this.tone1Freq);
                    this.audioController.playTone1();
                }
                this.updatePlayButtonStates();
            });
        }

        if (this.playTone2Btn) {
            this.playTone2Btn.addEventListener('click', () => {
                const state = this.audioController.getState();
                if (state.isPlayingTone2 && !state.isPlayingTone1) {
                    this.audioController.stopTone2();
                } else {
                    this.audioController.setTone2Frequency(this.tone2Freq);
                    this.audioController.playTone2();
                }
                this.updatePlayButtonStates();
            });
        }

        const onTone1Change = (value) => {
            const parsed = parseFloat(value);
            if (isNaN(parsed) || parsed <= 0) return;
            this.setFrequencies(parsed, this.tone2Freq);
            this.updatePlayButtonStates();
        };

        const onTone2Change = (value) => {
            const parsed = parseFloat(value);
            if (isNaN(parsed) || parsed <= 0) return;
            this.setFrequencies(this.tone1Freq, parsed);
            this.updatePlayButtonStates();
        };

        if (this.tone1Slider) {
            this.tone1Slider.addEventListener('input', (e) => onTone1Change(e.target.value));
        }
        if (this.tone1Input) {
            this.tone1Input.addEventListener('input', (e) => onTone1Change(e.target.value));
            this.tone1Input.addEventListener('blur', () => {
                this.tone1Input.value = this.tone1Freq.toFixed(2);
            });
        }

        if (this.tone2Slider) {
            this.tone2Slider.addEventListener('input', (e) => onTone2Change(e.target.value));
        }
        if (this.tone2Input) {
            this.tone2Input.addEventListener('input', (e) => onTone2Change(e.target.value));
            this.tone2Input.addEventListener('blur', () => {
                this.tone2Input.value = this.tone2Freq.toFixed(2);
            });
        }

        if (this.viewSideBySide) {
            this.viewSideBySide.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.setViewMode('side-by-side');
                }
            });
        }

        if (this.viewOverlay) {
            this.viewOverlay.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.setViewMode('overlay');
                }
            });
        }

        if (this.solfegeButtons && this.solfegeButtons.length) {
            this.solfegeButtons.forEach((btn) => {
                btn.addEventListener('click', () => {
                    const semitones = parseInt(btn.dataset.interval, 10);
                    if (isNaN(semitones)) return;

                    const rawFreq = this.tone1Freq * Math.pow(2, semitones / 12);
                    const maxFreq = this.tone2Slider ? parseFloat(this.tone2Slider.max) : 4186;
                    const minFreq = this.tone2Slider ? parseFloat(this.tone2Slider.min) : 27;
                    const newFreq = Math.min(Math.max(rawFreq, minFreq), maxFreq);
                    const wasPlaying = this.audioController.isAnyPlaying();
                    this.setFrequencies(this.tone1Freq, newFreq, { updateAudio: wasPlaying });
                    if (!wasPlaying) {
                        this.audioController.playBoth();
                    }
                    this.updatePlayButtonStates(true);
                });
            });
        }

        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => {
                this.stop();
                this.audioController.stopBoth();
                this.updatePlayButtonStates();
                const container = this.container || document.getElementById('waveVisualizationExercise');
                if (container) container.style.display = 'none';
                const app = document.getElementById('appContainer');
                if (app) app.style.display = 'block';
            });
        }

        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }

    start() {
        if (this.animationId) {
            return;
        }

        this.resizeCanvas();
        this.updateColors();
        this.updateMeta();
        this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
        this.updatePlayButtonStates();

        this.isRunning = true;
        this.animationId = requestAnimationFrame(() => this.render());
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.audioController && this.audioController.stopBoth && this.ownsAudioController) {
            this.audioController.stopBoth();
        }
    }

    resizeCanvas() {
        if (!this.canvas || !this.ctx) return;

        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width || 900;
        const height = rect.height || 420;
        const ratio = window.devicePixelRatio || 1;

        this.canvas.width = width * ratio;
        this.canvas.height = height * ratio;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        this.viewportWidth = width;
        this.viewportHeight = height;
        this.pixelRatio = ratio;

        if (typeof this.ctx.setTransform === 'function') {
            this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        } else {
            this.ctx.save();
            this.ctx.scale(ratio, ratio);
        }
    }

    setFrequencies(rootFreq, intervalFreq, { updateAudio = true } = {}) {
        this.tone1Freq = rootFreq;
        this.tone2Freq = intervalFreq;

        if (this.tone1Slider) this.tone1Slider.value = rootFreq;
        if (this.tone1Input) this.tone1Input.value = Number(rootFreq).toFixed(2);
        if (this.tone2Slider) this.tone2Slider.value = intervalFreq;
        if (this.tone2Input) this.tone2Input.value = Number(intervalFreq).toFixed(2);

        if (this.audioController) {
            this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
            if (updateAudio && typeof this.audioController.updatePlayingFrequencies === 'function' && this.audioController.isAnyPlaying()) {
                this.audioController.updatePlayingFrequencies();
            }
        }

        this.updateColors();
        this.updateMeta();
    }

    setViewMode(mode) {
        if (this.viewMode === mode) return;
        this.viewMode = mode;
    }

    updatePlayButtonStates(forcePlaying = false) {
        const state = this.audioController.getState();
        const bothPlaying = forcePlaying || (state.isPlayingTone1 && state.isPlayingTone2);

        if (this.playBothBtn) {
            this.playBothBtn.textContent = bothPlaying ? '⏸️ Stop' : '▶️ Play Both';
        }
        if (this.playTone1Btn) {
            this.playTone1Btn.textContent = state.isPlayingTone1 ? 'Stop' : 'Play';
        }
        if (this.playTone2Btn) {
            this.playTone2Btn.textContent = state.isPlayingTone2 ? 'Stop' : 'Play';
        }
    }

    randomizeFrequencies() {
        const minFreq = 110;
        const maxFreq = 880;
        const newRoot = Math.random() * (maxFreq - minFreq) + minFreq;
        const semitoneSpan = 24;
        const semitones = Math.floor(Math.random() * semitoneSpan);
        const newInterval = newRoot * Math.pow(2, semitones / 12);

        const wasPlaying = this.audioController && this.audioController.isAnyPlaying && this.audioController.isAnyPlaying();
        this.setFrequencies(newRoot, newInterval, { updateAudio: wasPlaying });
        if (!wasPlaying && this.audioController) {
            this.audioController.playBoth();
        }
        this.updatePlayButtonStates(true);
    }

    updateMeta() {
        if (this.tone1Label) {
            this.tone1Label.textContent = `${this.frequencyToNote(this.tone1Freq)} · ${this.tone1Freq.toFixed(2)} Hz`;
        }
        if (this.tone2Label) {
            this.tone2Label.textContent = `${this.frequencyToNote(this.tone2Freq)} · ${this.tone2Freq.toFixed(2)} Hz`;
        }
        if (this.diffLabel) {
            const cents = 1200 * Math.log2(this.tone2Freq / this.tone1Freq);
            const absCents = Math.abs(cents);
            const direction = cents >= 0 ? '↑' : '↓';
            this.diffLabel.textContent = `${direction} ${absCents.toFixed(1)} cents`;
        }
    }

    updateColors() {
        if (typeof ConsonanceColorSystem === 'undefined') return;

        this.tone1Color = ConsonanceColorSystem.getFrequencyColor(this.tone1Freq, this.tone1Freq);
        this.tone2Color = ConsonanceColorSystem.getFrequencyColor(this.tone2Freq, this.tone1Freq);

        const tone1Rgb = ConsonanceColorSystem.hexToRgb(this.tone1Color);
        const tone2Rgb = ConsonanceColorSystem.hexToRgb(this.tone2Color);
        const mix = [
            Math.min((tone1Rgb[0] + tone2Rgb[0]) / 2, 1),
            Math.min((tone1Rgb[1] + tone2Rgb[1]) / 2, 1),
            Math.min((tone1Rgb[2] + tone2Rgb[2]) / 2, 1)
        ];
        this.overlayRgb = {
            r: Math.round(mix[0] * 255),
            g: Math.round(mix[1] * 255),
            b: Math.round(mix[2] * 255)
        };
        this.overlayColor = `rgba(${this.overlayRgb.r}, ${this.overlayRgb.g}, ${this.overlayRgb.b}, 1)`;
    }

    render() {
        if (!this.isRunning || !this.ctx) return;

        this.animationId = requestAnimationFrame(() => this.render());

        const ctx = this.ctx;
        const width = this.viewportWidth;
        const height = this.viewportHeight;
        const ratio = this.tone2Freq / this.tone1Freq || 1;

        // Scale cycles based on frequency (more cycles for higher frequencies)
        // Use 440 Hz as reference (3 cycles), then scale proportionally
        const referenceFreq = 440;
        const cyclesRoot = 3 * (this.tone1Freq / referenceFreq);
        const cyclesInterval = cyclesRoot * ratio;
        const state = this.audioController.getState();
        const tone1Active = state.isPlayingTone1;
        const tone2Active = state.isPlayingTone2;

        ctx.clearRect(0, 0, width, height);

        // Retro background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(0, 20, 40, 0.9)');
        gradient.addColorStop(0.5, 'rgba(10, 8, 40, 0.85)');
        gradient.addColorStop(1, 'rgba(20, 6, 30, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Scanline overlay
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let y = 0; y < height; y += 6) {
            ctx.fillRect(0, y, width, 2);
        }
        ctx.restore();

        if (this.viewMode === 'overlay') {
            this.drawOverlayMode(cyclesRoot, cyclesInterval, { tone1Active, tone2Active });
        } else {
            this.drawSplitMode(cyclesRoot, cyclesInterval, { tone1Active, tone2Active });
        }

        // Update phases - tone 1 is the reference, tone 2 moves proportionally
        const baseSpeed = 0.1; // Base animation speed

        // Tone 1 always moves at a fixed reference speed
        if (tone1Active) {
            this.phase1 += baseSpeed;
        }

        // Tone 2 moves at a speed proportional to the frequency ratio
        if (tone2Active) {
            if (tone1Active && this.tone1Freq > 0) {
                // Move relative to tone 1 based on frequency ratio
                const ratio = this.tone2Freq / this.tone1Freq;
                this.phase2 += baseSpeed * ratio;
            } else {
                // If tone 1 isn't playing, tone 2 uses fixed speed
                this.phase2 += baseSpeed;
            }
        }

        // Sync phases at unison for perfect alignment
        if (tone1Active && tone2Active && Math.abs(this.tone1Freq - this.tone2Freq) < 0.1) {
            this.phase2 = this.phase1;
        }
    }

    drawOverlayMode(cyclesRoot, cyclesInterval, { tone1Active, tone2Active }) {
        const ctx = this.ctx;
        const width = this.viewportWidth;
        const height = this.viewportHeight;
        const centerY = height / 2;
        const amplitude = Math.min(height * 0.3, 140);

        // baseline grid
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        ctx.restore();

        if (tone1Active) {
            this.drawWavePath({
                cycles: cyclesRoot,
                amplitude,
                centerY,
                color: this.withAlpha(this.tone1Color, 0.8),
                glow: this.withAlpha(this.tone1Color, 0.35),
                phase: this.phase1
            });
        }

        if (tone2Active) {
            this.drawWavePath({
                cycles: cyclesInterval,
                amplitude,
                centerY,
                color: this.withAlpha(this.tone2Color, 0.75),
                glow: this.withAlpha(this.tone2Color, 0.3),
                dash: [12, 6],
                phase: this.phase2
            });
        }

        if (tone1Active && tone2Active) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineWidth = 3;

            const overlayRgb = this.overlayRgb || { r: 255, g: 255, b: 255 };
            for (let x = 0; x <= width; x += 3) {
                const angleBase = (x / width) * cyclesRoot * Math.PI * 2;
                const angleInterval = (x / width) * cyclesInterval * Math.PI * 2;
                const oscillatingAmplitude1 = amplitude * Math.cos(this.phase1);
                const oscillatingAmplitude2 = amplitude * Math.cos(this.phase2);
                const y1 = centerY - Math.sin(angleBase) * oscillatingAmplitude1;
                const y2 = centerY - Math.sin(angleInterval) * oscillatingAmplitude2;

                // Only highlight where waves are actually close together
                const distance = Math.abs(y1 - y2);
                const maxAmplitude = Math.max(Math.abs(oscillatingAmplitude1), Math.abs(oscillatingAmplitude2));
                const threshold = maxAmplitude * 0.25; // Increased threshold for slower fade

                if (distance > threshold) continue;

                const proximity = 1 - (distance / threshold);
                // More extreme brightness with slower fade (lower exponent = slower fade)
                const alpha = Math.min(1.0, (proximity ** 0.8));
                // Scale the visual size based on brightness - brighter = bigger
                // Cap at 50% of max (alpha capped at 0.5) for unison to not be too thick
                const cappedAlpha = Math.min(0.5, alpha);
                const lineHeight = 3 + (cappedAlpha * 8); // Range from 3 to 7 pixels
                ctx.strokeStyle = `rgba(${overlayRgb.r}, ${overlayRgb.g}, ${overlayRgb.b}, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(x, (y1 + y2) / 2 - lineHeight);
                ctx.lineTo(x, (y1 + y2) / 2 + lineHeight);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    drawSplitMode(cyclesRoot, cyclesInterval, { tone1Active, tone2Active }) {
        const ctx = this.ctx;
        const width = this.viewportWidth;
        const height = this.viewportHeight;
        const gutter = 6;

        // Check if we should show both panels or just one
        const showBothPanels = tone1Active && tone2Active;

        if (showBothPanels) {
            // Side-by-side layout (Root on left, Interval on right)
            const panelGap = gutter;
            const availableWidth = width - gutter * 2 - panelGap;
            // Each panel gets equal share, no minimum width to allow shrinking on small screens
            const panelWidth = availableWidth / 2;
            const panelHeight = height - gutter * 2;
            const leftX = gutter;
            const rightX = gutter + panelWidth + panelGap;

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(leftX, gutter, panelWidth, panelHeight);
            ctx.fillRect(rightX, gutter, panelWidth, panelHeight);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.strokeRect(leftX, gutter, panelWidth, panelHeight);
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.25)';
            ctx.strokeRect(rightX, gutter, panelWidth, panelHeight);
            ctx.restore();

            // Root on left
            this.drawWavePanel({
                x: leftX,
                y: gutter,
                width: panelWidth,
                height: panelHeight,
                cycles: cyclesRoot,
                color: this.withAlpha(this.tone1Color, 0.9),
                glow: this.withAlpha(this.tone1Color, 0.35),
                label: `${Math.round(this.tone1Freq)} Hz`,
                isActive: tone1Active,
                phase: this.phase1
            });

            // Interval on right
            this.drawWavePanel({
                x: rightX,
                y: gutter,
                width: panelWidth,
                height: panelHeight,
                cycles: cyclesInterval,
                color: this.withAlpha(this.tone2Color, 0.85),
                glow: this.withAlpha(this.tone2Color, 0.3),
                label: `${Math.round(this.tone2Freq)} Hz`,
                isActive: tone2Active,
                phase: this.phase2
            });

            // Draw centered vertical divider line between panels
            const centerX = leftX + panelWidth + (panelGap / 2);
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, gutter);
            ctx.lineTo(centerX, gutter + panelHeight);
            ctx.stroke();
            ctx.restore();
        } else {
            // Single panel - use full width
            const availableWidth = width - gutter * 2;
            const panelWidth = availableWidth;
            const panelHeight = height - gutter * 2;
            const leftX = gutter;

            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(leftX, gutter, panelWidth, panelHeight);
            ctx.strokeStyle = tone1Active ? 'rgba(0, 255, 255, 0.25)' : 'rgba(255, 0, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.strokeRect(leftX, gutter, panelWidth, panelHeight);
            ctx.restore();

            if (tone1Active) {
                this.drawWavePanel({
                    x: leftX,
                    y: gutter,
                    width: panelWidth,
                    height: panelHeight,
                    cycles: cyclesRoot,
                    color: this.withAlpha(this.tone1Color, 0.9),
                    glow: this.withAlpha(this.tone1Color, 0.35),
                    label: `${Math.round(this.tone1Freq)} Hz`,
                    isActive: tone1Active,
                    phase: this.phase1
                });
            } else if (tone2Active) {
                this.drawWavePanel({
                    x: leftX,
                    y: gutter,
                    width: panelWidth,
                    height: panelHeight,
                    cycles: cyclesInterval,
                    color: this.withAlpha(this.tone2Color, 0.85),
                    glow: this.withAlpha(this.tone2Color, 0.3),
                    label: `${Math.round(this.tone2Freq)} Hz`,
                    isActive: tone2Active,
                    phase: this.phase2
                });
            }
        }
    }

    drawWavePanel({ x, y, width, height, cycles, color, glow, label, isActive, phase }) {
        const ctx = this.ctx;
        const centerY = y + height / 2;
        const amplitude = height * 0.35;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(x, centerY);
        ctx.lineTo(x + width, centerY);
        ctx.stroke();
        ctx.restore();

        if (isActive) {
            this.drawWavePath({
                offsetX: x,
                width,
                cycles,
                amplitude,
                centerY,
                color,
                glow,
                phase
            });
        } else {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.font = '600 12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Press play to view this wave', x + width / 2, centerY);
            ctx.restore();
        }

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(x + 16, y + 16, width - 32, 28);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeRect(x + 16, y + 16, width - 32, 28);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.font = '600 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + width / 2, y + 36);
        ctx.restore();
    }

    drawWavePath({ cycles, amplitude, centerY, color, glow, dash, offsetX = 0, width = this.viewportWidth, phase = 0 }) {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 12;
        if (dash) ctx.setLineDash(dash);

        ctx.beginPath();
        for (let i = 0; i <= width; i++) {
            const x = offsetX + i;
            const angle = (i / width) * cycles * Math.PI * 2;
            // Oscillate amplitude based on phase instead of scrolling the wave
            const oscillatingAmplitude = amplitude * Math.cos(phase);
            const y = centerY - Math.sin(angle) * oscillatingAmplitude;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    withAlpha(hexColor, alpha) {
        if (!hexColor) return `rgba(0, 255, 255, ${alpha})`;
        const [r, g, b] = ConsonanceColorSystem.hexToRgb(hexColor)
            .map(value => Math.round(value * 255));
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    frequencyToNote(frequency) {
        if (!frequency || !isFinite(frequency)) return '--';
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const halfSteps = 12 * Math.log2(frequency / C0);
        const noteIndex = Math.round(halfSteps) % 12;
        const octave = Math.floor(Math.round(halfSteps) / 12);
        return `${noteNames[(noteIndex + 12) % 12]}${octave}`;
    }
}

WaveVisualizationExercise.DEFAULT_SELECTORS = WAVE_DEFAULT_SELECTORS;

document.addEventListener('DOMContentLoaded', () => {
    window.waveVizExercise = new WaveVisualizationExercise();
});
