class CymaticViz {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('cymaticCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Exit button
        this.exitBtn = document.getElementById('cymaticVizExitBtn');

        // Control elements
        this.tone1XSlider = document.getElementById('cymaticTone1X');
        this.tone1XValue = document.getElementById('cymaticTone1XValue');
        this.tone1FreqSlider = document.getElementById('cymaticTone1Freq');
        this.tone1FreqNum = document.getElementById('cymaticTone1FreqNum');

        this.tone2XSlider = document.getElementById('cymaticTone2X');
        this.tone2XValue = document.getElementById('cymaticTone2XValue');
        this.tone2FreqSlider = document.getElementById('cymaticTone2Freq');
        this.tone2FreqNum = document.getElementById('cymaticTone2FreqNum');

        // Button elements
        this.playTone1Btn = document.getElementById('cymaticPlayTone1Btn');
        this.playTone2Btn = document.getElementById('cymaticPlayTone2Btn');
        this.playBothBtn = document.getElementById('cymaticPlayBothBtn');
        this.randomizeBtn = document.getElementById('cymaticRandomizeBtn');

        // Type selection buttons
        this.typeButtons = {
            chladni: document.getElementById('cymaticTypeChladni'),
            water: document.getElementById('cymaticTypeWater'),
            sand: document.getElementById('cymaticTypeSand'),
            harmonic: document.getElementById('cymaticTypeHarmonic'),
            membrane: document.getElementById('cymaticTypeMembrane')
        };

        // Audio context
        this.audioContext = null;
        this.oscillator1 = null;
        this.oscillator2 = null;
        this.gainNode1 = null;
        this.gainNode2 = null;
        this.analyser = null;           // Analyser for mixed audio output
        this.analyserDataArray = null;  // Time-domain data for amplitude detection
        this.currentBeatAmplitude = 0;  // Current amplitude envelope (0-1)

        // State
        this.tone1X = 25;
        this.tone1Freq = 330;  // E4
        this.tone2X = 75;
        this.tone2Freq = 440;  // A4 (concert pitch)
        this.isPlayingTone1 = false;
        this.isPlayingTone2 = false;
        this.currentType = 'harmonic';  // Default to harmonic field
        this.animationId = null;
        this.startTime = 0;

        // Pulse animation tracking
        this.pulses = [];  // Array of active pulses {x, y, startTime, isStart: true/false}
        this.tone1StartTime = null;  // When tone 1 started
        this.tone2StartTime = null;  // When tone 2 started

        // Root note tracking (tone that user is NOT changing)
        this.rootTone = 1;  // 1 or 2, indicates which tone is the root
        this.lastChangedTone = 2;  // Track which tone was last changed by user

        // Settings
        this.settings = {
            // General
            resolution: 100,
            amplitude: 1.5,  // Increased from 1.0 to emphasize patterns
            damping: 0.96,   // Reduced from 0.98 for more active movement
            speed: 1.2,      // Increased from 1.0 for more dynamic visualization
            showInterferenceZones: true,  // New: highlight where waves interact
            interferenceOpacity: 0.8,      // New: opacity of interference highlights
            useIntervalColors: true,  // New: use interval-based color system

            // Chladni Plate
            chladniParticles: 6000,        // Increased from 5000 for denser patterns
            chladniParticleSize: 2.5,      // Increased from 2 for better visibility
            chladniAttraction: 0.7,        // Increased from 0.5 for stronger nodal line formation
            chladniShowNodes: true,
            chladniShowInteraction: true,  // New: highlight interaction zones
            chladniPlateShape: 'square',   // New: 'square' or 'circular'
            chladniNodalLineWidth: 3,      // New: width of nodal lines
            chladniNodalLineColor: '#ffffff', // New: color for nodal lines

            // Water Cymatics
            waterHeight: 20,               // Increased from 15 for more dramatic waves
            waterRipples: 16,              // Increased from 12 for more detailed patterns
            waterTension: 0.4,             // Reduced from 0.5 for more interaction
            waterReflection: true,
            waterShowBeats: true,          // New: show beat frequency patterns
            waterLayers: 5,                // New: number of concentric wave layers

            // Circular Membrane
            membraneRadius: 250,           // New: radius of circular membrane
            membraneShowNodes: true,       // New: show nodal circles
            membraneNodalLineWidth: 3,     // New: width of nodal lines
            membraneResolution: 80,        // New: resolution of membrane grid
            membraneLayers: 3,             // New: number of wave layers

            // Sand Patterns
            sandGrains: 10000,             // Increased from 8000 for denser patterns
            sandGrainSize: 2,              // Increased from 1.5 for better visibility
            sandGravity: 0.6,              // Reduced from 0.8 for more airborne particles
            sandShowField: true,
            sandShowInterference: true,    // New: highlight interference zones

            // Harmonic Field
            harmonicLines: 20,             // Increased from 16 for more detailed field
            harmonicDensity: 1.3,          // Increased from 1.0 for denser patterns
            harmonicOrder: 4,              // Increased from 3 for more harmonics
            harmonicShowPhase: true,
            harmonicShowBeats: true,       // New: visualize beat frequency
            harmonicLineThickness: 2,      // New: thickness of field lines

            // Colors
            tone1Color: '#00ffff',
            tone2Color: '#ff00ff',
            intersectionColor: '#ffff00',
            colorBlend: true,
            highlightInterference: true,   // New: make interference zones brighter

            // Interval-based color settings
            consonanceColor: '#00ffff',    // Color for root/consonant intervals
            dissonanceColor: '#ff0000',    // Color for dissonant intervals
            overlapEffect: 'intensity',    // How colors combine: additive, intensity, saturation, multiply
            colorContrast: 1.0,           // Overall color contrast multiplier
            blackTransparent: false,       // Treat black as transparent

            // Pulse Effects
            showStartPulse: true,          // Show pulse when tone starts
            showStopPulse: true,           // Show pulse when tone stops
            pulseSpeed: 300,               // Speed of pulse expansion (pixels/second)
            pulseDuration: 2000,           // How long pulse lasts (ms)
            pulseOpacity: 0.6,             // Maximum opacity of pulse
            pulseWidth: 3,                 // Line width of pulse ring
            showInterferencePulse: true,   // Show pulse at interference points
            interferencePulseInterval: 1000 // How often to show interference pulse (ms)
        };

        // Particles for simulations
        this.particles = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSettings();
        this.setupCanvas();
        this.selectType(this.currentType);  // Initialize the default type
        this.animate();
    }

    setupCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            if (container && container.offsetWidth > 0) {
                this.canvas.width = container.offsetWidth;
                this.canvas.height = 600;
            }
        };

        // Initial resize with a small delay to ensure container is visible
        setTimeout(resizeCanvas, 50);

        window.addEventListener('resize', resizeCanvas);
    }

    setupEventListeners() {
        // Exit button
        this.exitBtn.addEventListener('click', () => {
            this.cleanup();
            document.getElementById('cymaticVizExercise').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
        });

        // Tone 1 controls
        this.tone1XSlider.addEventListener('input', (e) => {
            this.tone1X = parseInt(e.target.value);
            this.tone1XValue.textContent = `${this.tone1X}%`;
            this.initializeParticles();
        });

        this.tone1FreqSlider.addEventListener('input', (e) => {
            this.tone1Freq = parseFloat(e.target.value);
            this.tone1FreqNum.value = this.tone1Freq.toFixed(1);
            this.lastChangedTone = 1;
            this.rootTone = 2;  // Tone 2 becomes root when tone 1 is changed
            this.updateIntervalColors();
            if (this.isPlayingTone1) {
                this.updateOscillator1();
            }
        });

        this.tone1FreqNum.addEventListener('input', (e) => {
            let freq = parseFloat(e.target.value);
            // Clamp to piano range
            freq = Math.max(27.5, Math.min(4186, freq));
            this.tone1Freq = freq;
            this.tone1FreqSlider.value = this.tone1Freq;
            this.tone1FreqNum.value = this.tone1Freq.toFixed(1);
            this.lastChangedTone = 1;
            this.rootTone = 2;  // Tone 2 becomes root when tone 1 is changed
            this.updateIntervalColors();
            if (this.isPlayingTone1) {
                this.updateOscillator1();
            }
        });

        // Tone 2 controls
        this.tone2XSlider.addEventListener('input', (e) => {
            this.tone2X = parseInt(e.target.value);
            this.tone2XValue.textContent = `${this.tone2X}%`;
            this.initializeParticles();
        });

        this.tone2FreqSlider.addEventListener('input', (e) => {
            this.tone2Freq = parseFloat(e.target.value);
            this.tone2FreqNum.value = this.tone2Freq.toFixed(1);
            this.lastChangedTone = 2;
            this.rootTone = 1;  // Tone 1 becomes root when tone 2 is changed
            this.updateIntervalColors();
            if (this.isPlayingTone2) {
                this.updateOscillator2();
            }
        });

        this.tone2FreqNum.addEventListener('input', (e) => {
            let freq = parseFloat(e.target.value);
            // Clamp to piano range
            freq = Math.max(27.5, Math.min(4186, freq));
            this.tone2Freq = freq;
            this.tone2FreqSlider.value = this.tone2Freq;
            this.tone2FreqNum.value = this.tone2Freq.toFixed(1);
            this.lastChangedTone = 2;
            this.rootTone = 1;  // Tone 1 becomes root when tone 2 is changed
            this.updateIntervalColors();
            if (this.isPlayingTone2) {
                this.updateOscillator2();
            }
        });

        // Button controls
        this.playTone1Btn.addEventListener('click', () => this.toggleTone1());
        this.playTone2Btn.addEventListener('click', () => this.toggleTone2());
        this.playBothBtn.addEventListener('click', () => this.toggleBoth());
        this.randomizeBtn.addEventListener('click', () => this.randomize());

        // Type selection
        Object.entries(this.typeButtons).forEach(([type, button]) => {
            button.addEventListener('click', () => this.selectType(type));
        });
    }

    setupSettings() {
        // General settings
        this.addSettingListener('settingCymaticResolution', 'resolution', (v) => parseInt(v));
        this.addSettingListener('settingCymaticAmplitude', 'amplitude', (v) => parseFloat(v));
        this.addSettingListener('settingCymaticDamping', 'damping', (v) => parseFloat(v));
        this.addSettingListener('settingCymaticSpeed', 'speed', (v) => parseFloat(v));
        this.addSettingListener('settingShowInterferenceZones', 'showInterferenceZones', (v) => v, false, true);
        this.addSettingListener('settingInterferenceOpacity', 'interferenceOpacity', (v) => parseFloat(v));

        // Chladni settings
        this.addSettingListener('settingChladniParticles', 'chladniParticles', (v) => parseInt(v), true);
        this.addSettingListener('settingChladniParticleSize', 'chladniParticleSize', (v) => parseFloat(v));
        this.addSettingListener('settingChladniAttraction', 'chladniAttraction', (v) => parseFloat(v));
        this.addSettingListener('settingChladniShowNodes', 'chladniShowNodes', (v) => v, false, true);
        this.addSettingListener('settingChladniShowInteraction', 'chladniShowInteraction', (v) => v, false, true);
        this.addSettingListener('settingChladniNodalLineWidth', 'chladniNodalLineWidth', (v) => parseFloat(v));
        this.addSettingListener('settingChladniNodalLineColor', 'chladniNodalLineColor', (v) => v, false, false, true);

        // Chladni plate shape
        const plateShapeSelect = document.getElementById('settingChladniPlateShape');
        if (plateShapeSelect) {
            plateShapeSelect.addEventListener('change', (e) => {
                this.settings.chladniPlateShape = e.target.value;
                this.initializeParticles();
            });
        }

        // Water settings
        this.addSettingListener('settingWaterHeight', 'waterHeight', (v) => parseInt(v));
        this.addSettingListener('settingWaterRipples', 'waterRipples', (v) => parseInt(v));
        this.addSettingListener('settingWaterTension', 'waterTension', (v) => parseFloat(v));
        this.addSettingListener('settingWaterReflection', 'waterReflection', (v) => v, false, true);
        this.addSettingListener('settingWaterShowBeats', 'waterShowBeats', (v) => v, false, true);
        this.addSettingListener('settingWaterLayers', 'waterLayers', (v) => parseInt(v));

        // Membrane settings
        this.addSettingListener('settingMembraneRadius', 'membraneRadius', (v) => parseInt(v));
        this.addSettingListener('settingMembraneShowNodes', 'membraneShowNodes', (v) => v, false, true);
        this.addSettingListener('settingMembraneNodalLineWidth', 'membraneNodalLineWidth', (v) => parseFloat(v));
        this.addSettingListener('settingMembraneResolution', 'membraneResolution', (v) => parseInt(v));
        this.addSettingListener('settingMembraneLayers', 'membraneLayers', (v) => parseInt(v));

        // Sand settings
        this.addSettingListener('settingSandGrains', 'sandGrains', (v) => parseInt(v), true);
        this.addSettingListener('settingSandGrainSize', 'sandGrainSize', (v) => parseFloat(v));
        this.addSettingListener('settingSandGravity', 'sandGravity', (v) => parseFloat(v));
        this.addSettingListener('settingSandShowField', 'sandShowField', (v) => v, false, true);
        this.addSettingListener('settingSandShowInterference', 'sandShowInterference', (v) => v, false, true);

        // Harmonic settings
        this.addSettingListener('settingHarmonicLines', 'harmonicLines', (v) => parseInt(v));
        this.addSettingListener('settingHarmonicDensity', 'harmonicDensity', (v) => parseFloat(v));
        this.addSettingListener('settingHarmonicOrder', 'harmonicOrder', (v) => parseInt(v));
        this.addSettingListener('settingHarmonicShowPhase', 'harmonicShowPhase', (v) => v, false, true);
        this.addSettingListener('settingHarmonicShowBeats', 'harmonicShowBeats', (v) => v, false, true);
        this.addSettingListener('settingHarmonicLineThickness', 'harmonicLineThickness', (v) => parseFloat(v));

        // Interference pattern settings
        this.addSettingListener('settingShowInterferenceZonesToggle', 'showInterferenceZones', (v) => v, false, true);
        this.addSettingListener('settingInterferenceOpacityControl', 'interferenceOpacity', (v) => parseFloat(v));

        // Color settings
        this.addSettingListener('settingUseIntervalColors', 'useIntervalColors', (v) => {
            this.updateIntervalColors();
            return v;
        }, false, true);
        this.addSettingListener('settingCymaticTone1Color', 'tone1Color', (v) => v, false, false, true);
        this.addSettingListener('settingCymaticTone2Color', 'tone2Color', (v) => v, false, false, true);
        this.addSettingListener('settingCymaticIntersectionColor', 'intersectionColor', (v) => v, false, false, true);
        this.addSettingListener('settingCymaticColorBlend', 'colorBlend', (v) => v, false, true);
        this.addSettingListener('settingHighlightInterference', 'highlightInterference', (v) => v, false, true);

        // Interval-based color settings
        this.addSettingListener('settingConsonanceColor', 'consonanceColor', (v) => {
            this.updateIntervalColors();
            return v;
        }, false, false, true);
        this.addSettingListener('settingDissonanceColor', 'dissonanceColor', (v) => {
            this.updateIntervalColors();
            return v;
        }, false, false, true);
        this.addSettingListener('settingColorContrast', 'colorContrast', (v) => {
            this.updateIntervalColors();
            return parseFloat(v);
        });
        this.addSettingListener('settingBlackTransparent', 'blackTransparent', (v) => v, false, true);

        // Overlap effect select
        const overlapSelect = document.getElementById('settingOverlapEffect');
        if (overlapSelect) {
            overlapSelect.addEventListener('change', (e) => {
                this.settings.overlapEffect = e.target.value;
            });
        }

        // Pulse settings
        this.addSettingListener('settingShowStartPulse', 'showStartPulse', (v) => v, false, true);
        this.addSettingListener('settingShowStopPulse', 'showStopPulse', (v) => v, false, true);
        this.addSettingListener('settingPulseSpeed', 'pulseSpeed', (v) => parseInt(v));
        this.addSettingListener('settingPulseDuration', 'pulseDuration', (v) => parseInt(v));
        this.addSettingListener('settingPulseOpacity', 'pulseOpacity', (v) => parseFloat(v));
        this.addSettingListener('settingPulseWidth', 'pulseWidth', (v) => parseFloat(v));
        this.addSettingListener('settingShowInterferencePulse', 'showInterferencePulse', (v) => v, false, true);
        this.addSettingListener('settingInterferencePulseInterval', 'interferencePulseInterval', (v) => parseInt(v));

        // Preset buttons
        document.getElementById('cymaticPresetDefault').addEventListener('click', () => this.loadPreset('default'));
        document.getElementById('cymaticPresetSubtle').addEventListener('click', () => this.loadPreset('subtle'));
        document.getElementById('cymaticPresetIntense').addEventListener('click', () => this.loadPreset('intense'));
        document.getElementById('cymaticPresetHarmonic').addEventListener('click', () => this.loadPreset('harmonic'));
    }

    addSettingListener(elementId, settingKey, transform, reinitParticles = false, isCheckbox = false, isColor = false) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const eventType = isCheckbox ? 'change' : 'input';
        element.addEventListener(eventType, (e) => {
            const value = isCheckbox ? e.target.checked : (isColor ? e.target.value : transform(e.target.value));
            this.settings[settingKey] = value;

            // Update display value if there's a value element
            const valueElement = document.getElementById(`value${elementId.replace('setting', '')}`);
            if (valueElement && !isCheckbox && !isColor) {
                valueElement.textContent = this.formatValue(settingKey, value);
            }

            if (reinitParticles) {
                this.initializeParticles();
            }
        });
    }

    formatValue(key, value) {
        if (key.includes('Size') || key.includes('Height') || key.includes('Spacing')) {
            return `${value}px`;
        } else if (key.includes('Amplitude') || key.includes('Speed') || key.includes('Density')) {
            return `${value}x`;
        } else {
            return value;
        }
    }

    selectType(type) {
        this.currentType = type;

        // Update button states
        Object.entries(this.typeButtons).forEach(([buttonType, button]) => {
            if (buttonType === type) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Reinitialize particles for new type
        this.initializeParticles();
    }

    initializeParticles() {
        this.particles = [];

        if (this.currentType === 'chladni') {
            for (let i = 0; i < this.settings.chladniParticles; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: 0,
                    vy: 0
                });
            }
        } else if (this.currentType === 'sand') {
            for (let i = 0; i < this.settings.sandGrains; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: 0,
                    vy: 0
                });
            }
        }
    }

    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create analyser for mixed audio output
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.3; // Some smoothing for cleaner envelope
            this.analyserDataArray = new Float32Array(this.analyser.fftSize);

            // Connect analyser to destination so it captures the final mixed output
            this.analyser.connect(this.audioContext.destination);

            console.log('CymaticViz: Audio context initialized with analyser');
        }
    }

    toggleTone1() {
        this.initAudio();

        if (this.isPlayingTone1) {
            this.stopTone1();
        } else {
            this.playTone1();
        }
    }

    toggleTone2() {
        this.initAudio();

        if (this.isPlayingTone2) {
            this.stopTone2();
        } else {
            this.playTone2();
        }
    }

    toggleBoth() {
        this.initAudio();

        if (this.isPlayingTone1 && this.isPlayingTone2) {
            this.stopTone1();
            this.stopTone2();
        } else {
            if (!this.isPlayingTone1) this.playTone1();
            if (!this.isPlayingTone2) this.playTone2();
        }
    }

    playTone1() {
        this.oscillator1 = this.audioContext.createOscillator();
        this.gainNode1 = this.audioContext.createGain();

        this.oscillator1.type = 'sine';
        this.oscillator1.frequency.value = this.tone1Freq;
        this.gainNode1.gain.value = 0.3;

        this.oscillator1.connect(this.gainNode1);
        // Connect to analyser instead of directly to destination
        this.gainNode1.connect(this.analyser);

        this.oscillator1.start();
        this.isPlayingTone1 = true;
        this.tone1StartTime = performance.now();
        this.playTone1Btn.textContent = 'Stop Tone 1';
        this.playTone1Btn.classList.add('active');

        // Create start pulse
        if (this.settings.showStartPulse) {
            const x = (this.tone1X / 100) * this.canvas.width;
            const y = this.canvas.height / 2;
            this.pulses.push({
                x,
                y,
                startTime: performance.now(),
                isStart: true,
                color: this.settings.tone1Color,
                toneNum: 1
            });
        }
    }

    stopTone1() {
        if (this.oscillator1) {
            this.oscillator1.stop();
            this.oscillator1.disconnect();
            this.gainNode1.disconnect();
            this.oscillator1 = null;
            this.gainNode1 = null;
        }
        this.isPlayingTone1 = false;
        this.tone1StartTime = null;
        this.playTone1Btn.textContent = 'Play Tone 1';
        this.playTone1Btn.classList.remove('active');

        // Create stop pulse
        if (this.settings.showStopPulse) {
            const x = (this.tone1X / 100) * this.canvas.width;
            const y = this.canvas.height / 2;
            this.pulses.push({
                x,
                y,
                startTime: performance.now(),
                isStart: false,
                color: this.settings.tone1Color,
                toneNum: 1
            });
        }
    }

    playTone2() {
        this.oscillator2 = this.audioContext.createOscillator();
        this.gainNode2 = this.audioContext.createGain();

        this.oscillator2.type = 'sine';
        this.oscillator2.frequency.value = this.tone2Freq;
        this.gainNode2.gain.value = 0.3;

        this.oscillator2.connect(this.gainNode2);
        // Connect to analyser instead of directly to destination
        this.gainNode2.connect(this.analyser);

        this.oscillator2.start();
        this.isPlayingTone2 = true;
        this.tone2StartTime = performance.now();
        this.playTone2Btn.textContent = 'Stop Tone 2';
        this.playTone2Btn.classList.add('active');

        // Create start pulse
        if (this.settings.showStartPulse) {
            const x = (this.tone2X / 100) * this.canvas.width;
            const y = this.canvas.height / 2;
            this.pulses.push({
                x,
                y,
                startTime: performance.now(),
                isStart: true,
                color: this.settings.tone2Color,
                toneNum: 2
            });
        }
    }

    stopTone2() {
        if (this.oscillator2) {
            this.oscillator2.stop();
            this.oscillator2.disconnect();
            this.gainNode2.disconnect();
            this.oscillator2 = null;
            this.gainNode2 = null;
        }
        this.isPlayingTone2 = false;
        this.tone2StartTime = null;
        this.playTone2Btn.textContent = 'Play Tone 2';
        this.playTone2Btn.classList.remove('active');

        // Create stop pulse
        if (this.settings.showStopPulse) {
            const x = (this.tone2X / 100) * this.canvas.width;
            const y = this.canvas.height / 2;
            this.pulses.push({
                x,
                y,
                startTime: performance.now(),
                isStart: false,
                color: this.settings.tone2Color,
                toneNum: 2
            });
        }
    }

    updateOscillator1() {
        if (this.oscillator1) {
            this.oscillator1.frequency.setValueAtTime(this.tone1Freq, this.audioContext.currentTime);
        }
    }

    updateOscillator2() {
        if (this.oscillator2) {
            this.oscillator2.frequency.setValueAtTime(this.tone2Freq, this.audioContext.currentTime);
        }
    }

    randomize() {
        // Randomize frequencies within piano range (27.5 Hz to 4186 Hz)
        // Use log scale for more musical distribution
        const minLog = Math.log(27.5);
        const maxLog = Math.log(4186);
        this.tone1Freq = Math.exp(minLog + Math.random() * (maxLog - minLog));
        this.tone2Freq = Math.exp(minLog + Math.random() * (maxLog - minLog));

        // Reset root tone to tone 1 on randomize
        this.rootTone = 1;
        this.lastChangedTone = 2;

        // Randomize all visualization settings
        this.settings.amplitude = 0.5 + Math.random() * 2.5;  // 0.5-3.0
        this.settings.damping = 0.9 + Math.random() * 0.09;  // 0.9-0.99
        this.settings.speed = 0.5 + Math.random() * 2;  // 0.5-2.5
        this.settings.resolution = Math.floor(50 + Math.random() * 101);  // 50-150

        // Randomize type
        const types = ['chladni', 'water', 'sand', 'harmonic', 'membrane'];
        this.currentType = types[Math.floor(Math.random() * types.length)];
        this.selectType(this.currentType);

        // Chladni settings
        this.settings.chladniParticles = Math.floor(2000 + Math.random() * 8001);  // 2000-10000
        this.settings.chladniParticleSize = 1 + Math.random() * 3;  // 1-4
        this.settings.chladniAttraction = 0.3 + Math.random() * 0.7;  // 0.3-1.0

        // Water settings
        this.settings.waterHeight = Math.floor(5 + Math.random() * 36);  // 5-40
        this.settings.waterRipples = Math.floor(5 + Math.random() * 20);  // 5-24
        this.settings.waterLayers = Math.floor(1 + Math.random() * 10);  // 1-10

        // Sand settings
        this.settings.sandGrains = Math.floor(2000 + Math.random() * 18001);  // 2000-20000
        this.settings.sandGrainSize = 0.5 + Math.random() * 3.5;  // 0.5-4
        this.settings.sandGravity = 0.1 + Math.random() * 1.9;  // 0.1-2.0

        // Harmonic settings
        this.settings.harmonicLines = Math.floor(8 + Math.random() * 33);  // 8-40
        this.settings.harmonicDensity = 0.5 + Math.random() * 1.5;  // 0.5-2.0
        this.settings.harmonicOrder = Math.floor(1 + Math.random() * 8);  // 1-8
        this.settings.harmonicLineThickness = 0.5 + Math.random() * 4.5;  // 0.5-5

        // Membrane settings
        this.settings.membraneRadius = Math.floor(150 + Math.random() * 251);  // 150-400
        this.settings.membraneResolution = Math.floor(40 + Math.random() * 81);  // 40-120
        this.settings.membraneLayers = Math.floor(1 + Math.random() * 5);  // 1-5

        // Pulse settings
        this.settings.pulseSpeed = Math.floor(100 + Math.random() * 501);  // 100-600
        this.settings.pulseDuration = Math.floor(500 + Math.random() * 3501);  // 500-4000
        this.settings.pulseOpacity = 0.1 + Math.random() * 0.9;  // 0.1-1.0
        this.settings.pulseWidth = 1 + Math.random() * 5;  // 1-6

        // Update UI (frequencies only, not positions)
        this.tone1FreqSlider.value = this.tone1Freq;
        this.tone1FreqNum.value = this.tone1Freq.toFixed(1);
        this.tone2FreqSlider.value = this.tone2Freq;
        this.tone2FreqNum.value = this.tone2Freq.toFixed(1);

        // Update interval colors based on new frequencies
        this.updateIntervalColors();

        // Update oscillators if playing
        if (this.isPlayingTone1) this.updateOscillator1();
        if (this.isPlayingTone2) this.updateOscillator2();

        // Reinitialize particles
        this.initializeParticles();
    }

    loadPreset(preset) {
        switch (preset) {
            case 'default':
                this.settings.amplitude = 1.0;
                this.settings.damping = 0.98;
                this.settings.speed = 1.0;
                break;
            case 'subtle':
                this.settings.amplitude = 0.5;
                this.settings.damping = 0.99;
                this.settings.speed = 0.5;
                break;
            case 'intense':
                this.settings.amplitude = 2.0;
                this.settings.damping = 0.95;
                this.settings.speed = 2.0;
                break;
            case 'harmonic':
                this.settings.amplitude = 1.2;
                this.settings.damping = 0.98;
                this.settings.harmonicOrder = 5;
                break;
        }

        // Update UI to reflect preset values
        this.updateSettingsUI();
    }

    updateSettingsUI() {
        document.getElementById('settingCymaticAmplitude').value = this.settings.amplitude;
        document.getElementById('valueCymaticAmplitude').textContent = `${this.settings.amplitude}x`;
        document.getElementById('settingCymaticDamping').value = this.settings.damping;
        document.getElementById('valueCymaticDamping').textContent = this.settings.damping;
        document.getElementById('settingCymaticSpeed').value = this.settings.speed;
        document.getElementById('valueCymaticSpeed').textContent = `${this.settings.speed}x`;
    }

    updateBeatAmplitude() {
        // Read amplitude envelope from the actual audio output
        if (this.analyser && this.analyserDataArray && this.isPlayingTone1 && this.isPlayingTone2) {
            this.analyser.getFloatTimeDomainData(this.analyserDataArray);

            // Calculate RMS (Root Mean Square) amplitude
            let sum = 0;
            for (let i = 0; i < this.analyserDataArray.length; i++) {
                sum += this.analyserDataArray[i] * this.analyserDataArray[i];
            }
            const rms = Math.sqrt(sum / this.analyserDataArray.length);

            // Normalize to 0-1 range
            // When two tones beat, RMS fluctuates between ~0.2-0.4 typically
            // Map this to 0-1 for visualization
            this.currentBeatAmplitude = Math.min(1, rms * 3);
        } else {
            this.currentBeatAmplitude = 0;
        }
    }

    animate() {
        // Update beat amplitude from actual audio
        this.updateBeatAmplitude();

        // Clear canvas
        this.ctx.fillStyle = 'rgba(10, 10, 20, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Only animate if at least one tone is playing
        if (this.isPlayingTone1 || this.isPlayingTone2) {
            const time = performance.now() * 0.001 * this.settings.speed;

            // Draw based on current type
            switch (this.currentType) {
                case 'chladni':
                    this.drawChladni(time);
                    break;
                case 'water':
                    this.drawWater(time);
                    break;
                case 'sand':
                    this.drawSand(time);
                    break;
                case 'harmonic':
                    this.drawHarmonic(time);
                    break;
                case 'membrane':
                    this.drawMembrane(time);
                    break;
            }
        } else {
            // When not playing, just draw static tone source positions (inactive)
            const width = this.canvas.width;
            const height = this.canvas.height;
            const tone1X = (this.tone1X / 100) * width;
            const tone2X = (this.tone2X / 100) * width;
            const tone1Y = height / 2;
            const tone2Y = height / 2;

            this.drawToneSource(this.ctx, tone1X, tone1Y, this.settings.tone1Color, 'T1', false);
            this.drawToneSource(this.ctx, tone2X, tone2Y, this.settings.tone2Color, 'T2', false);
        }

        // Draw pulses (always draw, even when not playing)
        this.drawPulses();

        // Draw interference pulses if both tones are playing
        this.drawInterferencePulses();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // Calculate reveal radius for spreading effect
    getRevealRadius(toneStartTime, toneX, toneY, width, height) {
        if (!toneStartTime) return Infinity;  // If not playing, show everything

        const elapsed = performance.now() - toneStartTime;
        const maxDist = Math.sqrt(width * width + height * height);  // Canvas diagonal
        const revealSpeed = this.settings.pulseSpeed;  // Use pulse speed for consistency
        const radius = (elapsed / 1000) * revealSpeed;

        return Math.min(radius, maxDist);  // Cap at canvas diagonal
    }

    // Check if a point should be visible based on reveal animation
    isPointVisible(x, y, tone1X, tone1Y, tone2X, tone2Y, width, height) {
        // If tone 1 is playing, check distance from tone 1
        if (this.isPlayingTone1) {
            const dist1 = Math.sqrt(Math.pow(x - tone1X, 2) + Math.pow(y - tone1Y, 2));
            const reveal1 = this.getRevealRadius(this.tone1StartTime, tone1X, tone1Y, width, height);
            if (dist1 <= reveal1) return true;
        }

        // If tone 2 is playing, check distance from tone 2
        if (this.isPlayingTone2) {
            const dist2 = Math.sqrt(Math.pow(x - tone2X, 2) + Math.pow(y - tone2Y, 2));
            const reveal2 = this.getRevealRadius(this.tone2StartTime, tone2X, tone2Y, width, height);
            if (dist2 <= reveal2) return true;
        }

        return false;  // Not within any reveal radius
    }

    drawChladni(time) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Calculate tone source positions
        const tone1X = (this.tone1X / 100) * width;
        const tone2X = (this.tone2X / 100) * width;
        const tone1Y = height / 2;
        const tone2Y = height / 2;

        // Update and draw particles
        this.particles.forEach(particle => {
            let combined = 0;

            if (this.settings.chladniPlateShape === 'square') {
                // Square plate standing wave equation: z = sin(n π x/L) · sin(m π y/L) · cos(2πf t)
                const L = Math.max(width, height);

                if (this.isPlayingTone1) {
                    const n1 = Math.floor(this.tone1Freq / 100) + 1;
                    const m1 = Math.floor(this.tone1Freq / 120) + 1;
                    const wave1 = Math.sin(n1 * Math.PI * particle.x / L) *
                                 Math.sin(m1 * Math.PI * particle.y / L) *
                                 Math.cos(2 * Math.PI * this.tone1Freq * time * 0.001) *
                                 this.settings.amplitude;
                    combined += wave1;
                }

                if (this.isPlayingTone2) {
                    const n2 = Math.floor(this.tone2Freq / 100) + 1;
                    const m2 = Math.floor(this.tone2Freq / 120) + 1;
                    const wave2 = Math.sin(n2 * Math.PI * particle.x / L) *
                                 Math.sin(m2 * Math.PI * particle.y / L) *
                                 Math.cos(2 * Math.PI * this.tone2Freq * time * 0.001) *
                                 this.settings.amplitude;
                    combined += wave2;
                }
            } else {
                // Circular plate - use radial distance from center
                const centerX = width / 2;
                const centerY = height / 2;
                const r = Math.sqrt(Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2));
                const maxRadius = Math.min(width, height) / 2;
                const normalizedR = r / maxRadius;

                if (this.isPlayingTone1) {
                    // Simplified Bessel-like function using sine waves
                    const k1 = this.tone1Freq / 100;
                    const wave1 = Math.sin(k1 * Math.PI * normalizedR) *
                                 Math.cos(2 * Math.PI * this.tone1Freq * time * 0.001) *
                                 this.settings.amplitude;
                    combined += wave1;
                }

                if (this.isPlayingTone2) {
                    const k2 = this.tone2Freq / 100;
                    const wave2 = Math.sin(k2 * Math.PI * normalizedR) *
                                 Math.cos(2 * Math.PI * this.tone2Freq * time * 0.001) *
                                 this.settings.amplitude;
                    combined += wave2;
                }
            }

            // Particles move to nodal lines (where combined wave is near zero)
            const force = -combined * this.settings.chladniAttraction;

            // Apply force based on wave amplitude gradient
            // Particles are repelled from high amplitude areas and attracted to nodes
            particle.vx += force * Math.random() * 0.2 - 0.1;
            particle.vy += force * Math.random() * 0.2 - 0.1;

            // Apply damping
            particle.vx *= this.settings.damping;
            particle.vy *= this.settings.damping;

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off edges
            if (particle.x < 0 || particle.x > width) particle.vx *= -0.5;
            if (particle.y < 0 || particle.y > height) particle.vy *= -0.5;
            particle.x = Math.max(0, Math.min(width, particle.x));
            particle.y = Math.max(0, Math.min(height, particle.y));

            // Check if particle is within reveal radius
            if (!this.isPointVisible(particle.x, particle.y, tone1X, tone1Y, tone2X, tone2Y, width, height)) {
                return;  // Skip drawing this particle
            }

            // Draw particle - color based on which tone is closer
            const dist1 = Math.abs(particle.x - tone1X) + Math.abs(particle.y - tone1Y);
            const dist2 = Math.abs(particle.x - tone2X) + Math.abs(particle.y - tone2Y);
            const colorMix = (dist1 / (dist1 + dist2 + 1));
            const color = this.blendColors(this.settings.tone1Color, this.settings.tone2Color, colorMix);

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(particle.x, particle.y, this.settings.chladniParticleSize, this.settings.chladniParticleSize);
        });

        ctx.globalAlpha = 1;

        // Draw nodal lines if enabled
        if (this.settings.chladniShowNodes) {
            this.drawNodalLines(ctx, width, height, tone1X, tone1Y, tone2X, tone2Y, time);
        }

        // Draw interaction zones if enabled
        if (this.settings.chladniShowInteraction && this.isPlayingTone1 && this.isPlayingTone2) {
            this.drawInteractionZones(ctx, width, height, tone1X, tone1Y, tone2X, tone2Y, time);
        }

        // Draw tone sources
        this.drawToneSource(ctx, tone1X, tone1Y, this.settings.tone1Color, 'T1', this.isPlayingTone1);
        this.drawToneSource(ctx, tone2X, tone2Y, this.settings.tone2Color, 'T2', this.isPlayingTone2);
    }

    drawWater(time) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Calculate tone source positions
        const tone1X = (this.tone1X / 100) * width;
        const tone2X = (this.tone2X / 100) * width;
        const tone1Y = height / 2;
        const tone2Y = height / 2;

        // Draw multiple layers of ripples (concentric expanding waves)
        for (let layer = 0; layer < this.settings.waterLayers; layer++) {
            const layerOffset = layer * 50;

            for (let i = 0; i < this.settings.waterRipples; i++) {
                const radius = layerOffset + (i / this.settings.waterRipples) * 300 + (time * 50 * this.tone1Freq / 440) % (300 / this.settings.waterRipples);
                const opacity = (1 - (i / this.settings.waterRipples)) * (1 - layer / this.settings.waterLayers);

                // Tone 1 ripples (only if playing)
                if (this.isPlayingTone1) {
                    ctx.strokeStyle = this.settings.tone1Color;
                    ctx.globalAlpha = opacity * 0.4;
                    ctx.lineWidth = 2 - (layer * 0.3);
                    ctx.beginPath();
                    ctx.arc(tone1X, tone1Y, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Tone 2 ripples (only if playing)
                if (this.isPlayingTone2) {
                    ctx.strokeStyle = this.settings.tone2Color;
                    ctx.globalAlpha = opacity * 0.4;
                    ctx.lineWidth = 2 - (layer * 0.3);
                    ctx.beginPath();
                    ctx.arc(tone2X, tone2Y, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        ctx.globalAlpha = 1;

        // Draw interference pattern
        const gridSize = 20;
        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                const dist1 = Math.sqrt(Math.pow(x - tone1X, 2) + Math.pow(y - tone1Y, 2));
                const dist2 = Math.sqrt(Math.pow(x - tone2X, 2) + Math.pow(y - tone2Y, 2));

                const wave1 = this.isPlayingTone1 ? Math.sin(dist1 * 0.05 - this.tone1Freq * time * 0.01) * this.settings.waterHeight : 0;
                const wave2 = this.isPlayingTone2 ? Math.sin(dist2 * 0.05 - this.tone2Freq * time * 0.01) * this.settings.waterHeight : 0;

                const combined = wave1 + wave2;
                const brightness = (combined + this.settings.waterHeight * 2) / (this.settings.waterHeight * 4);

                ctx.fillStyle = `rgba(100, 200, 255, ${brightness * 0.3})`;
                ctx.fillRect(x, y, gridSize, gridSize);
            }
        }

        // Draw tone sources
        this.drawToneSource(ctx, tone1X, tone1Y, this.settings.tone1Color, 'T1', this.isPlayingTone1);
        this.drawToneSource(ctx, tone2X, tone2Y, this.settings.tone2Color, 'T2', this.isPlayingTone2);
    }

    drawSand(time) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Calculate tone source positions
        const tone1X = (this.tone1X / 100) * width;
        const tone2X = (this.tone2X / 100) * width;
        const tone1Y = height / 2;
        const tone2Y = height / 2;

        // Update and draw sand grains
        this.particles.forEach(particle => {
            const dist1 = Math.sqrt(Math.pow(particle.x - tone1X, 2) + Math.pow(particle.y - tone1Y, 2));
            const dist2 = Math.sqrt(Math.pow(particle.x - tone2X, 2) + Math.pow(particle.y - tone2Y, 2));

            // Wave equations - only include active tones
            const wave1 = this.isPlayingTone1 ? Math.sin(dist1 * 0.05 - this.tone1Freq * time * 0.01) * this.settings.amplitude : 0;
            const wave2 = this.isPlayingTone2 ? Math.sin(dist2 * 0.05 - this.tone2Freq * time * 0.01) * this.settings.amplitude : 0;

            // Combined vibration
            const vibration = wave1 + wave2;

            // Apply vibration force
            const angle = Math.atan2(particle.y - height / 2, particle.x - width / 2);
            particle.vx += Math.cos(angle) * vibration * 0.5;
            particle.vy += Math.sin(angle) * vibration * 0.5;

            // Apply gravity
            particle.vy += this.settings.sandGravity * 0.1;

            // Apply damping
            particle.vx *= 0.95;
            particle.vy *= 0.95;

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Settle at bottom or on other particles
            if (particle.y > height - 50) {
                particle.y = height - 50;
                particle.vy = 0;
                particle.vx *= 0.8;
            }

            // Keep in bounds
            particle.x = Math.max(0, Math.min(width, particle.x));
            particle.y = Math.max(0, Math.min(height, particle.y));

            // Draw grain
            const colorMix = (dist1 / (dist1 + dist2));
            const color = this.blendColors(this.settings.tone1Color, this.settings.tone2Color, colorMix);

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(particle.x, particle.y, this.settings.sandGrainSize, this.settings.sandGrainSize);
        });

        ctx.globalAlpha = 1;

        // Draw vibration field if enabled
        if (this.settings.sandShowField) {
            this.drawVibrationField(ctx, width, height, tone1X, tone1Y, tone2X, tone2Y, time);
        }

        // Draw tone sources
        this.drawToneSource(ctx, tone1X, tone1Y, this.settings.tone1Color, 'T1', this.isPlayingTone1);
        this.drawToneSource(ctx, tone2X, tone2Y, this.settings.tone2Color, 'T2', this.isPlayingTone2);
    }

    drawHarmonic(time) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Calculate tone source positions
        const tone1X = (this.tone1X / 100) * width;
        const tone2X = (this.tone2X / 100) * width;
        const tone1Y = height / 2;
        const tone2Y = height / 2;

        // Draw harmonic field lines
        const lines = this.settings.harmonicLines;
        for (let i = 0; i < lines; i++) {
            const angle = (i / lines) * Math.PI * 2;

            // Draw field line from tone 1 (only if playing)
            if (this.isPlayingTone1) {
                this.drawFieldLine(ctx, tone1X, tone1Y, angle, this.tone1Freq, time, this.settings.tone1Color);
            }

            // Draw field line from tone 2 (only if playing)
            if (this.isPlayingTone2) {
                this.drawFieldLine(ctx, tone2X, tone2Y, angle, this.tone2Freq, time, this.settings.tone2Color);
            }
        }

        // Draw interference patterns with additive color mixing
        const gridSize = 15;
        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                // Check if point is within reveal radius
                if (!this.isPointVisible(x, y, tone1X, tone1Y, tone2X, tone2Y, width, height)) {
                    continue;  // Skip this grid cell
                }

                const dist1 = Math.sqrt(Math.pow(x - tone1X, 2) + Math.pow(y - tone1Y, 2));
                const dist2 = Math.sqrt(Math.pow(x - tone2X, 2) + Math.pow(y - tone2Y, 2));

                let wave1Amplitude = 0;
                let wave2Amplitude = 0;

                // Sum harmonics - only include active tones
                for (let h = 1; h <= this.settings.harmonicOrder; h++) {
                    if (this.isPlayingTone1) {
                        wave1Amplitude += Math.sin(dist1 * 0.05 * h - this.tone1Freq * h * time * 0.01) / h;
                    }
                    if (this.isPlayingTone2) {
                        wave2Amplitude += Math.sin(dist2 * 0.05 * h - this.tone2Freq * h * time * 0.01) / h;
                    }
                }

                wave1Amplitude *= this.settings.amplitude;
                wave2Amplitude *= this.settings.amplitude;

                // Calculate brightness for each tone
                const brightness1 = Math.abs(wave1Amplitude) * 0.3;
                const brightness2 = Math.abs(wave2Amplitude) * 0.3;

                // Additive color mixing (like light)
                const rgb1 = this.hexToRgb(this.settings.tone1Color);
                const rgb2 = this.hexToRgb(this.settings.tone2Color);

                const r = Math.min(255, Math.round(rgb1.r * brightness1 + rgb2.r * brightness2));
                const g = Math.min(255, Math.round(rgb1.g * brightness1 + rgb2.g * brightness2));
                const b = Math.min(255, Math.round(rgb1.b * brightness1 + rgb2.b * brightness2));

                // Only draw if there's some brightness
                if (r > 0 || g > 0 || b > 0) {
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.globalAlpha = 1;
                    ctx.fillRect(x, y, gridSize, gridSize);
                }
            }
        }

        ctx.globalAlpha = 1;

        // Draw phase relationships if enabled
        if (this.settings.harmonicShowPhase) {
            this.drawPhaseRelationship(ctx, tone1X, tone1Y, tone2X, tone2Y, time);
        }

        // Draw tone sources
        this.drawToneSource(ctx, tone1X, tone1Y, this.settings.tone1Color, 'T1', this.isPlayingTone1);
        this.drawToneSource(ctx, tone2X, tone2Y, this.settings.tone2Color, 'T2', this.isPlayingTone2);
    }

    drawMembrane(time) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = this.settings.membraneRadius;

        // Draw membrane boundary circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Calculate tone source positions
        const tone1X = (this.tone1X / 100) * width;
        const tone2X = (this.tone2X / 100) * width;
        const tone1Y = height / 2;
        const tone2Y = height / 2;

        // Draw multiple wave layers with circular membrane waves
        const resolution = this.settings.membraneResolution;
        for (let layer = 0; layer < this.settings.membraneLayers; layer++) {
            const layerAlpha = 1 - (layer / this.settings.membraneLayers);

            for (let i = 0; i < resolution; i++) {
                for (let j = 0; j < resolution; j++) {
                    const x = (i / resolution) * width;
                    const y = (j / resolution) * height;

                    // Distance from center
                    const r = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

                    // Only draw within membrane radius
                    if (r > radius) continue;

                    const normalizedR = r / radius;

                    // Calculate membrane displacement using Bessel-like waves
                    let displacement = 0;

                    if (this.isPlayingTone1) {
                        const k1 = (this.tone1Freq / 100) + layer;
                        const wave1 = Math.sin(k1 * Math.PI * normalizedR) *
                                     Math.cos(2 * Math.PI * this.tone1Freq * time * 0.001 + layer * Math.PI / 2) *
                                     this.settings.amplitude;
                        displacement += wave1;
                    }

                    if (this.isPlayingTone2) {
                        const k2 = (this.tone2Freq / 100) + layer;
                        const wave2 = Math.sin(k2 * Math.PI * normalizedR) *
                                     Math.cos(2 * Math.PI * this.tone2Freq * time * 0.001 + layer * Math.PI / 2) *
                                     this.settings.amplitude;
                        displacement += wave2;
                    }

                    // Color based on displacement
                    const intensity = (displacement + 2) / 4;
                    const dist1 = Math.sqrt(Math.pow(x - tone1X, 2) + Math.pow(y - tone1Y, 2));
                    const dist2 = Math.sqrt(Math.pow(x - tone2X, 2) + Math.pow(y - tone2Y, 2));
                    const colorMix = dist1 / (dist1 + dist2 + 1);
                    const color = this.blendColors(this.settings.tone1Color, this.settings.tone2Color, colorMix);

                    const rgb = this.hexToRgb(color);
                    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * layerAlpha * 0.3})`;
                    const cellSize = width / resolution;
                    ctx.fillRect(x, y, cellSize, cellSize);
                }
            }
        }

        // Draw nodal circles if enabled
        if (this.settings.membraneShowNodes) {
            this.drawMembraneNodes(ctx, centerX, centerY, radius, time);
        }

        // Draw tone sources
        this.drawToneSource(ctx, tone1X, tone1Y, this.settings.tone1Color, 'T1', this.isPlayingTone1);
        this.drawToneSource(ctx, tone2X, tone2Y, this.settings.tone2Color, 'T2', this.isPlayingTone2);
    }

    drawMembraneNodes(ctx, centerX, centerY, maxRadius, time) {
        ctx.strokeStyle = this.settings.chladniNodalLineColor;
        ctx.lineWidth = this.settings.membraneNodalLineWidth;
        ctx.globalAlpha = 0.6;

        // Draw nodal circles based on frequencies
        if (this.isPlayingTone1) {
            const numCircles1 = Math.floor(this.tone1Freq / 100);
            for (let i = 1; i <= numCircles1; i++) {
                const r = (i / numCircles1) * maxRadius;
                ctx.beginPath();
                ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        if (this.isPlayingTone2) {
            const numCircles2 = Math.floor(this.tone2Freq / 100);
            for (let i = 1; i <= numCircles2; i++) {
                const r = (i / numCircles2) * maxRadius;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        ctx.globalAlpha = 1;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    // Calculate interval ratio between two frequencies
    getIntervalRatio(freq1, freq2) {
        const ratio = freq2 / freq1;
        return ratio >= 1 ? ratio : 1 / ratio;  // Always return ratio >= 1
    }

    // Determine interval type and return properties
    analyzeInterval(ratio) {
        const cents = 1200 * Math.log2(ratio);

        // Interval definitions with consonance ratings (0 = pure, 1 = dissonant)
        // Hue mapping: Blue (cool, consonant) = 210°, Red (warm, dissonant) = 0°
        // More consonant = closer to blue, more dissonant = closer to red
        const intervals = [
            { name: 'unison', ratio: 1.0, cents: 0, consonance: 0.0, hueShift: 210 },      // Pure blue (most consonant)
            { name: 'minor2nd', ratio: 16/15, cents: 112, consonance: 0.95, hueShift: 15 }, // Red-orange (very dissonant)
            { name: 'major2nd', ratio: 9/8, cents: 204, consonance: 0.6, hueShift: 45 },    // Orange (moderately dissonant)
            { name: 'minor3rd', ratio: 6/5, cents: 316, consonance: 0.3, hueShift: 140 },   // Green-cyan (moderately consonant)
            { name: 'major3rd', ratio: 5/4, cents: 386, consonance: 0.25, hueShift: 160 },  // Cyan (consonant)
            { name: 'perfect4th', ratio: 4/3, cents: 498, consonance: 0.15, hueShift: 180 }, // Cyan-blue (very consonant)
            { name: 'tritone', ratio: Math.sqrt(2), cents: 600, consonance: 1.0, hueShift: 0 }, // Red (most dissonant)
            { name: 'perfect5th', ratio: 3/2, cents: 702, consonance: 0.1, hueShift: 200 },  // Blue (very consonant)
            { name: 'minor6th', ratio: 8/5, cents: 814, consonance: 0.4, hueShift: 100 },    // Yellow-green (moderate)
            { name: 'major6th', ratio: 5/3, cents: 884, consonance: 0.35, hueShift: 130 },   // Green (moderately consonant)
            { name: 'minor7th', ratio: 16/9, cents: 996, consonance: 0.7, hueShift: 30 },    // Orange-red (dissonant)
            { name: 'major7th', ratio: 15/8, cents: 1088, consonance: 0.85, hueShift: 20 },  // Red-orange (very dissonant)
            { name: 'octave', ratio: 2.0, cents: 1200, consonance: 0.0, hueShift: 210 }      // Pure blue (most consonant)
        ];

        // Find closest interval
        let closest = intervals[0];
        let minDiff = Math.abs(cents - closest.cents);

        for (const interval of intervals) {
            const diff = Math.abs(cents - interval.cents);
            if (diff < minDiff) {
                minDiff = diff;
                closest = interval;
            }
        }

        // Calculate octave number (which octave above root)
        const octaveNum = Math.floor(Math.log2(ratio));

        return {
            ...closest,
            cents,
            centsDiff: cents - closest.cents,
            octaveNum
        };
    }

    // Generate color based on frequency relative to root
    getFrequencyColor(freq, rootFreq) {
        if (!this.settings.useIntervalColors) {
            return freq === this.tone1Freq ? this.settings.tone1Color : this.settings.tone2Color;
        }

        const ratio = freq / rootFreq;
        const interval = this.analyzeInterval(ratio);

        // Base hue on interval type
        let hue = interval.hueShift;

        // For octaves, use same hue family but different brightness
        if (interval.name === 'octave' || interval.octaveNum > 0) {
            // Keep the base interval hue, just darken for higher octaves
            const baseRatio = ratio / Math.pow(2, interval.octaveNum);
            const baseInterval = this.analyzeInterval(baseRatio);
            hue = baseInterval.hueShift;
        }

        // Adjust saturation based on consonance
        // More dissonant = more saturated (vivid red/orange)
        // More consonant = less saturated (cool blue)
        const saturation = 50 + (interval.consonance * 50);  // 50-100%

        // Brightness based on frequency (lower = darker)
        // Also darken for higher octaves of same note
        const freqBrightness = 35 + (Math.log2(freq / 100) / Math.log2(20000 / 100)) * 35;  // 35-70%
        const octaveDarkening = interval.octaveNum * 10;  // Darken by 10% per octave
        const lightness = Math.max(25, freqBrightness - octaveDarkening);

        // For unison, make them match exactly
        if (interval.name === 'unison' || Math.abs(ratio - 1.0) < 0.01) {
            return this.hslToHex(hue, saturation, lightness);
        }

        return this.hslToHex(hue % 360, saturation, lightness);
    }

    // Convert HSL to hex color
    hslToHex(h, s, l) {
        s = s / 100;
        l = l / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c/2;

        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        } else if (h >= 60 && h < 120) {
            r = x; g = c; b = 0;
        } else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else if (h >= 300 && h < 360) {
            r = c; g = 0; b = x;
        }

        const toHex = (val) => {
            const hex = Math.round((val + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Update colors based on current interval relationship
    updateIntervalColors() {
        if (!this.settings.useIntervalColors) return;

        const rootFreq = this.rootTone === 1 ? this.tone1Freq : this.tone2Freq;

        this.settings.tone1Color = this.getFrequencyColor(this.tone1Freq, rootFreq);
        this.settings.tone2Color = this.getFrequencyColor(this.tone2Freq, rootFreq);

        // Update intersection color to be an additive blend
        // (simulates how light colors mix)
        const rgb1 = this.hexToRgb(this.settings.tone1Color);
        const rgb2 = this.hexToRgb(this.settings.tone2Color);

        // Additive color mixing (like light)
        const r = Math.min(255, rgb1.r + rgb2.r);
        const g = Math.min(255, rgb1.g + rgb2.g);
        const b = Math.min(255, rgb1.b + rgb2.b);

        this.settings.intersectionColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    drawNodalLines(ctx, width, height, tone1X, tone1Y, tone2X, tone2Y, time) {
        // Use proper standing wave equations to find nodal lines
        const gridSize = 3;

        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                let combined = 0;

                if (this.settings.chladniPlateShape === 'square') {
                    const L = Math.max(width, height);

                    if (this.isPlayingTone1) {
                        const n1 = Math.floor(this.tone1Freq / 100) + 1;
                        const m1 = Math.floor(this.tone1Freq / 120) + 1;
                        combined += Math.sin(n1 * Math.PI * x / L) * Math.sin(m1 * Math.PI * y / L);
                    }

                    if (this.isPlayingTone2) {
                        const n2 = Math.floor(this.tone2Freq / 100) + 1;
                        const m2 = Math.floor(this.tone2Freq / 120) + 1;
                        combined += Math.sin(n2 * Math.PI * x / L) * Math.sin(m2 * Math.PI * y / L);
                    }
                } else {
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const r = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                    const maxRadius = Math.min(width, height) / 2;
                    const normalizedR = r / maxRadius;

                    if (this.isPlayingTone1) {
                        const k1 = this.tone1Freq / 100;
                        combined += Math.sin(k1 * Math.PI * normalizedR);
                    }

                    if (this.isPlayingTone2) {
                        const k2 = this.tone2Freq / 100;
                        combined += Math.sin(k2 * Math.PI * normalizedR);
                    }
                }

                // Highlight nodal lines (near-zero amplitude)
                if (Math.abs(combined) < 0.15) {
                    ctx.fillStyle = this.settings.chladniNodalLineColor;
                    ctx.globalAlpha = 0.7;
                    ctx.fillRect(x, y, this.settings.chladniNodalLineWidth, this.settings.chladniNodalLineWidth);
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    drawVibrationField(ctx, width, height, tone1X, tone1Y, tone2X, tone2Y, time) {
        const gridSize = 30;

        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                const dist1 = Math.sqrt(Math.pow(x - tone1X, 2) + Math.pow(y - tone1Y, 2));
                const dist2 = Math.sqrt(Math.pow(x - tone2X, 2) + Math.pow(y - tone2Y, 2));

                const wave1 = this.isPlayingTone1 ? Math.sin(dist1 * 0.05 - this.tone1Freq * time * 0.01) : 0;
                const wave2 = this.isPlayingTone2 ? Math.sin(dist2 * 0.05 - this.tone2Freq * time * 0.01) : 0;

                const combined = (wave1 + wave2) * 10;

                const angle1 = Math.atan2(y - tone1Y, x - tone1X);
                const angle2 = Math.atan2(y - tone2Y, x - tone2X);

                const avgAngle = (angle1 + angle2) / 2;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(avgAngle + Math.PI / 2) * combined, y + Math.sin(avgAngle + Math.PI / 2) * combined);
                ctx.stroke();
            }
        }
    }

    drawFieldLine(ctx, x, y, angle, frequency, time, color) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = this.settings.harmonicLineThickness;

        ctx.beginPath();
        ctx.moveTo(x, y);

        const segments = 50;
        const maxLength = 300;

        // Calculate wavelength based on frequency
        // Lower frequencies = longer wavelengths (more spread out)
        // Higher frequencies = shorter wavelengths (tighter)
        // Use 440 Hz as reference (A4)
        const referenceFreq = 440;
        const wavelengthScale = referenceFreq / frequency;  // Inverse relationship

        // Spatial frequency affects how tight the waves are along the field line
        const spatialFrequency = 0.1 / wavelengthScale;  // Lower notes have lower spatial freq (more spread)

        // Wave amplitude - can be adjusted
        const waveAmplitude = 10 * this.settings.harmonicDensity;

        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const distance = t * maxLength;

            // Wave oscillation perpendicular to field line
            // The spatial frequency makes lower notes more spread out, higher notes tighter
            const wave = Math.sin(distance * spatialFrequency - frequency * time * 0.01) * waveAmplitude;

            const px = x + Math.cos(angle) * distance + Math.cos(angle + Math.PI / 2) * wave;
            const py = y + Math.sin(angle) * distance + Math.sin(angle + Math.PI / 2) * wave;

            ctx.lineTo(px, py);
        }

        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawPhaseRelationship(ctx, tone1X, tone1Y, tone2X, tone2Y, time) {
        // Draw connection line between tones
        ctx.strokeStyle = this.settings.intersectionColor;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(tone1X, tone1Y);
        ctx.lineTo(tone2X, tone2Y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Draw phase indicator
        const midX = (tone1X + tone2X) / 2;
        const midY = (tone1Y + tone2Y) / 2;

        const phaseDiff = (this.tone2Freq - this.tone1Freq) * time * 0.01;
        const phaseAngle = phaseDiff % (Math.PI * 2);

        ctx.strokeStyle = this.settings.intersectionColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(midX, midY, 20, 0, phaseAngle);
        ctx.stroke();
    }

    drawToneSource(ctx, x, y, color, label, isActive = false) {
        if (isActive) {
            // Draw glow when active
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
        } else {
            ctx.shadowBlur = 0;
        }

        // Draw circle - dimmer when inactive
        ctx.fillStyle = isActive ? color : `${color}80`; // Add 80 hex for 50% opacity when inactive
        ctx.globalAlpha = isActive ? 1 : 0.5;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Draw label
        ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }

    drawPulses() {
        const ctx = this.ctx;
        const now = performance.now();

        // Remove expired pulses
        this.pulses = this.pulses.filter(pulse => {
            const elapsed = now - pulse.startTime;
            return elapsed < this.settings.pulseDuration;
        });

        // Draw each active pulse
        this.pulses.forEach(pulse => {
            const elapsed = now - pulse.startTime;
            const progress = elapsed / this.settings.pulseDuration;

            // Calculate radius based on elapsed time
            const radius = (elapsed / 1000) * this.settings.pulseSpeed;

            // Calculate opacity (fade out over time)
            const opacity = this.settings.pulseOpacity * (1 - progress);

            // Draw pulse ring
            ctx.strokeStyle = pulse.color;
            ctx.lineWidth = this.settings.pulseWidth;
            ctx.globalAlpha = opacity;

            // Draw dashed line for stop pulses, solid for start
            if (pulse.isStart) {
                ctx.setLineDash([]);
            } else {
                ctx.setLineDash([10, 10]);
            }

            ctx.beginPath();
            ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        });

        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }

    drawInterferencePulses() {
        if (!this.settings.showInterferencePulse) return;
        if (!this.isPlayingTone1 || !this.isPlayingTone2) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const now = performance.now();

        // Calculate tone positions
        const tone1X = (this.tone1X / 100) * width;
        const tone2X = (this.tone2X / 100) * width;
        const tone1Y = height / 2;
        const tone2Y = height / 2;

        // Calculate interference point (midpoint between tones)
        const interferenceX = (tone1X + tone2X) / 2;
        const interferenceY = (tone1Y + tone2Y) / 2;

        // Create periodic interference pulses
        const timeSinceStart = Math.min(
            this.tone1StartTime ? now - this.tone1StartTime : Infinity,
            this.tone2StartTime ? now - this.tone2StartTime : Infinity
        );

        // Create a pulse at regular intervals
        const pulseNumber = Math.floor(timeSinceStart / this.settings.interferencePulseInterval);
        const timeSinceLastPulse = timeSinceStart % this.settings.interferencePulseInterval;

        // Only draw if we're within the display duration of the current pulse
        if (timeSinceLastPulse < this.settings.pulseDuration) {
            const progress = timeSinceLastPulse / this.settings.pulseDuration;
            const radius = (timeSinceLastPulse / 1000) * this.settings.pulseSpeed;
            const opacity = this.settings.pulseOpacity * (1 - progress);

            // Use intersection color
            ctx.strokeStyle = this.settings.intersectionColor;
            ctx.lineWidth = this.settings.pulseWidth * 1.5;  // Slightly thicker
            ctx.globalAlpha = opacity;
            ctx.setLineDash([5, 5]);

            ctx.beginPath();
            ctx.arc(interferenceX, interferenceY, radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }
    }

    blendColors(color1, color2, ratio) {
        if (!this.settings.colorBlend) {
            return ratio < 0.5 ? color1 : color2;
        }

        const r1 = parseInt(color1.substr(1, 2), 16);
        const g1 = parseInt(color1.substr(3, 2), 16);
        const b1 = parseInt(color1.substr(5, 2), 16);

        const r2 = parseInt(color2.substr(1, 2), 16);
        const g2 = parseInt(color2.substr(3, 2), 16);
        const b2 = parseInt(color2.substr(5, 2), 16);

        const r = Math.round(r1 + (r2 - r1) * ratio);
        const g = Math.round(g1 + (g2 - g1) * ratio);
        const b = Math.round(b1 + (b2 - b1) * ratio);

        return `rgb(${r}, ${g}, ${b})`;
    }

    drawInteractionZones(ctx, width, height, tone1X, tone1Y, tone2X, tone2Y, time) {
        if (!this.settings.showInterferenceZones) return;

        const gridSize = 15;
        ctx.globalAlpha = this.settings.interferenceOpacity * 0.5;

        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                const dist1 = Math.sqrt(Math.pow(x - tone1X, 2) + Math.pow(y - tone1Y, 2));
                const dist2 = Math.sqrt(Math.pow(x - tone2X, 2) + Math.pow(y - tone2Y, 2));

                const wave1 = this.isPlayingTone1 ? Math.sin(dist1 * 0.05 - this.tone1Freq * time * 0.01) : 0;
                const wave2 = this.isPlayingTone2 ? Math.sin(dist2 * 0.05 - this.tone2Freq * time * 0.01) : 0;

                // Calculate constructive/destructive interference
                const combined = wave1 + wave2;
                const interference = Math.abs(combined);

                // Highlight strong interference zones
                if (interference > 1.5) {
                    const brightness = this.settings.highlightInterference ? (interference / 2) * 0.6 : 0.3;
                    ctx.fillStyle = this.settings.intersectionColor;
                    ctx.globalAlpha = brightness * this.settings.interferenceOpacity;
                    ctx.fillRect(x, y, gridSize, gridSize);
                }
            }
        }

        ctx.globalAlpha = 1;
    }

    start() {
        // Force canvas resize when shown
        const container = this.canvas.parentElement;
        if (container && container.offsetWidth > 0) {
            this.canvas.width = container.offsetWidth;
            this.canvas.height = 600;
        }
        this.updateIntervalColors();
        this.initializeParticles();

        // Open settings panel by default
        const settingsPanel = document.querySelector('.cymatic-settings-panel');
        if (settingsPanel) {
            settingsPanel.open = true;
        }
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.stopTone1();
        this.stopTone2();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
