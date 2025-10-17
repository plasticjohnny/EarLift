// Centralized Audio Manager
// Handles all audio input/output, device selection, and routing
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.micStream = null;
        this.gainNode = null;
        this.analyser = null;
        this.currentGain = 4.0; // Default gain
        this.selectedDeviceId = null;
        this.isInitialized = false;
        this.pitchDetector = null; // Shared pitch detector for the whole app
    }

    // Initialize audio system with microphone and output
    async initialize() {
        if (this.isInitialized && this.audioContext && this.micStream) {
            console.log('AudioManager: Already initialized, reusing existing audio context');

            // Create shared pitch detector if it doesn't exist yet
            if (!this.pitchDetector && typeof PitchDetector !== 'undefined') {
                this.pitchDetector = new PitchDetector();
                await this.pitchDetector.initializeWithSharedAudio();
                console.log('AudioManager: Shared pitch detector created (late initialization)');
            }

            return true;
        }

        try {
            // Get saved microphone preference
            this.selectedDeviceId = appSettings.getSelectedMicrophone();
            this.currentGain = appSettings.getMicrophoneGain();

            // Get available devices to prioritize Bluetooth/AirPods
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');

            // Auto-select Bluetooth/AirPods if no preference saved
            if (!this.selectedDeviceId && audioInputs.length > 0) {
                // Prioritize Bluetooth devices
                const bluetoothDevice = audioInputs.find(d =>
                    d.label.toLowerCase().includes('airpod') ||
                    d.label.toLowerCase().includes('bluetooth') ||
                    d.label.toLowerCase().includes('headset') ||
                    d.label.toLowerCase().includes('wireless')
                );

                if (bluetoothDevice) {
                    this.selectedDeviceId = bluetoothDevice.deviceId;
                    appSettings.setSelectedMicrophone(this.selectedDeviceId);
                    console.log('AudioManager: Auto-selected Bluetooth device:', bluetoothDevice.label);
                }
            }

            // Request microphone access
            const constraints = {
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false,
                    sampleRate: { ideal: 48000 },
                    channelCount: { ideal: 1 }
                }
            };

            if (this.selectedDeviceId) {
                constraints.audio.deviceId = { exact: this.selectedDeviceId };
            }

            this.micStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Log which device we got
            const audioTracks = this.micStream.getAudioTracks();
            if (audioTracks.length > 0) {
                const deviceName = audioTracks[0].label || 'Unknown Device';
                console.log('AudioManager: Using microphone:', deviceName);

                // Update debug panel if available
                if (window.debugMode) {
                    window.debugMode.setMicrophoneInfo(deviceName, null);
                }
            }

            // Create shared audio context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({
                latencyHint: 'interactive'
            });

            console.log('AudioManager: Audio context sample rate:', this.audioContext.sampleRate);

            // Update debug panel with sample rate
            if (window.debugMode) {
                const deviceName = audioTracks.length > 0 ? audioTracks[0].label : 'Unknown';
                window.debugMode.setMicrophoneInfo(deviceName, this.audioContext.sampleRate);
            }

            // Resume context if suspended (iOS)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create analyser for pitch detection
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;
            this.analyser.smoothingTimeConstant = 0; // No smoothing for instant response

            // Create gain node
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.currentGain;

            // Connect: microphone -> gain -> analyser
            const source = this.audioContext.createMediaStreamSource(this.micStream);
            source.connect(this.gainNode);
            this.gainNode.connect(this.analyser);

            // Create shared pitch detector that uses this AudioManager
            if (!this.pitchDetector && typeof PitchDetector !== 'undefined') {
                this.pitchDetector = new PitchDetector();
                // Initialize it to use the shared audio manager
                await this.pitchDetector.initializeWithSharedAudio();
                console.log('AudioManager: Shared pitch detector created');
            }

            this.isInitialized = true;
            console.log('AudioManager: Initialized successfully');
            return true;

        } catch (error) {
            console.error('AudioManager: Initialization failed:', error);
            throw new Error('Failed to access microphone. Please check your audio settings and permissions.');
        }
    }

    // Initialize only AudioContext for playback (no microphone)
    async initializePlaybackOnly() {
        if (this.audioContext) {
            console.log('AudioManager: AudioContext already exists, reusing');
            return true;
        }

        try {
            // Create shared audio context (no microphone needed)
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({
                latencyHint: 'interactive'
            });

            console.log('AudioManager: AudioContext initialized for playback only');
            console.log('AudioManager: Audio context sample rate:', this.audioContext.sampleRate);

            // Resume context if suspended (iOS)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            return true;
        } catch (error) {
            console.error('AudioManager: Failed to initialize AudioContext:', error);
            throw new Error('Failed to initialize audio playback.');
        }
    }

    // Get the shared audio context (for ToneGenerator)
    getAudioContext() {
        return this.audioContext;
    }

    // Get the analyser node (for PitchDetector)
    getAnalyser() {
        return this.analyser;
    }

    // Set microphone gain
    setGain(gain) {
        this.currentGain = Math.max(0.1, Math.min(5.0, gain));
        if (this.gainNode) {
            this.gainNode.gain.value = this.currentGain;
        }
        appSettings.setMicrophoneGain(this.currentGain);
    }

    getGain() {
        return this.currentGain;
    }

    // Change microphone device
    async changeDevice(deviceId) {
        console.log('AudioManager: Changing device to:', deviceId);

        // Stop current stream
        this.stop();

        // Update selected device
        this.selectedDeviceId = deviceId;
        appSettings.setSelectedMicrophone(deviceId);

        // Reinitialize with new device
        await this.initialize();
    }

    // Stop audio system
    stop() {
        console.log('AudioManager: Stopping audio system');

        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }

        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isInitialized = false;
    }

    // Resume audio context (for iOS)
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
}

// Global singleton instance
window.audioManager = new AudioManager();
