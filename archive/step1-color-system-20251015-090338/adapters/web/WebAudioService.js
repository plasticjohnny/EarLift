/**
 * Web Audio Service Implementation
 * Implements IAudioService using Web Audio API
 */
class WebAudioService {
    constructor(storageService) {
        this.storageService = storageService;

        this.audioContext = null;
        this.micStream = null;
        this.gainNode = null;
        this.analyser = null;
        this.currentGain = 4.0; // Default gain
        this.selectedDeviceId = null;
        this.initialized = false;

        // Tone generation
        this.currentOscillator = null;
        this.currentGainNode = null;
    }

    async initialize() {
        if (this.initialized && this.audioContext && this.micStream) {
            console.log('WebAudioService: Already initialized');
            return true;
        }

        try {
            // Load saved settings
            this.selectedDeviceId = this.storageService ? this.storageService.get('selectedMicrophone') : null;
            this.currentGain = this.storageService ? (this.storageService.get('microphoneGain') || 4.0) : 4.0;

            // Get available devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');

            // Auto-select Bluetooth/AirPods if no preference saved
            if (!this.selectedDeviceId && audioInputs.length > 0) {
                const bluetoothDevice = audioInputs.find(d =>
                    d.label.toLowerCase().includes('airpod') ||
                    d.label.toLowerCase().includes('bluetooth') ||
                    d.label.toLowerCase().includes('headset') ||
                    d.label.toLowerCase().includes('wireless')
                );

                if (bluetoothDevice) {
                    this.selectedDeviceId = bluetoothDevice.deviceId;
                    if (this.storageService) {
                        this.storageService.set('selectedMicrophone', this.selectedDeviceId);
                    }
                    console.log('WebAudioService: Auto-selected Bluetooth device:', bluetoothDevice.label);
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
                console.log('WebAudioService: Using microphone:', deviceName);
            }

            // Create audio context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({
                latencyHint: 'interactive'
            });

            console.log('WebAudioService: Audio context sample rate:', this.audioContext.sampleRate);

            // Resume context if suspended (iOS)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create analyser
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

            this.initialized = true;
            console.log('WebAudioService: Initialized successfully');
            return true;

        } catch (error) {
            console.error('WebAudioService: Initialization failed:', error);
            throw new Error('Failed to access microphone. Please check your audio settings and permissions.');
        }
    }

    async initializePlaybackOnly() {
        if (this.audioContext) {
            console.log('WebAudioService: AudioContext already exists');
            return true;
        }

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({
                latencyHint: 'interactive'
            });

            console.log('WebAudioService: AudioContext initialized for playback only');
            console.log('WebAudioService: Sample rate:', this.audioContext.sampleRate);

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            return true;
        } catch (error) {
            console.error('WebAudioService: Failed to initialize AudioContext:', error);
            throw new Error('Failed to initialize audio playback.');
        }
    }

    getAudioContext() {
        return this.audioContext;
    }

    getAnalyser() {
        return this.analyser;
    }

    getSampleRate() {
        return this.audioContext ? this.audioContext.sampleRate : 0;
    }

    getFFTSize() {
        return this.analyser ? this.analyser.fftSize : 0;
    }

    getTimeDomainData(buffer) {
        if (this.analyser) {
            this.analyser.getFloatTimeDomainData(buffer);
        }
    }

    getFrequencyData(buffer) {
        if (this.analyser) {
            this.analyser.getFloatFrequencyData(buffer);
        }
    }

    setMicrophoneGain(gain) {
        this.currentGain = Math.max(0.1, Math.min(5.0, gain));
        if (this.gainNode) {
            this.gainNode.gain.value = this.currentGain;
        }
        if (this.storageService) {
            this.storageService.set('microphoneGain', this.currentGain);
        }
    }

    getMicrophoneGain() {
        return this.currentGain;
    }

    async changeMicrophone(deviceId) {
        console.log('WebAudioService: Changing device to:', deviceId);

        // Stop current stream
        this.stop();

        // Update selected device
        this.selectedDeviceId = deviceId;
        if (this.storageService) {
            this.storageService.set('selectedMicrophone', deviceId);
        }

        // Reinitialize with new device
        await this.initialize();
    }

    async getAvailableMicrophones() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices
                .filter(d => d.kind === 'audioinput')
                .map(d => ({
                    id: d.deviceId,
                    label: d.label || `Microphone ${d.deviceId.substring(0, 8)}`
                }));
        } catch (error) {
            console.error('WebAudioService: Failed to enumerate devices:', error);
            return [];
        }
    }

    playTone(frequency, duration = 0, volume = 0.5) {
        if (!this.audioContext) {
            console.warn('WebAudioService: Cannot play tone, audio context not initialized');
            return null;
        }

        // Stop any existing tone
        this.stopTone();

        // Create oscillator
        this.currentOscillator = this.audioContext.createOscillator();
        this.currentOscillator.type = 'sine';
        this.currentOscillator.frequency.value = frequency;

        // Create gain for volume control
        this.currentGainNode = this.audioContext.createGain();
        this.currentGainNode.gain.value = volume;

        // Connect: oscillator -> gain -> destination
        this.currentOscillator.connect(this.currentGainNode);
        this.currentGainNode.connect(this.audioContext.destination);

        // Start
        this.currentOscillator.start();

        // Auto-stop if duration specified
        if (duration > 0) {
            setTimeout(() => this.stopTone(), duration * 1000);
        }

        return { oscillator: this.currentOscillator, gainNode: this.currentGainNode };
    }

    stopTone() {
        if (this.currentOscillator) {
            try {
                this.currentOscillator.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentOscillator = null;
        }
        if (this.currentGainNode) {
            this.currentGainNode.disconnect();
            this.currentGainNode = null;
        }
    }

    stop() {
        console.log('WebAudioService: Stopping');

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

        this.initialized = false;
    }

    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    isInitialized() {
        return this.initialized;
    }

    // Web-specific helper: Get microphone stream (for diagnostics)
    getMicrophoneStream() {
        return this.micStream;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebAudioService;
}
