/**
 * Interference Visualization - WebGL Implementation
 *
 * Displays harmonic interference patterns for two simultaneous tones using WebGL.
 * Features gravity wells, consonance-based coloring, and real-time audio-visual sync.
 *
 * Dependencies:
 * - ConsonanceColorSystem: Color calculation based on frequency relationships
 * - SpeakerOverlayRenderer: 2D canvas overlay for speaker icons
 * - DualToneAudioController: Audio playback and beat amplitude calculation
 * - HarmonicRendererSettings: Configuration presets for visualization
 * - ToneGenerator: Web Audio API tone synthesis
 */
const INTERFERENCE_DEFAULT_SELECTORS = Object.freeze({
    canvas: '[data-interference="canvas"]',
    playBoth: '[data-interference="play-both"]',
    playTone1: '[data-interference="play-tone1"]',
    playTone2: '[data-interference="play-tone2"]',
    randomize: '[data-interference="randomize"]',
    exit: '[data-interference="exit"]',
    tone1Slider: '[data-interference="tone1-slider"]',
    tone1Input: '[data-interference="tone1-input"]',
    tone2Slider: '[data-interference="tone2-slider"]',
    tone2Input: '[data-interference="tone2-input"]',
    solfegeButtons: '[data-interference-solfege]',
    presetButtons: '[data-interference-preset]',
    rootCycleButtons: '[data-interference-root-cycle]',
    rootSelect: '[data-interference="root-select"]',
    rootOctave: '#interferenceVizRootOctave',
    colorSpectrum: '[data-interference="color-spectrum"]',
    pianoSpectrum: '[data-interference="piano-spectrum"]',
    copySettings: '[data-interference="copy-settings"]'
});

const INTERFERENCE_UNIFORM_DEFAULTS = Object.freeze({
    amplitude: 1.0,
    harmonicOrder: 5,
    tone1Color: '#00ffff',
    tone2Color: '#00ffff',
    rootIntensity: 1.0,
    intervalIntensity: 0.8,
    intersectionIntensity: 1.2,
    showOverallBeat: false,
    overallBeatIntensity: 0.0,
    showNodePulse: false,
    nodePulseIntensity: 0.0,
    nodePulseColor: '#ffffff',
    ringBreathing: false,
    ringBreathingIntensity: 0.0,
    heatMap: false,
    heatMapIntensity: 0.0,
    nodeMigration: false,
    nodeMigrationSpeed: 0.0,
    nodeMigrationAnimate: false,
    nodeDensityFlow: false,
    nodeDensityIntensity: 0.0,
    phaseTrails: false,
    phaseTrailLength: 0.0,
    nodeCoalescence: false,
    coalescenceStrength: 0.0,
    flowField: false,
    flowTurbulence: 0.0,
    depthLayers: false,
    depthLayerCount: 1,
    depthParallax: 0.0,
    zoneToggle: false,
    zoneToggleContrast: 0.0,
    particleResonance: false,
    particleCount: 0,
    particleSize: 0.0,
    energyArcs: false,
    arcThickness: 0.0,
    arcBranching: 0,
    arcWaveAmplitude: 0.0,
    pressureWave: false,
    pressureIntensity: 0.0,
    canvasStretch: false,
    stretchAmount: 0.0,
    drumPush: false,
    drumDepth: 0.0,
    gravityWell: false,
    gravityStrength: 0.0,
    gravityWellCount: 0,
    gravityVariant1: false,
    gravityAmpRange: 0.0,
    gravityWellSize: 0.0,
    gravityVariant2: false,
    repulsionForce: 0.0,
    gravityVariant3: false,
    vortexSpeed: 0.0,
    spiralTightness: 0.0,
    gravityVariant4: false,
    tidalStrength: 0.0,
    gravityVariant5: false,
    pulseDepth: 0.0,
    eventHorizon: 0.0,
    gravityVariant6: false,
    attractionRepulsionForce: 0.0,
    wellJitter: false,
    jitterIntensity: 0.0,
    wellBreathing: false,
    consonantBreathSpeed: 0.0,
    dissonantPulseSpeed: 0.0,
    lensRefraction: false,
    refractionAmount: 0.0,
    lensSize: 0.0,
    temporalShift: false,
    timeOffset: 0.0,
    temporalLayers: 1,
    membraneRipples: false,
    rippleAmplitude: 0.0,
    crystalGrowth: false,
    crystalComplexity: 1,
    crystalGrowthSpeed: 0.0,
    useBoundary: true,
    boundaryRadius: 300,
    speakerRadius: 30,
    useFoggyEdge: false,
    foggyEdgeStart: 0.7,
    rootFreq: 440,
    colorMode: 'consonance',
    rootNote: null,
    autoVolumeSync: true  // Automatically sync audio volume with reveal radius expansion
});

const INTERFERENCE_DEBUG_FLAG = '__INTERFERENCE_DEBUG';
function interferenceDebugEnabled() {
    try {
        return typeof window !== 'undefined' && Boolean(window[INTERFERENCE_DEBUG_FLAG]);
    } catch (err) {
        return false;
    }
}

function interferenceDebugLog(...args) {
    if (interferenceDebugEnabled()) {
        console.log(...args);
    }
}

class InterferenceVisualization {
    constructor(options = {}) {
        if (typeof options === 'string') {
            options = { canvas: document.getElementById(options) || document.querySelector(options) };
        }

        this.container = options.container || document.getElementById('interferenceVizExercise') || null;
        this.root = options.root || this.container || document;
        this.alwaysShowWaves = Boolean(options.alwaysShowWaves);

        this.selectors = Object.assign({}, INTERFERENCE_DEFAULT_SELECTORS, options.selectors || {});

        const rootSelectFallback = this.selectors.rootSelect ? '#interferenceVizRootNote' : null;
        const rootOctaveFallback = this.selectors.rootOctave ? '#interferenceVizRootOctave' : null;
        const colorSpectrumFallback = this.selectors.colorSpectrum ? '#interferenceVizColorSpectrumBtn' : null;
        const pianoSpectrumFallback = this.selectors.pianoSpectrum ? '#interferenceVizPianoSpectrumBtn' : null;
        const copySettingsFallback = this.selectors.copySettings ? '#interferenceVizCopySettingsBtn' : null;

        const defaultSelectors = INTERFERENCE_DEFAULT_SELECTORS;
        const tone1SliderFallback = this.selectors.tone1Slider === defaultSelectors.tone1Slider ? '#interferenceVizTone1Freq' : null;
        const tone1InputFallback = this.selectors.tone1Input === defaultSelectors.tone1Input ? '#interferenceVizTone1FreqNum' : null;
        const tone2SliderFallback = this.selectors.tone2Slider === defaultSelectors.tone2Slider ? '#interferenceVizTone2Freq' : null;
        const tone2InputFallback = this.selectors.tone2Input === defaultSelectors.tone2Input ? '#interferenceVizTone2FreqNum' : null;
        const playBothFallback = this.selectors.playBoth === defaultSelectors.playBoth ? '#interferenceVizPlayBothBtn' : null;
        const playTone1Fallback = this.selectors.playTone1 === defaultSelectors.playTone1 ? '#interferenceVizPlayTone1Btn' : null;
        const playTone2Fallback = this.selectors.playTone2 === defaultSelectors.playTone2 ? '#interferenceVizPlayTone2Btn' : null;
        const randomizeFallback = this.selectors.randomize === defaultSelectors.randomize ? '#interferenceVizRandomizeBtn' : null;

        this.elements = {
            canvas: this.resolveElement(options.canvas, this.selectors.canvas, '#interferenceVizCanvasWebGL'),
            playBothBtn: this.resolveElement(options.playBothBtn, this.selectors.playBoth, playBothFallback),
            playTone1Btn: this.resolveElement(options.playTone1Btn, this.selectors.playTone1, playTone1Fallback),
            playTone2Btn: this.resolveElement(options.playTone2Btn, this.selectors.playTone2, playTone2Fallback),
            randomizeBtn: this.resolveElement(options.randomizeBtn, this.selectors.randomize, randomizeFallback),
            exitBtn: this.resolveElement(options.exitBtn, this.selectors.exit, this.selectors.exit ? '#interferenceVizExitBtn' : null),
            tone1FreqSlider: this.resolveElement(options.tone1FreqSlider, this.selectors.tone1Slider, tone1SliderFallback),
            tone1FreqNum: this.resolveElement(options.tone1FreqNum, this.selectors.tone1Input, tone1InputFallback),
            tone2FreqSlider: this.resolveElement(options.tone2FreqSlider, this.selectors.tone2Slider, tone2SliderFallback),
            tone2FreqNum: this.resolveElement(options.tone2FreqNum, this.selectors.tone2Input, tone2InputFallback),
            rootSelect: this.resolveElement(options.rootSelect, this.selectors.rootSelect, rootSelectFallback),
            rootOctave: this.resolveElement(options.rootOctave, this.selectors.rootOctave, rootOctaveFallback),
            colorSpectrumBtn: this.resolveElement(options.colorSpectrumBtn, this.selectors.colorSpectrum, colorSpectrumFallback),
            pianoSpectrumBtn: this.resolveElement(options.pianoSpectrumBtn, this.selectors.pianoSpectrum, pianoSpectrumFallback),
            copySettingsBtn: this.resolveElement(options.copySettingsBtn, this.selectors.copySettings, copySettingsFallback),
            solfegeButtons: this.selectors.solfegeButtons ? Array.from((this.container || this.root || document).querySelectorAll(this.selectors.solfegeButtons)) : []
        };

        this.ownsAudioController = !options.audioController;
        if (options.audioController) {
            this.audioController = options.audioController;
        }

        this.canvas = this.elements.canvas;
        if (!this.canvas) {
            throw new Error('InterferenceVisualization: canvas element not found');
        }

        interferenceDebugLog('InterferenceVisualization ctor v18', {
            alwaysShowWaves: this.alwaysShowWaves,
            hasAudioController: Boolean(this.audioController),
            canvasWidthAttr: this.canvas.getAttribute('width'),
            canvasHeightAttr: this.canvas.getAttribute('height')
        });

        this.handleWindowResize = () => {
            this.resize();
        };
        window.addEventListener('resize', this.handleWindowResize);

        // Initialize WebGL context
        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: false,
            antialias: false // We'll handle this in shader for performance
        }) || this.canvas.getContext('experimental-webgl');

        if (!this.gl) {
            throw new Error('WebGL not supported in this browser');
        }

        // Initialize settings from settings module
        this.settings = Object.assign(
            {},
            INTERFERENCE_UNIFORM_DEFAULTS,
            HarmonicRendererSettings.getDefault() || {}
        );
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.cssWidth = null;
        this.cssHeight = null;
        this.pixelWidth = null;
        this.pixelHeight = null;

        // Initialize with hardcoded defaults - will be updated from DOM when controls initialize
        this.tone1Freq = 440;
        this.tone2Freq = 440;
        this.rootTone = 1; // Which tone is root (1 or 2)

        // Speaker positions (percentage of canvas size)
        this.tone1X = 0.25;
        this.tone1Y = 0.5;
        this.tone2X = 0.75;
        this.tone2Y = 0.5;

        // Piano chromatic colors - C (Do) = Cyan (home/pleasurable)
        // Color wheel rotated so Do is cyan
        this.chromaticColors = [
            [0.0, 1.0, 1.0],   // C (Do) - Cyan (home)
            [0.0, 0.5, 1.0],   // C# (Di) - Blue-Cyan
            [0.0, 0.0, 1.0],   // D (Re) - Blue
            [0.5, 0.0, 1.0],   // D# (Ri) - Purple
            [1.0, 0.0, 1.0],   // E (Mi) - Magenta
            [1.0, 0.0, 0.5],   // F (Fa) - Red-Magenta
            [1.0, 0.0, 0.0],   // F# (Fi) - Red
            [1.0, 0.5, 0.0],   // G (Sol) - Orange
            [1.0, 1.0, 0.0],   // G# (Si) - Yellow
            [0.5, 1.0, 0.0],   // A (La) - Yellow-Green
            [0.0, 1.0, 0.0],   // A# (Li) - Green
            [0.0, 1.0, 0.5]    // B (Ti) - Cyan-Green
        ];

        // Set canvas size - wait for layout to complete
        setTimeout(() => {
            this.resize();
        }, 100);

        // Initialize WebGL
        this.initShaders();
        this.initBuffers();
        this.initUniforms();

        // Animation
        this.animationFrameId = null;
        this.startTime = performance.now();
        this.debugFrameCount = 0;

        // Create overlay renderer for speaker icons (after canvas is ready)
        setTimeout(() => {
            this.overlayRenderer = new SpeakerOverlayRenderer(this.canvas);
            this.resize();
        }, 100);

        // Initialize audio for tone playback
        this.initializeAudio();

        // Initialize settings UI
        this.initializeSettingsUI();

        // Initialize control buttons
        this.initializeControls();
    }

    resolveElement(provided, selector, fallbackSelector) {
        if (provided instanceof HTMLElement) {
            return provided;
        }

        if (typeof provided === 'string') {
            const fromRoot = this.root ? this.root.querySelector(provided) : null;
            if (fromRoot) return fromRoot;
            const fromDoc = document.querySelector(provided);
            if (fromDoc) return fromDoc;
        }

        if (selector) {
            const fromRoot = this.root ? this.root.querySelector(selector) : null;
            if (fromRoot) return fromRoot;
        }

        if (fallbackSelector) {
            const fromDoc = document.querySelector(fallbackSelector);
            if (fromDoc) return fromDoc;
        }

        return null;
    }

    initializeAudio() {
        if (!this.audioController) {
            this.audioController = new DualToneAudioController();
            this.ownsAudioController = true;
        }
        this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
    }

    initializeControls() {
        const {
            playBothBtn,
            playTone1Btn,
            playTone2Btn,
            randomizeBtn,
            exitBtn,
            tone1FreqSlider,
            tone1FreqNum,
            tone2FreqSlider,
            tone2FreqNum
        } = this.elements;

        const scope = this.container || this.root || document;
        const solfegeButtons = (this.elements.solfegeButtons && this.elements.solfegeButtons.length)
            ? this.elements.solfegeButtons
            : (this.selectors.solfegeButtons ? Array.from(scope.querySelectorAll(this.selectors.solfegeButtons)) : []);
        const exerciseContainer = this.container || document.getElementById('interferenceVizExercise');

        // Try to read frequencies from DOM, but keep hardcoded defaults if they fail
        if (tone1FreqSlider && tone1FreqSlider.value) {
            const freq1 = parseFloat(tone1FreqSlider.value);
            if (!isNaN(freq1) && freq1 > 0) {
                this.tone1Freq = freq1;
            }
        }
        if (tone2FreqSlider && tone2FreqSlider.value) {
            const freq2 = parseFloat(tone2FreqSlider.value);
            if (!isNaN(freq2) && freq2 > 0) {
                this.tone2Freq = freq2;
            }
        }

        // Play Both button
        if (playBothBtn) {
            playBothBtn.addEventListener('click', () => {
                if (this.audioController.isAnyPlaying()) {
                    // Stop both
                    this.audioController.stopBoth();
                    playBothBtn.textContent = '▶️ Play Both';
                    if (playTone1Btn) playTone1Btn.textContent = 'Play';
                    if (playTone2Btn) playTone2Btn.textContent = 'Play';
                } else {
                    // Play both
                    this.audioController.playBoth();
                    playBothBtn.textContent = '⏸️ Stop';
                    if (playTone1Btn) playTone1Btn.textContent = 'Stop';
                    if (playTone2Btn) playTone2Btn.textContent = 'Stop';
                }
            });
        }

        // Play Tone 1 button
        if (playTone1Btn) {
            playTone1Btn.addEventListener('click', () => {
                const state = this.audioController.getState();
                if (state.isPlayingTone1) {
                    this.audioController.stopTone1();
                    playTone1Btn.textContent = 'Play';
                } else {
                    this.audioController.playTone1();
                    playTone1Btn.textContent = 'Stop';
                }
            });
        }

        // Play Tone 2 button
        if (playTone2Btn) {
            playTone2Btn.addEventListener('click', () => {
                const state = this.audioController.getState();
                if (state.isPlayingTone2) {
                    this.audioController.stopTone2();
                    playTone2Btn.textContent = 'Play';
                } else {
                    this.audioController.playTone2();
                    playTone2Btn.textContent = 'Stop';
                }
            });
        }

        // Frequency controls - Tone 1
        if (tone1FreqSlider && tone1FreqNum) {
            tone1FreqSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value)) return;
                this.setFrequencies(value, this.tone2Freq);
                tone1FreqNum.value = value.toFixed(2);
            });

            tone1FreqNum.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 27 && value <= 4186) {
                    this.setFrequencies(value, this.tone2Freq);
                    tone1FreqSlider.value = value;
                }
            });

            tone1FreqNum.addEventListener('blur', () => {
                tone1FreqNum.value = this.tone1Freq.toFixed(2);
            });
        }

        // Frequency controls - Tone 2
        if (tone2FreqSlider && tone2FreqNum) {
            tone2FreqSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value)) return;
                this.setFrequencies(this.tone1Freq, value);
                tone2FreqNum.value = value.toFixed(2);
            });

            tone2FreqNum.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 27 && value <= 4186) {
                    this.setFrequencies(this.tone1Freq, value);
                    tone2FreqSlider.value = value;
                }
            });

            tone2FreqNum.addEventListener('blur', () => {
                tone2FreqNum.value = this.tone2Freq.toFixed(2);
            });
        }

        // Solfege buttons
        solfegeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const semitones = parseInt(btn.dataset.interval);
                if (isNaN(semitones)) return;

                const rawFreq = this.tone1Freq * Math.pow(2, semitones / 12);
                const slider = this.elements.tone2FreqSlider;
                const maxFreq = slider ? parseFloat(slider.max) : 4186;
                const minFreq = slider ? parseFloat(slider.min) : 27;
                const newFreq = Math.min(Math.max(rawFreq, minFreq), maxFreq);

                const wasPlaying = this.audioController && this.audioController.isAnyPlaying && this.audioController.isAnyPlaying();
                this.setFrequencies(this.tone1Freq, newFreq, { updateAudio: wasPlaying });
                if (!wasPlaying && this.audioController) {
                    this.audioController.playBoth();
                    if (playBothBtn) playBothBtn.textContent = '⏸️ Stop';
                }
            });
        });

        // Randomize button
        if (randomizeBtn) {
            randomizeBtn.addEventListener('click', () => {
                const minFreq = 100;
                const maxFreq = 1000;
                const newRoot = Math.random() * (maxFreq - minFreq) + minFreq;
                const semitones = Math.floor(Math.random() * 25);
                const newInterval = newRoot * Math.pow(2, semitones / 12);

                const wasPlaying = this.audioController && this.audioController.isAnyPlaying && this.audioController.isAnyPlaying();
                this.setFrequencies(newRoot, newInterval, { updateAudio: wasPlaying });

                if (!wasPlaying && this.audioController) {
                    this.audioController.playBoth();
                }

                if (playBothBtn) playBothBtn.textContent = '⏸️ Stop';
                if (playTone1Btn) playTone1Btn.textContent = 'Stop';
                if (playTone2Btn) playTone2Btn.textContent = 'Stop';
                this.updatePlayButtonStates(true);
            });
        }

        // Exit button
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.stop();
                this.audioController.stopBoth();
                if (exerciseContainer) {
                    exerciseContainer.style.display = 'none';
                }
                const appContainer = document.getElementById('appContainer');
                if (appContainer) {
                    appContainer.style.display = 'block';
                }
            });
        }

        // Keyboard controls
        this.handleKeyDown = (e) => {
            // Only handle arrow keys if the exercise is visible
            const exerciseVisible = !exerciseContainer || exerciseContainer.style.display === 'block';
            if (!exerciseVisible) return;

            switch(e.key) {
                case 'ArrowLeft':
                    // Move tone 2 down by half step (semitone)
                    e.preventDefault();
                    this.tone2Freq = this.tone2Freq / Math.pow(2, 1/12);
                    this.audioController.setTone2Frequency(this.tone2Freq, true);
                    if (tone2FreqSlider) tone2FreqSlider.value = this.tone2Freq;
                    if (tone2FreqNum) tone2FreqNum.value = this.tone2Freq.toFixed(2);
                    break;

                case 'ArrowRight':
                    // Move tone 2 up by half step (semitone)
                    e.preventDefault();
                    this.tone2Freq = this.tone2Freq * Math.pow(2, 1/12);
                    this.audioController.setTone2Frequency(this.tone2Freq, true);
                    if (tone2FreqSlider) tone2FreqSlider.value = this.tone2Freq;
                    if (tone2FreqNum) tone2FreqNum.value = this.tone2Freq.toFixed(2);
                    break;

                case 'ArrowUp':
                    // Move tone 2 up by 1 Hz
                    e.preventDefault();
                    this.tone2Freq = this.tone2Freq + 1;
                    this.audioController.setTone2Frequency(this.tone2Freq, true);
                    if (tone2FreqSlider) tone2FreqSlider.value = this.tone2Freq;
                    if (tone2FreqNum) tone2FreqNum.value = this.tone2Freq.toFixed(2);
                    break;

                case 'ArrowDown':
                    // Move tone 2 down by 1 Hz
                    e.preventDefault();
                    this.tone2Freq = Math.max(27, this.tone2Freq - 1); // Don't go below min
                    this.audioController.setTone2Frequency(this.tone2Freq, true);
                    if (tone2FreqSlider) tone2FreqSlider.value = this.tone2Freq;
                    if (tone2FreqNum) tone2FreqNum.value = this.tone2Freq.toFixed(2);
                    break;
            }
        };

        // Add keyboard listener
        document.addEventListener('keydown', this.handleKeyDown);
    }


    initializeSettingsUI() {
        // Settings are managed by HarmonicRendererSettings module
        // No UI controls needed for this exercise
    }

    getVertexShaderSource() {
        return `
            attribute vec2 aPosition;
            varying vec2 vUV;

            void main() {
                vUV = aPosition * 0.5 + 0.5; // Convert -1..1 to 0..1
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;
    }

    getFragmentShaderSource() {
        return `
            precision highp float;

            varying vec2 vUV;

            // Uniforms
            uniform vec2 uResolution;
            uniform vec2 uTone1Pos;
            uniform vec2 uTone2Pos;
            uniform float uTone1Freq;
            uniform float uTone2Freq;
            uniform vec3 uTone1Color;
            uniform vec3 uTone2Color;
            uniform float uTime;
            uniform float uAmplitude;
            uniform int uHarmonicOrder;
            uniform bool uIsPlayingTone1;
            uniform bool uIsPlayingTone2;
            uniform float uTone1RevealRadiusMin;
            uniform float uTone1RevealRadiusMax;
            uniform float uTone2RevealRadiusMin;
            uniform float uTone2RevealRadiusMax;
            uniform float uBeatAmplitude;
            uniform float uShowOverallBeat;
            uniform float uOverallBeatIntensity;
            uniform float uShowNodePulse;
            uniform float uNodePulseIntensity;
            uniform vec3 uNodePulseColor;
            uniform float uRingBreathing;
            uniform float uRingBreathingIntensity;
            uniform float uHeatMap;
            uniform float uHeatMapIntensity;
            uniform float uNodeMigration;
            uniform float uNodeMigrationSpeed;
            uniform float uNodeMigrationAnimate;
            uniform float uNodeDensityFlow;
            uniform float uNodeDensityIntensity;
            uniform float uPhaseTrails;
            uniform float uPhaseTrailLength;
            uniform float uNodeCoalescence;
            uniform float uCoalescenceStrength;
            uniform float uFlowField;
            uniform float uFlowTurbulence;
            uniform float uDepthLayers;
            uniform int uDepthLayerCount;
            uniform float uDepthParallax;
            uniform float uZoneToggle;
            uniform float uZoneToggleContrast;

            // Emergent beat visualizations
            uniform float uParticleResonance;
            uniform int uParticleCount;
            uniform float uParticleSize;
            uniform float uEnergyArcs;
            uniform float uArcThickness;
            uniform int uArcBranching;
            uniform float uArcWaveAmplitude;
            uniform float uPressureWave;
            uniform float uPressureIntensity;
            uniform float uCanvasStretch;
            uniform float uStretchAmount;
            uniform float uDrumPush;
            uniform float uDrumDepth;
            uniform float uGravityWell;
            uniform float uGravityStrength;
            uniform int uGravityWellCount;
            uniform float uGravityVariant1;
            uniform float uGravityAmpRange;
            uniform float uGravityWellSize;
            uniform float uGravityVariant2;
            uniform float uRepulsionForce;
            uniform float uGravityVariant3;
            uniform float uVortexSpeed;
            uniform float uSpiralTightness;
            uniform float uGravityVariant4;
            uniform float uTidalStrength;
            uniform float uGravityVariant5;
            uniform float uPulseDepth;
            uniform float uEventHorizon;
            uniform float uGravityVariant6;
            uniform float uAttractionRepulsionForce;
            uniform float uWellJitter;
            uniform float uJitterIntensity;
            uniform float uWellBreathing;
            uniform float uConsonantBreathSpeed;
            uniform float uDissonantPulseSpeed;
            uniform float uLensRefraction;
            uniform float uRefractionAmount;
            uniform float uLensSize;
            uniform float uTemporalShift;
            uniform float uTimeOffset;
            uniform int uTemporalLayers;
            uniform float uMembraneRipples;
            uniform float uRippleAmplitude;
            uniform float uCrystalGrowth;
            uniform int uCrystalComplexity;
            uniform float uCrystalGrowthSpeed;
            uniform bool uUseBoundary;
            uniform float uBoundaryRadius;
            uniform float uSpeakerRadius;
            uniform bool uUseFoggyEdge;
            uniform float uFoggyEdgeStart;
            uniform float uRootIntensity;
            uniform float uIntervalIntensity;
            uniform float uIntersectionIntensity;
            uniform bool uUsePianoMode;
            uniform vec3 uChromaticColors[12];
            uniform float uRootFreq;
            uniform int uRootTone;

            float computeWaveAmplitude(vec2 pixelPos, vec2 sourcePos, float freq, int harmonicOrder, float time) {
                float dist = distance(pixelPos, sourcePos);
                float amplitude = 0.0;

                // Sum harmonics
                for (int h = 1; h <= 10; h++) {
                    if (h > harmonicOrder) break;
                    float harmonic = float(h);
                    amplitude += sin(dist * 0.05 * harmonic - freq * harmonic * time * 0.01) / harmonic;
                }

                return amplitude;
            }

            float computeBoundaryFalloff(vec2 pixelPos, vec2 sourcePos, float effectiveRadius) {
                float dist = distance(pixelPos, sourcePos);

                if (!uUseBoundary) {
                    return 1.0;
                }

                if (uUseFoggyEdge) {
                    // Foggy edge vignette
                    float fadeStart = effectiveRadius * uFoggyEdgeStart;
                    if (dist < fadeStart) {
                        return 1.0;
                    } else if (dist < effectiveRadius) {
                        float fadeAmount = 1.0 - ((dist - fadeStart) / (effectiveRadius - fadeStart));
                        return fadeAmount * fadeAmount * fadeAmount; // Cubic ease
                    } else {
                        return 0.0;
                    }
                } else {
                    // Smooth fade at edge instead of hard cutoff
                    float fadeWidth = 40.0;
                    float fadeStart = effectiveRadius - fadeWidth;
                    if (dist < fadeStart) {
                        return 1.0;
                    } else if (dist < effectiveRadius) {
                        // Smooth fade to transparency
                        return 1.0 - ((dist - fadeStart) / fadeWidth);
                    } else {
                        return 0.0;
                    }
                }
            }

            vec3 getPianoColor(float freq) {
                // Calculate cents offset from root
                float ratio = freq / uRootFreq;
                float cents = log2(ratio) * 1200.0;
                float normalizedCents = mod(mod(cents, 1200.0) + 1200.0, 1200.0);

                // Map to chromatic scale (0-11)
                float semitone = normalizedCents / 100.0;
                float semitoneFloored = floor(semitone);
                float frac = fract(semitone);

                // Clamp to valid range
                float clampedIndex = clamp(semitoneFloored, 0.0, 11.0);

                // Manual array indexing (WebGL 1.0 doesn't support dynamic indexing)
                vec3 color1 = vec3(0.0);
                vec3 color2 = vec3(0.0);

                for (int i = 0; i < 12; i++) {
                    if (abs(clampedIndex - float(i)) < 0.5) {
                        color1 = uChromaticColors[i];
                    }
                    float nextIdx = mod(clampedIndex + 1.0, 12.0);
                    if (abs(nextIdx - float(i)) < 0.5) {
                        color2 = uChromaticColors[i];
                    }
                }

                return mix(color1, color2, frac);
            }

            void main() {
                vec2 pixelPos = vUV * uResolution;
                float effectiveRadius = uBoundaryRadius + uSpeakerRadius;

                // === PRESSURE WAVE VARIANTS: Spatial/Temporal Distortions ===
                // These modify coordinates BEFORE wave calculation

                vec2 samplePos = pixelPos; // Position to sample from (may be warped)
                float sampleTime = uTime; // Time to sample (may be offset)

                // Calculate frequency ratio for consonance (used by variants)
                float variantFreqRatio = max(uTone1Freq, uTone2Freq) / min(uTone1Freq, uTone2Freq);
                float variantConsonance = 1.0 / (1.0 + abs(variantFreqRatio - floor(variantFreqRatio + 0.5)));

                // 1. Canvas Stretch - Radial stretching/compression (localized to overlap area)
                if (uCanvasStretch > 0.5) {
                    vec2 center = (uTone1Pos + uTone2Pos) * 0.5;
                    vec2 toPixel = samplePos - center;
                    float radialDist = length(toPixel);

                    // Only affect overlap region (falloff from center)
                    float overlapInfluence = smoothstep(400.0, 100.0, radialDist);

                    // Stretch oscillates with beat
                    float stretchPhase = sin(uTime * mix(1.0, 4.0, 1.0 - variantConsonance)) * uBeatAmplitude;
                    float stretchFactor = 1.0 + stretchPhase * uStretchAmount * overlapInfluence;

                    // Apply radial stretch
                    samplePos = center + toPixel * stretchFactor;
                }

                // 2. Drum Membrane Push - Z-depth illusion via brightness/scale
                float drumPushFactor = 1.0;
                if (uDrumPush > 0.5) {
                    // Push is stronger in overlap region
                    float dist1Push = length(pixelPos - uTone1Pos);
                    float dist2Push = length(pixelPos - uTone2Pos);
                    float inCenter = 1.0 - smoothstep(100.0, 300.0, min(dist1Push, dist2Push));

                    // Push oscillates with beat
                    float pushPhase = sin(uTime * mix(1.0, 4.0, 1.0 - variantConsonance)) * uBeatAmplitude;

                    // Consonant: uniform push, Dissonant: localized bulges
                    float localizedPush = variantConsonance + (1.0 - variantConsonance) * inCenter;
                    drumPushFactor = 1.0 + pushPhase * uDrumDepth * 0.3 * localizedPush;
                }

                // 3. Gravity Well Warp - Bend space around moving wells (6 variants)
                if (uGravityWell > 0.5) {
                    // Variant 1: Dissonance Amplitude / Consonance Size
                    if (uGravityVariant1 > 0.5) {
                        for (int w = 0; w < 5; w++) {
                            if (w >= uGravityWellCount) break;

                            vec2 center = (uTone1Pos + uTone2Pos) * 0.5;
                            float wellAngle = float(w) * 6.28318 / float(uGravityWellCount) + uTime * uBeatAmplitude;
                            float wellRadius = 100.0 * (1.0 - variantConsonance);
                            vec2 wellPos = center + vec2(cos(wellAngle), sin(wellAngle)) * wellRadius;

                            vec2 toWell = wellPos - samplePos;
                            float wellDist = length(toWell);

                            // Dissonance: strong rapid pulls, Consonance: large gentle wells
                            float dissonance = 1.0 - variantConsonance;
                            float pullStrength = mix(uGravityStrength, uGravityStrength * uGravityAmpRange, dissonance);
                            float wellSize = mix(uGravityWellSize, 50.0, dissonance);
                            float gravityPull = pullStrength / (wellDist + wellSize);
                            gravityPull *= uBeatAmplitude;

                            samplePos += normalize(toWell) * gravityPull;
                        }
                    }
                    // Variant 2: Repulsion Mode
                    else if (uGravityVariant2 > 0.5) {
                        for (int w = 0; w < 5; w++) {
                            if (w >= uGravityWellCount) break;

                            vec2 center = (uTone1Pos + uTone2Pos) * 0.5;
                            float wellAngle = float(w) * 6.28318 / float(uGravityWellCount) + uTime * uBeatAmplitude;
                            float wellRadius = 100.0 * (1.0 - variantConsonance);
                            vec2 wellPos = center + vec2(cos(wellAngle), sin(wellAngle)) * wellRadius;

                            vec2 toWell = wellPos - samplePos;
                            float wellDist = length(toWell);

                            // Push away instead of pull
                            float gravityPush = uGravityStrength * uRepulsionForce / (wellDist + 10.0);
                            gravityPush *= uBeatAmplitude;

                            // Dissonance: stronger fragmentation
                            float dissonance = 1.0 - variantConsonance;
                            gravityPush *= (1.0 + dissonance);

                            samplePos -= normalize(toWell) * gravityPush; // Negative for repulsion
                        }
                    }
                    // Variant 3: Orbital Vortex
                    else if (uGravityVariant3 > 0.5) {
                        for (int w = 0; w < 5; w++) {
                            if (w >= uGravityWellCount) break;

                            vec2 center = (uTone1Pos + uTone2Pos) * 0.5;
                            float wellAngle = float(w) * 6.28318 / float(uGravityWellCount) + uTime * uBeatAmplitude * uVortexSpeed;
                            float wellRadius = 100.0 * (1.0 - variantConsonance);
                            vec2 wellPos = center + vec2(cos(wellAngle), sin(wellAngle)) * wellRadius;

                            vec2 toWell = wellPos - samplePos;
                            float wellDist = length(toWell);

                            // Tangential force (perpendicular to radial)
                            vec2 radialDir = normalize(toWell);
                            vec2 tangentDir = vec2(-radialDir.y, radialDir.x);

                            // Vortex strength falls off with distance
                            float vortexStrength = uGravityStrength / (wellDist + 10.0);
                            vortexStrength *= uBeatAmplitude * uSpiralTightness;

                            // Dissonance: tight fast vortices, Consonance: wide slow spirals
                            float dissonance = 1.0 - variantConsonance;
                            vortexStrength *= mix(0.5, 2.0, dissonance);

                            // Apply tangential force for spiral motion
                            samplePos += tangentDir * vortexStrength;
                        }
                    }
                    // Variant 4: Tidal Locking
                    else if (uGravityVariant4 > 0.5) {
                        // Wells at tone sources - competing tidal forces
                        vec2 toTone1 = uTone1Pos - samplePos;
                        vec2 toTone2 = uTone2Pos - samplePos;
                        float dist1 = length(toTone1);
                        float dist2 = length(toTone2);

                        // Gravitational pull from each tone
                        float pull1 = uGravityStrength * uTidalStrength / (dist1 + 10.0);
                        float pull2 = uGravityStrength * uTidalStrength / (dist2 + 10.0);
                        pull1 *= uBeatAmplitude;
                        pull2 *= uBeatAmplitude;

                        // Dissonance: unstable stretching/tearing, Consonance: stable oscillation
                        float dissonance = 1.0 - variantConsonance;
                        float chaosPhase = sin(uTime * 10.0 * dissonance) * dissonance;
                        pull1 *= (1.0 + chaosPhase);
                        pull2 *= (1.0 - chaosPhase);

                        // Apply competing forces
                        samplePos += normalize(toTone1) * pull1;
                        samplePos += normalize(toTone2) * pull2;
                    }
                    // Variant 5: Pulsing Black Holes
                    else if (uGravityVariant5 > 0.5) {
                        for (int w = 0; w < 5; w++) {
                            if (w >= uGravityWellCount) break;

                            vec2 center = (uTone1Pos + uTone2Pos) * 0.5;
                            float wellAngle = float(w) * 6.28318 / float(uGravityWellCount) + uTime * uBeatAmplitude;
                            float wellRadius = 100.0 * (1.0 - variantConsonance);
                            vec2 wellPos = center + vec2(cos(wellAngle), sin(wellAngle)) * wellRadius;

                            // Add jitter for dissonance (well position wobbles erratically)
                            if (uWellJitter > 0.5) {
                                float dissonance = 1.0 - variantConsonance;
                                // Multiple frequency jitters for chaotic movement
                                float jitterX = sin(uTime * 8.0 + float(w) * 3.0) * dissonance;
                                jitterX += sin(uTime * 13.0 + float(w) * 5.0) * dissonance * 0.5;
                                float jitterY = cos(uTime * 9.0 + float(w) * 4.0) * dissonance;
                                jitterY += cos(uTime * 11.0 + float(w) * 6.0) * dissonance * 0.5;
                                wellPos += vec2(jitterX, jitterY) * uJitterIntensity;
                            }

                            vec2 toWell = wellPos - samplePos;
                            float wellDist = length(toWell);

                            // Pulsing strength at beat frequency
                            float beatFreq = abs(uTone1Freq - uTone2Freq);
                            float dissonance = 1.0 - variantConsonance;

                            // Breathing speed varies with consonance/dissonance
                            float breathingSpeed;
                            float pulsePhase;
                            if (uWellBreathing > 0.5) {
                                // Consonant: slow deep breathing, Dissonant: rapid shallow pulsing
                                breathingSpeed = mix(uConsonantBreathSpeed, uDissonantPulseSpeed, dissonance);
                                if (dissonance > 0.5) {
                                    // Each well pulses independently for dissonance
                                    pulsePhase = sin(uTime * beatFreq * 0.1 * breathingSpeed + float(w) * 2.0);
                                } else {
                                    // All wells pulse together for consonance
                                    pulsePhase = sin(uTime * beatFreq * 0.1 * breathingSpeed);
                                }
                            } else {
                                // Default behavior when breathing is off
                                if (dissonance > 0.5) {
                                    pulsePhase = sin(uTime * beatFreq * 0.1 + float(w) * 2.0);
                                } else {
                                    pulsePhase = sin(uTime * beatFreq * 0.1);
                                }
                            }

                            float pulseStrength = mix(1.0 - uPulseDepth, 1.0, (pulsePhase + 1.0) * 0.5);

                            // Event horizon - extreme warping close to well
                            float horizonFactor = smoothstep(uEventHorizon * 2.0, uEventHorizon, wellDist);
                            float gravityPull = uGravityStrength * pulseStrength / (wellDist + 10.0);
                            gravityPull *= (1.0 + horizonFactor * 3.0); // Extreme pull near horizon
                            gravityPull *= uBeatAmplitude;

                            samplePos += normalize(toWell) * gravityPull;
                        }
                    }
                    // Variant 6: Consonance Attraction / Dissonance Repulsion
                    else if (uGravityVariant6 > 0.5) {
                        for (int w = 0; w < 5; w++) {
                            if (w >= uGravityWellCount) break;

                            vec2 center = (uTone1Pos + uTone2Pos) * 0.5;
                            float wellAngle = float(w) * 6.28318 / float(uGravityWellCount) + uTime * uBeatAmplitude;
                            float wellRadius = 100.0 * (1.0 - variantConsonance);
                            vec2 wellPos = center + vec2(cos(wellAngle), sin(wellAngle)) * wellRadius;

                            vec2 toWell = wellPos - samplePos;
                            float wellDist = length(toWell);

                            // Force magnitude
                            float forceMagnitude = uGravityStrength * uAttractionRepulsionForce / (wellDist + 10.0);
                            forceMagnitude *= uBeatAmplitude;

                            // Consonance: attract (positive), Dissonance: repel (negative)
                            float forceDirection = variantConsonance * 2.0 - 1.0; // -1 to +1

                            samplePos += normalize(toWell) * forceMagnitude * forceDirection;
                        }
                    }
                    // Default: Original behavior
                    else {
                        for (int w = 0; w < 5; w++) {
                            if (w >= uGravityWellCount) break;

                            vec2 center = (uTone1Pos + uTone2Pos) * 0.5;
                            float wellAngle = float(w) * 6.28318 / float(uGravityWellCount) + uTime * uBeatAmplitude;
                            float wellRadius = 100.0 * (1.0 - variantConsonance);
                            vec2 wellPos = center + vec2(cos(wellAngle), sin(wellAngle)) * wellRadius;

                            // Add jitter for dissonance (well position wobbles erratically)
                            if (uWellJitter > 0.5) {
                                float dissonance = 1.0 - variantConsonance;
                                // Multiple frequency jitters for chaotic movement
                                float jitterX = sin(uTime * 8.0 + float(w) * 3.0) * dissonance;
                                jitterX += sin(uTime * 13.0 + float(w) * 5.0) * dissonance * 0.5;
                                float jitterY = cos(uTime * 9.0 + float(w) * 4.0) * dissonance;
                                jitterY += cos(uTime * 11.0 + float(w) * 6.0) * dissonance * 0.5;
                                wellPos += vec2(jitterX, jitterY) * uJitterIntensity;
                            }

                            vec2 toWell = wellPos - samplePos;
                            float wellDist = length(toWell);
                            float gravityPull = uGravityStrength / (wellDist + 10.0);

                            // Apply breathing modulation to pull strength
                            if (uWellBreathing > 0.5) {
                                float beatFreq = abs(uTone1Freq - uTone2Freq);
                                float dissonance = 1.0 - variantConsonance;
                                float breathingSpeed = mix(uConsonantBreathSpeed, uDissonantPulseSpeed, dissonance);
                                float breathPhase = sin(uTime * beatFreq * 0.1 * breathingSpeed);
                                // Modulate pull strength with breathing
                                gravityPull *= (1.0 + breathPhase * 0.3);
                            }

                            gravityPull *= uBeatAmplitude;

                            samplePos += normalize(toWell) * gravityPull;
                        }
                    }
                }

                // 4. Lens Refraction - Local displacement like looking through water
                if (uLensRefraction > 0.5) {
                    // Multiple moving lens regions
                    int lensCount = int(mix(1.0, 4.0, 1.0 - variantConsonance));
                    for (int l = 0; l < 4; l++) {
                        if (l >= lensCount) break;

                        // Lens centers move around
                        vec2 center = (uTone1Pos + uTone2Pos) * 0.5;
                        float lensPhase = float(l) * 2.0 + uTime * mix(0.5, 2.0, 1.0 - variantConsonance);
                        vec2 lensCenter = center + vec2(
                            cos(lensPhase) * 150.0,
                            sin(lensPhase * 1.3) * 150.0
                        );

                        // Distance to lens center
                        vec2 toLens = samplePos - lensCenter;
                        float lensDist = length(toLens);

                        // Refraction strength falls off with distance
                        float lensInfluence = smoothstep(uLensSize, 0.0, lensDist);

                        // Refract: push away from center (convex lens)
                        float refractionStrength = lensInfluence * uRefractionAmount * uBeatAmplitude;
                        samplePos += normalize(toLens) * refractionStrength;
                    }
                }

                // 5. Temporal Phase Shift - Sample from different time slices
                if (uTemporalShift > 0.5) {
                    // Calculate temporal offset based on position
                    vec2 center = (uTone1Pos + uTone2Pos) * 0.5;
                    vec2 toPixel = pixelPos - center;
                    float angle = atan(toPixel.y, toPixel.x);
                    float radialDist = length(toPixel);

                    // Only affect overlap region
                    float temporalInfluence = smoothstep(400.0, 100.0, radialDist);

                    // Normalized angle (0 to 1)
                    float normalizedAngle = (angle + 3.14159) / 6.28318;

                    // Consonant: smooth gradient, Dissonant: stepped zones
                    float timePattern;
                    if (variantConsonance > 0.7) {
                        // Consonant: smooth circular gradient
                        timePattern = normalizedAngle;
                    } else {
                        // Dissonant: quantized zones with smoothed edges
                        float temporalZones = float(uTemporalLayers);
                        float zonePos = normalizedAngle * temporalZones;
                        float zone = floor(zonePos);
                        float zoneBlend = fract(zonePos);

                        // Smooth between zones to avoid hard lines
                        float smoothWidth = 0.2; // 20% of zone for blending
                        zoneBlend = smoothstep(0.5 - smoothWidth, 0.5 + smoothWidth, zoneBlend);

                        timePattern = (zone + zoneBlend) / temporalZones;
                    }

                    // Time offset based on pattern and beat
                    sampleTime = uTime - timePattern * uTimeOffset * uBeatAmplitude * temporalInfluence;
                }

                // Compute boundary falloffs (use original pixelPos for boundaries)
                float falloff1 = uIsPlayingTone1 ? computeBoundaryFalloff(pixelPos, uTone1Pos, effectiveRadius) : 0.0;
                float falloff2 = uIsPlayingTone2 ? computeBoundaryFalloff(pixelPos, uTone2Pos, effectiveRadius) : 0.0;

                // Skip if outside both boundaries
                if (falloff1 == 0.0 && falloff2 == 0.0) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                    return;
                }

                // Check reveal radius (expanding wave effect or shrinking ring)
                float dist1 = distance(pixelPos, uTone1Pos);
                float dist2 = distance(pixelPos, uTone2Pos);

                // Hide pixels outside reveal radius range (min = dead zone, max = outer edge)
                if (dist1 < uTone1RevealRadiusMin || dist1 > uTone1RevealRadiusMax) falloff1 = 0.0;
                if (dist2 < uTone2RevealRadiusMin || dist2 > uTone2RevealRadiusMax) falloff2 = 0.0;

                // Skip if outside both reveal radii
                if (falloff1 == 0.0 && falloff2 == 0.0) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                    return;
                }

                // Compute wave amplitudes (use samplePos and sampleTime for warped sampling)
                float wave1 = uIsPlayingTone1 ? computeWaveAmplitude(samplePos, uTone1Pos, uTone1Freq, uHarmonicOrder, sampleTime) * uAmplitude * falloff1 : 0.0;
                float wave2 = uIsPlayingTone2 ? computeWaveAmplitude(samplePos, uTone2Pos, uTone2Freq, uHarmonicOrder, sampleTime) * uAmplitude * falloff2 : 0.0;

                float brightness1 = abs(wave1) * 0.5;
                float brightness2 = abs(wave2) * 0.5;

                // Determine if overlapping
                bool tone1Active = uIsPlayingTone1 && falloff1 > 0.0;
                bool tone2Active = uIsPlayingTone2 && falloff2 > 0.0;
                bool overlapping = tone1Active && tone2Active;

                vec3 finalColor;
                float finalAlpha;

                // Use tone colors (calculated in JavaScript based on consonance/dissonance)
                vec3 color1 = uTone1Color;
                vec3 color2 = uTone2Color;

                // Compute individual tone colors with their brightness
                // Apply falloff directly to get contribution from each tone
                // Keep brightness lower so overlap doesn't get too bright when adding
                vec3 tone1Contribution = color1 * (0.25 + brightness1 * 0.35) * falloff1 * uRootIntensity;
                vec3 tone2Contribution = color2 * (0.25 + brightness2 * 0.35) * falloff2 * uIntervalIntensity;

                // Natural overlap: just add the contributions together
                // Where both are present, they combine and get brighter
                // Where only one is present, you see just that tone
                finalColor = tone1Contribution + tone2Contribution;
                finalAlpha = max(falloff1, falloff2);

                // Only apply special overlap effects when BOTH tones are significantly present
                if (overlapping) {
                    // Calculate interference and brightness for overlap effects
                    float totalBrightness = brightness1 + brightness2;

                    // Detect destructive interference (dark spots where waves cancel)
                    // When wave1 and wave2 have opposite signs and similar magnitudes, we get cancellation
                    float interference = wave1 + wave2; // Combined wave
                    float interferenceStrength = abs(interference) / (abs(wave1) + abs(wave2) + 0.001); // 0 = perfect cancellation, 1 = constructive

                    // Identify dark nodes (destructive interference points)
                    float isDarkNode = 1.0 - interferenceStrength; // 1.0 at dark spots, 0.0 at bright spots

                    // Pulsate the dark nodes with beat frequency (if enabled)
                    float nodePulse = 0.0;
                    if (uShowNodePulse > 0.5) {
                        nodePulse = isDarkNode * uBeatAmplitude * uNodePulseIntensity;
                    }

                    // Add beat frequency brightness modulation (if enabled)
                    float beatBrightness = 0.0;
                    if (uShowOverallBeat > 0.5) {
                        beatBrightness = uBeatAmplitude * uOverallBeatIntensity;
                    }

                    // Compute base overlap color
                    vec3 baseColor = (color1 + color2) * 0.3;

                    // Calculate brightness modulation from waves and beat
                    float brightnessMod = 0.8 + totalBrightness * 0.25;

                    // Add beat modulation if enabled
                    if (uShowOverallBeat > 0.5) {
                        brightnessMod += uBeatAmplitude * uOverallBeatIntensity;
                    }

                    // Apply brightness to base color
                    vec3 overlapColor = baseColor * brightnessMod;

                    // Add pulsing effect synchronized with beat frequency
                    if (uShowNodePulse > 0.5 && uNodePulseIntensity > 0.0) {
                        // Use actual audio beat amplitude (already synced to audio phase)
                        float beatPulse = uBeatAmplitude;

                        // Make the dark nodes themselves pulse in and out of existence
                        // At dark nodes (destructive interference), modulate their brightness with the beat

                        // Sharpen the node identification to make them more distinct
                        float nodeSharpness = pow(isDarkNode, 4.0); // Sharp peaks at nodes

                        // The nodes pulse brighter when beat is high, darker when beat is low
                        // This makes them appear to breathe/pulse in sync with the audio
                        float nodeBrightness = nodeSharpness * beatPulse * uNodePulseIntensity;

                        // Add bright glow at node points that pulses with the beat
                        vec3 nodeGlow = uNodePulseColor * nodeBrightness;

                        // Add the overlap effects on top of the natural combination
                        finalColor += nodeGlow * 0.5;
                    }

                    // Overlap glow removed - natural additive combination is sufficient

                    // Scale overlap brightness
                    finalColor *= uIntersectionIntensity;

                    // Advanced beat visualization effects
                    // 1. Ring Breathing: Modulate wave brightness with beat to make rings expand/contract
                    if (uRingBreathing > 0.5) {
                        float breathe = uBeatAmplitude * uRingBreathingIntensity;
                        finalColor *= (1.0 + breathe * totalBrightness);
                    }

                    // 2. Heat Map: Color-code by interference strength (warm=constructive, cool=destructive)
                    if (uHeatMap > 0.5) {
                        // interferenceStrength: 1.0 = constructive (warm), 0.0 = destructive (cool)
                        vec3 warmColor = vec3(1.0, 0.3, 0.0); // Orange/red for constructive
                        vec3 coolColor = vec3(0.0, 0.3, 1.0); // Blue for destructive
                        vec3 heatColor = mix(coolColor, warmColor, interferenceStrength);
                        finalColor = mix(finalColor, finalColor * heatColor, uHeatMapIntensity);
                    }

                    // 3. Node Migration: Dynamic drifting effect like refracted water shadows
                    if (uNodeMigration > 0.5) {
                        // Create continuous time-based phase drift
                        float timeDrift = uTime * uNodeMigrationSpeed * 0.5;

                        // Add beat amplitude for additional movement synchronized with audio
                        float beatDrift = uBeatAmplitude * uNodeMigrationSpeed * 2.0;

                        // Combine time and beat for flowing movement
                        float totalPhaseShift = (timeDrift + beatDrift) * 3.14159;

                        // Sample multiple phase-shifted versions to create flowing shadows
                        float shadowAccum = 0.0;
                        for (int i = 0; i < 3; i++) {
                            float offset = float(i) * 0.4;
                            float phaseShift = totalPhaseShift + offset;

                            // Recompute interference with this phase shift
                            float migratedWave1 = sin((length(pixelPos - uTone1Pos) * uTone1Freq * 0.01 + phaseShift) * 6.28318);
                            float migratedWave2 = sin((length(pixelPos - uTone2Pos) * uTone2Freq * 0.01 + phaseShift) * 6.28318);
                            float migratedInterference = migratedWave1 + migratedWave2;
                            float migratedStrength = abs(migratedInterference) / (abs(migratedWave1) + abs(migratedWave2) + 0.001);
                            float migratedDarkNode = 1.0 - migratedStrength;

                            // Accumulate with decay for layered shadows
                            shadowAccum += pow(migratedDarkNode, 4.0) * (1.0 - float(i) * 0.3);
                        }

                        // Animation multiplier: fade in/out if animate is enabled
                        float animationMod = 1.0;
                        if (uNodeMigrationAnimate > 0.5) {
                            animationMod = (sin(uTime * 2.0) + 1.0) * 0.5;
                        }

                        // Create flowing shadow effect
                        vec3 migrationGlow = uNodePulseColor * shadowAccum * 0.15 * animationMod;
                        finalColor += migrationGlow;
                    }

                    // 4. Zone Toggle: Alternate highlighting constructive vs destructive zones
                    if (uZoneToggle > 0.5) {
                        // Use beat amplitude to toggle between highlighting constructive vs destructive
                        float togglePhase = uBeatAmplitude;

                        // When beat is high, highlight constructive; when low, highlight destructive
                        float constructiveBoost = togglePhase * interferenceStrength * uZoneToggleContrast;
                        float destructiveBoost = (1.0 - togglePhase) * isDarkNode * uZoneToggleContrast;

                        finalColor *= (1.0 + constructiveBoost + destructiveBoost);
                    }

                    // Advanced Node Migration Modes

                    // 5. Node Density Flow: Node spacing changes with frequency ratio and oscillates with beat
                    if (uNodeDensityFlow > 0.5) {
                        // Calculate frequency ratio for consonance detection
                        float freqRatio = max(uTone1Freq, uTone2Freq) / min(uTone1Freq, uTone2Freq);
                        float consonance = 1.0 / (1.0 + abs(freqRatio - floor(freqRatio + 0.5)));

                        // Density oscillation: compress/expand node spacing with beat
                        float densityMod = 1.0 + uBeatAmplitude * uNodeDensityIntensity * 0.5;

                        // Modify wave frequency perception based on density
                        float modifiedNode = isDarkNode * densityMod;

                        // Consonant intervals: calm, stable oscillation
                        // Dissonant intervals: rapid, chaotic flutter
                        float flutterSpeed = mix(2.0, 8.0, 1.0 - consonance);
                        float flutter = sin(uTime * flutterSpeed + modifiedNode * 10.0) * (1.0 - consonance);

                        finalColor *= 1.0 + modifiedNode * 0.2 + flutter * 0.15 * uNodeDensityIntensity;
                    }

                    // 6. Phase Coherence Trails: Dark nodes leave trailing echoes
                    if (uPhaseTrails > 0.5) {
                        // Calculate frequency ratio for consonance
                        float freqRatio = max(uTone1Freq, uTone2Freq) / min(uTone1Freq, uTone2Freq);
                        float consonance = 1.0 / (1.0 + abs(freqRatio - floor(freqRatio + 0.5)));

                        // Trail length based on consonance and settings
                        float trailLength = consonance * uPhaseTrailLength;

                        // Sample trailing positions in time
                        vec3 trailAccum = vec3(0.0);
                        for (int i = 1; i <= 4; i++) {
                            float timeOffset = float(i) * 0.15 * trailLength;
                            float pastPhase = (uTime - timeOffset) * uNodeMigrationSpeed;
                            float pastBeat = sin(pastPhase * 3.14159) * 0.5 + 0.5;

                            // Compute past node positions
                            float pastShift = pastBeat * 3.14159;
                            float pastWave1 = sin((length(pixelPos - uTone1Pos) * uTone1Freq * 0.01 + pastShift) * 6.28318);
                            float pastWave2 = sin((length(pixelPos - uTone2Pos) * uTone2Freq * 0.01 + pastShift) * 6.28318);
                            float pastInterference = pastWave1 + pastWave2;
                            float pastStrength = abs(pastInterference) / (abs(pastWave1) + abs(pastWave2) + 0.001);
                            float pastNode = 1.0 - pastStrength;

                            // Decay trail over distance and time
                            float decay = 1.0 - float(i) * 0.2;
                            trailAccum += uNodePulseColor * pow(pastNode, 4.0) * decay;
                        }

                        // Consonant: long smooth trails, Dissonant: short choppy trails
                        finalColor += trailAccum * 0.1 * consonance * uBeatAmplitude;
                    }

                    // 7. Node Coalescence: Nodes attract/repel based on consonance
                    if (uNodeCoalescence > 0.5) {
                        // Calculate frequency ratio for consonance
                        float freqRatio = max(uTone1Freq, uTone2Freq) / min(uTone1Freq, uTone2Freq);
                        float consonance = 1.0 / (1.0 + abs(freqRatio - floor(freqRatio + 0.5)));

                        // Beat-driven node merging
                        float mergeFactor = uBeatAmplitude * uCoalescenceStrength;

                        // Consonant: nodes merge cleanly (sharp focus)
                        // Dissonant: nodes orbit chaotically (blur/spread)
                        float sharpness = mix(2.0, 8.0, consonance);
                        float coalescedNode = pow(isDarkNode, sharpness);

                        // Add orbital motion for dissonance
                        float orbitSpeed = (1.0 - consonance) * 5.0;
                        float orbitPhase = uTime * orbitSpeed;
                        vec2 orbitOffset = vec2(cos(orbitPhase), sin(orbitPhase)) * isDarkNode * (1.0 - consonance) * 20.0;

                        // Recompute node at orbited position
                        vec2 orbitedPos = pixelPos + orbitOffset;
                        float orbitWave1 = sin(length(orbitedPos - uTone1Pos) * uTone1Freq * 0.01 * 6.28318);
                        float orbitWave2 = sin(length(orbitedPos - uTone2Pos) * uTone2Freq * 0.01 * 6.28318);
                        float orbitNode = 1.0 - abs(orbitWave1 + orbitWave2) / 2.0;

                        finalColor += uNodePulseColor * mix(coalescedNode, orbitNode, 1.0 - consonance) * mergeFactor * 0.3;
                    }

                    // 8. Harmonic Flow Field: Nodes follow flow patterns
                    if (uFlowField > 0.5) {
                        // Calculate frequency ratio for consonance
                        float freqRatio = max(uTone1Freq, uTone2Freq) / min(uTone1Freq, uTone2Freq);
                        float consonance = 1.0 / (1.0 + abs(freqRatio - floor(freqRatio + 0.5)));

                        // Create flow vector field based on wave gradients
                        vec2 gradient1 = normalize(pixelPos - uTone1Pos);
                        vec2 gradient2 = normalize(pixelPos - uTone2Pos);
                        vec2 flowDir = gradient1 + gradient2;

                        // Consonant: smooth laminar flow
                        // Dissonant: turbulent chaotic flow with vortices
                        float turbulence = (1.0 - consonance) * uFlowTurbulence;
                        float vortex = sin(flowDir.x * 5.0 + uTime) * cos(flowDir.y * 5.0 + uTime) * turbulence;

                        // Sample along flow direction
                        vec2 flowOffset = flowDir * uBeatAmplitude * 30.0 + vec2(vortex * 20.0);
                        vec2 flowedPos = pixelPos + flowOffset;

                        float flowWave1 = sin(length(flowedPos - uTone1Pos) * uTone1Freq * 0.01 * 6.28318);
                        float flowWave2 = sin(length(flowedPos - uTone2Pos) * uTone2Freq * 0.01 * 6.28318);
                        float flowNode = 1.0 - abs(flowWave1 + flowWave2) / 2.0;

                        // Visualize flow with node intensity
                        finalColor += uNodePulseColor * pow(flowNode, 3.0) * isDarkNode * 0.25;
                    }

                    // 9. Interference Depth Layers: Multiple stacked phase layers with parallax
                    if (uDepthLayers > 0.5) {
                        // Calculate frequency ratio for consonance
                        float freqRatio = max(uTone1Freq, uTone2Freq) / min(uTone1Freq, uTone2Freq);
                        float consonance = 1.0 / (1.0 + abs(freqRatio - floor(freqRatio + 0.5)));

                        // Consonant: few aligned layers, Dissonant: many competing layers
                        int layerCount = int(mix(float(uDepthLayerCount), 2.0, consonance));

                        vec3 layerAccum = vec3(0.0);
                        for (int i = 0; i < 8; i++) {
                            if (i >= layerCount) break;

                            // Each layer at different depth with parallax shift
                            float depth = float(i) / float(layerCount);
                            float parallaxShift = depth * uDepthParallax * uBeatAmplitude * 50.0;
                            vec2 layerPos = pixelPos + vec2(parallaxShift, parallaxShift * 0.5);

                            // Phase offset per layer
                            float phaseOffset = float(i) * 0.5 + uTime * (1.0 - consonance) * 0.5;

                            float layerWave1 = sin((length(layerPos - uTone1Pos) * uTone1Freq * 0.01 + phaseOffset) * 6.28318);
                            float layerWave2 = sin((length(layerPos - uTone2Pos) * uTone2Freq * 0.01 + phaseOffset) * 6.28318);
                            float layerNode = 1.0 - abs(layerWave1 + layerWave2) / 2.0;

                            // Layer opacity decreases with depth
                            float opacity = 1.0 - depth * 0.7;
                            layerAccum += uNodePulseColor * pow(layerNode, 4.0) * opacity;
                        }

                        finalColor += layerAccum * 0.1;
                    }

                    // ========== EMERGENT BEAT VISUALIZATIONS ==========
                    // These create new visual layers that respond to interference

                    // Calculate frequency ratio for consonance (used by multiple effects)
                    float freqRatio = max(uTone1Freq, uTone2Freq) / min(uTone1Freq, uTone2Freq);
                    float consonance = 1.0 / (1.0 + abs(freqRatio - floor(freqRatio + 0.5)));

                    // Pre-calculate overlap strength for emergent effects
                    float overlapStrength = min(falloff1, falloff2);

                    // 1. Particle Resonance System
                    if (uParticleResonance > 0.5) {
                        // Create pseudo-particles using hash function
                        float particleLayer = 0.0;
                        for (int i = 0; i < 100; i++) {
                            if (i >= uParticleCount) break;

                            // Pseudo-random particle orbit parameters
                            float seed = float(i) * 12.9898;
                            float orbitRadius = fract(sin(seed) * 43758.5453) * 100.0 + 50.0;
                            float orbitSpeed = fract(cos(seed * 1.618) * 43758.5453) * 2.0 + 0.5;
                            float orbitPhase = fract(sin(seed * 2.718) * 43758.5453) * 6.28318;

                            // Particles orbit around the midpoint between speakers
                            vec2 centerPos = (uTone1Pos + uTone2Pos) * 0.5;
                            float angle = uTime * orbitSpeed + orbitPhase;

                            vec2 particlePos = centerPos + vec2(
                                cos(angle) * orbitRadius,
                                sin(angle) * orbitRadius
                            );

                            // Get wave forces at particle position
                            float dist1 = length(particlePos - uTone1Pos);
                            float dist2 = length(particlePos - uTone2Pos);
                            float particleWave1 = sin(dist1 * uTone1Freq * 0.01 * 6.28318);
                            float particleWave2 = sin(dist2 * uTone2Freq * 0.01 * 6.28318);

                            // Particles oscillate strongly at beat frequency
                            float oscillation = sin(uTime * 10.0 + float(i)) * uBeatAmplitude * 30.0;
                            particlePos += normalize(particlePos - centerPos) * oscillation;

                            // Draw particle
                            float dist = length(pixelPos - particlePos);
                            float particleGlow = smoothstep(uParticleSize * 4.0, 0.0, dist);

                            // Brightness based on interference at particle location
                            float particleInterference = (particleWave1 + particleWave2) * 0.5;
                            float particleBrightness = abs(particleInterference);

                            // Consonance: synchronized orbits (uniform), Dissonance: chaotic (varied)
                            float chaos = (1.0 - consonance) * fract(sin(seed * 3.14) * 43758.5453);
                            particleLayer += particleGlow * (0.5 + particleBrightness * 0.5 + chaos * 0.5);
                        }

                        finalColor += uNodePulseColor * particleLayer * 0.2;
                    }

                    // 2. Energy Transfer Arcs - Side-view beat frequency wave (like vibrating rope)
                    if (uEnergyArcs > 0.5) {
                        // Create base line between speakers
                        vec2 arcVec = uTone2Pos - uTone1Pos;
                        float arcLength = length(arcVec);
                        vec2 arcDir = normalize(arcVec);
                        vec2 perpDir = vec2(-arcDir.y, arcDir.x); // Perpendicular for wave displacement

                        // Project pixel onto base line
                        vec2 toPixel = pixelPos - uTone1Pos;
                        float projection = dot(toPixel, arcDir); // Position along arc 0 to arcLength
                        float normalizedPos = projection / arcLength; // 0 to 1

                        // Calculate beat frequency (difference between the two tones)
                        float beatFreq = abs(uTone1Freq - uTone2Freq);

                        // Dissonance creates shakiness and instability in the arc
                        // Consonance: smooth, steady wave
                        // Dissonance: erratic wobbling, multiple competing frequencies, jitter
                        float dissonance = 1.0 - consonance;

                        // Add high-frequency jitter for dissonance
                        float jitterFreq = mix(0.0, 50.0, dissonance); // High freq shake
                        float jitter = sin(uTime * jitterFreq + normalizedPos * 20.0) * dissonance * 3.0;

                        // Add chaotic wobble (multiple competing frequencies)
                        float wobble1 = sin(uTime * 3.7 + normalizedPos * 8.0) * dissonance * 5.0;
                        float wobble2 = sin(uTime * 5.3 - normalizedPos * 12.0) * dissonance * 4.0;
                        float wobble3 = cos(uTime * 7.1 + normalizedPos * 15.0) * dissonance * 3.0;

                        // Amplitude instability - varies along the arc for dissonance
                        float ampNoise = sin(normalizedPos * 10.0 + uTime * 2.0) * dissonance * 0.5;

                        // Side-view wave displacement: sine wave at beat frequency
                        // Amplitude is larger in middle (loose rope), tighter at ends
                        float tensionProfile = sin(normalizedPos * 3.14159); // 0 at ends, 1 in middle
                        float wavePhase = normalizedPos * 3.14159 * 4.0 - uTime * beatFreq * 0.1;
                        float waveDisplacement = sin(wavePhase) * uArcWaveAmplitude * tensionProfile;

                        // Beat amplitude modulates overall wave amplitude
                        waveDisplacement *= (0.5 + uBeatAmplitude * 0.5);

                        // Apply amplitude instability for dissonance
                        waveDisplacement *= (1.0 + ampNoise);

                        // Add all the dissonance effects (jitter + wobbles)
                        waveDisplacement += jitter + wobble1 + wobble2 + wobble3;

                        // Calculate actual wave position
                        vec2 basePoint = uTone1Pos + arcDir * clamp(projection, 0.0, arcLength);
                        vec2 wavePoint = basePoint + perpDir * waveDisplacement;

                        // Distance from pixel to wave point
                        float distToWave = length(pixelPos - wavePoint);

                        // Thickness modulates with local wave amplitude (thicker at peaks)
                        float localAmplitude = abs(sin(wavePhase));
                        float dynamicThickness = uArcThickness * (0.5 + localAmplitude * 0.5);

                        // Dissonance makes thickness unstable (flickering, irregular)
                        float thicknessNoise = sin(uTime * 15.0 + normalizedPos * 30.0) * dissonance * 0.3;
                        dynamicThickness *= (1.0 + thicknessNoise);

                        // Consonance: sharp, defined edge; Dissonance: fuzzy, uncertain edge
                        float edgeSharpness = mix(4.0, 1.0, dissonance);
                        float waveMask = smoothstep(dynamicThickness * edgeSharpness, 0.0, distToWave);

                        // Add harmonic overtones for dissonance (multiple waves)
                        // Consonance: clean single wave, Dissonance: multiple interfering harmonics
                        float branchFactor = dissonance * float(uArcBranching);
                        for (int h = 1; h < 5; h++) {
                            if (float(h) > branchFactor) break;

                            // Harmonic at different frequency and phase
                            float harmonicFreq = float(h + 1);
                            float harmonicPhase = normalizedPos * 3.14159 * 4.0 * harmonicFreq - uTime * beatFreq * 0.1 * harmonicFreq;
                            float harmonicDisplacement = sin(harmonicPhase) * uArcWaveAmplitude * tensionProfile * 0.5 / harmonicFreq;
                            harmonicDisplacement *= (0.5 + uBeatAmplitude * 0.5);

                            // Each harmonic gets its own jitter and wobble
                            float hJitter = sin(uTime * 30.0 * float(h) + normalizedPos * 25.0) * dissonance * 2.0;
                            harmonicDisplacement += hJitter;

                            vec2 harmonicPoint = basePoint + perpDir * harmonicDisplacement;
                            float distToHarmonic = length(pixelPos - harmonicPoint);
                            float harmonicAmp = abs(sin(harmonicPhase));
                            float harmonicThickness = uArcThickness * 0.5 * (0.5 + harmonicAmp * 0.5);

                            // Harmonics also have fuzzy edges
                            waveMask += smoothstep(harmonicThickness * edgeSharpness, 0.0, distToHarmonic) * 0.4 / float(h);
                        }

                        // Brightness based on wave amplitude and beat
                        float intensity = waveMask * (0.7 + uBeatAmplitude * 0.3);

                        // Dissonance creates flickering/strobing intensity
                        float flicker = sin(uTime * 20.0) * sin(uTime * 13.0) * dissonance * 0.3;
                        intensity *= (1.0 + flicker);

                        // Color varies along wave: bright at antinodes, dim at nodes
                        vec3 waveColor = mix(uNodePulseColor * 0.4, uNodePulseColor, localAmplitude);

                        // Dissonance adds chaotic color shifting
                        float colorShift = sin(uTime * 8.0 + normalizedPos * 10.0) * dissonance * 0.3;
                        waveColor *= (1.0 + colorShift);

                        finalColor += waveColor * intensity * 0.5;
                    }

                    // 3. Pressure Wave Atmosphere
                    if (uPressureWave > 0.5) {
                        // Calculate overall pressure from both waves
                        float pressure = (wave1 + wave2) * 0.5;

                        // Pressure modulates canvas brightness - breathing effect
                        float breathe = uBeatAmplitude * uPressureIntensity;

                        // Consonance: deep slow breathing, Dissonance: rapid shallow gasping
                        float breathSpeed = mix(1.0, 4.0, 1.0 - consonance);
                        float breathPhase = sin(uTime * breathSpeed) * breathe;

                        // Apply pressure modulation to entire canvas
                        float pressureMod = 1.0 + breathPhase * 0.3 + pressure * 0.1 * uPressureIntensity;
                        finalColor *= pressureMod;
                    }

                    // 4. Membrane Tension Ripples
                    if (uMembraneRipples > 0.5) {
                        // Membrane wobbles from interference pressure
                        float membraneHeight = isDarkNode;

                        // Generate secondary ripples perpendicular to interference rings
                        vec2 centerPos = (uTone1Pos + uTone2Pos) * 0.5;
                        vec2 toCenter = pixelPos - centerPos;
                        float radialDist = length(toCenter);

                        // Consonance: large slow undulations, Dissonance: small fast ripples
                        float rippleFreq = mix(0.02, 0.08, 1.0 - consonance);
                        float rippleSpeed = mix(2.0, 8.0, 1.0 - consonance);
                        float ripple = sin(radialDist * rippleFreq - uTime * rippleSpeed) * uRippleAmplitude;
                        ripple *= uBeatAmplitude;

                        // Ripple modulates the existing pattern
                        float rippleEffect = membraneHeight * ripple * 0.3;
                        finalColor *= 1.0 + rippleEffect;
                    }

                    // 5. Harmonic Crystal Growth
                    if (uCrystalGrowth > 0.5) {
                        // Crystals grow from speaker positions along constructive interference paths
                        vec3 crystalLayer = vec3(0.0);

                        for (int s = 0; s < 2; s++) {
                            vec2 speakerPos = s == 0 ? uTone1Pos : uTone2Pos;
                            vec2 fromSpeaker = pixelPos - speakerPos;
                            float distFromSpeaker = length(fromSpeaker);
                            vec2 growthDir = normalize(fromSpeaker);

                            // Crystal grows along lines of high interference
                            float growthPath = interferenceStrength;

                            // Growth pulses with beat - extends and retracts
                            float growthPhase = uBeatAmplitude * uCrystalGrowthSpeed;
                            float maxGrowth = 200.0 * (1.0 + growthPhase);

                            // Consonance: large symmetric structures, Dissonance: small irregular shards
                            int branches = int(mix(2.0, float(uCrystalComplexity) * 2.0, consonance));
                            for (int b = 0; b < 10; b++) {
                                if (b >= branches) break;

                                float branchAngle = float(b) * 6.28318 / float(branches);
                                vec2 branchDir = vec2(cos(branchAngle), sin(branchAngle));

                                // Check if pixel is along this branch direction
                                float alignment = dot(growthDir, branchDir);
                                if (alignment > 0.8) {
                                    // Crystal structure: nodes at regular intervals
                                    float nodeSpacing = mix(15.0, 30.0, consonance);
                                    float nodePhase = mod(distFromSpeaker - uTime * uCrystalGrowthSpeed * 10.0, nodeSpacing);
                                    float isNode = smoothstep(5.0, 0.0, abs(nodePhase - nodeSpacing * 0.5));

                                    // Crystals only exist where growth is active
                                    float inGrowthZone = smoothstep(maxGrowth + 20.0, maxGrowth - 20.0, distFromSpeaker);
                                    float crystalIntensity = isNode * inGrowthZone * growthPath;

                                    // Age-based transparency: older = more solid
                                    float age = distFromSpeaker / maxGrowth;
                                    float opacity = smoothstep(0.0, 0.5, age);

                                    crystalLayer += uNodePulseColor * crystalIntensity * opacity * 0.5;
                                }
                            }
                        }

                        finalColor += crystalLayer * 0.3;
                    }

                    // finalColor already has the natural combination of both tones
                    // Just add optional special overlap effects on top if enabled

                    // The special overlap effects (node pulse, ring breathing, etc.)
                    // are already added to finalColor above in their respective sections

                    // Optionally reduce alpha at dark nodes for pulsing transparency effect
                    if (uShowNodePulse > 0.5) {
                        // At dark nodes, reduce alpha slightly to show the pulsing effect better
                        finalAlpha *= mix(0.85, 1.0, interferenceStrength);
                    }
                }

                // Apply drum push factor (brightness modulation from z-depth illusion)
                finalColor *= drumPushFactor;

                finalColor = clamp(finalColor, 0.0, 1.0);
                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    initShaders() {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, this.getVertexShaderSource());
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, this.getFragmentShaderSource());

        if (!vertexShader || !fragmentShader) {
            throw new Error('Failed to compile shaders');
        }

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(this.program));
            throw new Error('Failed to link shader program');
        }

        this.gl.useProgram(this.program);
    }

    initBuffers() {
        // Fullscreen quad vertices
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const positionLoc = this.gl.getAttribLocation(this.program, 'aPosition');
        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);
    }

    initUniforms() {
        // Cache all uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'uResolution'),
            tone1Pos: this.gl.getUniformLocation(this.program, 'uTone1Pos'),
            tone2Pos: this.gl.getUniformLocation(this.program, 'uTone2Pos'),
            tone1Freq: this.gl.getUniformLocation(this.program, 'uTone1Freq'),
            tone2Freq: this.gl.getUniformLocation(this.program, 'uTone2Freq'),
            tone1Color: this.gl.getUniformLocation(this.program, 'uTone1Color'),
            tone2Color: this.gl.getUniformLocation(this.program, 'uTone2Color'),
            time: this.gl.getUniformLocation(this.program, 'uTime'),
            amplitude: this.gl.getUniformLocation(this.program, 'uAmplitude'),
            harmonicOrder: this.gl.getUniformLocation(this.program, 'uHarmonicOrder'),
            isPlayingTone1: this.gl.getUniformLocation(this.program, 'uIsPlayingTone1'),
            isPlayingTone2: this.gl.getUniformLocation(this.program, 'uIsPlayingTone2'),
            tone1RevealRadiusMin: this.gl.getUniformLocation(this.program, 'uTone1RevealRadiusMin'),
            tone1RevealRadiusMax: this.gl.getUniformLocation(this.program, 'uTone1RevealRadiusMax'),
            tone2RevealRadiusMin: this.gl.getUniformLocation(this.program, 'uTone2RevealRadiusMin'),
            tone2RevealRadiusMax: this.gl.getUniformLocation(this.program, 'uTone2RevealRadiusMax'),
            beatAmplitude: this.gl.getUniformLocation(this.program, 'uBeatAmplitude'),
            showOverallBeat: this.gl.getUniformLocation(this.program, 'uShowOverallBeat'),
            overallBeatIntensity: this.gl.getUniformLocation(this.program, 'uOverallBeatIntensity'),
            showNodePulse: this.gl.getUniformLocation(this.program, 'uShowNodePulse'),
            nodePulseIntensity: this.gl.getUniformLocation(this.program, 'uNodePulseIntensity'),
            nodePulseColor: this.gl.getUniformLocation(this.program, 'uNodePulseColor'),
            ringBreathing: this.gl.getUniformLocation(this.program, 'uRingBreathing'),
            ringBreathingIntensity: this.gl.getUniformLocation(this.program, 'uRingBreathingIntensity'),
            heatMap: this.gl.getUniformLocation(this.program, 'uHeatMap'),
            heatMapIntensity: this.gl.getUniformLocation(this.program, 'uHeatMapIntensity'),
            nodeMigration: this.gl.getUniformLocation(this.program, 'uNodeMigration'),
            nodeMigrationSpeed: this.gl.getUniformLocation(this.program, 'uNodeMigrationSpeed'),
            nodeMigrationAnimate: this.gl.getUniformLocation(this.program, 'uNodeMigrationAnimate'),
            nodeDensityFlow: this.gl.getUniformLocation(this.program, 'uNodeDensityFlow'),
            nodeDensityIntensity: this.gl.getUniformLocation(this.program, 'uNodeDensityIntensity'),
            phaseTrails: this.gl.getUniformLocation(this.program, 'uPhaseTrails'),
            phaseTrailLength: this.gl.getUniformLocation(this.program, 'uPhaseTrailLength'),
            nodeCoalescence: this.gl.getUniformLocation(this.program, 'uNodeCoalescence'),
            coalescenceStrength: this.gl.getUniformLocation(this.program, 'uCoalescenceStrength'),
            flowField: this.gl.getUniformLocation(this.program, 'uFlowField'),
            flowTurbulence: this.gl.getUniformLocation(this.program, 'uFlowTurbulence'),
            depthLayers: this.gl.getUniformLocation(this.program, 'uDepthLayers'),
            depthLayerCount: this.gl.getUniformLocation(this.program, 'uDepthLayerCount'),
            depthParallax: this.gl.getUniformLocation(this.program, 'uDepthParallax'),
            zoneToggle: this.gl.getUniformLocation(this.program, 'uZoneToggle'),
            zoneToggleContrast: this.gl.getUniformLocation(this.program, 'uZoneToggleContrast'),
            particleResonance: this.gl.getUniformLocation(this.program, 'uParticleResonance'),
            particleCount: this.gl.getUniformLocation(this.program, 'uParticleCount'),
            particleSize: this.gl.getUniformLocation(this.program, 'uParticleSize'),
            energyArcs: this.gl.getUniformLocation(this.program, 'uEnergyArcs'),
            arcThickness: this.gl.getUniformLocation(this.program, 'uArcThickness'),
            arcBranching: this.gl.getUniformLocation(this.program, 'uArcBranching'),
            arcWaveAmplitude: this.gl.getUniformLocation(this.program, 'uArcWaveAmplitude'),
            pressureWave: this.gl.getUniformLocation(this.program, 'uPressureWave'),
            pressureIntensity: this.gl.getUniformLocation(this.program, 'uPressureIntensity'),
            canvasStretch: this.gl.getUniformLocation(this.program, 'uCanvasStretch'),
            stretchAmount: this.gl.getUniformLocation(this.program, 'uStretchAmount'),
            drumPush: this.gl.getUniformLocation(this.program, 'uDrumPush'),
            drumDepth: this.gl.getUniformLocation(this.program, 'uDrumDepth'),
            gravityWell: this.gl.getUniformLocation(this.program, 'uGravityWell'),
            gravityStrength: this.gl.getUniformLocation(this.program, 'uGravityStrength'),
            gravityWellCount: this.gl.getUniformLocation(this.program, 'uGravityWellCount'),
            gravityVariant1: this.gl.getUniformLocation(this.program, 'uGravityVariant1'),
            gravityAmpRange: this.gl.getUniformLocation(this.program, 'uGravityAmpRange'),
            gravityWellSize: this.gl.getUniformLocation(this.program, 'uGravityWellSize'),
            gravityVariant2: this.gl.getUniformLocation(this.program, 'uGravityVariant2'),
            repulsionForce: this.gl.getUniformLocation(this.program, 'uRepulsionForce'),
            gravityVariant3: this.gl.getUniformLocation(this.program, 'uGravityVariant3'),
            vortexSpeed: this.gl.getUniformLocation(this.program, 'uVortexSpeed'),
            spiralTightness: this.gl.getUniformLocation(this.program, 'uSpiralTightness'),
            gravityVariant4: this.gl.getUniformLocation(this.program, 'uGravityVariant4'),
            tidalStrength: this.gl.getUniformLocation(this.program, 'uTidalStrength'),
            gravityVariant5: this.gl.getUniformLocation(this.program, 'uGravityVariant5'),
            pulseDepth: this.gl.getUniformLocation(this.program, 'uPulseDepth'),
            eventHorizon: this.gl.getUniformLocation(this.program, 'uEventHorizon'),
            gravityVariant6: this.gl.getUniformLocation(this.program, 'uGravityVariant6'),
            attractionRepulsionForce: this.gl.getUniformLocation(this.program, 'uAttractionRepulsionForce'),
            wellJitter: this.gl.getUniformLocation(this.program, 'uWellJitter'),
            jitterIntensity: this.gl.getUniformLocation(this.program, 'uJitterIntensity'),
            wellBreathing: this.gl.getUniformLocation(this.program, 'uWellBreathing'),
            consonantBreathSpeed: this.gl.getUniformLocation(this.program, 'uConsonantBreathSpeed'),
            dissonantPulseSpeed: this.gl.getUniformLocation(this.program, 'uDissonantPulseSpeed'),
            lensRefraction: this.gl.getUniformLocation(this.program, 'uLensRefraction'),
            refractionAmount: this.gl.getUniformLocation(this.program, 'uRefractionAmount'),
            lensSize: this.gl.getUniformLocation(this.program, 'uLensSize'),
            temporalShift: this.gl.getUniformLocation(this.program, 'uTemporalShift'),
            timeOffset: this.gl.getUniformLocation(this.program, 'uTimeOffset'),
            temporalLayers: this.gl.getUniformLocation(this.program, 'uTemporalLayers'),
            membraneRipples: this.gl.getUniformLocation(this.program, 'uMembraneRipples'),
            rippleAmplitude: this.gl.getUniformLocation(this.program, 'uRippleAmplitude'),
            crystalGrowth: this.gl.getUniformLocation(this.program, 'uCrystalGrowth'),
            crystalComplexity: this.gl.getUniformLocation(this.program, 'uCrystalComplexity'),
            crystalGrowthSpeed: this.gl.getUniformLocation(this.program, 'uCrystalGrowthSpeed'),
            useBoundary: this.gl.getUniformLocation(this.program, 'uUseBoundary'),
            boundaryRadius: this.gl.getUniformLocation(this.program, 'uBoundaryRadius'),
            speakerRadius: this.gl.getUniformLocation(this.program, 'uSpeakerRadius'),
            useFoggyEdge: this.gl.getUniformLocation(this.program, 'uUseFoggyEdge'),
            foggyEdgeStart: this.gl.getUniformLocation(this.program, 'uFoggyEdgeStart'),
            rootIntensity: this.gl.getUniformLocation(this.program, 'uRootIntensity'),
            intervalIntensity: this.gl.getUniformLocation(this.program, 'uIntervalIntensity'),
            intersectionIntensity: this.gl.getUniformLocation(this.program, 'uIntersectionIntensity'),
            usePianoMode: this.gl.getUniformLocation(this.program, 'uUsePianoMode'),
            chromaticColors: this.gl.getUniformLocation(this.program, 'uChromaticColors'),
            rootFreq: this.gl.getUniformLocation(this.program, 'uRootFreq'),
            rootTone: this.gl.getUniformLocation(this.program, 'uRootTone')
        };
    }

    hexToRgb(hex) {
        return ConsonanceColorSystem.hexToRgb(hex);
    }

    getRevealRadius(toneStartTime, toneStopTime, isPlaying, toneX, toneY, width, height) {
        const maxDist = Math.sqrt(width * width + height * height);
        const revealSpeed = 300; // Pulse speed setting

        if (isPlaying && toneStartTime) {
            // Expanding - tone is playing
            const elapsed = performance.now() - toneStartTime;
            const radius = (elapsed / 1000) * revealSpeed;
            return Math.min(radius, maxDist);
        } else if (toneStopTime && toneStartTime) {
            // Shrinking from center outward - show a "dead zone" expanding from center
            const elapsedSinceStopped = performance.now() - toneStopTime;
            const deadZoneRadius = (elapsedSinceStopped / 1000) * revealSpeed;

            // The maximum expansion when stopped
            const totalExpanded = toneStopTime - toneStartTime;
            const maxRadius = Math.min((totalExpanded / 1000) * revealSpeed, maxDist);

            // If dead zone has caught up to the edge, everything is gone
            if (deadZoneRadius >= maxRadius) {
                return 0;
            }

            // Return object with both radii so we can check if point is in the visible ring
            return { minRadius: deadZoneRadius, maxRadius: maxRadius };
        }

        return 0;
    }

    updateUniforms() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const time = (performance.now() - this.startTime) / 1000; // Convert to seconds
        const state = this.audioController.getState();
        if (this.alwaysShowWaves && !this.debugLogged) {
            interferenceDebugLog('InterferenceVisualization (combined) state snapshot', {
                tone1Freq: this.tone1Freq,
                tone2Freq: this.tone2Freq,
                state
            });
            this.debugLogged = true;
        }

        // Calculate reveal radii for expanding wave effect
        const tone1RevealRadius = this.getRevealRadius(
            state.tone1StartTime,
            state.tone1StopTime,
            state.isPlayingTone1,
            this.tone1X,
            this.tone1Y,
            width,
            height
        );
        const tone2RevealRadius = this.getRevealRadius(
            state.tone2StartTime,
            state.tone2StopTime,
            state.isPlayingTone2,
            this.tone2X,
            this.tone2Y,
            width,
            height
        );

        // Handle reveal radius - can be a number (expanding) or object with minRadius/maxRadius (shrinking ring)
        if (this.alwaysShowWaves) {
            this.tone1RevealRadiusMin = 0;
            this.tone1RevealRadiusMax = 9999;
        } else if (typeof tone1RevealRadius === 'number') {
            this.tone1RevealRadiusMin = 0;
            this.tone1RevealRadiusMax = tone1RevealRadius;
        } else if (tone1RevealRadius && tone1RevealRadius.minRadius !== undefined) {
            this.tone1RevealRadiusMin = tone1RevealRadius.minRadius;
            this.tone1RevealRadiusMax = tone1RevealRadius.maxRadius;
        } else {
            // Tone is fully stopped or never started
            this.tone1RevealRadiusMin = 0;
            this.tone1RevealRadiusMax = tone1RevealRadius === 0 ? 0 : 9999;
        }

        if (this.alwaysShowWaves) {
            this.tone2RevealRadiusMin = 0;
            this.tone2RevealRadiusMax = 9999;
        } else if (typeof tone2RevealRadius === 'number') {
            this.tone2RevealRadiusMin = 0;
            this.tone2RevealRadiusMax = tone2RevealRadius;
        } else if (tone2RevealRadius && tone2RevealRadius.minRadius !== undefined) {
            this.tone2RevealRadiusMin = tone2RevealRadius.minRadius;
            this.tone2RevealRadiusMax = tone2RevealRadius.maxRadius;
        } else {
            // Tone is fully stopped or never started
            this.tone2RevealRadiusMin = 0;
            this.tone2RevealRadiusMax = tone2RevealRadius === 0 ? 0 : 9999;
        }

        // Auto-sync audio volume with reveal radius expansion (if enabled)
        if (this.settings.autoVolumeSync && this.audioController && !this.alwaysShowWaves) {
            const maxDist = Math.sqrt(width * width + height * height);

            // Calculate tone 1 volume based on expansion
            let tone1Volume = 1.0; // Default full volume
            if (typeof tone1RevealRadius === 'number' && tone1RevealRadius < maxDist) {
                // Expanding - volume proportional to expansion (use square root for more natural curve)
                const expansion = tone1RevealRadius / maxDist;
                tone1Volume = Math.sqrt(expansion);
            } else if (tone1RevealRadius && tone1RevealRadius.minRadius !== undefined) {
                // Shrinking ring - calculate remaining visible area
                const visibleRing = tone1RevealRadius.maxRadius - tone1RevealRadius.minRadius;
                const expansion = visibleRing / maxDist;
                tone1Volume = Math.sqrt(expansion);
            }

            // Calculate tone 2 volume based on expansion
            let tone2Volume = 1.0; // Default full volume
            if (typeof tone2RevealRadius === 'number' && tone2RevealRadius < maxDist) {
                // Expanding - volume proportional to expansion (use square root for more natural curve)
                const expansion = tone2RevealRadius / maxDist;
                tone2Volume = Math.sqrt(expansion);
            } else if (tone2RevealRadius && tone2RevealRadius.minRadius !== undefined) {
                // Shrinking ring - calculate remaining visible area
                const visibleRing = tone2RevealRadius.maxRadius - tone2RevealRadius.minRadius;
                const expansion = visibleRing / maxDist;
                tone2Volume = Math.sqrt(expansion);
            }

            // Apply volume to audio controller
            this.audioController.setTone1Volume(tone1Volume);
            this.audioController.setTone2Volume(tone2Volume);
        }

        // Calculate absolute positions
        const tone1X = width * this.tone1X;
        const tone1Y = height * this.tone1Y;
        const tone2X = width * this.tone2X;
        const tone2Y = height * this.tone2Y;

        // Update all uniforms
        this.gl.uniform2f(this.uniforms.resolution, width, height);
        this.gl.uniform2f(this.uniforms.tone1Pos, tone1X, tone1Y);
        this.gl.uniform2f(this.uniforms.tone2Pos, tone2X, tone2Y);
        this.gl.uniform1f(this.uniforms.tone1Freq, this.tone1Freq);
        this.gl.uniform1f(this.uniforms.tone2Freq, this.tone2Freq);

        const tone1Rgb = this.hexToRgb(this.settings.tone1Color);
        const tone2Rgb = this.hexToRgb(this.settings.tone2Color);
        this.gl.uniform3f(this.uniforms.tone1Color, tone1Rgb[0], tone1Rgb[1], tone1Rgb[2]);
        this.gl.uniform3f(this.uniforms.tone2Color, tone2Rgb[0], tone2Rgb[1], tone2Rgb[2]);

        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform1f(this.uniforms.amplitude, this.settings.amplitude);
        this.gl.uniform1i(this.uniforms.harmonicOrder, this.settings.harmonicOrder);
        const tone1Active = this.alwaysShowWaves || state.isPlayingTone1;
        const tone2Active = this.alwaysShowWaves || state.isPlayingTone2;
        this.gl.uniform1i(this.uniforms.isPlayingTone1, tone1Active ? 1 : 0);
        this.gl.uniform1i(this.uniforms.isPlayingTone2, tone2Active ? 1 : 0);
        this.gl.uniform1f(this.uniforms.tone1RevealRadiusMin, this.tone1RevealRadiusMin || 0);
        this.gl.uniform1f(this.uniforms.tone1RevealRadiusMax, this.tone1RevealRadiusMax || 9999);
        this.gl.uniform1f(this.uniforms.tone2RevealRadiusMin, this.tone2RevealRadiusMin || 0);
        this.gl.uniform1f(this.uniforms.tone2RevealRadiusMax, this.tone2RevealRadiusMax || 9999);
        this.gl.uniform1f(this.uniforms.beatAmplitude, state.beatAmplitude || 0);
        this.gl.uniform1f(this.uniforms.showOverallBeat, this.settings.showOverallBeat ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.overallBeatIntensity, this.settings.overallBeatIntensity);
        this.gl.uniform1f(this.uniforms.showNodePulse, this.settings.showNodePulse ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.nodePulseIntensity, this.settings.nodePulseIntensity);

        // Parse node pulse color
        const nodePulseColor = this.hexToRgb(this.settings.nodePulseColor);
        this.gl.uniform3f(this.uniforms.nodePulseColor, nodePulseColor[0], nodePulseColor[1], nodePulseColor[2]);

        // Advanced beat visualizations
        this.gl.uniform1f(this.uniforms.ringBreathing, this.settings.ringBreathing ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.ringBreathingIntensity, this.settings.ringBreathingIntensity);
        this.gl.uniform1f(this.uniforms.heatMap, this.settings.heatMap ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.heatMapIntensity, this.settings.heatMapIntensity);
        this.gl.uniform1f(this.uniforms.nodeMigration, this.settings.nodeMigration ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.nodeMigrationSpeed, this.settings.nodeMigrationSpeed);
        this.gl.uniform1f(this.uniforms.nodeMigrationAnimate, this.settings.nodeMigrationAnimate ? 1.0 : 0.0);

        // Advanced node migration modes
        this.gl.uniform1f(this.uniforms.nodeDensityFlow, this.settings.nodeDensityFlow ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.nodeDensityIntensity, this.settings.nodeDensityIntensity);
        this.gl.uniform1f(this.uniforms.phaseTrails, this.settings.phaseTrails ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.phaseTrailLength, this.settings.phaseTrailLength);
        this.gl.uniform1f(this.uniforms.nodeCoalescence, this.settings.nodeCoalescence ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.coalescenceStrength, this.settings.coalescenceStrength);
        this.gl.uniform1f(this.uniforms.flowField, this.settings.flowField ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.flowTurbulence, this.settings.flowTurbulence);
        this.gl.uniform1f(this.uniforms.depthLayers, this.settings.depthLayers ? 1.0 : 0.0);
        this.gl.uniform1i(this.uniforms.depthLayerCount, this.settings.depthLayerCount);
        this.gl.uniform1f(this.uniforms.depthParallax, this.settings.depthParallax);

        this.gl.uniform1f(this.uniforms.zoneToggle, this.settings.zoneToggle ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.zoneToggleContrast, this.settings.zoneToggleContrast);

        // Emergent beat visualizations
        this.gl.uniform1f(this.uniforms.particleResonance, this.settings.particleResonance ? 1.0 : 0.0);
        this.gl.uniform1i(this.uniforms.particleCount, this.settings.particleCount);
        this.gl.uniform1f(this.uniforms.particleSize, this.settings.particleSize);
        this.gl.uniform1f(this.uniforms.energyArcs, this.settings.energyArcs ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.arcThickness, this.settings.arcThickness);
        this.gl.uniform1i(this.uniforms.arcBranching, this.settings.arcBranching);
        this.gl.uniform1f(this.uniforms.arcWaveAmplitude, this.settings.arcWaveAmplitude);
        this.gl.uniform1f(this.uniforms.pressureWave, this.settings.pressureWave ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.pressureIntensity, this.settings.pressureIntensity);
        this.gl.uniform1f(this.uniforms.canvasStretch, this.settings.canvasStretch ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.stretchAmount, this.settings.stretchAmount);
        this.gl.uniform1f(this.uniforms.drumPush, this.settings.drumPush ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.drumDepth, this.settings.drumDepth);
        this.gl.uniform1f(this.uniforms.gravityWell, this.settings.gravityWell ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.gravityStrength, this.settings.gravityStrength);
        this.gl.uniform1i(this.uniforms.gravityWellCount, this.settings.gravityWellCount);
        this.gl.uniform1f(this.uniforms.gravityVariant1, this.settings.gravityVariant1 ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.gravityAmpRange, this.settings.gravityAmpRange);
        this.gl.uniform1f(this.uniforms.gravityWellSize, this.settings.gravityWellSize);
        this.gl.uniform1f(this.uniforms.gravityVariant2, this.settings.gravityVariant2 ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.repulsionForce, this.settings.repulsionForce);
        this.gl.uniform1f(this.uniforms.gravityVariant3, this.settings.gravityVariant3 ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.vortexSpeed, this.settings.vortexSpeed);
        this.gl.uniform1f(this.uniforms.spiralTightness, this.settings.spiralTightness);
        this.gl.uniform1f(this.uniforms.gravityVariant4, this.settings.gravityVariant4 ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.tidalStrength, this.settings.tidalStrength);
        this.gl.uniform1f(this.uniforms.gravityVariant5, this.settings.gravityVariant5 ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.pulseDepth, this.settings.pulseDepth);
        this.gl.uniform1f(this.uniforms.eventHorizon, this.settings.eventHorizon);
        this.gl.uniform1f(this.uniforms.gravityVariant6, this.settings.gravityVariant6 ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.attractionRepulsionForce, this.settings.attractionRepulsionForce);
        this.gl.uniform1f(this.uniforms.wellJitter, this.settings.wellJitter ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.jitterIntensity, this.settings.jitterIntensity);
        this.gl.uniform1f(this.uniforms.wellBreathing, this.settings.wellBreathing ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.consonantBreathSpeed, this.settings.consonantBreathSpeed);
        this.gl.uniform1f(this.uniforms.dissonantPulseSpeed, this.settings.dissonantPulseSpeed);
        this.gl.uniform1f(this.uniforms.lensRefraction, this.settings.lensRefraction ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.refractionAmount, this.settings.refractionAmount);
        this.gl.uniform1f(this.uniforms.lensSize, this.settings.lensSize);
        this.gl.uniform1f(this.uniforms.temporalShift, this.settings.temporalShift ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.timeOffset, this.settings.timeOffset);
        this.gl.uniform1i(this.uniforms.temporalLayers, this.settings.temporalLayers);
        this.gl.uniform1f(this.uniforms.membraneRipples, this.settings.membraneRipples ? 1.0 : 0.0);
        this.gl.uniform1f(this.uniforms.rippleAmplitude, this.settings.rippleAmplitude);
        this.gl.uniform1f(this.uniforms.crystalGrowth, this.settings.crystalGrowth ? 1.0 : 0.0);
        this.gl.uniform1i(this.uniforms.crystalComplexity, this.settings.crystalComplexity);
        this.gl.uniform1f(this.uniforms.crystalGrowthSpeed, this.settings.crystalGrowthSpeed);

        this.gl.uniform1i(this.uniforms.useBoundary, this.settings.useBoundary ? 1 : 0);
        this.gl.uniform1f(this.uniforms.boundaryRadius, this.settings.boundaryRadius);
        this.gl.uniform1f(this.uniforms.speakerRadius, this.settings.speakerRadius);
        this.gl.uniform1i(this.uniforms.useFoggyEdge, this.settings.useFoggyEdge ? 1 : 0);
        this.gl.uniform1f(this.uniforms.foggyEdgeStart, this.settings.foggyEdgeStart);
        this.gl.uniform1f(this.uniforms.rootIntensity, this.settings.rootIntensity);
        this.gl.uniform1f(this.uniforms.intervalIntensity, this.settings.intervalIntensity);
        this.gl.uniform1f(this.uniforms.intersectionIntensity, this.settings.intersectionIntensity);
        this.gl.uniform1i(this.uniforms.usePianoMode, this.settings.colorMode === 'piano' ? 1 : 0);
        this.gl.uniform1f(this.uniforms.rootFreq, this.settings.rootFreq);
        this.gl.uniform1i(this.uniforms.rootTone, this.rootTone);

        // Upload chromatic colors array
        const flatColors = this.chromaticColors.flat();
        this.gl.uniform3fv(this.uniforms.chromaticColors, flatColors);
    }

    render() {
        if (this.debugFrameCount < 3) {
            interferenceDebugLog('InterferenceVisualization render tick', {
                pixelWidth: this.canvas.width,
                pixelHeight: this.canvas.height,
                cssWidth: this.cssWidth,
                cssHeight: this.cssHeight,
                ratio: this.devicePixelRatio,
                tone1Freq: this.tone1Freq,
                tone2Freq: this.tone2Freq,
                alwaysShowWaves: this.alwaysShowWaves
            });
            this.debugFrameCount++;
        }

        const currentRatio = window.devicePixelRatio || 1;
        if (currentRatio !== this.devicePixelRatio) {
            this.resize();
        }

        // Update colors based on consonance/dissonance
        const rootFreq = (this.rootTone == 1) ? this.tone1Freq : this.tone2Freq;
        this.settings.tone1Color = this.getFrequencyColor(this.tone1Freq, rootFreq);
        this.settings.tone2Color = this.getFrequencyColor(this.tone2Freq, rootFreq);

        // Get beat amplitude from audio controller
        const beatAmplitude = this.audioController.getBeatAmplitude();

        // Clear with black background
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Enable blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Update uniforms
        this.updateUniforms();

        // Draw fullscreen quad
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        const glError = this.gl.getError();
        if (glError !== this.gl.NO_ERROR) {
            console.error('InterferenceVisualization WebGL error', glError);
        }

        // Render 2D overlay (speakers)
        this.renderOverlay();
    }

    renderOverlay() {
        if (!this.overlayRenderer) return;

        // Use pixel dimensions for calculation, then convert to CSS for overlay rendering
        const pixelWidth = this.canvas.width;
        const pixelHeight = this.canvas.height;
        // Always get current ratio to handle dynamic changes
        const ratio = window.devicePixelRatio || 1;
        const state = this.audioController.getState();

        // Calculate positions in pixel space, then convert to CSS space for overlay
        const tone1State = {
            x: (pixelWidth * this.tone1X) / ratio,
            y: (pixelHeight * this.tone1Y) / ratio,
            color: this.settings.tone1Color,
            label: 'T1',
            isActive: state.isPlayingTone1
        };

        const tone2State = {
            x: (pixelWidth * this.tone2X) / ratio,
            y: (pixelHeight * this.tone2Y) / ratio,
            color: this.settings.tone2Color,
            label: 'T2',
            isActive: state.isPlayingTone2
        };

        // Debug logging for Mac Chrome issue
        if (interferenceDebugEnabled()) {
            console.log('renderOverlay positions:', {
                pixelWidth,
                pixelHeight,
                ratio,
                cssWidth: this.cssWidth,
                cssHeight: this.cssHeight,
                tone1X_percentage: this.tone1X,
                tone1X_pixel: pixelWidth * this.tone1X,
                tone1X_css: tone1State.x,
                tone2X_percentage: this.tone2X,
                tone2X_pixel: pixelWidth * this.tone2X,
                tone2X_css: tone2State.x
            });
        }

        this.overlayRenderer.render(tone1State, tone2State);
    }


    start() {
        if (this.animationFrameId) {
            return;
        }

        // Re-check and initialize frequencies from DOM in case they weren't available in constructor
        this.ensureFrequenciesInitialized();

        const animate = () => {
            this.render();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    ensureFrequenciesInitialized() {
        // Check if frequencies are invalid and try to get them from DOM
        if (isNaN(this.tone1Freq) || this.tone1Freq <= 0 || isNaN(this.tone2Freq) || this.tone2Freq <= 0) {
            const tone1FreqSlider = this.elements.tone1FreqSlider;
            const tone2FreqSlider = this.elements.tone2FreqSlider;

            const freq1 = tone1FreqSlider ? parseFloat(tone1FreqSlider.value) : NaN;
            const freq2 = tone2FreqSlider ? parseFloat(tone2FreqSlider.value) : NaN;

            if (!isNaN(freq1) && freq1 > 0) this.tone1Freq = freq1;
            else if (isNaN(this.tone1Freq) || this.tone1Freq <= 0) this.tone1Freq = 440;

            if (!isNaN(freq2) && freq2 > 0) this.tone2Freq = freq2;
            else if (isNaN(this.tone2Freq) || this.tone2Freq <= 0) this.tone2Freq = 554;
        }
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }


    stopAll() {
        this.audioController.stopBoth();
    }

    setRootTone(toneNumber) {
        this.rootTone = toneNumber;
    }

    setFrequencies(rootFreq, intervalFreq, { updateAudio = true } = {}) {
        this.tone1Freq = rootFreq;
        this.tone2Freq = intervalFreq;
        this.settings.rootFreq = rootFreq;

        const { tone1FreqSlider, tone1FreqNum, tone2FreqSlider, tone2FreqNum } = this.elements;
        if (tone1FreqSlider) tone1FreqSlider.value = rootFreq;
        if (tone1FreqNum) tone1FreqNum.value = Number(rootFreq).toFixed(2);
        if (tone2FreqSlider) tone2FreqSlider.value = intervalFreq;
        if (tone2FreqNum) tone2FreqNum.value = Number(intervalFreq).toFixed(2);

        if (this.audioController) {
            this.audioController.setFrequencies(this.tone1Freq, this.tone2Freq);
            if (updateAudio && typeof this.audioController.updatePlayingFrequencies === 'function') {
                this.audioController.updatePlayingFrequencies();
            }
        }
    }

    updateRootNote(note, freq) {
        this.settings.rootNote = note;
        this.settings.rootFreq = freq;
    }

    // Consonance-based color system from original Cymatic Harmonic Visualization
    getDissonanceCurve(cents) {
        return ConsonanceColorSystem.getDissonanceCurve(cents);
    }

    getFrequencyColor(freq, rootFreq) {
        return ConsonanceColorSystem.getFrequencyColor(freq, rootFreq);
    }

    hslToHex(h, s, l) {
        return ConsonanceColorSystem.hslToHex(h, s, l);
    }

    resize() {
        const parent = this.canvas.parentElement;
        const attrWidth = parseInt(this.canvas.getAttribute('width'), 10) || 520;
        const targetHeight = 600;

        // Get dimensions from parent container, not from canvas itself
        let containerWidth = attrWidth;
        let containerHeight = targetHeight;

        if (parent) {
            containerWidth = parent.clientWidth || parent.offsetWidth || attrWidth;
            containerHeight = parent.clientHeight || parent.offsetHeight || targetHeight;
        }

        interferenceDebugLog('Interference resize measurement', {
            containerWidth,
            containerHeight,
            attrWidth,
            hasParent: !!parent
        });

        // Use full container dimensions
        let cssWidth = containerWidth;
        let cssHeight = containerHeight;

        if (!cssWidth || cssWidth <= 0) {
            cssWidth = Math.max(attrWidth, 520);
            console.warn('InterferenceVisualization: fallback canvas width applied', {
                rect,
                attrWidth,
                containerWidth,
                cssWidth
            });
        }

        const ratio = window.devicePixelRatio || 1;
        const pixelWidth = Math.max(1, Math.round(cssWidth * ratio));
        const pixelHeight = Math.max(1, Math.round(cssHeight * ratio));

        this.devicePixelRatio = ratio;
        this.cssWidth = cssWidth;
        this.cssHeight = cssHeight;
        this.pixelWidth = pixelWidth;
        this.pixelHeight = pixelHeight;

        if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
            this.canvas.width = pixelWidth;
            this.canvas.height = pixelHeight;
        }

        this.canvas.style.width = `${cssWidth}px`;
        this.canvas.style.height = `${cssHeight}px`;

        if (this.overlayRenderer) {
            this.overlayRenderer.resize(cssWidth, cssHeight, pixelWidth, pixelHeight, ratio);
        }

        this.gl.viewport(0, 0, pixelWidth, pixelHeight);
        interferenceDebugLog('InterferenceVisualization resize', {
            cssWidth,
            cssHeight,
            pixelWidth,
            pixelHeight,
            boundaryRadius: this.settings.boundaryRadius,
            speakerRadius: this.settings.speakerRadius,
            ratio,
            canvasStyleWidth: this.canvas.style.width,
            canvasStyleHeight: this.canvas.style.height,
            containerClientWidth: this.canvas.parentElement ? this.canvas.parentElement.clientWidth : null,
            containerClientHeight: this.canvas.parentElement ? this.canvas.parentElement.clientHeight : null
        });
    }

    destroy() {
        this.stop();

        // Remove keyboard event listener
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }

        // Clean up audio controller
        if (this.audioController && this.ownsAudioController && typeof this.audioController.destroy === 'function') {
            this.audioController.destroy();
        }

        // Clean up overlay renderer
        if (this.overlayRenderer) {
            this.overlayRenderer.destroy();
        }

        // Clean up WebGL resources
        if (this.vertexBuffer) {
            this.gl.deleteBuffer(this.vertexBuffer);
        }

        if (this.handleWindowResize) {
            window.removeEventListener('resize', this.handleWindowResize);
        }
        if (this.program) {
            this.gl.deleteProgram(this.program);
        }
    }
}

InterferenceVisualization.DEFAULT_SELECTORS = INTERFERENCE_DEFAULT_SELECTORS;
