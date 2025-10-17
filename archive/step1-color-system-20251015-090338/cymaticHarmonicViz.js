// Cymatic Harmonic Visualization - Simplified harmonic field only
class CymaticHarmonicViz {
    constructor() {
        // DOM Elements
        this.canvas = document.getElementById('cymaticHarmonicCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Exit button
        this.exitBtn = document.getElementById('cymaticHarmonicVizExitBtn');

        // Control elements
        this.tone1FreqSlider = document.getElementById('cymaticHarmonicTone1Freq');
        this.tone1FreqNum = document.getElementById('cymaticHarmonicTone1FreqNum');
        this.tone2FreqSlider = document.getElementById('cymaticHarmonicTone2Freq');
        this.tone2FreqNum = document.getElementById('cymaticHarmonicTone2FreqNum');

        // Button elements
        this.playTone1Btn = document.getElementById('cymaticHarmonicPlayTone1Btn');
        this.playTone2Btn = document.getElementById('cymaticHarmonicPlayTone2Btn');
        this.playBothBtn = document.getElementById('cymaticHarmonicPlayBothBtn');
        this.randomizeBtn = document.getElementById('cymaticHarmonicRandomizeBtn');

        // Speaker images - one with white background, one transparent
        this.speakerImage = new Image();
        this.speakerImage.src = './images/roundspeaker.png';
        this.speakerImageTransparent = new Image();
        this.speakerImageTransparent.src = './images/roundspeaker-transparent.png';
        this.speakerImageLoaded = false;
        this.speakerImage.onload = () => {
            this.speakerImageLoaded = true;
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
        this.beatHistory = [];          // History buffer for waveform (last 2 seconds)
        this.beatHistoryMaxLength = 200; // ~60fps * 2 seconds = 120, round up to 200

        // State
        this.tone1X = 25;  // Fixed position
        this.tone1Freq = 440;
        this.tone2X = 75;  // Fixed position
        this.tone2Freq = 440; // Default to unison (same as tone1)
        this.isPlayingTone1 = false;
        this.isPlayingTone2 = false;
        this.animationId = null;
        this.startTime = 0;

        // Pulse animation tracking
        this.pulses = [];
        this.tone1StartTime = null;
        this.tone2StartTime = null;
        this.tone1StopTime = null;
        this.tone2StopTime = null;

        // Root note tracking
        this.rootTone = 1;
        this.lastChangedTone = 2;

        // Settings (harmonic field only)
        this.settings = {
            amplitude: 1.5,
            speed: 1.2,
            harmonicLines: 20,
            harmonicDensity: 1.3,
            harmonicOrder: 5,
            harmonicLineThickness: 2,
            showFieldLines: true,
            showInterferencePattern: true,
            interferenceResolution: 5,
            overlapResolution: 5,

            // Edge quality settings
            useSmoothCalculatedEdges: false,
            edgeResolution: 3,
            edgeSize: 100,
            useFoggyEdge: false,
            foggyEdgeResolution: 2,
            foggyEdgeStart: 0.7,
            foggyEdgeFeather: 0.3,

            // Boundary settings
            useBoundary: true,
            boundaryRadius: 300,
            boundaryFalloff: 50,
            speakerRadius: 30,

            // Pulse effects
            showStartPulse: false,
            showStopPulse: false,
            pulseSpeed: 300,
            pulseDuration: 2000,
            pulseOpacity: 0.6,
            pulseWidth: 3,
            showInterferencePulse: false,
            useBeatFrequency: true,
            interferencePulseInterval: 1000,

            // Beat frequency visualization
            showBeatBrightness: true,
            beatBrightnessIntensity: 2,
            showBeatBoundary: true,
            beatBoundaryAmount: 30,

            // Standalone beat visualizations
            showBeatCircle: false,
            beatCircleSize: 50,
            showBeatMetronome: false,
            beatMetronomeSize: 30,
            showBeatWaveform: false,
            beatWaveformHeight: 100,
            showBeatPulses: false,
            beatPulseInterval: 500,

            // Colors
            useIntervalColors: true,
            tone1Color: '#54b6b6',
            tone2Color: '#3d3d3d',
            intersectionColor: '#91f3f3',

            // Color intensity
            rootIntensity: 0.6,
            intervalIntensity: 0.35,
            intersectionIntensity: 0.4,

            // Color system mode
            colorMode: 'piano'
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSettings();
        this.setupCanvas();
        this.updateIntervalColors();
        this.animate();
    }

    setupCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            if (container && container.offsetWidth > 0) {
                const containerWidth = container.offsetWidth;
                const targetHeight = 600;

                // Maintain aspect ratio - canvas should be square or have consistent dimensions
                // Use the smaller of container width or target height to create square canvas
                const size = Math.min(containerWidth, targetHeight);

                this.canvas.width = size;
                this.canvas.height = size;
            }
        };

        setTimeout(resizeCanvas, 50);
        window.addEventListener('resize', resizeCanvas);
    }

    setupEventListeners() {
        // Exit button
        this.exitBtn.addEventListener('click', () => {
            this.stopTone1();
            this.stopTone2();
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            document.getElementById('cymaticHarmonicVizExercise').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
        });

        // Frequency controls
        this.tone1FreqSlider.addEventListener('input', (e) => {
            this.tone1Freq = parseInt(e.target.value);
            this.tone1FreqNum.value = this.tone1Freq;
            this.lastChangedTone = 1;
            this.rootTone = 2;
            this.updateIntervalColors();
            if (this.isPlayingTone1) this.updateOscillator1();
        });

        this.tone1FreqNum.addEventListener('input', (e) => {
            this.tone1Freq = parseInt(e.target.value);
            this.tone1FreqSlider.value = this.tone1Freq;
            this.lastChangedTone = 1;
            this.rootTone = 2;
            this.updateIntervalColors();
            if (this.isPlayingTone1) this.updateOscillator1();
        });

        this.tone2FreqSlider.addEventListener('input', (e) => {
            this.tone2Freq = parseInt(e.target.value);
            this.tone2FreqNum.value = this.tone2Freq;
            this.lastChangedTone = 2;
            this.rootTone = 1;
            this.updateIntervalColors();
            if (this.isPlayingTone2) this.updateOscillator2();
        });

        this.tone2FreqNum.addEventListener('input', (e) => {
            this.tone2Freq = parseInt(e.target.value);
            this.tone2FreqSlider.value = this.tone2Freq;
            this.lastChangedTone = 2;
            this.rootTone = 1;
            this.updateIntervalColors();
            if (this.isPlayingTone2) this.updateOscillator2();
        });

        // Button controls
        this.playTone1Btn.addEventListener('click', () => this.toggleTone1());
        this.playTone2Btn.addEventListener('click', () => this.toggleTone2());
        this.playBothBtn.addEventListener('click', () => this.toggleBoth());
        this.randomizeBtn.addEventListener('click', () => this.randomize());

        // Solfege buttons - set Tone 2 relative to Tone 1 (Do)
        const solfegeBtns = document.querySelectorAll('.solfege-btn');
        solfegeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const semitones = parseInt(btn.getAttribute('data-interval'));
                this.setTone2BySemitones(semitones);
            });
        });

        // Keyboard controls for Tone 2
        document.addEventListener('keydown', (e) => {
            // Only handle if we're in the cymatic harmonic viz exercise
            if (document.getElementById('cymaticHarmonicVizExercise').style.display === 'none') {
                return;
            }

            // Ignore if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    // Decrease Tone 2 by 1 Hz
                    this.tone2Freq = Math.max(27, this.tone2Freq - 1);
                    this.updateTone2Frequency();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    // Increase Tone 2 by 1 Hz
                    this.tone2Freq = Math.min(4186, this.tone2Freq + 1);
                    this.updateTone2Frequency();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    // Move up by 1 semitone (chromatic half step)
                    this.adjustTone2BySemitones(1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    // Move down by 1 semitone (chromatic half step)
                    this.adjustTone2BySemitones(-1);
                    break;
            }
        });

        // Copy settings button
        const copySettingsBtn = document.getElementById('cymaticHarmonicCopySettingsBtn');
        if (copySettingsBtn) {
            copySettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.copySettings();
            });
        }

        // Color spectrum button
        const colorSpectrumBtn = document.getElementById('cymaticHarmonicColorSpectrumBtn');
        if (colorSpectrumBtn) {
            colorSpectrumBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showColorSpectrum();
            });
        }

        // Color spectrum close button
        const colorSpectrumCloseBtn = document.getElementById('colorSpectrumCloseBtn');
        if (colorSpectrumCloseBtn) {
            colorSpectrumCloseBtn.addEventListener('click', () => {
                document.getElementById('colorSpectrumModal').style.display = 'none';
            });
        }

        // Piano spectrum button
        const pianoSpectrumBtn = document.getElementById('cymaticHarmonicPianoSpectrumBtn');
        if (pianoSpectrumBtn) {
            pianoSpectrumBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showPianoSpectrum();
            });
        }

        // Piano spectrum close button
        const pianoSpectrumCloseBtn = document.getElementById('pianoSpectrumCloseBtn');
        if (pianoSpectrumCloseBtn) {
            pianoSpectrumCloseBtn.addEventListener('click', () => {
                document.getElementById('pianoSpectrumModal').style.display = 'none';
            });
        }
    }

    setupSettings() {
        // Color system mode
        this.addSettingListener('settingColorMode2', 'colorMode', (v) => v, false, false, false, true);

        // Harmonic settings
        this.addSettingListener('settingShowFieldLines2', 'showFieldLines', (v) => v, false, true);
        this.addSettingListener('settingShowInterferencePattern2', 'showInterferencePattern', (v) => v, false, true);
        this.addSettingListener('settingHarmonicLines2', 'harmonicLines', (v) => parseInt(v));
        this.addSettingListener('settingHarmonicDensity2', 'harmonicDensity', (v) => parseFloat(v));
        this.addSettingListener('settingHarmonicOrder2', 'harmonicOrder', (v) => parseInt(v));
        this.addSettingListener('settingHarmonicLineThickness2', 'harmonicLineThickness', (v) => parseFloat(v));
        this.addSettingListener('settingAmplitude2', 'amplitude', (v) => parseFloat(v));
        this.addSettingListener('settingSpeed2', 'speed', (v) => parseFloat(v));
        this.addSettingListener('settingInterferenceResolution2', 'interferenceResolution', (v) => parseInt(v));
        this.addSettingListener('settingOverlapResolution2', 'overlapResolution', (v) => parseInt(v));

        // Edge quality settings
        this.addSettingListener('settingUseSmoothCalculatedEdges2', 'useSmoothCalculatedEdges', (v) => v, false, true);
        this.addSettingListener('settingEdgeResolution2', 'edgeResolution', (v) => parseInt(v));
        this.addSettingListener('settingEdgeSize2', 'edgeSize', (v) => parseInt(v));
        this.addSettingListener('settingUseFoggyEdge2', 'useFoggyEdge', (v) => v, false, true);
        this.addSettingListener('settingFoggyEdgeResolution2', 'foggyEdgeResolution', (v) => parseInt(v));
        this.addSettingListener('settingFoggyEdgeStart2', 'foggyEdgeStart', (v) => parseFloat(v));
        this.addSettingListener('settingFoggyEdgeFeather2', 'foggyEdgeFeather', (v) => parseFloat(v));

        // Boundary settings
        this.addSettingListener('settingUseBoundary2', 'useBoundary', (v) => v, false, true);
        this.addSettingListener('settingBoundaryRadius2', 'boundaryRadius', (v) => parseInt(v));
        this.addSettingListener('settingBoundaryFalloff2', 'boundaryFalloff', (v) => parseInt(v));
        this.addSettingListener('settingSpeakerRadius2', 'speakerRadius', (v) => parseInt(v));

        // Pulse settings
        this.addSettingListener('settingShowStartPulse2', 'showStartPulse', (v) => v, false, true);
        this.addSettingListener('settingShowStopPulse2', 'showStopPulse', (v) => v, false, true);
        this.addSettingListener('settingShowInterferencePulse2', 'showInterferencePulse', (v) => v, false, true);
        this.addSettingListener('settingUseBeatFrequency2', 'useBeatFrequency', (v) => v, false, true);
        this.addSettingListener('settingPulseSpeed2', 'pulseSpeed', (v) => parseInt(v));
        this.addSettingListener('settingPulseDuration2', 'pulseDuration', (v) => parseInt(v));
        this.addSettingListener('settingPulseOpacity2', 'pulseOpacity', (v) => parseFloat(v));
        this.addSettingListener('settingPulseWidth2', 'pulseWidth', (v) => parseFloat(v));
        this.addSettingListener('settingInterferencePulseInterval2', 'interferencePulseInterval', (v) => parseInt(v));

        // Beat frequency visualization settings
        this.addSettingListener('settingShowBeatBrightness2', 'showBeatBrightness', (v) => v, false, true);
        this.addSettingListener('settingBeatBrightnessIntensity2', 'beatBrightnessIntensity', (v) => parseFloat(v));
        this.addSettingListener('settingShowBeatBoundary2', 'showBeatBoundary', (v) => v, false, true);
        this.addSettingListener('settingBeatBoundaryAmount2', 'beatBoundaryAmount', (v) => parseInt(v));

        // Standalone beat visualizations
        this.addSettingListener('settingShowBeatCircle2', 'showBeatCircle', (v) => v, false, true);
        this.addSettingListener('settingBeatCircleSize2', 'beatCircleSize', (v) => parseInt(v));
        this.addSettingListener('settingShowBeatMetronome2', 'showBeatMetronome', (v) => v, false, true);
        this.addSettingListener('settingBeatMetronomeSize2', 'beatMetronomeSize', (v) => parseInt(v));
        this.addSettingListener('settingShowBeatWaveform2', 'showBeatWaveform', (v) => v, false, true);
        this.addSettingListener('settingBeatWaveformHeight2', 'beatWaveformHeight', (v) => parseInt(v));
        this.addSettingListener('settingShowBeatPulses2', 'showBeatPulses', (v) => v, false, true);
        this.addSettingListener('settingBeatPulseInterval2', 'beatPulseInterval', (v) => parseInt(v));

        // Color settings
        this.addSettingListener('settingUseIntervalColors2', 'useIntervalColors', (v) => {
            this.updateIntervalColors();
            return v;
        }, false, true);
        this.addSettingListener('settingTone1Color2', 'tone1Color', (v) => v, false, false, true);
        this.addSettingListener('settingTone2Color2', 'tone2Color', (v) => v, false, false, true);
        this.addSettingListener('settingIntersectionColor2', 'intersectionColor', (v) => v, false, false, true);
        this.addSettingListener('settingRootIntensity2', 'rootIntensity', (v) => parseFloat(v));
        this.addSettingListener('settingIntervalIntensity2', 'intervalIntensity', (v) => parseFloat(v));
        this.addSettingListener('settingIntersectionIntensity2', 'intersectionIntensity', (v) => parseFloat(v));
    }

    addSettingListener(elementId, settingKey, transform, updateValue = true, isCheckbox = false, isColor = false, isSelect = false) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const eventType = (isCheckbox || isSelect) ? 'change' : 'input';
        element.addEventListener(eventType, (e) => {
            const value = isCheckbox ? e.target.checked : (isColor || isSelect ? e.target.value : transform(e.target.value));
            this.settings[settingKey] = value;

            if (updateValue && !isCheckbox && !isColor && !isSelect) {
                const valueElement = document.getElementById(`value${elementId.replace('setting', '')}`);
                if (valueElement) {
                    valueElement.textContent = this.formatValue(settingKey, value);
                }
            }
        });
    }

    formatValue(key, value) {
        if (key.includes('Thickness') || key.includes('Width')) return `${value}px`;
        if (key.includes('Amplitude') || key.includes('Speed') || key.includes('Density')) return `${value}x`;
        if (key.includes('Duration') || key.includes('Interval')) return `${value}ms`;
        return value;
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create analyser for mixed audio output
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.3; // Some smoothing for cleaner envelope
            this.analyserDataArray = new Float32Array(this.analyser.fftSize);

            // Connect analyser to destination so it captures the final mixed output
            this.analyser.connect(this.audioContext.destination);

            console.log('CymaticHarmonicViz: Audio context initialized with analyser');
        }
    }

    toggleTone1() {
        this.initAudioContext();

        if (this.isPlayingTone1) {
            this.stopTone1();
        } else {
            this.playTone1();
        }
    }

    toggleTone2() {
        this.initAudioContext();

        if (this.isPlayingTone2) {
            this.stopTone2();
        } else {
            this.playTone2();
        }
    }

    toggleBoth() {
        this.initAudioContext();

        const anyPlaying = this.isPlayingTone1 || this.isPlayingTone2;

        if (anyPlaying) {
            this.stopTone1();
            this.stopTone2();
            this.playBothBtn.textContent = 'Play Both';
        } else {
            this.playTone1();
            this.playTone2();
            this.playBothBtn.textContent = 'Stop Both';
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
        this.tone1StopTime = null;
        this.playTone1Btn.textContent = 'Stop Tone 1';
        this.playTone1Btn.classList.add('active');

        if (this.settings.showStartPulse) {
            const x = (this.tone1X / 100) * this.canvas.width;
            const y = this.canvas.height / 2;
            this.pulses.push({
                x, y,
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
        this.tone1StopTime = performance.now();
        this.playTone1Btn.textContent = 'Play Tone 1';
        this.playTone1Btn.classList.remove('active');

        if (this.settings.showStopPulse) {
            const x = (this.tone1X / 100) * this.canvas.width;
            const y = this.canvas.height / 2;
            this.pulses.push({
                x, y,
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
        this.tone2StopTime = null;
        this.playTone2Btn.textContent = 'Stop Tone 2';
        this.playTone2Btn.classList.add('active');

        if (this.settings.showStartPulse) {
            const x = (this.tone2X / 100) * this.canvas.width;
            const y = this.canvas.height / 2;
            this.pulses.push({
                x, y,
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
        this.tone2StopTime = performance.now();
        this.playTone2Btn.textContent = 'Play Tone 2';
        this.playTone2Btn.classList.remove('active');

        if (this.settings.showStopPulse) {
            const x = (this.tone2X / 100) * this.canvas.width;
            const y = this.canvas.height / 2;
            this.pulses.push({
                x, y,
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

    setTone2BySemitones(semitones) {
        // Calculate Tone 2 frequency based on Tone 1 as root (Do)
        const baseFreq = this.tone1Freq; // Tone 1 is always Do
        const newFreq = Math.round(baseFreq * Math.pow(2, semitones / 12));

        this.tone2Freq = Math.max(27, Math.min(4186, newFreq)); // Clamp to piano range
        this.tone2FreqSlider.value = this.tone2Freq;
        this.tone2FreqNum.value = this.tone2Freq;
        this.lastChangedTone = 2;
        this.rootTone = 1; // Tone 1 is the root
        this.updateIntervalColors();
        if (this.isPlayingTone2) this.updateOscillator2();
    }

    adjustTone2BySemitones(semitones) {
        // Adjust Tone 2 by a chromatic interval (semitones)
        const newFreq = Math.round(this.tone2Freq * Math.pow(2, semitones / 12));
        this.tone2Freq = Math.max(27, Math.min(4186, newFreq));
        this.updateTone2Frequency();
    }

    updateTone2Frequency() {
        // Update UI and oscillator for Tone 2
        this.tone2FreqSlider.value = this.tone2Freq;
        this.tone2FreqNum.value = this.tone2Freq;
        this.lastChangedTone = 2;
        this.rootTone = 1;
        this.updateIntervalColors();
        if (this.isPlayingTone2) this.updateOscillator2();
    }

    randomize() {
        // Stop any currently playing tones
        const wasPlaying = this.isPlayingTone1 || this.isPlayingTone2;
        if (this.isPlayingTone1) this.stopTone1();
        if (this.isPlayingTone2) this.stopTone2();

        // Randomize frequencies and settings (piano range: A0 27Hz to C8 4186Hz)
        this.tone1Freq = Math.floor(Math.random() * (4186 - 27 + 1)) + 27;
        this.tone2Freq = Math.floor(Math.random() * (4186 - 27 + 1)) + 27;

        this.rootTone = 1;
        this.lastChangedTone = 2;

        this.settings.amplitude = 0.5 + Math.random() * 2.5;
        this.settings.speed = 0.5 + Math.random() * 2;
        this.settings.harmonicLines = Math.floor(8 + Math.random() * 33);
        this.settings.harmonicDensity = 0.5 + Math.random() * 1.5;
        this.settings.harmonicOrder = Math.floor(1 + Math.random() * 8);
        this.settings.harmonicLineThickness = 0.5 + Math.random() * 4.5;
        this.settings.pulseSpeed = Math.floor(100 + Math.random() * 501);
        this.settings.pulseDuration = Math.floor(500 + Math.random() * 3501);
        this.settings.pulseOpacity = 0.1 + Math.random() * 0.9;
        this.settings.pulseWidth = 1 + Math.random() * 5;

        this.tone1FreqSlider.value = this.tone1Freq;
        this.tone1FreqNum.value = this.tone1Freq;
        this.tone2FreqSlider.value = this.tone2Freq;
        this.tone2FreqNum.value = this.tone2Freq;

        this.updateIntervalColors();

        // Initialize audio context and analyser
        this.initAudioContext();

        // Start playing both tones
        setTimeout(() => {
            this.playTone1();
            this.playTone2();
            this.playBothBtn.textContent = 'Stop Both';
        }, 100);
    }

    start() {
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('cymaticHarmonicVizExercise').style.display = 'block';
        this.setupCanvas();
        this.updateIntervalColors();
    }

    pauseRendering() {
        // Stop rendering loop but keep audio analysis and state updates running
        this.renderingPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        // Start a minimal update loop for state management
        this.startStateUpdateLoop();
    }

    startStateUpdateLoop() {
        if (this.stateUpdateId) return;

        const updateState = () => {
            if (!this.renderingPaused) {
                this.stateUpdateId = null;
                return;
            }

            // Update beat frequency analysis
            if (this.isPlayingTone1 && this.isPlayingTone2) {
                this.updateBeatAmplitude();
            }

            // Continue state updates
            this.stateUpdateId = requestAnimationFrame(updateState);
        };

        this.stateUpdateId = requestAnimationFrame(updateState);
    }

    resumeRendering() {
        // Resume rendering loop
        this.renderingPaused = false;
        // Stop state update loop
        if (this.stateUpdateId) {
            cancelAnimationFrame(this.stateUpdateId);
            this.stateUpdateId = null;
        }
        if (!this.animationId) {
            this.animate();
        }
    }

    // Copy color functions from cymaticViz.js
    getIntervalRatio(freq1, freq2) {
        const ratio = freq2 / freq1;
        return ratio >= 1 ? ratio : 1 / ratio;
    }

    // Calculate dissonance/consonance based on cents
    // Uses smooth curves for gradual transitions
    getDissonanceCurve(cents) {
        // Normalize cents to 0-1200 range (one octave)
        const normalizedCents = cents % 1200;

        // Define dissonance peaks and valleys with smooth interpolation
        // 0 = perfect consonance, 1 = maximum dissonance
        const dissonanceMap = [
            { cents: 0, dissonance: 0.0 },      // Unison - perfect consonance
            { cents: 100, dissonance: 0.9 },    // Minor 2nd - very dissonant
            { cents: 200, dissonance: 0.5 },    // Major 2nd - moderately clear
            { cents: 300, dissonance: 0.2 },    // Minor 3rd - consonant
            { cents: 400, dissonance: 0.15 },   // Major 3rd - very consonant
            { cents: 500, dissonance: 0.1 },    // Perfect 4th - extremely consonant
            { cents: 600, dissonance: 1.0 },    // Tritone - most dissonant
            { cents: 700, dissonance: 0.05 },   // Perfect 5th - most consonant
            { cents: 800, dissonance: 0.25 },   // Minor 6th - fairly consonant
            { cents: 900, dissonance: 0.2 },    // Major 6th - consonant
            { cents: 1000, dissonance: 0.6 },   // Minor 7th - somewhat dissonant
            { cents: 1100, dissonance: 0.75 },  // Major 7th - dissonant
            { cents: 1200, dissonance: 0.0 }    // Octave - perfect consonance
        ];

        // Find two closest points for interpolation
        let prev = dissonanceMap[0];
        let next = dissonanceMap[1];

        for (let i = 0; i < dissonanceMap.length - 1; i++) {
            if (normalizedCents >= dissonanceMap[i].cents && normalizedCents <= dissonanceMap[i + 1].cents) {
                prev = dissonanceMap[i];
                next = dissonanceMap[i + 1];
                break;
            }
        }

        // Linear interpolation between points
        const range = next.cents - prev.cents;
        const position = (normalizedCents - prev.cents) / range;
        const dissonance = prev.dissonance + (next.dissonance - prev.dissonance) * position;

        return dissonance;
    }

    // Piano Coloring: Equal temperament based on exact chromatic frequencies
    getFrequencyColorPiano(freq, rootFreq) {
        // Define equal temperament chromatic scale relative to C4 (261.63 Hz at A440)
        const C4 = 261.63;
        const chromaticNotes = [
            { name: 'C', semitone: 0, hue: 180, dissonance: 0.0 },      // Unison - cyan
            { name: 'C#', semitone: 1, hue: 0, dissonance: 0.9 },       // Minor 2nd - red
            { name: 'D', semitone: 2, hue: 40, dissonance: 0.5 },       // Major 2nd - orange
            { name: 'D#', semitone: 3, hue: 120, dissonance: 0.25 },    // Minor 3rd - green
            { name: 'E', semitone: 4, hue: 160, dissonance: 0.15 },     // Major 3rd - cyan-green
            { name: 'F', semitone: 5, hue: 200, dissonance: 0.1 },      // Perfect 4th - blue
            { name: 'F#', semitone: 6, hue: 0, dissonance: 1.0 },       // Tritone - red (most dissonant)
            { name: 'G', semitone: 7, hue: 220, dissonance: 0.05 },     // Perfect 5th - bright blue
            { name: 'G#', semitone: 8, hue: 280, dissonance: 0.25 },    // Minor 6th - purple
            { name: 'A', semitone: 9, hue: 300, dissonance: 0.2 },      // Major 6th - magenta
            { name: 'A#', semitone: 10, hue: 30, dissonance: 0.6 },     // Minor 7th - orange
            { name: 'B', semitone: 11, hue: 15, dissonance: 0.75 }      // Major 7th - red-orange
        ];

        // Calculate frequency ratio
        const ratio = freq / rootFreq;
        const cents = 1200 * Math.log2(ratio);
        // Ensure normalizedCents is always positive (0-1200)
        const normalizedCents = ((cents % 1200) + 1200) % 1200;

        // Find which semitone we're closest to
        const semitonesFromRoot = normalizedCents / 100;
        const lowerSemitone = Math.floor(semitonesFromRoot);
        const upperSemitone = Math.ceil(semitonesFromRoot) % 12;
        const blendFactor = semitonesFromRoot - Math.floor(semitonesFromRoot);

        // Get colors for interpolation
        const lowerNote = chromaticNotes[lowerSemitone];
        const upperNote = chromaticNotes[upperSemitone];

        // Interpolate hue (handle wraparound for red/orange transitions)
        let hue;
        const hueDiff = upperNote.hue - lowerNote.hue;
        if (Math.abs(hueDiff) > 180) {
            // Wrap around the color wheel
            if (lowerNote.hue > upperNote.hue) {
                hue = lowerNote.hue + blendFactor * (360 + upperNote.hue - lowerNote.hue);
            } else {
                hue = lowerNote.hue + blendFactor * (upperNote.hue - 360 - lowerNote.hue);
            }
        } else {
            hue = lowerNote.hue + blendFactor * hueDiff;
        }
        hue = ((hue % 360) + 360) % 360; // Ensure positive result

        // Interpolate dissonance
        const dissonance = lowerNote.dissonance + blendFactor * (upperNote.dissonance - lowerNote.dissonance);

        // Saturation: consonant intervals are vivid, dissonant are less saturated
        const saturation = 60 + ((1.0 - dissonance) * 30); // 60-90%

        // Lightness: bright enough to be visible
        const lightness = 65; // Brighter for visibility

        return this.hslToHex(hue, saturation, lightness);
    }

    getFrequencyColor(freq, rootFreq) {
        if (!this.settings.useIntervalColors) {
            return freq === this.tone1Freq ? this.settings.tone1Color : this.settings.tone2Color;
        }

        const ratio = freq / rootFreq;
        const cents = 1200 * Math.log2(ratio);
        const normalizedCents = ((cents % 1200) + 1200) % 1200;

        // Use piano coloring if enabled
        if (this.settings.colorMode === 'piano') {
            return this.getFrequencyColorPiano(freq, rootFreq);
        }

        // Otherwise use continuous (smooth gradient) system
        // ratio, cents, and normalizedCents already calculated above

        const octaveNum = Math.floor(cents / 1200);

        // Get dissonance value (0 = consonant, 1 = dissonant)
        const dissonance = this.getDissonanceCurve(cents);

        // Map cents smoothly around the color wheel
        // Create a continuous gradient that follows dissonance curves
        // Consonant = cool colors (cyan/blue), Dissonant = warm colors (red/orange/yellow)

        // Use cents position to create smooth transitions
        // Map 0-1200 cents to hue values that reflect dissonance
        let hue;

        // Create smooth color progression based on cents position
        // 0 (unison): cyan (180)
        // 100 (m2): red (0) - dissonant
        // 200 (M2): orange (40) - moderately clear
        // 300 (m3): green (120) - consonant
        // 400 (M3): cyan-green (160) - very consonant
        // 500 (P4): blue (200) - extremely consonant
        // 600 (tritone): red (0) - most dissonant
        // 700 (P5): bright blue (220) - most consonant
        // 800 (m6): purple (280) - fairly consonant
        // 900 (M6): magenta (300) - consonant
        // 1000 (m7): orange (30) - somewhat dissonant
        // 1100 (M7): red-orange (15) - dissonant
        // 1200 (octave): cyan (180) - perfect consonance

        // Interpolate hue based on dissonance with smooth transitions
        if (normalizedCents < 100) {
            // 0-100: unison to m2 (cyan 180 to red 0)
            hue = 180 - (normalizedCents / 100) * 180; // 180 to 0
        } else if (normalizedCents < 200) {
            // 100-200: m2 to M2 (red 0 to orange 40)
            hue = 0 + ((normalizedCents - 100) / 100) * 40; // 0 to 40
        } else if (normalizedCents < 300) {
            // 200-300: M2 to m3 (orange 40 to green 120)
            const t = (normalizedCents - 200) / 100;
            hue = 40 + t * 80; // 40 to 120
        } else if (normalizedCents < 400) {
            // 300-400: m3 to M3 (green 120 to cyan-green 160)
            const t = (normalizedCents - 300) / 100;
            hue = 120 + t * 40; // 120 to 160
        } else if (normalizedCents < 500) {
            // 400-500: M3 to P4 (cyan-green 160 to blue 200)
            const t = (normalizedCents - 400) / 100;
            hue = 160 + t * 40; // 160 to 200
        } else if (normalizedCents < 600) {
            // 500-600: P4 to tritone (blue 200 to red 0)
            const t = (normalizedCents - 500) / 100;
            hue = 200 - t * 200; // 200 to 0
        } else if (normalizedCents < 700) {
            // 600-700: tritone to P5 (red 0 to bright blue 220)
            const t = (normalizedCents - 600) / 100;
            hue = 0 + t * 220; // 0 to 220
        } else if (normalizedCents < 800) {
            // 700-800: P5 to m6 (bright blue 220 to purple 280)
            const t = (normalizedCents - 700) / 100;
            hue = 220 + t * 60; // 220 to 280
        } else if (normalizedCents < 900) {
            // 800-900: m6 to M6 (purple 280 to magenta 300)
            const t = (normalizedCents - 800) / 100;
            hue = 280 + t * 20; // 280 to 300
        } else if (normalizedCents < 1000) {
            // 900-1000: M6 to m7 (magenta 300 to orange 30)
            const t = (normalizedCents - 900) / 100;
            hue = 300 + t * 90; // 300 to 390, then mod 360 = 30
        } else if (normalizedCents < 1100) {
            // 1000-1100: m7 to M7 (orange 30 to red-orange 15)
            const t = (normalizedCents - 1000) / 100;
            hue = 30 - t * 15; // 30 to 15
        } else {
            // 1100-1200: M7 to octave (red-orange 15 to cyan 180)
            const t = (normalizedCents - 1100) / 100;
            hue = 15 + t * 165; // 15 to 180
        }

        // Saturation: consonant intervals are vivid, dissonant are less saturated
        const saturation = 60 + ((1.0 - dissonance) * 30); // 60-90%

        // Lightness: bright enough to be visible
        const lightness = 65; // Brighter for visibility

        const finalHue = hue % 360;
        if (Math.abs(normalizedCents - 700) < 10) {
            console.log('Sol (P5) color calculation:', {
                cents: normalizedCents,
                hue: finalHue,
                saturation,
                lightness,
                dissonance
            });
        }
        return this.hslToHex(finalHue, saturation, lightness);
    }

    hslToHex(h, s, l) {
        s = s / 100;
        l = l / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c/2;
        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
        else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
        else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
        else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
        else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
        else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

        const toHex = (val) => {
            const hex = Math.round((val + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    updateIntervalColors() {
        if (!this.settings.useIntervalColors) return;

        const rootFreq = this.rootTone === 1 ? this.tone1Freq : this.tone2Freq;
        this.settings.tone1Color = this.getFrequencyColor(this.tone1Freq, rootFreq);
        this.settings.tone2Color = this.getFrequencyColor(this.tone2Freq, rootFreq);

        console.log('Color update:', {
            tone1Freq: this.tone1Freq,
            tone2Freq: this.tone2Freq,
            rootFreq: rootFreq,
            tone1Color: this.settings.tone1Color,
            tone2Color: this.settings.tone2Color
        });

        const rgb1 = this.hexToRgb(this.settings.tone1Color);
        const rgb2 = this.hexToRgb(this.settings.tone2Color);
        const r = Math.min(255, rgb1.r + rgb2.r);
        const g = Math.min(255, rgb1.g + rgb2.g);
        const b = Math.min(255, rgb1.b + rgb2.b);
        this.settings.intersectionColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    getRevealRadius(toneStartTime, toneStopTime, isPlaying, toneX, toneY, width, height) {
        const maxDist = Math.sqrt(width * width + height * height);
        const revealSpeed = this.settings.pulseSpeed;

        if (isPlaying && toneStartTime) {
            // Expanding - tone is playing
            const elapsed = performance.now() - toneStartTime;
            const radius = (elapsed / 1000) * revealSpeed;
            return Math.min(radius, maxDist);
        } else if (toneStopTime && toneStartTime) {
            // Shrinking from center outward - show a "dead zone" expanding from center
            // Returns the minimum radius that is still visible (everything inside is invisible)
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

    isPointVisible(x, y, tone1X, tone1Y, tone2X, tone2Y, width, height) {
        // Check if point is within reveal radius of any playing tone
        if (this.isPlayingTone1) {
            const dist1 = Math.sqrt(Math.pow(x - tone1X, 2) + Math.pow(y - tone1Y, 2));
            const revealRadius1 = this.getRevealRadius(this.tone1StartTime, this.tone1StopTime, this.isPlayingTone1, tone1X, tone1Y, width, height);
            if (dist1 <= revealRadius1 && dist1 <= this.settings.boundaryRadius + this.settings.boundaryFalloff) return true;
        }
        if (this.isPlayingTone2) {
            const dist2 = Math.sqrt(Math.pow(x - tone2X, 2) + Math.pow(y - tone2Y, 2));
            const revealRadius2 = this.getRevealRadius(this.tone2StartTime, this.tone2StopTime, this.isPlayingTone2, tone2X, tone2Y, width, height);
            if (dist2 <= revealRadius2 && dist2 <= this.settings.boundaryRadius + this.settings.boundaryFalloff) return true;
        }
        return false;
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

            // Add to history buffer for waveform
            this.beatHistory.push(this.currentBeatAmplitude);
            if (this.beatHistory.length > this.beatHistoryMaxLength) {
                this.beatHistory.shift(); // Remove oldest value
            }
        } else {
            this.currentBeatAmplitude = 0;
            // Clear history when not playing both tones
            if (this.beatHistory.length > 0) {
                this.beatHistory = [];
            }
        }
    }

    animate() {
        const canvas = this.canvas;
        if (!canvas) return;

        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;
        const time = performance.now() * 0.001 * this.settings.speed;
        const realTime = performance.now() * 0.001; // Real time for beat frequency sync

        // Update beat amplitude from actual audio
        this.updateBeatAmplitude();

        // Clear canvas
        ctx.fillStyle = 'rgba(10, 10, 20, 1)';
        ctx.fillRect(0, 0, width, height);

        // Draw if at least one tone is playing OR if shrinking animation is active
        const isShrinking = (!this.isPlayingTone1 && this.tone1StopTime) || (!this.isPlayingTone2 && this.tone2StopTime);
        if (this.isPlayingTone1 || this.isPlayingTone2 || isShrinking) {
            this.drawHarmonic(time, realTime);

            // Clear stop times once shrinking is complete
            if (!this.isPlayingTone1 && this.tone1StopTime) {
                const revealRadius1 = this.getRevealRadius(this.tone1StartTime, this.tone1StopTime, false, 0, 0, width, height);
                if (revealRadius1 === 0) {
                    this.tone1StopTime = null;
                    this.tone1StartTime = null;
                }
            }
            if (!this.isPlayingTone2 && this.tone2StopTime) {
                const revealRadius2 = this.getRevealRadius(this.tone2StartTime, this.tone2StopTime, false, 0, 0, width, height);
                if (revealRadius2 === 0) {
                    this.tone2StopTime = null;
                    this.tone2StartTime = null;
                }
            }
        } else {
            // Draw static tone sources when not playing
            const tone1X = (this.tone1X / 100) * width;
            const tone2X = (this.tone2X / 100) * width;
            const tone1Y = height / 2;
            const tone2Y = height / 2;
            this.drawToneSource(ctx, tone1X, tone1Y, this.settings.tone1Color, 'T1', false);
            this.drawToneSource(ctx, tone2X, tone2Y, this.settings.tone2Color, 'T2', false);
        }

        // Draw pulses and interference pulses
        this.drawPulses();
        this.drawInterferencePulses();

        // Only continue animation if we're the active renderer (not paused for WebGL)
        if (!this.renderingPaused) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    drawHarmonic(time, realTime) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const tone1X = (this.tone1X / 100) * width;
        const tone2X = (this.tone2X / 100) * width;
        const tone1Y = height / 2;
        const tone2Y = height / 2;

        // Calculate beat frequency and amplitude envelope
        const beatFreq = Math.abs(this.tone1Freq - this.tone2Freq);

        // Use real-time audio amplitude from analyser instead of mathematical calculation
        // currentBeatAmplitude is already 0-1 normalized from actual audio
        const beatMultiplier = this.currentBeatAmplitude;

        // Draw harmonic field lines (if enabled)
        if (this.settings.showFieldLines) {
            const lines = this.settings.harmonicLines;
            for (let i = 0; i < lines; i++) {
                const angle = (i / lines) * Math.PI * 2;
                if (this.isPlayingTone1) {
                    this.drawFieldLine(ctx, tone1X, tone1Y, angle, this.tone1Freq, time, this.settings.tone1Color);
                }
                if (this.isPlayingTone2) {
                    this.drawFieldLine(ctx, tone2X, tone2Y, angle, this.tone2Freq, time, this.settings.tone2Color);
                }
            }
        }

        // Draw interference patterns with adaptive resolution (if enabled)
        if (this.settings.showInterferencePattern) {
            // First pass: determine which grid cells need which resolution
            const baseGridSize = this.settings.interferenceResolution;
            const overlapGridSize = this.settings.overlapResolution;
            const edgeGridSize = this.settings.edgeResolution;

            for (let x = 0; x < width; x += baseGridSize) {
            for (let y = 0; y < height; y += baseGridSize) {
                const dist1 = Math.sqrt(Math.pow(x - tone1X, 2) + Math.pow(y - tone1Y, 2));
                const dist2 = Math.sqrt(Math.pow(x - tone2X, 2) + Math.pow(y - tone2Y, 2));

                // Quick check if this area might have overlap or is near edge
                let quickBoundary1 = 0;
                let quickBoundary2 = 0;
                let nearEdge1 = false;
                let nearEdge2 = false;
                let inFoggyZone1 = false;
                let inFoggyZone2 = false;

                if (this.settings.useBoundary) {
                    // Add speaker radius so boundary starts at speaker edge
                    const effectiveBoundaryRadius = this.settings.boundaryRadius + this.settings.speakerRadius;
                    // Foggy zone: narrow band from 85% to boundary + 10% for performance
                    const foggyZoneStart = effectiveBoundaryRadius * 0.85;
                    const foggyZoneEnd = effectiveBoundaryRadius * 1.10;

                    if (this.isPlayingTone1) {
                        if (dist1 <= effectiveBoundaryRadius + this.settings.boundaryFalloff) {
                            quickBoundary1 = 1;
                            // Check if near the boundary edge (within edgeSize distance from boundary)
                            if (dist1 >= effectiveBoundaryRadius - this.settings.edgeSize &&
                                dist1 <= effectiveBoundaryRadius + this.settings.edgeSize) {
                                nearEdge1 = true;
                            }
                            // Check if in foggy zone - narrow band for performance
                            if (this.settings.useFoggyEdge &&
                                dist1 >= foggyZoneStart &&
                                dist1 <= foggyZoneEnd) {
                                inFoggyZone1 = true;
                            }
                        }
                    }
                    if (this.isPlayingTone2) {
                        if (dist2 <= effectiveBoundaryRadius + this.settings.boundaryFalloff) {
                            quickBoundary2 = 1;
                            // Check if near the boundary edge
                            if (dist2 >= effectiveBoundaryRadius - this.settings.edgeSize &&
                                dist2 <= effectiveBoundaryRadius + this.settings.edgeSize) {
                                nearEdge2 = true;
                            }
                            // Check if in foggy zone - narrow band for performance
                            if (this.settings.useFoggyEdge &&
                                dist2 >= foggyZoneStart &&
                                dist2 <= foggyZoneEnd) {
                                inFoggyZone2 = true;
                            }
                        }
                    }
                } else {
                    if (this.isPlayingTone1) quickBoundary1 = 1;
                    if (this.isPlayingTone2) quickBoundary2 = 1;
                }

                const mightOverlap = quickBoundary1 > 0 && quickBoundary2 > 0;
                const nearEdge = nearEdge1 || nearEdge2;
                const inFoggyZone = inFoggyZone1 || inFoggyZone2;

                // Determine resolution: use configurable foggy edge resolution
                let currentGridSize = baseGridSize;
                if (this.settings.useFoggyEdge && inFoggyZone) {
                    currentGridSize = this.settings.foggyEdgeResolution;
                } else if (this.settings.useSmoothCalculatedEdges && nearEdge) {
                    currentGridSize = edgeGridSize;
                } else if (mightOverlap) {
                    currentGridSize = overlapGridSize;
                }

                // Now draw at appropriate resolution for this cell
                for (let ox = 0; ox < baseGridSize; ox += currentGridSize) {
                    for (let oy = 0; oy < baseGridSize; oy += currentGridSize) {
                        const px = x + ox;
                        const py = y + oy;
                        if (px >= width || py >= height) continue;

                        const pdist1 = Math.sqrt(Math.pow(px - tone1X, 2) + Math.pow(py - tone1Y, 2));
                        const pdist2 = Math.sqrt(Math.pow(px - tone2X, 2) + Math.pow(py - tone2Y, 2));

                        // Calculate boundary falloff for each tone
                        let boundaryFalloff1 = 0;
                        let boundaryFalloff2 = 0;

                        if (this.settings.useBoundary) {
                            // Apply beat boundary pulsing if enabled
                            let beatBoundaryMult = 1;
                            if (this.settings.showBeatBoundary && this.isPlayingTone1 && this.isPlayingTone2) {
                                beatBoundaryMult = 1 + (beatMultiplier * this.settings.beatBoundaryAmount / 100);
                            }

                            // Add speaker radius so boundary starts at speaker edge
                            const effectiveBoundaryRadius = (this.settings.boundaryRadius + this.settings.speakerRadius) * beatBoundaryMult;

                            if (this.isPlayingTone1 || this.tone1StopTime) {
                                // Check if within reveal radius
                                const revealRadius1 = this.getRevealRadius(this.tone1StartTime, this.tone1StopTime, this.isPlayingTone1, tone1X, tone1Y, width, height);

                                let isInRevealedArea = false;
                                if (typeof revealRadius1 === 'object') {
                                    // Shrinking - check if in the visible ring
                                    isInRevealedArea = pdist1 >= revealRadius1.minRadius && pdist1 <= revealRadius1.maxRadius;
                                } else if (typeof revealRadius1 === 'number') {
                                    // Expanding or no reveal
                                    isInRevealedArea = pdist1 <= revealRadius1;
                                }

                                if (!isInRevealedArea) {
                                    boundaryFalloff1 = 0; // Not yet revealed or already shrunk away
                                } else if (this.settings.useFoggyEdge) {
                                    // Foggy edge mode: vignette fade to transparent
                                    const fadeStartDist = effectiveBoundaryRadius * this.settings.foggyEdgeStart;

                                    if (pdist1 < fadeStartDist) {
                                        boundaryFalloff1 = 1; // Full opacity before fade starts
                                    } else if (pdist1 < effectiveBoundaryRadius) {
                                        // Gradient fade from fadeStart to boundary edge
                                        const fadeRange = effectiveBoundaryRadius - fadeStartDist;
                                        const distIntoFade = pdist1 - fadeStartDist;
                                        const fadeAmount = 1 - (distIntoFade / fadeRange);
                                        // Smooth feathering with cubic ease
                                        boundaryFalloff1 = fadeAmount * fadeAmount * fadeAmount;
                                    } else {
                                        boundaryFalloff1 = 0; // Completely transparent outside boundary
                                    }
                                } else {
                                    // Standard boundary mode with falloff
                                    if (pdist1 <= effectiveBoundaryRadius) {
                                        boundaryFalloff1 = 1;
                                    } else {
                                        const distPastBoundary = pdist1 - effectiveBoundaryRadius;
                                        const linearFalloff = Math.max(0, 1 - (distPastBoundary / this.settings.boundaryFalloff));
                                        // Apply smooth curve (cubic ease-out) for natural edge
                                        boundaryFalloff1 = linearFalloff * linearFalloff * (3 - 2 * linearFalloff); // smoothstep
                                    }
                                }
                            }

                            if (this.isPlayingTone2 || this.tone2StopTime) {
                                // Check if within reveal radius
                                const revealRadius2 = this.getRevealRadius(this.tone2StartTime, this.tone2StopTime, this.isPlayingTone2, tone2X, tone2Y, width, height);

                                let isInRevealedArea = false;
                                if (typeof revealRadius2 === 'object') {
                                    // Shrinking - check if in the visible ring
                                    isInRevealedArea = pdist2 >= revealRadius2.minRadius && pdist2 <= revealRadius2.maxRadius;
                                } else if (typeof revealRadius2 === 'number') {
                                    // Expanding or no reveal
                                    isInRevealedArea = pdist2 <= revealRadius2;
                                }

                                if (!isInRevealedArea) {
                                    boundaryFalloff2 = 0; // Not yet revealed or already shrunk away
                                } else if (this.settings.useFoggyEdge) {
                                    // Foggy edge mode: vignette fade to transparent
                                    const fadeStartDist = effectiveBoundaryRadius * this.settings.foggyEdgeStart;

                                    if (pdist2 < fadeStartDist) {
                                        boundaryFalloff2 = 1; // Full opacity before fade starts
                                    } else if (pdist2 < effectiveBoundaryRadius) {
                                        // Gradient fade from fadeStart to boundary edge
                                        const fadeRange = effectiveBoundaryRadius - fadeStartDist;
                                        const distIntoFade = pdist2 - fadeStartDist;
                                        const fadeAmount = 1 - (distIntoFade / fadeRange);
                                        // Smooth feathering with cubic ease
                                        boundaryFalloff2 = fadeAmount * fadeAmount * fadeAmount;
                                    } else {
                                        boundaryFalloff2 = 0; // Completely transparent outside boundary
                                    }
                                } else {
                                    // Standard boundary mode with falloff
                                    if (pdist2 <= effectiveBoundaryRadius) {
                                        boundaryFalloff2 = 1;
                                    } else {
                                        const distPastBoundary = pdist2 - effectiveBoundaryRadius;
                                        const linearFalloff = Math.max(0, 1 - (distPastBoundary / this.settings.boundaryFalloff));
                                        // Apply smooth curve (cubic ease-out) for natural edge
                                        boundaryFalloff2 = linearFalloff * linearFalloff * (3 - 2 * linearFalloff); // smoothstep
                                    }
                                }
                            }
                        } else {
                            // No boundary - show full intensity everywhere, but still apply reveal animation
                            if (this.isPlayingTone1 || this.tone1StopTime) {
                                const revealRadius1 = this.getRevealRadius(this.tone1StartTime, this.tone1StopTime, this.isPlayingTone1, tone1X, tone1Y, width, height);
                                if (typeof revealRadius1 === 'object') {
                                    // Shrinking - check if in visible ring
                                    boundaryFalloff1 = (pdist1 >= revealRadius1.minRadius && pdist1 <= revealRadius1.maxRadius) ? 1 : 0;
                                } else {
                                    boundaryFalloff1 = pdist1 <= revealRadius1 ? 1 : 0;
                                }
                            }
                            if (this.isPlayingTone2 || this.tone2StopTime) {
                                const revealRadius2 = this.getRevealRadius(this.tone2StartTime, this.tone2StopTime, this.isPlayingTone2, tone2X, tone2Y, width, height);
                                if (typeof revealRadius2 === 'object') {
                                    // Shrinking - check if in visible ring
                                    boundaryFalloff2 = (pdist2 >= revealRadius2.minRadius && pdist2 <= revealRadius2.maxRadius) ? 1 : 0;
                                } else {
                                    boundaryFalloff2 = pdist2 <= revealRadius2 ? 1 : 0;
                                }
                            }
                        }

                        // Skip if both tones are fully faded out
                        if (boundaryFalloff1 === 0 && boundaryFalloff2 === 0) continue;

                        let wave1Amplitude = 0;
                        let wave2Amplitude = 0;

                        for (let h = 1; h <= this.settings.harmonicOrder; h++) {
                            // Keep animating waves even when stopped, as long as they're still visible
                            if ((this.isPlayingTone1 || this.tone1StopTime) && boundaryFalloff1 > 0) {
                                wave1Amplitude += Math.sin(pdist1 * 0.05 * h - this.tone1Freq * h * time * 0.01) / h;
                            }
                            if ((this.isPlayingTone2 || this.tone2StopTime) && boundaryFalloff2 > 0) {
                                wave2Amplitude += Math.sin(pdist2 * 0.05 * h - this.tone2Freq * h * time * 0.01) / h;
                            }
                        }

                        wave1Amplitude *= this.settings.amplitude * boundaryFalloff1;
                        wave2Amplitude *= this.settings.amplitude * boundaryFalloff2;

                        let brightness1 = Math.abs(wave1Amplitude) * 0.8;
                        let brightness2 = Math.abs(wave2Amplitude) * 0.8;

                        // Check if boundaries are overlapping at this point
                        const tone1InBounds = this.isPlayingTone1 && boundaryFalloff1 > 0;
                        const tone2InBounds = this.isPlayingTone2 && boundaryFalloff2 > 0;
                        const isOverlapping = tone1InBounds && tone2InBounds;

                        // Apply beat brightness pulsing only in overlapping interference zone
                        if (this.settings.showBeatBrightness && isOverlapping && this.isPlayingTone1 && this.isPlayingTone2) {
                            const interferenceX = (tone1X + tone2X) / 2;
                            const interferenceY = (tone1Y + tone2Y) / 2;
                            const distToInterference = Math.sqrt(Math.pow(px - interferenceX, 2) + Math.pow(py - interferenceY, 2));
                            const maxInterferenceRadius = Math.abs(tone1X - tone2X) * 0.2; // Smaller radius (was 0.5)

                            if (distToInterference < maxInterferenceRadius) {
                                const interferenceInfluence = 1 - (distToInterference / maxInterferenceRadius);
                                // More intense with steeper falloff
                                // When beatMultiplier is 1 (loud), boost brightness. When 0 (quiet), reduce brightness
                                const beatEffect = (beatMultiplier - 0.5) * 2; // -1 to 1 range
                                const beatBoost = 1 + (beatEffect * this.settings.beatBrightnessIntensity * Math.pow(interferenceInfluence, 2));
                                brightness1 *= beatBoost;
                                brightness2 *= beatBoost;
                            }
                        }

                        let r, g, b;

                        if (!isOverlapping) {
                            // Single tone - root is pure/vivid, interval is muted
                            // Determine which tone is present (1 or 2)
                            const activeTone = brightness1 > brightness2 ? 1 : 2;
                            const isRootTone = activeTone === this.rootTone;
                            const activeToneColor = activeTone === 1 ? this.settings.tone1Color : this.settings.tone2Color;
                            const activeBrightness = brightness1 + brightness2;

                            // Parse hex color
                            const hexR = parseInt(activeToneColor.substring(1, 3), 16);
                            const hexG = parseInt(activeToneColor.substring(3, 5), 16);
                            const hexB = parseInt(activeToneColor.substring(5, 7), 16);

                            if (isRootTone) {
                                // Root tone: pure, vivid color
                                const pureFactor = this.settings.rootIntensity + (activeBrightness * 0.35);
                                r = Math.round(hexR * pureFactor);
                                g = Math.round(hexG * pureFactor);
                                b = Math.round(hexB * pureFactor);
                            } else {
                                // Interval tone: muted color
                                const mutedFactor = this.settings.intervalIntensity + (activeBrightness * 0.35);
                                r = Math.round(hexR * mutedFactor);
                                g = Math.round(hexG * mutedFactor);
                                b = Math.round(hexB * mutedFactor);
                            }
                        } else {
                            // Boundaries overlap - pure additive color mixing
                            const totalBrightness = brightness1 + brightness2;

                            // Parse both tone colors
                            const hex1R = parseInt(this.settings.tone1Color.substring(1, 3), 16);
                            const hex1G = parseInt(this.settings.tone1Color.substring(3, 5), 16);
                            const hex1B = parseInt(this.settings.tone1Color.substring(5, 7), 16);

                            const hex2R = parseInt(this.settings.tone2Color.substring(1, 3), 16);
                            const hex2G = parseInt(this.settings.tone2Color.substring(3, 5), 16);
                            const hex2B = parseInt(this.settings.tone2Color.substring(5, 7), 16);

                            // No beat pulsing effect - static color mixing
                            const waveFactor = 1.0;

                            // Pure additive mixing with wave modulation
                            // Use equal weight blending for pure color intersection
                            const baseIntensity = this.settings.intersectionIntensity + (totalBrightness * 0.25);
                            const intensityFactor = baseIntensity * waveFactor;

                            r = Math.min(255, Math.round((hex1R + hex2R) * intensityFactor));
                            g = Math.min(255, Math.round((hex1G + hex2G) * intensityFactor));
                            b = Math.min(255, Math.round((hex1B + hex2B) * intensityFactor));
                        }

                        if (r > 0 || g > 0 || b > 0) {
                            // Use boundary falloff to control alpha for foggy edge fade
                            const finalAlpha = this.settings.useFoggyEdge
                                ? Math.max(boundaryFalloff1, boundaryFalloff2)
                                : 1;

                            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                            ctx.globalAlpha = finalAlpha;
                            ctx.fillRect(px, py, currentGridSize, currentGridSize);
                        }
                    }
                }
            }
            }
        } // End if showInterferencePattern

        ctx.globalAlpha = 1;

        // Draw standalone beat visualizations (visible even without interference pattern)
        if (this.isPlayingTone1 && this.isPlayingTone2) {
            const interferenceX = (tone1X + tone2X) / 2;
            const interferenceY = (tone1Y + tone2Y) / 2;

            if (this.settings.showBeatCircle) {
                this.drawBeatCircle(ctx, interferenceX, interferenceY, beatMultiplier);
            }
            if (this.settings.showBeatMetronome) {
                this.drawBeatMetronome(ctx, width, height, beatMultiplier);
            }
            if (this.settings.showBeatWaveform) {
                this.drawBeatWaveform(ctx, width, height, realTime, beatFreq);
            }
            if (this.settings.showBeatPulses) {
                this.drawBeatPulsesStandalone(ctx, interferenceX, interferenceY, realTime);
            }
        }

        // Draw tone sources
        this.drawToneSource(ctx, tone1X, tone1Y, this.settings.tone1Color, 'T1', this.isPlayingTone1);
        this.drawToneSource(ctx, tone2X, tone2Y, this.settings.tone2Color, 'T2', this.isPlayingTone2);
    }

    drawFieldLine(ctx, x, y, angle, frequency, time, color) {
        ctx.lineWidth = this.settings.harmonicLineThickness;
        const segments = 50;
        const maxLength = 300;
        const referenceFreq = 440;
        const wavelengthScale = referenceFreq / frequency;
        const spatialFrequency = 0.1 / wavelengthScale;
        const waveAmplitude = 10 * this.settings.harmonicDensity;

        ctx.beginPath();
        ctx.moveTo(x, y);

        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const distance = t * maxLength;
            const wave = Math.sin(distance * spatialFrequency - frequency * time * 0.01) * waveAmplitude;
            const px = x + Math.cos(angle) * distance + Math.cos(angle + Math.PI / 2) * wave;
            const py = y + Math.sin(angle) * distance + Math.sin(angle + Math.PI / 2) * wave;
            ctx.lineTo(px, py);
        }

        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    drawToneSource(ctx, x, y, color, label, isActive = false) {
        if (this.speakerImageLoaded) {
            // Draw speaker icon - size responsive to canvas dimensions
            // Use percentage of canvas width, clamped between min and max
            const baseSize = Math.min(this.canvas.width, this.canvas.height) * 0.08; // 8% of smallest dimension
            const speakerSize = Math.max(40, Math.min(80, baseSize)); // Clamp between 40-80px
            const bgRadius = speakerSize / 2;

            ctx.save();

            // Calculate pulsing opacity when active
            let speakerOpacity = 0.5;
            if (isActive) {
                // Create pulsing effect using sine wave
                const pulseSpeed = 3; // Hz
                const time = performance.now() / 1000; // Convert to seconds
                const pulse = (Math.sin(time * pulseSpeed * Math.PI * 2) + 1) / 2; // 0 to 1
                speakerOpacity = 0.5 + (pulse * 0.5); // 0.5 to 1.0
            }

            if (isActive) {
                // When playing: just draw transparent speaker, no background
                ctx.shadowBlur = 0; // No glow
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = speakerOpacity;

                // Draw the transparent speaker image centered at x, y
                // The transparent parts will show the visualization behind
                ctx.drawImage(
                    this.speakerImageTransparent,
                    x - speakerSize / 2,
                    y - speakerSize / 2,
                    speakerSize,
                    speakerSize
                );
            } else {
                // When not playing: invert colors - draw inverted speaker with high contrast

                // Draw black background circle first
                ctx.fillStyle = '#000000';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(x, y, bgRadius, 0, Math.PI * 2);
                ctx.fill();

                // Add white border for contrast
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.4;
                ctx.stroke();

                // Draw inverted speaker with high contrast
                ctx.globalAlpha = 0.9; // Higher opacity for better visibility
                ctx.save();
                ctx.filter = 'invert(1) contrast(1.5) brightness(1.2)'; // Boost contrast and brightness
                ctx.drawImage(
                    this.speakerImage,
                    x - speakerSize / 2,
                    y - speakerSize / 2,
                    speakerSize,
                    speakerSize
                );
                ctx.restore();
            }

            ctx.restore();
        } else {
            // Fallback to circle if image not loaded
            if (isActive) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = color;
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = isActive ? color : `${color}80`;
            ctx.globalAlpha = isActive ? 1 : 0.5;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;

            ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y);
        }
    }

    drawPulses() {
        const ctx = this.ctx;
        const now = performance.now();

        this.pulses = this.pulses.filter(pulse => {
            const elapsed = now - pulse.startTime;
            return elapsed < this.settings.pulseDuration;
        });

        this.pulses.forEach(pulse => {
            const elapsed = now - pulse.startTime;
            const progress = elapsed / this.settings.pulseDuration;
            const radius = (elapsed / 1000) * this.settings.pulseSpeed;
            const opacity = this.settings.pulseOpacity * (1 - progress);

            ctx.strokeStyle = pulse.color;
            ctx.lineWidth = this.settings.pulseWidth;
            ctx.globalAlpha = opacity;
            ctx.setLineDash(pulse.isStart ? [] : [10, 10]);
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

        const tone1X = (this.tone1X / 100) * width;
        const tone2X = (this.tone2X / 100) * width;
        const tone1Y = height / 2;
        const tone2Y = height / 2;

        const interferenceX = (tone1X + tone2X) / 2;
        const interferenceY = (tone1Y + tone2Y) / 2;

        const timeSinceStart = Math.min(
            this.tone1StartTime ? now - this.tone1StartTime : Infinity,
            this.tone2StartTime ? now - this.tone2StartTime : Infinity
        );

        // Use beat frequency if enabled, otherwise use fixed interval
        let pulseInterval = this.settings.interferencePulseInterval;
        if (this.settings.useBeatFrequency) {
            const beatFreq = Math.abs(this.tone1Freq - this.tone2Freq);
            // Prevent division by zero for unison, use minimum 0.5 Hz
            const effectiveBeatFreq = Math.max(beatFreq, 0.5);
            pulseInterval = 1000 / effectiveBeatFreq; // Convert to milliseconds
        }

        const timeSinceLastPulse = timeSinceStart % pulseInterval;

        // When using beat frequency, sync pulse duration and speed to the beat period
        let effectiveDuration = this.settings.pulseDuration;
        let effectiveSpeed = this.settings.pulseSpeed;

        if (this.settings.useBeatFrequency) {
            // Pulse should complete within one beat period
            effectiveDuration = pulseInterval;
            // Calculate speed needed to reach a good visible radius within the beat period
            const targetRadius = 300; // Target radius in pixels
            effectiveSpeed = (targetRadius / (pulseInterval / 1000)); // pixels per second
        }

        if (timeSinceLastPulse < effectiveDuration) {
            const progress = timeSinceLastPulse / effectiveDuration;
            const radius = (timeSinceLastPulse / 1000) * effectiveSpeed;
            const opacity = this.settings.pulseOpacity * (1 - progress);

            ctx.strokeStyle = this.settings.intersectionColor;
            ctx.lineWidth = this.settings.pulseWidth * 1.5;
            ctx.globalAlpha = opacity;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(interferenceX, interferenceY, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }
    }

    hslToRgb(h, s, l) {
        // Convert HSL to RGB
        // h: 0-360, s: 0-100, l: 0-100
        s /= 100;
        l /= 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;

        let r = 0, g = 0, b = 0;
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    // Standalone beat visualization methods
    drawBeatCircle(ctx, x, y, beatMultiplier) {
        // Pulsing circle at interference point
        // Use actual audio amplitude from the mixed output
        const normalizedBeat = this.currentBeatAmplitude;

        const baseSize = this.settings.beatCircleSize;
        const pulseAmount = normalizedBeat * 30; // Pulse between 0-30 pixels
        const radius = baseSize + pulseAmount;

        ctx.strokeStyle = this.settings.intersectionColor;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        ctx.globalAlpha = normalizedBeat * 0.3;
        ctx.fillStyle = this.settings.intersectionColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }

    drawBeatMetronome(ctx, width, height, beatMultiplier) {
        // Visual metronome in corner
        // Use actual audio amplitude from the mixed output
        const normalizedBeat = this.currentBeatAmplitude;

        const x = width - 80;
        const y = 80;
        const size = this.settings.beatMetronomeSize;

        // Background circle
        ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, size + 10, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing dot
        const dotSize = size * (0.5 + normalizedBeat * 0.5);
        ctx.fillStyle = this.settings.intersectionColor;
        ctx.shadowBlur = 20 * normalizedBeat;
        ctx.shadowColor = this.settings.intersectionColor;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BEAT', x, y + size + 25);
    }

    drawBeatWaveform(ctx, width, height, realTime, beatFreq) {
        // Waveform showing beat amplitude at bottom
        // Now uses actual audio amplitude history instead of calculated values
        const waveHeight = this.settings.beatWaveformHeight;
        const startY = height - waveHeight - 20;

        // Background
        ctx.fillStyle = 'rgba(20, 20, 30, 0.7)';
        ctx.fillRect(20, startY, width - 40, waveHeight);

        // Center line
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, startY + waveHeight / 2);
        ctx.lineTo(width - 20, startY + waveHeight / 2);
        ctx.stroke();

        // Beat waveform from actual audio history
        if (this.beatHistory.length > 1) {
            ctx.strokeStyle = this.settings.intersectionColor;
            ctx.lineWidth = 2;
            ctx.beginPath();

            const historyLength = this.beatHistory.length;
            for (let i = 0; i < historyLength; i++) {
                const x = 20 + (i / historyLength) * (width - 40);
                // Convert 0-1 amplitude to y position (inverted so peaks go up)
                const amplitude = this.beatHistory[i];
                const y = startY + waveHeight / 2 - ((amplitude - 0.5) * waveHeight * 0.8);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Beat Frequency: ${beatFreq.toFixed(2)} Hz (from audio)`, 30, startY + 15);
    }

    drawBeatPulsesStandalone(ctx, x, y, realTime) {
        // Radiating pulses from interference point
        const interval = this.settings.beatPulseInterval / 1000; // Convert to seconds
        const duration = 2; // seconds

        // Calculate how many pulses to show
        const timeSinceStart = realTime;
        const numPulses = Math.floor(timeSinceStart / interval);

        for (let i = Math.max(0, numPulses - 5); i <= numPulses; i++) {
            const pulseTime = i * interval;
            const elapsed = timeSinceStart - pulseTime;

            if (elapsed >= 0 && elapsed < duration) {
                const progress = elapsed / duration;
                const radius = progress * 300;
                const opacity = (1 - progress) * 0.6;

                ctx.strokeStyle = this.settings.intersectionColor;
                ctx.lineWidth = 2;
                ctx.globalAlpha = opacity;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        ctx.globalAlpha = 1;
    }

    copySettings() {
        // Create a formatted JavaScript object string of current settings
        const settingsCode = `{
    amplitude: ${this.settings.amplitude},
    speed: ${this.settings.speed},
    harmonicLines: ${this.settings.harmonicLines},
    harmonicDensity: ${this.settings.harmonicDensity},
    harmonicOrder: ${this.settings.harmonicOrder},
    harmonicLineThickness: ${this.settings.harmonicLineThickness},
    showFieldLines: ${this.settings.showFieldLines},
    showInterferencePattern: ${this.settings.showInterferencePattern},
    interferenceResolution: ${this.settings.interferenceResolution},
    overlapResolution: ${this.settings.overlapResolution},

    // Edge quality settings
    useSmoothCalculatedEdges: ${this.settings.useSmoothCalculatedEdges},
    edgeResolution: ${this.settings.edgeResolution},
    edgeSize: ${this.settings.edgeSize},
    useFoggyEdge: ${this.settings.useFoggyEdge},
    foggyEdgeResolution: ${this.settings.foggyEdgeResolution},
    foggyEdgeStart: ${this.settings.foggyEdgeStart},
    foggyEdgeFeather: ${this.settings.foggyEdgeFeather},

    // Boundary settings
    useBoundary: ${this.settings.useBoundary},
    boundaryRadius: ${this.settings.boundaryRadius},
    boundaryFalloff: ${this.settings.boundaryFalloff},

    // Pulse effects
    showStartPulse: ${this.settings.showStartPulse},
    showStopPulse: ${this.settings.showStopPulse},
    pulseSpeed: ${this.settings.pulseSpeed},
    pulseDuration: ${this.settings.pulseDuration},
    pulseOpacity: ${this.settings.pulseOpacity},
    pulseWidth: ${this.settings.pulseWidth},
    showInterferencePulse: ${this.settings.showInterferencePulse},
    useBeatFrequency: ${this.settings.useBeatFrequency},
    interferencePulseInterval: ${this.settings.interferencePulseInterval},

    // Beat frequency visualization
    showBeatBrightness: ${this.settings.showBeatBrightness},
    beatBrightnessIntensity: ${this.settings.beatBrightnessIntensity},
    showBeatBoundary: ${this.settings.showBeatBoundary},
    beatBoundaryAmount: ${this.settings.beatBoundaryAmount},

    // Standalone beat visualizations
    showBeatCircle: ${this.settings.showBeatCircle},
    beatCircleSize: ${this.settings.beatCircleSize},
    showBeatMetronome: ${this.settings.showBeatMetronome},
    beatMetronomeSize: ${this.settings.beatMetronomeSize},
    showBeatWaveform: ${this.settings.showBeatWaveform},
    beatWaveformHeight: ${this.settings.beatWaveformHeight},
    showBeatPulses: ${this.settings.showBeatPulses},
    beatPulseInterval: ${this.settings.beatPulseInterval},

    // Colors
    useIntervalColors: ${this.settings.useIntervalColors},
    tone1Color: '${this.settings.tone1Color}',
    tone2Color: '${this.settings.tone2Color}',
    intersectionColor: '${this.settings.intersectionColor}',

    // Color intensity
    rootIntensity: ${this.settings.rootIntensity},
    intervalIntensity: ${this.settings.intervalIntensity},
    intersectionIntensity: ${this.settings.intersectionIntensity}
}`;

        // Copy to clipboard
        navigator.clipboard.writeText(settingsCode).then(() => {
            // Visual feedback
            const btn = document.getElementById('cymaticHarmonicCopySettingsBtn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            btn.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);

            console.log('Settings copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy settings:', err);
            alert('Failed to copy settings. Check console for output.');
            console.log(settingsCode);
        });
    }

    showColorSpectrum() {
        // Show modal
        const modal = document.getElementById('colorSpectrumModal');
        modal.style.display = 'block';

        // Get current root frequency
        const rootFreq = this.rootTone === 1 ? this.tone1Freq : this.tone2Freq;

        // Piano range: A0 (27.5 Hz) to C8 (4186 Hz)
        const minFreq = 27.5;
        const maxFreq = 4186;

        // Generate frequency labels (octave markers)
        const labelsContainer = document.getElementById('colorSpectrumLabels');
        labelsContainer.innerHTML = '';

        // Create labels for each octave
        const octaveFreqs = [
            { freq: 27.5, note: 'A0' },
            { freq: 55, note: 'A1' },
            { freq: 110, note: 'A2' },
            { freq: 220, note: 'A3' },
            { freq: 440, note: 'A4' },
            { freq: 880, note: 'A5' },
            { freq: 1760, note: 'A6' },
            { freq: 3520, note: 'A7' },
            { freq: 4186, note: 'C8' }
        ];

        octaveFreqs.forEach(({freq, note}) => {
            const label = document.createElement('div');
            label.style.padding = '4px 0';
            label.textContent = `${note} (${freq} Hz)`;
            labelsContainer.appendChild(label);
        });

        // Draw root color bar
        const rootBar = document.getElementById('colorSpectrumRootBar');
        const rootColor = this.getFrequencyColor(rootFreq, rootFreq);
        rootBar.style.background = rootColor;

        // Draw Piano Coloring spectrum
        const pianoCanvas = document.getElementById('colorSpectrumPianoCanvas');
        const pianoCtx = pianoCanvas.getContext('2d');
        pianoCanvas.width = 80;
        pianoCanvas.height = 600;

        const pianoHeight = pianoCanvas.height;
        const steps = pianoHeight;

        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const freq = minFreq * Math.pow(maxFreq / minFreq, t);
            const color = this.getFrequencyColorPiano(freq, rootFreq);
            pianoCtx.fillStyle = color;
            pianoCtx.fillRect(0, pianoHeight - i - 1, 80, 1);
        }

        // Draw Continuous Gradient spectrum
        const canvas = document.getElementById('colorSpectrumCanvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 600;

        const width = canvas.width;
        const height = canvas.height;

        // Draw gradient from bottom (low freq) to top (high freq)
        for (let i = 0; i < height; i++) {
            // Map pixel row to frequency (bottom = minFreq, top = maxFreq)
            const t = i / height;
            const freq = minFreq * Math.pow(maxFreq / minFreq, t);

            // Get color for this frequency using continuous gradient
            const color = this.getFrequencyColor(freq, rootFreq);

            // Draw horizontal line
            ctx.fillStyle = color;
            ctx.fillRect(0, height - i - 1, width, 1);
        }

        // Add frequency markers on the canvas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';

        octaveFreqs.forEach(({freq, note}) => {
            // Calculate y position (logarithmic scale)
            const t = Math.log(freq / minFreq) / Math.log(maxFreq / minFreq);
            const y = height - (t * height);

            // Draw line
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(0, y, width, 1);

            // Draw label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillText(note, 10, y - 5);
        });

        console.log('Color spectrum displayed for root frequency:', rootFreq, 'Hz');
    }

    showPianoSpectrum() {
        // Show modal
        const modal = document.getElementById('pianoSpectrumModal');
        modal.style.display = 'block';

        // C as root note (middle C = C4 = 261.63 Hz)
        const rootFreq = 261.63; // C4

        // Define 88 piano keys (A0 to C8)
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const keys = [];

        // Start from A0 (27.5 Hz, key 1)
        // A0, A#0, B0 (3 keys) -> C1 starts at key 4
        for (let i = 0; i < 88; i++) {
            const keyNum = i + 1;
            // Calculate frequency for this key (A0 = 27.5 Hz is key 1)
            const freq = 27.5 * Math.pow(2, i / 12);

            // Determine note name
            // A0 is index 0, so we need to offset by 9 semitones to start at A
            const noteIndex = (i + 9) % 12;
            const octave = Math.floor((i + 9) / 12);
            const noteName = notes[noteIndex] + octave;

            // Determine if black or white key
            const isBlack = noteName.includes('#');

            keys.push({ keyNum, freq, noteName, isBlack });
        }

        // Draw piano on canvas
        const canvas = document.getElementById('pianoSpectrumCanvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 300;

        const width = canvas.width;
        const height = canvas.height;

        // Calculate key dimensions
        const whiteKeys = keys.filter(k => !k.isBlack);
        const whiteKeyWidth = width / whiteKeys.length;
        const whiteKeyHeight = height * 0.7;
        const blackKeyWidth = whiteKeyWidth * 0.6;
        const blackKeyHeight = height * 0.4;

        // Draw white keys first - use Piano Coloring
        let whiteKeyX = 0;
        keys.forEach((key, index) => {
            if (!key.isBlack) {
                const color = this.getFrequencyColorPiano(key.freq, rootFreq);

                // Draw white key
                ctx.fillStyle = color;
                ctx.fillRect(whiteKeyX, 0, whiteKeyWidth, whiteKeyHeight);

                // Draw key border
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(whiteKeyX, 0, whiteKeyWidth, whiteKeyHeight);

                // Draw note name for C notes
                if (key.noteName.startsWith('C') && !key.noteName.includes('#')) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(key.noteName, whiteKeyX + whiteKeyWidth / 2, whiteKeyHeight - 10);
                }

                whiteKeyX += whiteKeyWidth;
            }
        });

        // Draw black keys on top - use Piano Coloring
        whiteKeyX = 0;
        let whiteKeyIndex = 0;
        keys.forEach((key, index) => {
            if (key.isBlack) {
                // Find position between white keys
                const color = this.getFrequencyColorPiano(key.freq, rootFreq);

                // Black key positioned after the previous white key
                const blackKeyX = whiteKeyX - (blackKeyWidth / 2);

                // Draw black key
                ctx.fillStyle = color;
                ctx.fillRect(blackKeyX, 0, blackKeyWidth, blackKeyHeight);

                // Draw border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(blackKeyX, 0, blackKeyWidth, blackKeyHeight);
            } else {
                whiteKeyX += whiteKeyWidth;
                whiteKeyIndex++;
            }
        });

        console.log('Piano spectrum displayed with C (261.63 Hz) as root');
    }
}
