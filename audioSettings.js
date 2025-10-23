// Audio Settings Manager
class AudioSettings {
    constructor() {
        this.modal = document.getElementById('audioSettings');
        this.closeBtn = document.getElementById('closeAudioSettings');
        this.micSelect = document.getElementById('micSelect');
        this.speakerSelect = document.getElementById('speakerSelect');
        this.requestBtn = document.getElementById('requestPermissions');
        this.testBtn = document.getElementById('testAudio');
        this.showInstallBtn = document.getElementById('showInstallBtn');
        this.sensitivityPreset = document.getElementById('sensitivityPreset');
        this.toleranceSelect = document.getElementById('toleranceSelect');
        this.sensitivityDescription = document.getElementById('sensitivityDescription');
        this.micGainSlider = document.getElementById('micGainSlider');
        this.micGainValue = document.getElementById('micGainValue');
        this.debugControlsToggle = document.getElementById('debugControlsToggle');
        this.debugControlsStatus = document.getElementById('debugControlsStatus');
        this.usageModeSelect = document.getElementById('usageModeSelect');
        this.usageModeDescription = document.getElementById('usageModeDescription');

        // Settings buttons from different screens
        this.settingsBtns = [
            document.getElementById('audioSettingsBtn'),
            document.getElementById('audioSettingsBtnMain'),
            document.getElementById('audioSettingsBtnExercise'),
            document.getElementById('audioSettingsBtnPitchHold'),
            document.getElementById('audioSettingsBtnGlissando'),
            document.getElementById('audioSettingsBtnOctave'),
            document.getElementById('audioSettingsBtnScale'),
            document.getElementById('audioSettingsBtnToneSlide'),
            document.getElementById('audioSettingsBtnDarts'),
            document.getElementById('audioSettingsBtnOctaveFeelRoot'),
            document.getElementById('audioSettingsBtnHalfStepFeelRoot'),
            document.getElementById('audioSettingsBtnWholeStepFeelRoot'),
            document.getElementById('audioSettingsBtnMajorThirdFeelRoot'),
            document.getElementById('audioSettingsBtnPerfectFourthFeelRoot'),
            document.getElementById('audioSettingsBtnPerfectFifthFeelRoot'),
            document.getElementById('audioSettingsBtnMajorSixthFeelRoot'),
            document.getElementById('audioSettingsBtnMajorSeventhFeelRoot'),
            document.getElementById('audioSettingsBtnIntervalOverview'),
            document.getElementById('audioSettingsBtnGeneralIntervalOverview')
        ];

        this.attachEventListeners();
        this.loadDevices();
        this.loadSensitivitySettings();
    }

    attachEventListeners() {
        this.settingsBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.openModal());
            }
        });

        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.requestBtn.addEventListener('click', () => this.requestPermissions());
        this.testBtn.addEventListener('click', () => this.testAudio());

        if (this.showInstallBtn) {
            this.showInstallBtn.addEventListener('click', () => {
                this.closeModal();
                if (window.showInstallInstructions) {
                    window.showInstallInstructions();
                }
            });
        }

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Sensitivity settings
        if (this.sensitivityPreset) {
            this.sensitivityPreset.addEventListener('change', (e) => this.updateSensitivityPreset(e.target.value));
        }
        if (this.toleranceSelect) {
            this.toleranceSelect.addEventListener('change', (e) => this.updateTolerance(parseFloat(e.target.value)));
        }

        // Microphone gain control
        if (this.micGainSlider) {
            this.micGainSlider.addEventListener('input', (e) => this.updateMicGain(parseFloat(e.target.value)));
        }

        // Debug controls toggle
        if (this.debugControlsToggle) {
            this.debugControlsToggle.addEventListener('change', (e) => this.updateDebugControls(e.target.checked));
        }

        // Usage mode selection
        if (this.usageModeSelect) {
            this.usageModeSelect.addEventListener('change', (e) => this.updateUsageMode(e.target.value));
        }

        // Microphone device selection - save and change device
        if (this.micSelect) {
            this.micSelect.addEventListener('change', () => {
                this.changeSelectedMic();
            });
        }
    }

    loadSensitivitySettings() {
        const sensitivity = appSettings.getPitchSensitivity();
        const presets = Settings.getSensitivityPresets();

        if (this.sensitivityPreset) {
            this.sensitivityPreset.value = sensitivity.preset;
            const preset = presets[sensitivity.preset];
            if (preset && this.sensitivityDescription) {
                this.sensitivityDescription.textContent = preset.description;
            }
        }

        if (this.toleranceSelect) {
            this.toleranceSelect.value = sensitivity.tolerance.toString();
        }

        // Load microphone gain
        const gain = appSettings.getMicrophoneGain();
        if (this.micGainSlider) {
            this.micGainSlider.value = gain;
        }
        if (this.micGainValue) {
            this.micGainValue.textContent = `${gain.toFixed(1)}x`;
        }

        // Load debug controls state
        const debugEnabled = appSettings.getDebugControlsEnabled();
        if (this.debugControlsToggle) {
            this.debugControlsToggle.checked = debugEnabled;
        }
        if (this.debugControlsStatus) {
            this.debugControlsStatus.textContent = debugEnabled ? 'On' : 'Off';
        }

        // Apply visibility on load
        this.applyDebugControlsVisibility();

        // Load usage mode
        const usageMode = appSettings.getUsageMode();
        if (this.usageModeSelect) {
            this.usageModeSelect.value = usageMode;
        }
        this.updateUsageModeDescription(usageMode);
    }

    updateSensitivityPreset(preset) {
        const presets = Settings.getSensitivityPresets();
        const presetConfig = presets[preset];

        if (presetConfig && this.sensitivityDescription) {
            this.sensitivityDescription.textContent = presetConfig.description;
        }

        appSettings.setSensitivityPreset(preset);

        // Reload settings in pitch hold exercise if it exists
        if (window.pitchHoldExercise) {
            window.pitchHoldExercise.loadSensitivitySettings();
        }
    }

    updateTolerance(tolerance) {
        appSettings.setTolerance(tolerance);

        // Reload settings in pitch hold exercise if it exists
        if (window.pitchHoldExercise) {
            window.pitchHoldExercise.loadSensitivitySettings();
        }
    }

    updateMicGain(gain) {
        // Update display
        if (this.micGainValue) {
            this.micGainValue.textContent = `${gain.toFixed(1)}x`;
        }

        // Update AudioManager directly
        if (window.audioManager) {
            window.audioManager.setGain(gain);
        }

        // Save to settings
        appSettings.setMicrophoneGain(gain);
    }

    updateDebugControls(enabled) {
        // Update status text
        if (this.debugControlsStatus) {
            this.debugControlsStatus.textContent = enabled ? 'On' : 'Off';
        }

        // Save to settings
        appSettings.setDebugControlsEnabled(enabled);

        // Update visibility immediately
        this.applyDebugControlsVisibility();
    }

    applyDebugControlsVisibility() {
        const enabled = appSettings.getDebugControlsEnabled();

        // Show/hide debug button
        const debugBtn = document.getElementById('debugBtn');
        if (debugBtn) {
            debugBtn.style.display = enabled ? 'block' : 'none';
        }

        // Show/hide diagnostics exercise card
        const diagnosticsCard = document.querySelector('[data-exercise="diagnostics"]');
        if (diagnosticsCard) {
            diagnosticsCard.style.display = enabled ? 'block' : 'none';
        }
    }

    updateUsageMode(mode) {
        appSettings.setUsageMode(mode);
        this.updateUsageModeDescription(mode);

        // Update exercise card states
        if (window.mainApp) {
            window.mainApp.updateExerciseStates();
        }
    }

    updateUsageModeDescription(mode) {
        const modes = Settings.getUsageModes();
        const modeConfig = modes[mode];
        if (modeConfig && this.usageModeDescription) {
            this.usageModeDescription.textContent = modeConfig.description;
        }
    }

    async changeSelectedMic() {
        const deviceId = this.micSelect.value;

        // Update AudioManager to use new device
        if (window.audioManager && window.audioManager.isInitialized) {
            try {
                await window.audioManager.changeDevice(deviceId);
                console.log('Audio device changed to:', deviceId);
            } catch (error) {
                console.error('Failed to change audio device:', error);
            }
        } else {
            // Not initialized yet, just save preference
            appSettings.setSelectedMicrophone(deviceId);
        }
    }

    getSelectedMicId() {
        return this.micSelect.value;
    }

    openModal() {
        this.modal.style.display = 'flex';
        this.loadDevices();
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    async requestPermissions() {
        try {
            await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            alert('Microphone access granted!');
            this.loadDevices();
        } catch (error) {
            alert('Microphone access denied. Please enable it in your browser settings.');
        }
    }

    async loadDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            // Filter audio devices
            const mics = devices.filter(d => d.kind === 'audioinput');
            const speakers = devices.filter(d => d.kind === 'audiooutput');

            // Get saved microphone preference
            const savedMicId = appSettings.getSelectedMicrophone();

            // Populate microphone dropdown
            this.micSelect.innerHTML = '';
            if (mics.length === 0) {
                this.micSelect.innerHTML = '<option>No microphones found</option>';
            } else {
                mics.forEach((mic, index) => {
                    const option = document.createElement('option');
                    option.value = mic.deviceId;
                    option.textContent = mic.label || `Microphone ${index + 1}`;
                    this.micSelect.appendChild(option);
                });

                // Restore saved selection
                if (savedMicId && mics.some(m => m.deviceId === savedMicId)) {
                    this.micSelect.value = savedMicId;
                }
            }

            // Populate speaker dropdown
            this.speakerSelect.innerHTML = '';
            if (speakers.length === 0) {
                this.speakerSelect.innerHTML = '<option>No speakers found</option>';
            } else {
                speakers.forEach((speaker, index) => {
                    const option = document.createElement('option');
                    option.value = speaker.deviceId;
                    option.textContent = speaker.label || `Speaker ${index + 1}`;
                    this.speakerSelect.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Error loading devices:', error);
            this.micSelect.innerHTML = '<option>Error loading devices</option>';
            this.speakerSelect.innerHTML = '<option>Error loading devices</option>';
        }
    }

    async testAudio() {
        const toneGen = new ToneGenerator();
        toneGen.playTone(440, 0.3); // A4 note
        setTimeout(() => toneGen.stopTone(), 1000);
    }

    getSelectedMicId() {
        return this.micSelect.value;
    }

    getSelectedSpeakerId() {
        return this.speakerSelect.value;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.audioSettings = new AudioSettings();
    });
} else {
    window.audioSettings = new AudioSettings();
}
