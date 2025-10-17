// Debug Mode System
class DebugMode {
    constructor() {
        this.isEnabled = false;
        this.isMinimized = false;
        this.debugPanel = null;
        this.debugToggleBtn = null;
        this.targetFreqElement = null;
        this.targetNoteElement = null;
        this.detectedFreqElement = null;
        this.detectedNoteElement = null;
        this.stabilityElement = null;
        this.differenceElement = null;
        this.statusElement = null;

        this.currentTargetFreq = null;
        this.detectedFreq = null;
        this.detectedNote = null;
        this.stabilityScore = 0;
        this.recentPitches = [];
        this.maxRecentPitches = 10;

        this.monitoringInterval = null;

        this.createDebugPanel();
        this.createToggleButton();
        this.attachKeyboardShortcut();
    }

    createDebugPanel() {
        // Create debug panel HTML
        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.className = 'debug-panel';
        panel.style.display = 'none';

        panel.innerHTML = `
            <div class="debug-header">
                <h3>Mic Debug Mode</h3>
                <div class="debug-header-buttons">
                    <button id="minimizeDebugBtn" class="debug-minimize-btn">−</button>
                    <button id="closeDebugBtn" class="debug-close-btn">×</button>
                </div>
            </div>
            <div class="debug-content">
                <div class="debug-section">
                    <h4>Target Tone</h4>
                    <div class="debug-row">
                        <span class="debug-label">Note:</span>
                        <span id="debugTargetNote" class="debug-value">--</span>
                    </div>
                    <div class="debug-row">
                        <span class="debug-label">Frequency:</span>
                        <span id="debugTargetFreq" class="debug-value">-- Hz</span>
                    </div>
                </div>

                <div class="debug-section">
                    <h4>Detected Voice</h4>
                    <div class="debug-row">
                        <span class="debug-label">Note:</span>
                        <span id="debugDetectedNote" class="debug-value">--</span>
                    </div>
                    <div class="debug-row">
                        <span class="debug-label">Frequency:</span>
                        <span id="debugDetectedFreq" class="debug-value">-- Hz</span>
                    </div>
                </div>

                <div class="debug-section">
                    <h4>Analysis</h4>
                    <div class="debug-row">
                        <span class="debug-label">Difference:</span>
                        <span id="debugDifference" class="debug-value">-- cents</span>
                    </div>
                    <div class="debug-row">
                        <span class="debug-label">Stability:</span>
                        <span id="debugStability" class="debug-value debug-stability">--</span>
                    </div>
                    <div class="debug-row">
                        <span class="debug-label">Status:</span>
                        <span id="debugStatus" class="debug-value">--</span>
                    </div>
                </div>

                <div class="debug-section">
                    <h4>Microphone</h4>
                    <div class="debug-row">
                        <span class="debug-label">Device:</span>
                        <span id="debugMicDevice" class="debug-value" style="font-size: 0.7rem;">--</span>
                    </div>
                    <div class="debug-row">
                        <span class="debug-label">Sample Rate:</span>
                        <span id="debugSampleRate" class="debug-value">--</span>
                    </div>
                    <div class="debug-row">
                        <span class="debug-label">Volume:</span>
                        <div id="debugVolumeMeter" class="debug-volume-meter">
                            <div id="debugVolumeFill" class="debug-volume-fill"></div>
                        </div>
                        <span id="debugVolumeValue" class="debug-value" style="margin-left: 8px; min-width: 40px;">0%</span>
                    </div>
                    <div class="debug-row">
                        <span class="debug-label">Raw RMS:</span>
                        <span id="debugRMS" class="debug-value">--</span>
                    </div>
                    <div class="debug-row" style="margin-top: 10px;">
                        <span class="debug-label">Candidates:</span>
                    </div>
                    <div id="debugCandidates" class="debug-candidates">--</div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        this.debugPanel = panel;
        this.targetFreqElement = document.getElementById('debugTargetFreq');
        this.targetNoteElement = document.getElementById('debugTargetNote');
        this.detectedFreqElement = document.getElementById('debugDetectedFreq');
        this.detectedNoteElement = document.getElementById('debugDetectedNote');
        this.stabilityElement = document.getElementById('debugStability');
        this.differenceElement = document.getElementById('debugDifference');
        this.statusElement = document.getElementById('debugStatus');
        this.volumeFillElement = document.getElementById('debugVolumeFill');
        this.volumeValueElement = document.getElementById('debugVolumeValue');
        this.rmsElement = document.getElementById('debugRMS');
        this.candidatesElement = document.getElementById('debugCandidates');
        this.micDeviceElement = document.getElementById('debugMicDevice');
        this.sampleRateElement = document.getElementById('debugSampleRate');

        // Close button
        const closeBtn = document.getElementById('closeDebugBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.minimize());
        }

        // Minimize button
        const minimizeBtn = document.getElementById('minimizeDebugBtn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.minimize());
        }
    }

    createToggleButton() {
        // Create floating toggle button
        const btn = document.createElement('button');
        btn.id = 'debugToggleBtn';
        btn.className = 'debug-toggle-btn';
        btn.textContent = '🐛';
        btn.title = 'Toggle Debug Panel (Ctrl+Shift+D)';
        btn.style.display = 'none';

        btn.addEventListener('click', () => this.maximize());

        document.body.appendChild(btn);
        this.debugToggleBtn = btn;
    }

    attachKeyboardShortcut() {
        // Press Ctrl+Shift+D to toggle debug mode
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    enable() {
        this.isEnabled = true;
        this.isMinimized = true; // Start minimized
        if (this.debugPanel) {
            this.debugPanel.style.display = 'none'; // Start hidden
        }
        if (this.debugToggleBtn) {
            this.debugToggleBtn.style.display = 'block'; // Show toggle button
        }
        console.log('Debug mode enabled (minimized)');
    }

    disable() {
        this.isEnabled = false;
        this.isMinimized = false;
        if (this.debugPanel) {
            this.debugPanel.style.display = 'none';
        }
        if (this.debugToggleBtn) {
            this.debugToggleBtn.style.display = 'none';
        }
        console.log('Debug mode disabled');
    }

    minimize() {
        this.isMinimized = true;
        if (this.debugPanel) {
            this.debugPanel.style.display = 'none';
        }
        if (this.debugToggleBtn) {
            this.debugToggleBtn.style.display = 'block';
        }
        this.stopMonitoring();
        console.log('Debug mode minimized');
    }

    maximize() {
        this.isMinimized = false;
        this.isEnabled = true;
        if (this.debugPanel) {
            this.debugPanel.style.display = 'block';
        }
        if (this.debugToggleBtn) {
            this.debugToggleBtn.style.display = 'none';
        }
        this.startMonitoring();
        console.log('Debug mode maximized');
    }

    async startMonitoring() {
        // Stop any existing monitoring
        this.stopMonitoring();

        try {
            // Check if audioManager exists
            if (!window.audioManager) {
                console.error('AudioManager not available');
                return;
            }

            // Ensure audio is initialized (this will create the pitch detector)
            if (!window.audioManager.isInitialized) {
                console.log('Debug mode: Initializing AudioManager...');
                await window.audioManager.initialize();
            }

            // Check if pitch detector was created
            if (!window.audioManager.pitchDetector) {
                console.error('Pitch detector not created by AudioManager');
                return;
            }

            console.log('Debug mode: Using shared pitch detector');

            // Start monitoring loop using the shared pitch detector
            this.monitoringInterval = setInterval(() => {
                const pitchDetector = window.audioManager.pitchDetector;
                if (!pitchDetector) return;

                const pitch = pitchDetector.getCurrentPitch();
                const volume = pitchDetector.getVolume();
                const rms = pitchDetector.getRMS();

                if (pitch) {
                    this.updateDetectedPitch(pitch, volume, rms);
                } else {
                    this.updateDetectedPitch(null, volume, rms);
                }
            }, 50); // Update every 50ms

            console.log('Debug mode monitoring started');
        } catch (error) {
            console.error('Failed to start debug monitoring:', error);
        }
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('Debug mode monitoring stopped');
        }
    }

    toggle() {
        if (this.isMinimized) {
            this.maximize();
        } else if (this.isEnabled) {
            this.minimize();
        } else {
            this.enable();
        }
    }

    setTargetFrequency(frequency) {
        console.log(`DebugMode.setTargetFrequency called: ${frequency}Hz`);
        this.currentTargetFreq = frequency;
        if (this.targetFreqElement) {
            this.targetFreqElement.textContent = `${Math.round(frequency)} Hz`;
            console.log(`Updated targetFreqElement to: ${Math.round(frequency)} Hz`);
        } else {
            console.log('targetFreqElement is null');
        }
        if (this.targetNoteElement) {
            const note = this.frequencyToNote(frequency);
            this.targetNoteElement.textContent = note;
            console.log(`Updated targetNoteElement to: ${note}`);
        } else {
            console.log('targetNoteElement is null');
        }
    }

    clearTargetFrequency() {
        console.log('DebugMode.clearTargetFrequency called');
        this.currentTargetFreq = null;
        if (this.targetFreqElement) {
            this.targetFreqElement.textContent = '--';
        }
        if (this.targetNoteElement) {
            this.targetNoteElement.textContent = '--';
        }
    }

    updateVolume(volume) {
        if (this.volumeFillElement) {
            const percentage = Math.min(100, Math.max(0, volume));
            this.volumeFillElement.style.width = `${percentage}%`;

            // Update numeric value
            if (this.volumeValueElement) {
                this.volumeValueElement.textContent = `${percentage.toFixed(0)}%`;
            }

            // Color code volume level
            let color;
            if (percentage < 5) {
                color = 'var(--neon-orange)';
            } else if (percentage < 20) {
                color = 'var(--neon-yellow)';
            } else {
                color = 'var(--neon-green)';
            }

            this.volumeFillElement.style.backgroundColor = color;

            // Also color the text value
            if (this.volumeValueElement) {
                this.volumeValueElement.style.color = color;
            }
        }
    }

    updateDetectedPitch(pitch, volume, rms) {
        // Update volume meter
        if (volume !== undefined) {
            this.updateVolume(volume);
        }

        // Update raw RMS display
        if (rms !== undefined && this.rmsElement) {
            this.rmsElement.textContent = rms.toFixed(5);

            // Color code based on threshold (0.0005)
            if (rms < 0.0005) {
                this.rmsElement.style.color = 'var(--neon-orange)'; // Below threshold
            } else if (rms < 0.003) {
                this.rmsElement.style.color = 'var(--neon-yellow)'; // Above new threshold, below old
            } else {
                this.rmsElement.style.color = 'var(--neon-green)'; // Strong signal
            }
        }

        if (!pitch || !pitch.frequency) {
            this.detectedFreq = null;
            this.detectedNote = null;
            if (this.detectedFreqElement) {
                this.detectedFreqElement.textContent = '-- Hz';
            }
            if (this.detectedNoteElement) {
                this.detectedNoteElement.textContent = '--';
            }
            if (this.statusElement) {
                this.statusElement.textContent = 'No pitch detected';
                this.statusElement.className = 'debug-value debug-status-none';
            }

            // Show candidates even when no pitch is detected
            if (pitch && pitch.candidates && this.candidatesElement) {
                this.updateCandidates(pitch.candidates);
            }
            return;
        }

        // Update candidates display
        if (pitch.candidates && this.candidatesElement) {
            this.updateCandidates(pitch.candidates);
        }

        this.detectedFreq = pitch.frequency;
        this.detectedNote = pitch.note;

        // Update recent pitches for stability calculation
        this.recentPitches.push(pitch.frequency);
        if (this.recentPitches.length > this.maxRecentPitches) {
            this.recentPitches.shift();
        }

        // Calculate stability
        this.stabilityScore = this.calculateStability();

        // Update display
        if (this.detectedFreqElement) {
            this.detectedFreqElement.textContent = `${Math.round(pitch.frequency)} Hz`;
        }
        if (this.detectedNoteElement) {
            this.detectedNoteElement.textContent = pitch.note;
        }
        if (this.stabilityElement) {
            this.stabilityElement.textContent = `${this.stabilityScore.toFixed(1)}%`;

            // Color code stability
            if (this.stabilityScore >= 80) {
                this.stabilityElement.style.color = 'var(--neon-green)';
            } else if (this.stabilityScore >= 50) {
                this.stabilityElement.style.color = 'var(--neon-yellow)';
            } else {
                this.stabilityElement.style.color = 'var(--neon-orange)';
            }
        }

        // Calculate difference from target
        if (this.currentTargetFreq && this.differenceElement) {
            const cents = this.frequencyDifferenceInCents(this.currentTargetFreq, pitch.frequency);
            this.differenceElement.textContent = `${cents >= 0 ? '+' : ''}${cents.toFixed(1)} cents`;

            // Color code difference
            const absCents = Math.abs(cents);
            if (absCents <= 10) {
                this.differenceElement.style.color = 'var(--neon-green)';
            } else if (absCents <= 25) {
                this.differenceElement.style.color = 'var(--neon-yellow)';
            } else {
                this.differenceElement.style.color = 'var(--neon-orange)';
            }
        }

        // Update status
        if (this.statusElement && this.currentTargetFreq) {
            const tolerance = this.currentTargetFreq * 0.01; // 1% tolerance
            const diff = Math.abs(pitch.frequency - this.currentTargetFreq);

            if (diff <= tolerance) {
                this.statusElement.textContent = 'MATCHING';
                this.statusElement.className = 'debug-value debug-status-match';
            } else {
                const cents = this.frequencyDifferenceInCents(this.currentTargetFreq, pitch.frequency);
                if (cents > 0) {
                    this.statusElement.textContent = 'Too High';
                } else {
                    this.statusElement.textContent = 'Too Low';
                }
                this.statusElement.className = 'debug-value debug-status-off';
            }
        }
    }

    calculateStability() {
        if (this.recentPitches.length < 2) {
            return 0;
        }

        // Calculate average frequency
        const avg = this.recentPitches.reduce((a, b) => a + b, 0) / this.recentPitches.length;

        // Calculate standard deviation
        const variance = this.recentPitches.reduce((sum, freq) => {
            return sum + Math.pow(freq - avg, 2);
        }, 0) / this.recentPitches.length;
        const stdDev = Math.sqrt(variance);

        // Convert to stability percentage (lower std dev = higher stability)
        // Assume 5 Hz std dev = 0% stability, 0 Hz = 100% stability
        const maxStdDev = 10; // Hz
        const stabilityPercent = Math.max(0, Math.min(100, 100 - (stdDev / maxStdDev * 100)));

        return stabilityPercent;
    }

    frequencyToNote(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const halfSteps = 12 * Math.log2(frequency / A4);
        const noteIndex = Math.round(halfSteps) + 9; // A is 9th note in chromatic scale starting from C
        const octave = Math.floor((noteIndex + 3) / 12) + 4;
        const note = noteNames[((noteIndex % 12) + 12) % 12];
        return `${note}${octave}`;
    }

    frequencyDifferenceInCents(freq1, freq2) {
        return Math.round(1200 * Math.log2(freq2 / freq1) * 10) / 10;
    }

    updateCandidates(candidates) {
        if (!candidates || candidates.length === 0) {
            this.candidatesElement.textContent = '--';
            return;
        }

        // Display top 5 candidates with their frequencies
        const candidateText = candidates.map((c, i) =>
            `${i + 1}. ${c.freq}Hz`
        ).join(' | ');

        this.candidatesElement.textContent = candidateText;
        this.candidatesElement.style.fontSize = '0.7rem';
        this.candidatesElement.style.color = 'var(--text-secondary)';
    }

    setMicrophoneInfo(deviceName, sampleRate) {
        if (this.micDeviceElement) {
            this.micDeviceElement.textContent = deviceName || '--';

            // Highlight if it's the iPhone mic (likely wrong device)
            if (deviceName && deviceName.toLowerCase().includes('iphone')) {
                this.micDeviceElement.style.color = 'var(--neon-orange)';
            } else if (deviceName && (deviceName.toLowerCase().includes('airpod') || deviceName.toLowerCase().includes('headset'))) {
                this.micDeviceElement.style.color = 'var(--neon-green)';
            } else {
                this.micDeviceElement.style.color = 'var(--neon-cyan)';
            }
        }
        if (this.sampleRateElement) {
            this.sampleRateElement.textContent = sampleRate ? `${sampleRate} Hz` : '--';
        }
    }

    reset() {
        this.recentPitches = [];
        this.stabilityScore = 0;
        this.currentTargetFreq = null;
        this.detectedFreq = null;
        this.detectedNote = null;
    }
}

// Initialize debug mode
window.debugMode = new DebugMode();
// Enable by default as requested
window.debugMode.enable();
