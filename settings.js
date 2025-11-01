// Settings Manager for Ear Trainer App
class Settings {
    constructor(profileName = 'Default') {
        this.profileName = profileName;
        this.storageKey = `earTrainerSettings_${profileName}`;
        this.settings = this.load();
    }

    // Load settings from localStorage
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }

        // Default settings
        return {
            setupComplete: false,
            vocalRange: {
                low: null,
                high: null,
                voiceType: null
            },
            pitchSensitivity: {
                preset: 'normal', // very-strict, strict, normal, forgiving, very-forgiving
                tolerance: 0.015 // 0.01 (1%), 0.015 (1.5%), 0.02 (2%), 0.03 (3%)
            },
            microphoneGain: 4.0, // Default gain level (0.1 to 5.0) - 4.0 for quiet mics
            selectedMicrophone: null, // Device ID of preferred microphone
            debugControlsEnabled: true, // Show debug button and diagnostics exercise by default
            usageMode: 'headphone-mic', // headphone-mic, speaker-mic, car-mode
            sliderGlissandoVisualization: true // Show wave visualization during Slider Glissando exercises
        };
    }

    // Save settings to localStorage
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    // Check if setup is complete
    isSetupComplete() {
        return this.settings.setupComplete === true &&
               this.settings.vocalRange.low !== null &&
               this.settings.vocalRange.high !== null;
    }

    // Set vocal range
    setVocalRange(low, high, voiceType = null) {
        this.settings.vocalRange.low = low;
        this.settings.vocalRange.high = high;

        // Auto-detect voice type if not provided
        if (!voiceType) {
            voiceType = this.detectVoiceType(low.frequency, high.frequency);
        }
        this.settings.vocalRange.voiceType = voiceType;

        this.settings.setupComplete = true;
        return this.save();
    }

    // Detect voice type based on frequency range
    detectVoiceType(lowFreq, highFreq) {
        // Standard vocal ranges (matching setup.js)
        const standardRanges = {
            'Bass': { low: 82.41, high: 329.63 },
            'Baritone': { low: 110.00, high: 440.00 },
            'Tenor': { low: 130.81, high: 523.25 },
            'Alto': { low: 174.61, high: 698.46 },
            'Mezzo-Soprano': { low: 220.00, high: 880.00 },
            'Soprano': { low: 261.63, high: 1046.50 }
        };

        // Find the closest match by comparing both low and high frequencies
        let closestType = 'Alto'; // Default
        let minDistance = Infinity;

        for (const [type, range] of Object.entries(standardRanges)) {
            // Calculate distance using both low and high frequencies
            const lowDiff = Math.abs(lowFreq - range.low);
            const highDiff = Math.abs(highFreq - range.high);
            const distance = lowDiff + highDiff;

            if (distance < minDistance) {
                minDistance = distance;
                closestType = type;
            }
        }

        return closestType;
    }

    // Get vocal range
    getVocalRange() {
        return this.settings.vocalRange;
    }

    // Reset all settings
    reset() {
        this.settings = {
            setupComplete: false,
            vocalRange: {
                low: null,
                high: null,
                voiceType: null
            }
        };
        return this.save();
    }

    // Format note for display
    static formatNote(noteData) {
        if (!noteData) return '--';
        return `${noteData.note} (${Math.round(noteData.frequency)}Hz)`;
    }

    // Get note name only
    static getNoteName(noteData) {
        if (!noteData) return '--';
        return noteData.note;
    }

    // Sensitivity preset configurations
    static getSensitivityPresets() {
        return {
            'very-strict': {
                name: 'Very Strict',
                description: 'Professional level - requires near-perfect pitch',
                stableReadings: 15,
                confidenceThreshold: 0.90,
                graceTokens: 0,
                graceTokenDuration: 0
            },
            'strict': {
                name: 'Strict',
                description: 'Advanced - minimal forgiveness for pitch wobbles',
                stableReadings: 10,
                confidenceThreshold: 0.88,
                graceTokens: 1,
                graceTokenDuration: 100
            },
            'normal': {
                name: 'Normal',
                description: 'Balanced - good for most users',
                stableReadings: 5,
                confidenceThreshold: 0.85,
                graceTokens: 2,
                graceTokenDuration: 200
            },
            'forgiving': {
                name: 'Forgiving',
                description: 'Beginner-friendly - allows natural voice variation',
                stableReadings: 3,
                confidenceThreshold: 0.80,
                graceTokens: 4,
                graceTokenDuration: 300
            },
            'very-forgiving': {
                name: 'Very Forgiving',
                description: 'Learning mode - maximum flexibility',
                stableReadings: 2,
                confidenceThreshold: 0.75,
                graceTokens: 6,
                graceTokenDuration: 400
            }
        };
    }

    // Get pitch sensitivity settings
    getPitchSensitivity() {
        // Ensure settings exist with defaults
        if (!this.settings.pitchSensitivity) {
            this.settings.pitchSensitivity = {
                preset: 'normal',
                tolerance: 0.015
            };
            this.save();
        }

        // Migration: Update old tolerance values that are too strict
        if (this.settings.pitchSensitivity.tolerance < 0.005) {
            console.log(`Migrating tolerance from ${this.settings.pitchSensitivity.tolerance} to 0.015`);
            this.settings.pitchSensitivity.tolerance = 0.015;
            this.save();
        }

        return this.settings.pitchSensitivity;
    }

    // Set sensitivity preset
    setSensitivityPreset(preset) {
        const presets = Settings.getSensitivityPresets();
        if (!presets[preset]) {
            console.error('Invalid preset:', preset);
            return false;
        }

        if (!this.settings.pitchSensitivity) {
            this.settings.pitchSensitivity = { tolerance: 0.015 };
        }
        this.settings.pitchSensitivity.preset = preset;
        return this.save();
    }

    // Set tolerance
    setTolerance(tolerance) {
        const validTolerances = [0.0005, 0.001, 0.01, 0.02];
        if (!validTolerances.includes(tolerance)) {
            console.error('Invalid tolerance:', tolerance);
            return false;
        }

        if (!this.settings.pitchSensitivity) {
            this.settings.pitchSensitivity = { preset: 'normal' };
        }
        this.settings.pitchSensitivity.tolerance = tolerance;
        return this.save();
    }

    // Get current preset configuration
    getCurrentSensitivityConfig() {
        const sensitivity = this.getPitchSensitivity();
        const presets = Settings.getSensitivityPresets();
        const preset = presets[sensitivity.preset] || presets['normal'];

        return {
            ...preset,
            tolerance: sensitivity.tolerance
        };
    }

    // Get microphone gain
    getMicrophoneGain() {
        if (this.settings.microphoneGain === undefined) {
            this.settings.microphoneGain = 3.0; // Higher default for better detection
            this.save();
        }
        return this.settings.microphoneGain;
    }

    // Set microphone gain
    setMicrophoneGain(gain) {
        // Clamp between 0.1 and 5.0
        const clampedGain = Math.max(0.1, Math.min(5.0, gain));
        this.settings.microphoneGain = clampedGain;
        return this.save();
    }

    // Get selected microphone device ID
    getSelectedMicrophone() {
        return this.settings.selectedMicrophone;
    }

    // Set selected microphone device ID
    setSelectedMicrophone(deviceId) {
        this.settings.selectedMicrophone = deviceId;
        console.log('Saved microphone preference:', deviceId);
        return this.save();
    }

    // Get debug controls enabled state
    getDebugControlsEnabled() {
        if (this.settings.debugControlsEnabled === undefined) {
            this.settings.debugControlsEnabled = true; // Default to on
            this.save();
        }
        return this.settings.debugControlsEnabled;
    }

    // Set debug controls enabled state
    setDebugControlsEnabled(enabled) {
        this.settings.debugControlsEnabled = !!enabled;
        return this.save();
    }

    // Usage mode configurations
    static getUsageModes() {
        return {
            'headphone-mic': {
                name: 'Headphone + Mic',
                description: 'Single headphone with microphone (default)',
                icon: '🎧',
                allowSimultaneousAudio: true
            },
            'speaker-mic': {
                name: 'Speaker + Mic',
                description: 'Separate speaker and microphone (no simultaneous audio)',
                icon: '🔊',
                allowSimultaneousAudio: false
            },
            'car-mode': {
                name: 'Car Mode',
                description: 'Hands-free mode for driving (adapted exercises)',
                icon: '🚗',
                allowSimultaneousAudio: false,
                handsFree: true
            }
        };
    }

    // Get usage mode
    getUsageMode() {
        if (!this.settings.usageMode) {
            this.settings.usageMode = 'headphone-mic';
            this.save();
        }
        return this.settings.usageMode;
    }

    // Set usage mode
    setUsageMode(mode) {
        const modes = Settings.getUsageModes();
        if (!modes[mode]) {
            console.error('Invalid usage mode:', mode);
            return false;
        }
        this.settings.usageMode = mode;
        return this.save();
    }

    // Get current usage mode config
    getCurrentUsageModeConfig() {
        const mode = this.getUsageMode();
        const modes = Settings.getUsageModes();
        return modes[mode] || modes['headphone-mic'];
    }

    // Check if an exercise is compatible with current usage mode
    isExerciseCompatible(exerciseType) {
        const mode = this.getUsageMode();
        const modeConfig = this.getCurrentUsageModeConfig();

        // Exercise compatibility matrix
        const exerciseRequirements = {
            'glissando': { requiresSimultaneous: true, requiresTouch: false, hasCarMode: false },
            'pitch': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: true },
            'pitchhold': { requiresSimultaneous: true, requiresTouch: false, hasCarMode: false, carModeOnly: true },
            'octave': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: false },
            'scale': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: false },
            'toneSlide': { requiresSimultaneous: false, requiresTouch: true, hasCarMode: false },
            'darts': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: true }, // Sequential: tone then mic
            'unisonDarts': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: true }, // Sequential: root then mic
            'halfStepDarts': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: true }, // Sequential: root then mic
            'wholeStepDarts': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: true }, // Sequential: root then mic
            'diagnostics': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: false },
            'halfStepFeelRoot': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: false }, // Sequential: toggle between tones
            'wholeStepFeelRoot': { requiresSimultaneous: false, requiresTouch: false, hasCarMode: false }, // Sequential: toggle between tones
            'halfStepSlide': { requiresSimultaneous: false, requiresTouch: true, hasCarMode: false }, // Requires touch for slider
            'wholeStepSlide': { requiresSimultaneous: false, requiresTouch: true, hasCarMode: false } // Requires touch for slider
        };

        const requirements = exerciseRequirements[exerciseType];
        if (!requirements) return true; // Unknown exercises are allowed

        // Car mode only exercises - only show in car mode
        if (requirements.carModeOnly) {
            return mode === 'car-mode';
        }

        // Car mode - only allow exercises with car mode implementation
        if (mode === 'car-mode') {
            return requirements.hasCarMode === true;
        }

        // Check simultaneous audio requirement
        if (requirements.requiresSimultaneous && !modeConfig.allowSimultaneousAudio) {
            return false;
        }

        // Check touch requirement (incompatible with car mode)
        if (requirements.requiresTouch && modeConfig.handsFree) {
            return false;
        }

        return true;
    }

    // Get slider glissando visualization setting
    getSliderGlissandoVisualization() {
        if (this.settings.sliderGlissandoVisualization === undefined) {
            this.settings.sliderGlissandoVisualization = true;
            this.save();
        }
        return this.settings.sliderGlissandoVisualization;
    }

    // Set slider glissando visualization setting
    setSliderGlissandoVisualization(enabled) {
        this.settings.sliderGlissandoVisualization = Boolean(enabled);
        return this.save();
    }
}

// Global settings instance (initialized in app.js with profile support)
let appSettings;
