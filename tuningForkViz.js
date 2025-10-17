// Tuning Fork Visualization Exercise - Interactive frequency visualization
class TuningForkViz {
    constructor() {
        this.exerciseId = 'tuningForkViz';
        this.containerId = 'tuningForkVizExercise';
        this.rootToneGenerator = new ToneGenerator();
        this.targetToneGenerator = new ToneGenerator();
        this.rootFrequency = 440; // Default A4
        this.targetFrequency = 659; // Default E5 (perfect fifth)
        this.isPlayingRoot = false;
        this.isPlayingTarget = false;
        this.animationFrame = null;

        // Settings - all customizable
        this.settings = {
            // Visibility toggles
            showTuningForks: false,
            showWaves: false,
            showInterference: false,

            forkSize: 1.0,
            vibrationSpeed: 0.125,
            vibrationAmount: 15,
            showForkLabels: true,
            waveSpeed: 0.5,
            numWaves: 8,
            waveOpacity: 0.8,
            maxRadius: 150,
            waveStyle: 'circle',
            waveModulation: 0,
            modulationFreq: 4,
            lineThickness: 2,
            spacingVariation: 0,
            frequencyScaling: true,
            frequencyColor: true,
            pitchSize: false,
            beatSpeed: 0.5,
            pulseSize: 15,
            interferenceRings: 3,
            ringSpacing: 20,
            showBeatLabel: true,
            showInterferenceState: true,
            rootColor: '#00ffff',
            targetColor: '#ff00ff',
            interferenceColor: '#ffff00',
            waveGlow: true,
            forkSpacing: 0.25,
            forkYPosition: 0.5,
            showGrid: true,
            // Strobe settings
            showStrobe: true,
            strobePattern: 'radial',
            strobeSegments: 12,
            strobeRadius: 100,
            strobeWidth: 30,
            strobeSpeed: 1.0,
            strobeOpacity: 0.7,
            strobeReferenceFreq: 440,
            strobeAlternateDirection: false,
            strobeFrequencySize: false,
            strobeMode: 'single', // single, dual, triple, expanding
            strobeCircleFork: true, // Circle the tuning fork instead of appearing separately
            // Peterson strobe effect settings
            petersonMode: true, // Enable true Peterson strobe tuner effect
            petersonRings: 3, // Number of strobe rings (2-4)
            petersonRingSpacing: 15, // Spacing between rings in pixels
            petersonCalibratedNote: 440, // The note each ring is calibrated to
            petersonHarmonics: true // Include harmonic rings (octaves)
        };

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById(this.containerId);
        this.combinedCanvas = document.getElementById('tuningForkStrobeCanvas'); // Using one canvas for everything now
        this.exitBtn = document.getElementById('tuningForkVizExitBtn');
        this.settingsBtn = document.getElementById('audioSettingsBtnTuningFork');
        this.playRootBtn = document.getElementById('tuningForkPlayRootBtn');
        this.playTargetBtn = document.getElementById('tuningForkPlayTargetBtn');
        this.playBothBtn = document.getElementById('tuningForkPlayBothBtn');
        this.randomizeBtn = document.getElementById('tuningForkRandomizeBtn');
        this.rootFreqInput = document.getElementById('tuningForkRootFreq');
        this.targetFreqInput = document.getElementById('tuningForkTargetFreq');
        this.rootSlider1 = document.getElementById('tuningForkRootSlider1');
        this.rootSlider2 = document.getElementById('tuningForkRootSlider2');
        this.targetSlider1 = document.getElementById('tuningForkTargetSlider1');
        this.targetSlider2 = document.getElementById('tuningForkTargetSlider2');
        this.intervalNameDisplay = document.getElementById('tuningForkIntervalName');

        // All setting inputs
        this.settingInputs = {
            showTuningForks: document.getElementById('settingShowTuningForks'),
            showWaves: document.getElementById('settingShowWaves'),
            showInterference: document.getElementById('settingShowInterference'),
            forkSize: document.getElementById('settingForkSize'),
            vibrationSpeed: document.getElementById('settingVibrationSpeed'),
            vibrationAmount: document.getElementById('settingVibrationAmount'),
            showForkLabels: document.getElementById('settingShowForkLabels'),
            waveSpeed: document.getElementById('settingWaveSpeed'),
            numWaves: document.getElementById('settingNumWaves'),
            waveOpacity: document.getElementById('settingWaveOpacity'),
            maxRadius: document.getElementById('settingMaxRadius'),
            waveStyle: document.getElementById('settingWaveStyle'),
            waveModulation: document.getElementById('settingWaveModulation'),
            modulationFreq: document.getElementById('settingModulationFreq'),
            lineThickness: document.getElementById('settingLineThickness'),
            spacingVariation: document.getElementById('settingSpacingVariation'),
            frequencyScaling: document.getElementById('settingFrequencyScaling'),
            frequencyColor: document.getElementById('settingFrequencyColor'),
            pitchSize: document.getElementById('settingPitchSize'),
            beatSpeed: document.getElementById('settingBeatSpeed'),
            pulseSize: document.getElementById('settingPulseSize'),
            interferenceRings: document.getElementById('settingInterferenceRings'),
            ringSpacing: document.getElementById('settingRingSpacing'),
            showBeatLabel: document.getElementById('settingShowBeatLabel'),
            showInterferenceState: document.getElementById('settingShowInterferenceState'),
            rootColor: document.getElementById('settingRootColor'),
            targetColor: document.getElementById('settingTargetColor'),
            interferenceColor: document.getElementById('settingInterferenceColor'),
            waveGlow: document.getElementById('settingWaveGlow'),
            forkSpacing: document.getElementById('settingForkSpacing'),
            forkYPosition: document.getElementById('settingForkYPosition'),
            showGrid: document.getElementById('settingShowGrid'),
            showStrobe: document.getElementById('settingShowStrobe'),
            strobePattern: document.getElementById('settingStrobePattern'),
            strobeSegments: document.getElementById('settingStrobeSegments'),
            strobeRadius: document.getElementById('settingStrobeRadius'),
            strobeWidth: document.getElementById('settingStrobeWidth'),
            strobeSpeed: document.getElementById('settingStrobeSpeed'),
            strobeOpacity: document.getElementById('settingStrobeOpacity'),
            strobeReferenceFreq: document.getElementById('settingStrobeReferenceFreq'),
            strobeAlternateDirection: document.getElementById('settingStrobeAlternateDirection'),
            strobeFrequencySize: document.getElementById('settingStrobeFrequencySize'),
            strobeMode: document.getElementById('settingStrobeMode'),
            strobeCircleFork: document.getElementById('settingStrobeCircleFork'),
            petersonMode: document.getElementById('settingPetersonMode'),
            petersonRings: document.getElementById('settingPetersonRings'),
            petersonRingSpacing: document.getElementById('settingPetersonRingSpacing'),
            petersonCalibratedNote: document.getElementById('settingPetersonCalibratedNote'),
            petersonHarmonics: document.getElementById('settingPetersonHarmonics')
        };

        // Value display elements
        this.valueDisplays = {
            forkSize: document.getElementById('valueForkSize'),
            vibrationSpeed: document.getElementById('valueVibrationSpeed'),
            vibrationAmount: document.getElementById('valueVibrationAmount'),
            waveSpeed: document.getElementById('valueWaveSpeed'),
            numWaves: document.getElementById('valueNumWaves'),
            waveOpacity: document.getElementById('valueWaveOpacity'),
            maxRadius: document.getElementById('valueMaxRadius'),
            waveModulation: document.getElementById('valueWaveModulation'),
            modulationFreq: document.getElementById('valueModulationFreq'),
            lineThickness: document.getElementById('valueLineThickness'),
            spacingVariation: document.getElementById('valueSpacingVariation'),
            beatSpeed: document.getElementById('valueBeatSpeed'),
            pulseSize: document.getElementById('valuePulseSize'),
            interferenceRings: document.getElementById('valueInterferenceRings'),
            ringSpacing: document.getElementById('valueRingSpacing'),
            forkSpacing: document.getElementById('valueForkSpacing'),
            forkYPosition: document.getElementById('valueForkYPosition'),
            strobeSegments: document.getElementById('valueStrobeSegments'),
            strobeRadius: document.getElementById('valueStrobeRadius'),
            strobeWidth: document.getElementById('valueStrobeWidth'),
            strobeSpeed: document.getElementById('valueStrobeSpeed'),
            strobeOpacity: document.getElementById('valueStrobeOpacity'),
            strobeReferenceFreq: document.getElementById('valueStrobeReferenceFreq'),
            petersonRings: document.getElementById('valuePetersonRings'),
            petersonRingSpacing: document.getElementById('valuePetersonRingSpacing'),
            petersonCalibratedNote: document.getElementById('valuePetersonCalibratedNote')
        };
    }

    attachEventListeners() {
        this.exitBtn.addEventListener('click', () => this.exit());

        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => {
                if (window.audioSettings) {
                    window.audioSettings.show();
                }
            });
        }

        this.playRootBtn.addEventListener('click', () => this.toggleRoot());
        this.playTargetBtn.addEventListener('click', () => this.toggleTarget());
        this.playBothBtn.addEventListener('click', () => this.toggleBoth());
        this.randomizeBtn.addEventListener('click', () => this.randomizeFrequencies());

        // Frequency inputs
        this.rootFreqInput.addEventListener('input', (e) => {
            this.rootFrequency = parseFloat(e.target.value);
            this.syncSliders('root', this.rootFrequency);
            this.updateIntervalDisplay();
            if (this.isPlayingRoot) {
                this.rootToneGenerator.playTone(this.rootFrequency, 0.3);
            }
        });

        this.targetFreqInput.addEventListener('input', (e) => {
            this.targetFrequency = parseFloat(e.target.value);
            this.syncSliders('target', this.targetFrequency);
            this.updateIntervalDisplay();
            if (this.isPlayingTarget) {
                this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
            }
        });

        // Root sliders
        this.rootSlider1.addEventListener('input', (e) => {
            this.rootFrequency = parseFloat(e.target.value);
            this.rootFreqInput.value = this.rootFrequency;
            this.rootSlider2.value = this.rootFrequency;
            this.updateIntervalDisplay();
            if (this.isPlayingRoot) {
                this.rootToneGenerator.playTone(this.rootFrequency, 0.3);
            }
        });

        this.rootSlider2.addEventListener('input', (e) => {
            this.rootFrequency = parseFloat(e.target.value);
            this.rootFreqInput.value = this.rootFrequency;
            this.rootSlider1.value = this.rootFrequency;
            this.updateIntervalDisplay();
            if (this.isPlayingRoot) {
                this.rootToneGenerator.playTone(this.rootFrequency, 0.3);
            }
        });

        // Target sliders
        this.targetSlider1.addEventListener('input', (e) => {
            this.targetFrequency = parseFloat(e.target.value);
            this.targetFreqInput.value = this.targetFrequency;
            this.targetSlider2.value = this.targetFrequency;
            this.updateIntervalDisplay();
            if (this.isPlayingTarget) {
                this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
            }
        });

        this.targetSlider2.addEventListener('input', (e) => {
            this.targetFrequency = parseFloat(e.target.value);
            this.targetFreqInput.value = this.targetFrequency;
            this.targetSlider1.value = this.targetFrequency;
            this.updateIntervalDisplay();
            if (this.isPlayingTarget) {
                this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
            }
        });

        // Attach setting listeners
        Object.entries(this.settingInputs).forEach(([key, input]) => {
            if (!input) return;

            if (input.type === 'checkbox') {
                input.addEventListener('change', () => {
                    this.settings[key] = input.checked;
                });
            } else if (input.type === 'range' || input.type === 'number') {
                input.addEventListener('input', () => {
                    this.settings[key] = parseFloat(input.value);
                    this.updateValueDisplay(key);
                });
            } else if (input.type === 'color') {
                input.addEventListener('input', () => {
                    this.settings[key] = input.value;
                });
            } else if (input.tagName === 'SELECT') {
                input.addEventListener('change', () => {
                    this.settings[key] = input.value;
                });
            }
        });

        // Preset buttons
        document.getElementById('presetDefault').addEventListener('click', () => this.applyPreset('default'));
        document.getElementById('presetMinimal').addEventListener('click', () => this.applyPreset('minimal'));
        document.getElementById('presetMaximal').addEventListener('click', () => this.applyPreset('maximal'));
        document.getElementById('presetFast').addEventListener('click', () => this.applyPreset('fast'));
        document.getElementById('presetSlow').addEventListener('click', () => this.applyPreset('slow'));
    }

    updateValueDisplay(key) {
        const display = this.valueDisplays[key];
        if (!display) return;

        const value = this.settings[key];
        if (key === 'forkSize' || key === 'waveSpeed' || key === 'beatSpeed' || key === 'strobeSpeed') {
            display.textContent = `${value.toFixed(1)}x`;
        } else if (key === 'waveOpacity') {
            display.textContent = value.toFixed(1);
        } else if (key === 'vibrationSpeed') {
            display.textContent = value.toFixed(3);
        } else if (key === 'forkSpacing') {
            display.textContent = `${(value * 100).toFixed(0)}%`;
        } else if (key === 'forkYPosition') {
            display.textContent = `${(value * 100).toFixed(0)}%`;
        } else if (key === 'strobeOpacity') {
            display.textContent = value.toFixed(1);
        } else if (key.includes('Amount') || key.includes('Size') || key.includes('Radius') || key.includes('Spacing') || key.includes('Width')) {
            display.textContent = `${value}px`;
        } else if (key.includes('Freq')) {
            display.textContent = `${value} Hz`;
        } else {
            display.textContent = value.toString();
        }
    }

    applyPreset(preset) {
        const presets = {
            default: {
                forkSize: 1.0,
                vibrationSpeed: 0.125,
                vibrationAmount: 15,
                waveSpeed: 0.5,
                numWaves: 8,
                waveOpacity: 0.8,
                maxRadius: 150,
                beatSpeed: 0.5,
                pulseSize: 15,
                interferenceRings: 3,
                ringSpacing: 20,
                showForkLabels: true,
                frequencyScaling: true,
                showBeatLabel: true,
                showInterferenceState: true,
                waveGlow: true,
                forkSpacing: 0.25,
                forkYPosition: 0.5,
                showGrid: true
            },
            minimal: {
                forkSize: 0.8,
                vibrationSpeed: 0.1,
                vibrationAmount: 10,
                waveSpeed: 0.3,
                numWaves: 4,
                waveOpacity: 0.5,
                maxRadius: 120,
                beatSpeed: 0.3,
                pulseSize: 10,
                interferenceRings: 1,
                ringSpacing: 15,
                showForkLabels: false,
                frequencyScaling: false,
                showBeatLabel: false,
                showInterferenceState: false,
                waveGlow: false,
                forkSpacing: 0.3,
                forkYPosition: 0.5,
                showGrid: false
            },
            maximal: {
                forkSize: 1.5,
                vibrationSpeed: 0.3,
                vibrationAmount: 25,
                waveSpeed: 0.8,
                numWaves: 12,
                waveOpacity: 1.0,
                maxRadius: 220,
                beatSpeed: 0.8,
                pulseSize: 25,
                interferenceRings: 6,
                ringSpacing: 30,
                showForkLabels: true,
                frequencyScaling: true,
                showBeatLabel: true,
                showInterferenceState: true,
                waveGlow: true,
                forkSpacing: 0.2,
                forkYPosition: 0.5,
                showGrid: true
            },
            fast: {
                ...this.settings,
                vibrationSpeed: 0.4,
                waveSpeed: 1.0,
                beatSpeed: 1.0
            },
            slow: {
                ...this.settings,
                vibrationSpeed: 0.05,
                waveSpeed: 0.2,
                beatSpeed: 0.2
            }
        };

        const presetSettings = presets[preset];
        Object.entries(presetSettings).forEach(([key, value]) => {
            this.settings[key] = value;
            const input = this.settingInputs[key];
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else {
                    input.value = value;
                }
                this.updateValueDisplay(key);
            }
        });
    }

    syncSliders(type, value) {
        if (type === 'root') {
            this.rootSlider1.value = value;
            this.rootSlider2.value = value;
        } else {
            this.targetSlider1.value = value;
            this.targetSlider2.value = value;
        }
    }

    randomizeFrequencies() {
        // Generate random frequencies in unison
        const randomFreq = Math.floor(Math.random() * (800 - 200 + 1)) + 200;

        this.rootFrequency = randomFreq;
        this.targetFrequency = randomFreq;

        // Update all inputs to same value
        this.rootFreqInput.value = randomFreq;
        this.targetFreqInput.value = randomFreq;
        this.syncSliders('root', randomFreq);
        this.syncSliders('target', randomFreq);

        this.updateIntervalDisplay();

        // Randomize all settings
        const randomSettings = {
            // Visibility
            showTuningForks: Math.random() > 0.3,
            showWaves: Math.random() > 0.3,
            showInterference: Math.random() > 0.5,

            // Fork settings
            forkSize: 0.5 + Math.random() * 1.5, // 0.5-2.0
            vibrationSpeed: 0.05 + Math.random() * 0.45, // 0.05-0.5
            vibrationAmount: 5 + Math.floor(Math.random() * 26), // 5-30
            showForkLabels: Math.random() > 0.5,

            // Wave settings
            waveSpeed: 0.1 + Math.random() * 0.9, // 0.1-1.0
            numWaves: 3 + Math.floor(Math.random() * 10), // 3-12
            waveOpacity: 0.3 + Math.random() * 0.7, // 0.3-1.0
            maxRadius: 100 + Math.floor(Math.random() * 151), // 100-250
            waveStyle: ['circle', 'oscilloscope', 'square', 'hexagon', 'spiral'][Math.floor(Math.random() * 5)],
            waveModulation: Math.floor(Math.random() * 21) * 0.5, // 0-10
            modulationFreq: 1 + Math.floor(Math.random() * 12), // 1-12
            lineThickness: 1 + Math.floor(Math.random() * 8), // 1-8
            spacingVariation: Math.floor(Math.random() * 51), // 0-50
            frequencyScaling: Math.random() > 0.5,
            frequencyColor: Math.random() > 0.5,
            pitchSize: Math.random() > 0.5,

            // Interference settings
            beatSpeed: 0.1 + Math.random() * 0.9, // 0.1-1.0
            pulseSize: 5 + Math.floor(Math.random() * 26), // 5-30
            interferenceRings: Math.floor(Math.random() * 9), // 0-8
            ringSpacing: 10 + Math.floor(Math.random() * 7) * 5, // 10-40 (step 5)
            showBeatLabel: Math.random() > 0.5,
            showInterferenceState: Math.random() > 0.5,

            // Color settings
            rootColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
            targetColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
            interferenceColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
            waveGlow: Math.random() > 0.5,

            // Layout settings
            forkSpacing: 0.2 + Math.random() * 0.2, // 0.2-0.4
            forkYPosition: 0.3 + Math.random() * 0.4, // 0.3-0.7
            showGrid: Math.random() > 0.5,

            // Strobe settings
            showStrobe: Math.random() > 0.5,
            strobePattern: ['radial', 'dots', 'bars', 'wave'][Math.floor(Math.random() * 4)],
            strobeSegments: 6 + Math.floor(Math.random() * 19), // 6-24
            strobeRadius: 50 + Math.floor(Math.random() * 16) * 10, // 50-200 (step 10)
            strobeWidth: 10 + Math.floor(Math.random() * 11) * 5, // 10-60 (step 5)
            strobeSpeed: 0.5 + Math.floor(Math.random() * 26) * 0.1, // 0.5-3.0
            strobeOpacity: 0.3 + Math.floor(Math.random() * 8) * 0.1, // 0.3-1.0
            strobeReferenceFreq: 200 + Math.floor(Math.random() * 601), // 200-800
            strobeAlternateDirection: Math.random() > 0.5,
            strobeFrequencySize: Math.random() > 0.5,
            strobeMode: ['single', 'dual', 'triple', 'expanding'][Math.floor(Math.random() * 4)],
            strobeCircleFork: Math.random() > 0.5,
            // Peterson settings
            petersonMode: Math.random() > 0.5,
            petersonRings: 2 + Math.floor(Math.random() * 3), // 2-4
            petersonRingSpacing: 10 + Math.floor(Math.random() * 21), // 10-30
            petersonCalibratedNote: 200 + Math.floor(Math.random() * 601), // 200-800
            petersonHarmonics: Math.random() > 0.5
        };

        // Apply randomized settings
        Object.entries(randomSettings).forEach(([key, value]) => {
            this.settings[key] = value;
            const input = this.settingInputs[key];
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else if (input.tagName === 'SELECT') {
                    input.value = value;
                } else {
                    input.value = value;
                }
                this.updateValueDisplay(key);
            }
        });

        // Update playing tones if active
        if (this.isPlayingRoot) {
            this.rootToneGenerator.playTone(this.rootFrequency, 0.3);
        }
        if (this.isPlayingTarget) {
            this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
        }
    }

    async start() {
        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';
        this.initializeCanvas();
        this.updateIntervalDisplay();
        this.animate();
    }

    initializeCanvas() {
        if (this.combinedCanvas) {
            this.combinedCanvas.width = this.combinedCanvas.offsetWidth;
            this.combinedCanvas.height = this.combinedCanvas.offsetHeight;
        }
    }

    updateIntervalDisplay() {
        const cents = Math.round(1200 * Math.log2(this.targetFrequency / this.rootFrequency));
        const intervalNames = {
            0: 'Unison',
            100: 'Half Step',
            200: 'Whole Step',
            300: 'Minor Third',
            400: 'Major Third',
            500: 'Perfect Fourth',
            700: 'Perfect Fifth',
            1200: 'Octave'
        };

        let intervalName = 'Custom Interval';
        for (const [intervalCents, name] of Object.entries(intervalNames)) {
            if (Math.abs(cents - parseInt(intervalCents)) < 10) {
                intervalName = name;
                break;
            }
        }

        this.intervalNameDisplay.textContent = `${intervalName} (${cents} cents)`;
    }

    toggleRoot() {
        if (this.isPlayingRoot) {
            this.rootToneGenerator.stopTone();
            this.isPlayingRoot = false;
            this.playRootBtn.textContent = 'Play Root';
        } else {
            this.rootToneGenerator.playTone(this.rootFrequency, 0.3);
            this.isPlayingRoot = true;
            this.playRootBtn.textContent = 'Stop Root';
        }
    }

    toggleTarget() {
        if (this.isPlayingTarget) {
            this.targetToneGenerator.stopTone();
            this.isPlayingTarget = false;
            this.playTargetBtn.textContent = 'Play Target';
        } else {
            this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
            this.isPlayingTarget = true;
            this.playTargetBtn.textContent = 'Stop Target';
        }
    }

    toggleBoth() {
        const anyPlaying = this.isPlayingRoot || this.isPlayingTarget;

        if (anyPlaying) {
            this.rootToneGenerator.stopTone();
            this.targetToneGenerator.stopTone();
            this.isPlayingRoot = false;
            this.isPlayingTarget = false;
            this.playBothBtn.textContent = 'Play Both';
            this.playRootBtn.textContent = 'Play Root';
            this.playTargetBtn.textContent = 'Play Target';
        } else {
            this.rootToneGenerator.playTone(this.rootFrequency, 0.3);
            this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
            this.isPlayingRoot = true;
            this.isPlayingTarget = true;
            this.playBothBtn.textContent = 'Stop Both';
            this.playRootBtn.textContent = 'Stop Root';
            this.playTargetBtn.textContent = 'Stop Target';
        }
    }

    animate() {
        if (!this.container || this.container.style.display === 'none') return;

        const canvas = this.combinedCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background grid
        if (this.settings.showGrid) {
            this.drawGrid(ctx, width, height);
        }

        // Calculate layout
        const centerY = height * this.settings.forkYPosition;
        const leftX = width * this.settings.forkSpacing;
        const rightX = width * (1 - this.settings.forkSpacing);

        // Draw root fork and waves (always show if settings enabled, dim when not playing)
        if (this.settings.showTuningForks) {
            this.drawTuningFork(ctx, leftX, centerY, this.rootFrequency, time, this.settings.rootColor, 'Root', this.isPlayingRoot);
        }
        if (this.isPlayingRoot && this.settings.showWaves) {
            this.drawWaves(ctx, leftX, centerY - 40 * this.settings.forkSize, this.rootFrequency, time, this.settings.rootColor);
        }

        // Draw strobes (always show if enabled, animate only when playing)
        if (this.settings.showStrobe) {
            if (this.settings.petersonMode) {
                this.drawPetersonStrobe(ctx, leftX, centerY - 40 * this.settings.forkSize, this.rootFrequency, time, this.settings.rootColor, this.isPlayingRoot);
            } else if (this.settings.strobeCircleFork) {
                this.drawStrobeCircling(ctx, leftX, centerY - 40 * this.settings.forkSize, this.rootFrequency, time, this.settings.rootColor, this.isPlayingRoot);
            }
        }

        // Draw target fork and waves (always show if settings enabled, dim when not playing)
        if (this.settings.showTuningForks) {
            this.drawTuningFork(ctx, rightX, centerY, this.targetFrequency, time, this.settings.targetColor, 'Target', this.isPlayingTarget);
        }
        if (this.isPlayingTarget && this.settings.showWaves) {
            this.drawWaves(ctx, rightX, centerY - 40 * this.settings.forkSize, this.targetFrequency, time, this.settings.targetColor);
        }

        // Draw strobes (always show if enabled, animate only when playing)
        if (this.settings.showStrobe) {
            if (this.settings.petersonMode) {
                this.drawPetersonStrobe(ctx, rightX, centerY - 40 * this.settings.forkSize, this.targetFrequency, time, this.settings.targetColor, this.isPlayingTarget);
            } else if (this.settings.strobeCircleFork) {
                this.drawStrobeCircling(ctx, rightX, centerY - 40 * this.settings.forkSize, this.targetFrequency, time, this.settings.targetColor, this.isPlayingTarget);
            }
        }

        // Draw interference pulse
        if (this.settings.showInterference && this.isPlayingRoot && this.isPlayingTarget) {
            this.drawInterferencePulse(ctx, width / 2, centerY - 40 * this.settings.forkSize, time);
        }

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    drawGrid(ctx, width, height) {
        const gridSpacing = 30;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        for (let x = 0; x < width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y < height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawTuningFork(ctx, centerX, centerY, frequency, time, color, label, isPlaying = true) {
        const scale = this.settings.forkSize;
        const vibrationPhase = isPlaying ? time * frequency * Math.PI * this.settings.vibrationSpeed : 0;
        const displacement = Math.sin(vibrationPhase) * this.settings.vibrationAmount;

        const handleWidth = 8 * scale;
        const handleHeight = 60 * scale;
        const handleTop = centerY + 40 * scale;
        const prongWidth = 6 * scale;
        const prongHeight = 80 * scale;
        const prongSeparation = 30 * scale;

        // Set opacity based on playing state
        const opacity = isPlaying ? 1 : 0.3;
        ctx.globalAlpha = opacity;

        // Handle
        ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
        ctx.fillRect(centerX - handleWidth / 2, handleTop, handleWidth, handleHeight);

        // Prongs
        ctx.fillStyle = color;
        if (this.settings.waveGlow && isPlaying) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        }
        const leftProngX = centerX - prongSeparation / 2 - prongWidth + displacement;
        ctx.fillRect(leftProngX, centerY - prongHeight, prongWidth, prongHeight);
        const rightProngX = centerX + prongSeparation / 2 - displacement;
        ctx.fillRect(rightProngX, centerY - prongHeight, prongWidth, prongHeight);

        // Connecting base
        ctx.fillRect(centerX - prongSeparation / 2 - prongWidth, centerY - 10 * scale,
                     prongSeparation + prongWidth * 2, 10 * scale);
        ctx.shadowBlur = 0;

        // Label
        if (this.settings.showForkLabels) {
            ctx.fillStyle = color;
            ctx.font = `bold ${12 * scale}px monospace`;
            ctx.fillText(label, centerX - 20 * scale, centerY + handleHeight + 75 * scale);
            ctx.font = `${10 * scale}px monospace`;
            ctx.fillText(`${frequency.toFixed(1)} Hz`, centerX - 25 * scale, centerY + handleHeight + 90 * scale);
        }

        // Reset opacity
        ctx.globalAlpha = 1;
    }

    drawWaves(ctx, centerX, centerY, frequency, time, color) {
        const numWaves = this.settings.numWaves;
        const maxRadius = this.settings.maxRadius;
        const frequencyScale = this.settings.frequencyScaling ? (frequency / 440) : 1;
        const waveSpeed = this.settings.waveSpeed * frequencyScale;

        // Frequency-based color shift (hue rotation)
        let waveColor = color;
        if (this.settings.frequencyColor) {
            const hueShift = ((frequency - 440) / 200) * 60; // ±60 degrees based on frequency
            waveColor = this.shiftHue(color, hueShift);
        }

        for (let i = 0; i < numWaves; i++) {
            // Add spacing variation based on frequency
            const spacingFactor = 1 + (this.settings.spacingVariation / 100) * (frequency / 440 - 1);
            const phaseOffset = (i / numWaves) * Math.PI * 2 * spacingFactor;
            const expansionPhase = (time * waveSpeed * 0.5) + phaseOffset;
            const waveRadius = 30 + ((expansionPhase % (Math.PI * 2)) / (Math.PI * 2)) * maxRadius;

            const alpha = Math.max(0, this.settings.waveOpacity * (1 - (waveRadius - 30) / maxRadius));

            if (alpha > 0.05 && waveRadius <= 30 + maxRadius) {
                // Frequency-based thickness
                const baseThickness = this.settings.lineThickness;
                const thicknessMod = this.settings.pitchSize ? (frequency / 440) * 0.5 : 0;
                const lineWidth = baseThickness + thicknessMod + (alpha * 2);

                ctx.strokeStyle = waveColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
                ctx.lineWidth = lineWidth;

                if (this.settings.waveGlow) {
                    ctx.shadowBlur = 5 + (frequency / 440) * 3;
                    ctx.shadowColor = waveColor;
                }

                ctx.beginPath();

                // Draw wave based on style
                this.drawWaveShape(ctx, centerX, centerY, waveRadius, frequency, time, i);

                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    }

    drawWaveShape(ctx, centerX, centerY, radius, frequency, time, waveIndex) {
        const numPoints = 100;
        const modAmount = this.settings.waveModulation;
        const modFreq = this.settings.modulationFreq;

        switch (this.settings.waveStyle) {
            case 'circle':
                if (modAmount === 0) {
                    // Simple circle
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                } else {
                    // Circle with sine wave modulation
                    for (let i = 0; i <= numPoints; i++) {
                        const angle = (i / numPoints) * Math.PI * 2;
                        const modPhase = angle * modFreq + time * frequency * 0.01;
                        const radiusMod = radius + Math.sin(modPhase) * modAmount;
                        const x = centerX + Math.cos(angle) * radiusMod;
                        const y = centerY + Math.sin(angle) * radiusMod;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                }
                break;

            case 'oscilloscope':
                // Wavy circle like oscilloscope
                for (let i = 0; i <= numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    const wavePhase = angle * modFreq + time * frequency * Math.PI * 0.01;
                    const radiusMod = radius + Math.sin(wavePhase) * (3 + modAmount);
                    const x = centerX + Math.cos(angle) * radiusMod;
                    const y = centerY + Math.sin(angle) * radiusMod;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                break;

            case 'square':
                // Square with rounded corners based on modulation
                const halfSize = radius;
                const cornerRadius = Math.min(radius * 0.2, 20) + modAmount;
                ctx.moveTo(centerX - halfSize + cornerRadius, centerY - halfSize);
                ctx.lineTo(centerX + halfSize - cornerRadius, centerY - halfSize);
                ctx.arcTo(centerX + halfSize, centerY - halfSize, centerX + halfSize, centerY - halfSize + cornerRadius, cornerRadius);
                ctx.lineTo(centerX + halfSize, centerY + halfSize - cornerRadius);
                ctx.arcTo(centerX + halfSize, centerY + halfSize, centerX + halfSize - cornerRadius, centerY + halfSize, cornerRadius);
                ctx.lineTo(centerX - halfSize + cornerRadius, centerY + halfSize);
                ctx.arcTo(centerX - halfSize, centerY + halfSize, centerX - halfSize, centerY + halfSize - cornerRadius, cornerRadius);
                ctx.lineTo(centerX - halfSize, centerY - halfSize + cornerRadius);
                ctx.arcTo(centerX - halfSize, centerY - halfSize, centerX - halfSize + cornerRadius, centerY - halfSize, cornerRadius);
                ctx.closePath();
                break;

            case 'hexagon':
                // Regular hexagon with modulation
                const sides = 6;
                for (let i = 0; i <= sides; i++) {
                    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
                    const modPhase = angle * modFreq + time * frequency * 0.01;
                    const radiusMod = radius + Math.sin(modPhase) * modAmount;
                    const x = centerX + Math.cos(angle) * radiusMod;
                    const y = centerY + Math.sin(angle) * radiusMod;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                break;

            case 'spiral':
                // Spiral outward
                const spiralTurns = 2;
                for (let i = 0; i <= numPoints; i++) {
                    const t = i / numPoints;
                    const angle = t * Math.PI * 2 * spiralTurns + time * frequency * 0.05;
                    const spiralRadius = radius * (0.3 + t * 0.7);
                    const modPhase = angle * modFreq;
                    const radiusMod = spiralRadius + Math.sin(modPhase) * modAmount;
                    const x = centerX + Math.cos(angle) * radiusMod;
                    const y = centerY + Math.sin(angle) * radiusMod;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                break;
        }
    }

    // Helper to shift hue of hex color
    shiftHue(hexColor, degrees) {
        // Convert hex to RGB
        const r = parseInt(hexColor.slice(1, 3), 16) / 255;
        const g = parseInt(hexColor.slice(3, 5), 16) / 255;
        const b = parseInt(hexColor.slice(5, 7), 16) / 255;

        // Convert to HSL
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
        }

        // Shift hue
        h = (h * 360 + degrees) % 360;
        if (h < 0) h += 360;
        h = h / 360;

        // Convert back to RGB
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let rNew, gNew, bNew;
        if (s === 0) {
            rNew = gNew = bNew = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            rNew = hue2rgb(p, q, h + 1/3);
            gNew = hue2rgb(p, q, h);
            bNew = hue2rgb(p, q, h - 1/3);
        }

        // Convert to hex
        const toHex = c => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(rNew)}${toHex(gNew)}${toHex(bNew)}`;
    }

    drawInterferencePulse(ctx, centerX, centerY, time) {
        const beatFreq = Math.abs(this.targetFrequency - this.rootFrequency);
        const beatPhase = time * beatFreq * this.settings.beatSpeed * Math.PI;
        const beatIntensity = (Math.cos(beatPhase) + 1) / 2;

        // Center pulse
        const pulseRadius = 8 + beatIntensity * this.settings.pulseSize;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
        gradient.addColorStop(0, `${this.settings.interferenceColor}${Math.floor(beatIntensity * 230).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.6, `${this.settings.interferenceColor}${Math.floor(beatIntensity * 128).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${this.settings.interferenceColor}00`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Interference rings
        const numRings = this.settings.interferenceRings;
        for (let i = 0; i < numRings; i++) {
            const ringPhase = (beatPhase / Math.PI + i * 0.5) % 2;
            const isConstructive = ringPhase < 1;

            const ringRadius = 15 + i * this.settings.ringSpacing;
            const baseAlpha = isConstructive ? beatIntensity : (1 - beatIntensity);
            const alpha = baseAlpha * 0.4 * (1 - i / numRings);

            if (alpha > 0.05) {
                const colorR = isConstructive ? 255 : 200;
                const colorG = isConstructive ? 255 : 150;
                const colorB = isConstructive ? 100 : 0;

                ctx.strokeStyle = `rgba(${colorR}, ${colorG}, ${colorB}, ${alpha})`;
                ctx.lineWidth = isConstructive ? 3 : 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Beat label
        if (this.settings.showBeatLabel || this.settings.showInterferenceState) {
            ctx.fillStyle = this.settings.interferenceColor;
            ctx.font = '10px monospace';
            if (this.settings.waveGlow) {
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.settings.interferenceColor;
            }

            let labelText = '';
            if (this.settings.showBeatLabel) {
                labelText = `Beat: ${beatFreq.toFixed(1)} Hz`;
            }
            if (this.settings.showInterferenceState) {
                const state = beatIntensity > 0.6 ? 'Constructive' : beatIntensity < 0.4 ? 'Destructive' : 'Neutral';
                labelText += this.settings.showBeatLabel ? ` (${state})` : state;
            }

            ctx.fillText(labelText, centerX - 70, centerY + 45);
            ctx.shadowBlur = 0;
        }
    }

    drawStrobe(ctx, centerX, centerY, frequency, time, color) {
        const segments = this.settings.strobeSegments;
        let radius = this.settings.strobeRadius;
        let width = this.settings.strobeWidth;
        const opacity = this.settings.strobeOpacity;
        const referenceFreq = this.settings.strobeReferenceFreq;

        // Apply frequency-based size scaling
        if (this.settings.strobeFrequencySize) {
            const freqRatio = frequency / referenceFreq;
            const sizeMultiplier = 0.7 + (freqRatio - 1) * 0.5; // Scale between 0.7x and 1.3x
            radius *= sizeMultiplier;
            width *= sizeMultiplier;
        }

        // Calculate rotation based on frequency difference from reference
        // This creates the "counter-rotation" effect - frequencies above reference rotate one way,
        // frequencies below rotate the opposite way
        const freqDiff = frequency - referenceFreq;
        let rotationSpeed = (freqDiff / referenceFreq) * this.settings.strobeSpeed;

        // Apply alternate direction if enabled
        // This makes the two tuning forks' strobes rotate in opposite directions
        if (this.settings.strobeAlternateDirection) {
            // Use frequency to determine direction - root vs target
            const isRoot = frequency === this.rootFrequency;
            if (isRoot) {
                rotationSpeed *= -1;
            }
        }

        const rotation = time * rotationSpeed * Math.PI * 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);

        if (this.settings.strobePattern === 'radial') {
            // Radial spoke pattern (like Peterson strobe)
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                ctx.save();
                ctx.rotate(angle);

                // Draw spoke from inner radius to outer radius
                const gradient = ctx.createLinearGradient(0, radius, 0, radius + width);
                gradient.addColorStop(0, color.replace(')', `, ${opacity})`).replace('rgb', 'rgba'));
                gradient.addColorStop(1, color.replace(')', `, 0)`).replace('rgb', 'rgba'));

                ctx.fillStyle = gradient;
                ctx.fillRect(-3, radius, 6, width);

                ctx.restore();
            }
        } else if (this.settings.strobePattern === 'dots') {
            // Circular dot pattern
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const x = Math.cos(angle) * (radius + width / 2);
                const y = Math.sin(angle) * (radius + width / 2);

                ctx.fillStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.settings.strobePattern === 'bars') {
            // Concentric segmented bars
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const segmentWidth = (Math.PI * 2 / segments) * 0.7; // 70% of segment arc

                ctx.fillStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
                ctx.beginPath();
                ctx.arc(0, 0, radius + width, angle - segmentWidth / 2, angle + segmentWidth / 2);
                ctx.arc(0, 0, radius, angle + segmentWidth / 2, angle - segmentWidth / 2, true);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawStrobeCircling(ctx, centerX, centerY, frequency, time, color, isPlaying = true) {
        const segments = this.settings.strobeSegments;
        let baseRadius = this.settings.strobeRadius;
        let width = this.settings.strobeWidth;
        const opacity = isPlaying ? this.settings.strobeOpacity : this.settings.strobeOpacity * 0.3;
        const referenceFreq = this.settings.strobeReferenceFreq;

        // Apply frequency-based size scaling
        if (this.settings.strobeFrequencySize) {
            const freqRatio = frequency / referenceFreq;
            const sizeMultiplier = 0.7 + (freqRatio - 1) * 0.5;
            baseRadius *= sizeMultiplier;
            width *= sizeMultiplier;
        }

        // Calculate rotation based on frequency difference from reference
        // When not playing, show static pattern
        const freqDiff = frequency - referenceFreq;
        let rotationSpeed = isPlaying ? (freqDiff / referenceFreq) * this.settings.strobeSpeed : 0;

        // Apply alternate direction if enabled
        if (this.settings.strobeAlternateDirection) {
            const isRoot = frequency === this.rootFrequency;
            if (isRoot) {
                rotationSpeed *= -1;
            }
        }

        const rotation = time * rotationSpeed * Math.PI * 2;

        // Draw multiple rings based on mode (like Peterson strobe tuner views)
        const modes = {
            'single': [{ radius: baseRadius, width: width }],
            'dual': [
                { radius: baseRadius * 0.7, width: width * 0.8 },
                { radius: baseRadius * 1.3, width: width * 0.8 }
            ],
            'triple': [
                { radius: baseRadius * 0.6, width: width * 0.7 },
                { radius: baseRadius, width: width },
                { radius: baseRadius * 1.4, width: width * 0.7 }
            ],
            'expanding': [] // Will be populated dynamically
        };

        // Generate expanding rings
        if (this.settings.strobeMode === 'expanding') {
            const numRings = 5;
            for (let i = 0; i < numRings; i++) {
                const phase = (time * this.settings.strobeSpeed * 0.5 + i * 0.4) % 2;
                const expandRadius = baseRadius * (0.5 + phase * 0.8);
                const expandOpacity = (1 - phase / 2);
                modes.expanding.push({
                    radius: expandRadius,
                    width: width * expandOpacity,
                    opacity: opacity * expandOpacity
                });
            }
        }

        const rings = modes[this.settings.strobeMode] || modes.single;

        rings.forEach(ring => {
            const radius = ring.radius;
            const ringWidth = ring.width;
            const ringOpacity = ring.opacity !== undefined ? ring.opacity : opacity;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);

            if (this.settings.strobePattern === 'radial') {
                // Radial spoke pattern
                for (let i = 0; i < segments; i++) {
                    const angle = (i / segments) * Math.PI * 2;
                    ctx.save();
                    ctx.rotate(angle);

                    const gradient = ctx.createLinearGradient(0, radius, 0, radius + ringWidth);
                    gradient.addColorStop(0, color.replace(')', `, ${ringOpacity})`).replace('rgb', 'rgba'));
                    gradient.addColorStop(1, color.replace(')', `, 0)`).replace('rgb', 'rgba'));

                    ctx.fillStyle = gradient;
                    ctx.fillRect(-3, radius, 6, ringWidth);

                    ctx.restore();
                }
            } else if (this.settings.strobePattern === 'dots') {
                // Circular dot pattern
                for (let i = 0; i < segments; i++) {
                    const angle = (i / segments) * Math.PI * 2;
                    const x = Math.cos(angle) * (radius + ringWidth / 2);
                    const y = Math.sin(angle) * (radius + ringWidth / 2);

                    ctx.fillStyle = color.replace(')', `, ${ringOpacity})`).replace('rgb', 'rgba');
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (this.settings.strobePattern === 'bars') {
                // Concentric segmented bars
                for (let i = 0; i < segments; i++) {
                    const angle = (i / segments) * Math.PI * 2;
                    const segmentWidth = (Math.PI * 2 / segments) * 0.7;

                    ctx.fillStyle = color.replace(')', `, ${ringOpacity})`).replace('rgb', 'rgba');
                    ctx.beginPath();
                    ctx.arc(0, 0, radius + ringWidth, angle - segmentWidth / 2, angle + segmentWidth / 2);
                    ctx.arc(0, 0, radius, angle + segmentWidth / 2, angle - segmentWidth / 2, true);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (this.settings.strobePattern === 'wave') {
                // Wave-like pattern that pulses
                const numPoints = 100;
                ctx.beginPath();
                for (let i = 0; i <= numPoints; i++) {
                    const angle = (i / numPoints) * Math.PI * 2;
                    const wavePhase = angle * segments + time * frequency * Math.PI * 0.01;
                    const radiusMod = radius + Math.sin(wavePhase) * (ringWidth / 2);
                    const x = Math.cos(angle) * radiusMod;
                    const y = Math.sin(angle) * radiusMod;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = color.replace(')', `, ${ringOpacity})`).replace('rgb', 'rgba');
                ctx.lineWidth = 3;
                ctx.stroke();
            }

            ctx.restore();
        });
    }

    drawPetersonStrobe(ctx, centerX, centerY, frequency, time, color, isPlaying = true) {
        const segments = this.settings.strobeSegments;
        const baseRadius = this.settings.strobeRadius;
        const opacity = isPlaying ? this.settings.strobeOpacity : this.settings.strobeOpacity * 0.3;
        const calibratedFreq = this.settings.petersonCalibratedNote;
        const numRings = this.settings.petersonRings;
        const ringSpacing = this.settings.petersonRingSpacing;

        // Generate rings - each calibrated to different harmonics/octaves
        const rings = [];

        for (let i = 0; i < numRings; i++) {
            const ringRadius = baseRadius + (i * ringSpacing);

            // Each ring is calibrated to a different harmonic
            let ringCalibratedFreq = calibratedFreq;
            if (this.settings.petersonHarmonics && i > 0) {
                // Alternate between octaves and fifths for different rings
                if (i === 1) {
                    ringCalibratedFreq = calibratedFreq * 2; // Octave up
                } else if (i === 2) {
                    ringCalibratedFreq = calibratedFreq * 1.5; // Fifth up
                } else if (i === 3) {
                    ringCalibratedFreq = calibratedFreq * 0.5; // Octave down
                }
            }

            // Calculate rotation speed based on how far off this ring is from its calibrated frequency
            // When frequency matches ringCalibratedFreq, rotation speed is 0 (appears stationary)
            const ringCentsOff = frequency > 0 ? 1200 * Math.log2(frequency / ringCalibratedFreq) : 0;

            // Rotation speed is proportional to cents difference
            // The pattern should appear to "move around" the ring
            // When not playing, add slow ambient rotation for visual interest
            // When playing, add base rotation plus frequency-based rotation
            let rotationSpeed = 0;
            if (isPlaying) {
                // Base rotation speed to keep it always moving
                const baseRotation = 0.2 * this.settings.strobeSpeed;
                // Frequency-based rotation (how out-of-tune)
                const freqRotation = (ringCentsOff / 50) * this.settings.strobeSpeed;
                rotationSpeed = baseRotation + freqRotation;
            } else {
                // Slow ambient rotation when not playing
                rotationSpeed = 0.05 * this.settings.strobeSpeed;
            }
            const phaseOffset = time * rotationSpeed * Math.PI * 2;

            rings.push({
                radius: ringRadius,
                phaseOffset: phaseOffset,
                centsOff: ringCentsOff,
                calibratedFreq: ringCalibratedFreq
            });
        }

        // Draw each ring
        ctx.save();
        ctx.translate(centerX, centerY);

        rings.forEach((ring, index) => {
            // Vary opacity based on how close to in-tune
            const tuningAccuracy = Math.max(0, 1 - Math.abs(ring.centsOff) / 50);
            const ringOpacity = opacity * (0.5 + tuningAccuracy * 0.5);

            // Color intensity based on tuning - brighter when in tune
            const colorIntensity = 0.6 + tuningAccuracy * 0.4;
            const adjustedColor = this.adjustColorBrightness(color, colorIntensity);

            if (this.settings.strobePattern === 'radial') {
                // Radial spoke pattern - segments move around the circumference
                for (let i = 0; i < segments; i++) {
                    // Apply phase offset to make segments appear to move around the ring
                    const angle = (i / segments) * Math.PI * 2 + ring.phaseOffset;

                    ctx.save();
                    ctx.rotate(angle);

                    // Alternating spoke lengths for classic Peterson look
                    const spokeLength = (i % 2 === 0) ? 15 : 10;
                    const gradient = ctx.createLinearGradient(0, ring.radius - 5, 0, ring.radius + spokeLength);

                    gradient.addColorStop(0, adjustedColor.replace(')', `, ${ringOpacity})`).replace('rgb', 'rgba'));
                    gradient.addColorStop(1, adjustedColor.replace(')', `, 0)`).replace('rgb', 'rgba'));

                    ctx.fillStyle = gradient;
                    ctx.fillRect(-2, ring.radius - 5, 4, spokeLength);

                    ctx.restore();
                }
            } else if (this.settings.strobePattern === 'bars') {
                // Segmented bars - bars move around the circumference
                for (let i = 0; i < segments; i++) {
                    const angle = (i / segments) * Math.PI * 2 + ring.phaseOffset;
                    const segmentWidth = (Math.PI * 2 / segments) * 0.6;

                    ctx.fillStyle = adjustedColor.replace(')', `, ${ringOpacity})`).replace('rgb', 'rgba');
                    ctx.beginPath();
                    ctx.arc(0, 0, ring.radius + 8, angle - segmentWidth / 2, angle + segmentWidth / 2);
                    ctx.arc(0, 0, ring.radius - 8, angle + segmentWidth / 2, angle - segmentWidth / 2, true);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (this.settings.strobePattern === 'dots') {
                // Dots move around the circumference
                for (let i = 0; i < segments; i++) {
                    const angle = (i / segments) * Math.PI * 2 + ring.phaseOffset;
                    const x = Math.cos(angle) * ring.radius;
                    const y = Math.sin(angle) * ring.radius;

                    ctx.fillStyle = adjustedColor.replace(')', `, ${ringOpacity})`).replace('rgb', 'rgba');
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        ctx.restore();
    }

    adjustColorBrightness(hexColor, factor) {
        // Simple brightness adjustment
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        const newR = Math.min(255, Math.floor(r * factor));
        const newG = Math.min(255, Math.floor(g * factor));
        const newB = Math.min(255, Math.floor(b * factor));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    exit() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.rootToneGenerator.stopTone();
        this.targetToneGenerator.stopTone();
        this.isPlayingRoot = false;
        this.isPlayingTarget = false;
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        if (window.mainApp) {
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tuningForkViz = new TuningForkViz();
    });
} else {
    window.tuningForkViz = new TuningForkViz();
}
