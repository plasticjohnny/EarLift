// Mic Diagnostics Exercise - Test and debug pitch detection issues
class AudioDiagnostics {
    constructor() {
        this.pitchDetector = null; // Will use shared pitch detector from audioManager
        this.toneGenerator = new ToneGenerator();
        this.isRunning = false;
        this.currentTest = null;
        this.testResults = [];
        this.detectionInterval = null;
        this.waveformCanvas = null;
        this.waveformCtx = null;

        // Data collection
        this.rmsHistory = [];
        this.pitchHistory = [];
        this.maxHistoryLength = 100;
        this.detailedLog = []; // Store detailed diagnostic information

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById('audioDiagnostics');
        this.waveformCanvas = document.getElementById('diagWaveform');
        this.waveformCtx = this.waveformCanvas ? this.waveformCanvas.getContext('2d') : null;
        this.spectrumCanvas = document.getElementById('diagSpectrum');
        this.spectrumCtx = this.spectrumCanvas ? this.spectrumCanvas.getContext('2d') : null;

        // Test buttons
        this.testSpeechBtn = document.getElementById('diagTestSpeech');
        this.testSingingBtn = document.getElementById('diagTestSinging');
        this.testToneBtn = document.getElementById('diagTestTone');
        this.stopTestBtn = document.getElementById('diagStopTest');

        // Displays
        this.currentTestDisplay = document.getElementById('diagCurrentTest');
        this.rmsDisplay = document.getElementById('diagRMS');
        this.rmsThresholdDisplay = document.getElementById('diagRMSThreshold');
        this.pitchDisplay = document.getElementById('diagPitch');
        this.clippingDisplay = document.getElementById('diagClipping');
        this.bufferSizeDisplay = document.getElementById('diagBufferSize');
        this.fftSizeDisplay = document.getElementById('diagFFTSize');
        this.processingDisplay = document.getElementById('diagProcessing');
        this.detectionMethodDisplay = document.getElementById('diagMethod');
        this.fftFreqDisplay = document.getElementById('diagFFTFreq');
        this.autocorrFreqDisplay = document.getElementById('diagAutocorrFreq');
        this.fftConfidenceDisplay = document.getElementById('diagFFTConfidence');
        this.fftThresholdDisplay = document.getElementById('diagFFTThreshold');
        this.smoothingDisplay = document.getElementById('diagSmoothing');
        this.micGainDisplay = document.getElementById('diagMicGain');

        // Results
        this.resultsContainer = document.getElementById('diagResults');
        this.copyLogBtn = document.getElementById('diagCopyLog');

        // Exit button
        this.exitBtn = document.getElementById('exitDiagnostics');
    }

    attachEventListeners() {
        this.testSpeechBtn.addEventListener('click', () => this.startTest('speech'));
        this.testSingingBtn.addEventListener('click', () => this.startTest('singing'));
        this.testToneBtn.addEventListener('click', () => this.startTest('tone'));
        this.stopTestBtn.addEventListener('click', () => this.stopTest());
        this.exitBtn.addEventListener('click', () => this.exit());

        if (this.copyLogBtn) {
            this.copyLogBtn.addEventListener('click', () => this.copyLogToClipboard());
        }
    }

    async start() {
        // Show exercise
        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';

        // Reset
        this.testResults = [];
        this.updateResultsDisplay();
        this.currentTestDisplay.textContent = 'None';

        // Initialize audio manager and use shared pitch detector
        try {
            console.log('Mic Diagnostics: Initializing audio manager...');

            // Initialize audio manager (creates microphone stream and shared pitch detector)
            await window.audioManager.initialize();

            console.log('Mic Diagnostics: Audio manager initialized');
            console.log('Mic Diagnostics: audioManager.pitchDetector =', window.audioManager.pitchDetector);

            // Use the shared pitch detector
            this.pitchDetector = window.audioManager.pitchDetector;
            if (!this.pitchDetector) {
                throw new Error('Shared pitch detector not available');
            }

            console.log('Mic Diagnostics: Using shared pitch detector');

            // Display audio configuration
            const analyser = window.audioManager.getAnalyser();
            if (analyser) {
                this.bufferSizeDisplay.textContent = analyser.fftSize;
                this.fftSizeDisplay.textContent = analyser.fftSize;

                // Display smoothing time constant
                if (this.smoothingDisplay) {
                    this.smoothingDisplay.textContent = analyser.smoothingTimeConstant.toFixed(2);
                }
            } else {
                this.bufferSizeDisplay.textContent = 'N/A';
                this.fftSizeDisplay.textContent = 'N/A';
                if (this.smoothingDisplay) {
                    this.smoothingDisplay.textContent = 'N/A';
                }
            }

            // Display current microphone gain
            if (this.micGainDisplay && window.audioManager) {
                const currentGain = window.audioManager.getGain();
                this.micGainDisplay.textContent = currentGain.toFixed(1) + 'x';
            }

            // Check if audio processing is disabled
            const stream = window.audioManager ? window.audioManager.micStream : null;
            if (stream) {
                const tracks = stream.getAudioTracks();
                if (tracks.length > 0) {
                    const settings = tracks[0].getSettings();
                    const processing = [];
                    if (settings.echoCancellation) processing.push('Echo Cancellation');
                    if (settings.autoGainControl) processing.push('Auto Gain Control');
                    if (settings.noiseSuppression) processing.push('Noise Suppression');

                    if (processing.length === 0) {
                        this.processingDisplay.textContent = 'All Disabled ✓';
                        this.processingDisplay.style.color = 'var(--neon-green)';
                    } else {
                        this.processingDisplay.textContent = processing.join(', ');
                        this.processingDisplay.style.color = 'var(--neon-orange)';
                    }
                }
            }

            // Enable diagnostics logging
            this.pitchDetector.enableDiagnostics((data) => {
                this.handleDiagnosticData(data);
            });

        } catch (error) {
            alert(error.message);
            this.exit();
        }
    }

    startTest(testType) {
        this.currentTest = testType;
        this.currentTestDisplay.textContent = testType.charAt(0).toUpperCase() + testType.slice(1);
        this.rmsHistory = [];
        this.pitchHistory = [];
        this.detailedLog = [];
        this.testStartTime = Date.now();

        // Start detection loop
        this.isRunning = true;
        this.detectionInterval = setInterval(() => {
            this.updateDiagnostics();
        }, 50); // 20 Hz

        // Update UI
        this.testSpeechBtn.disabled = true;
        this.testSingingBtn.disabled = true;
        this.testToneBtn.disabled = true;
        this.stopTestBtn.disabled = false;

        // If tone test, play a reference tone
        if (testType === 'tone') {
            const vocalRange = appSettings.getVocalRange();
            const MIN_FREQUENCY = 174.61;
            const lowFreq = Math.max(vocalRange.low.frequency, MIN_FREQUENCY);
            const highFreq = vocalRange.high.frequency;
            const targetFreq = this.toneGenerator.getRandomFrequencyInRange(lowFreq, highFreq);

            this.addResult(`Playing reference tone: ${targetFreq.toFixed(2)} Hz`);
            this.toneGenerator.playTone(targetFreq);

            // Stop tone after 5 seconds
            setTimeout(() => {
                if (this.currentTest === 'tone') {
                    this.toneGenerator.stopTone();
                    this.addResult('Reference tone stopped. Continue singing the pitch...');
                }
            }, 5000);
        }

        this.addResult(`Started ${testType} test. Instructions:`);
        if (testType === 'speech') {
            this.addResult('→ Talk normally, say anything. Count numbers, recite alphabet, etc.');
            this.addResult('→ Watch if RMS stays above threshold and pitch is detected.');
        } else if (testType === 'singing') {
            this.addResult('→ Sing a steady note (any comfortable pitch) for 5-10 seconds.');
            this.addResult('→ Watch if RMS drops below threshold or pitch detection fails.');
        } else if (testType === 'tone') {
            this.addResult('→ Listen to the 5-second tone, then match it with your voice.');
            this.addResult('→ Try to sustain the pitch as steadily as possible.');
        }
    }

    stopTest() {
        this.isRunning = false;

        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        this.toneGenerator.stopTone();

        // Analyze results
        this.analyzeTestResults();

        // Reset UI
        this.currentTest = null;
        this.currentTestDisplay.textContent = 'None';
        this.testSpeechBtn.disabled = false;
        this.testSingingBtn.disabled = false;
        this.testToneBtn.disabled = false;
        this.stopTestBtn.disabled = true;
    }

    updateDiagnostics() {
        if (!this.isRunning) return;

        // Check if pitch detector is available
        if (!this.pitchDetector) {
            console.error('Mic Diagnostics: Pitch detector not available');
            this.addResult('ERROR: Pitch detector not initialized. Please restart exercise.');
            this.stopTest();
            return;
        }

        const timestamp = Date.now();
        const pitch = this.pitchDetector.detectPitch();
        const rms = this.pitchDetector.getRMS();
        const volume = this.pitchDetector.getVolume();
        const isClipping = this.pitchDetector.isClipping();

        // Get comparison data for troubleshooting
        const fftOnly = this.pitchDetector.detectPitchFFT();
        const analyser = window.audioManager.getAnalyser();
        const audioContext = window.audioManager.getAudioContext();
        let autocorrOnly = null;
        if (analyser && audioContext && this.pitchDetector.buffer) {
            autocorrOnly = this.pitchDetector.autoCorrelate(this.pitchDetector.buffer, audioContext.sampleRate);
        }

        // Collect detailed diagnostic data
        const logEntry = {
            timestamp: timestamp - (this.testStartTime || timestamp),
            testType: this.currentTest,
            // Detection results
            detectedPitch: pitch ? {
                frequency: pitch.frequency,
                note: pitch.note,
                cents: pitch.cents,
                method: pitch.method,
                fftFrequency: pitch.fftFrequency,
                fftConfidence: pitch.fftConfidence
            } : null,
            // Individual method results
            fftOnly: fftOnly ? {
                frequency: fftOnly.frequency,
                confidence: fftOnly.confidence,
                passedThreshold: fftOnly.passedThreshold,
                threshold: fftOnly.threshold
            } : {
                rejectionReason: this.pitchDetector.lastRejectionReason || 'Unknown'
            },
            autocorrOnly: autocorrOnly ? {
                frequency: autocorrOnly.frequency > 0 ? autocorrOnly.frequency : null,
                rms: autocorrOnly.rms
            } : null,
            // Signal metrics
            rms: rms,
            volume: volume,
            isClipping: isClipping,
            // System info
            sampleRate: audioContext ? audioContext.sampleRate : null,
            fftSize: analyser ? analyser.fftSize : null,
            smoothing: analyser ? analyser.smoothingTimeConstant : null
        };

        this.detailedLog.push(logEntry);

        // Update displays
        this.rmsDisplay.textContent = rms.toFixed(6);

        // Add visual warning for low RMS
        if (rms < 0.01 && rms > 0.0001) {
            this.rmsDisplay.style.color = 'var(--neon-orange)';
            this.rmsDisplay.title = 'Signal is very low - increase gain or sing louder';
        } else if (rms <= 0.0001) {
            this.rmsDisplay.style.color = 'var(--neon-red)';
            this.rmsDisplay.title = 'Signal too low to detect - increase gain significantly';
        } else {
            this.rmsDisplay.style.color = 'var(--neon-green)';
            this.rmsDisplay.title = '';
        }

        this.clippingDisplay.textContent = isClipping ? 'YES ⚠' : 'No';
        this.clippingDisplay.style.color = isClipping ? 'var(--neon-red)' : 'var(--neon-green)';

        if (pitch && pitch.frequency > 0) {
            this.pitchDisplay.textContent = `${pitch.frequency.toFixed(2)} Hz (${pitch.note})`;
            this.pitchDisplay.style.color = 'var(--neon-green)';
            this.pitchHistory.push({ time: Date.now(), freq: pitch.frequency, rms, method: pitch.method });

            // Show detection method
            if (this.detectionMethodDisplay) {
                const methodName = pitch.method || 'unknown';
                this.detectionMethodDisplay.textContent = methodName.toUpperCase();
                if (methodName === 'hybrid') {
                    this.detectionMethodDisplay.style.color = 'var(--neon-green)';
                } else if (methodName === 'fft-only') {
                    this.detectionMethodDisplay.style.color = 'var(--neon-cyan)';
                } else {
                    this.detectionMethodDisplay.style.color = 'var(--neon-yellow)';
                }
            }
        } else {
            this.pitchDisplay.textContent = 'Not detected';
            this.pitchDisplay.style.color = 'var(--neon-orange)';
            this.pitchHistory.push({ time: Date.now(), freq: null, rms });

            if (this.detectionMethodDisplay) {
                this.detectionMethodDisplay.textContent = 'NONE';
                this.detectionMethodDisplay.style.color = 'var(--neon-red)';
            }
        }

        // Show comparison data
        if (this.fftFreqDisplay) {
            if (fftOnly && fftOnly.frequency) {
                this.fftFreqDisplay.textContent = `${fftOnly.frequency.toFixed(2)} Hz`;
                this.fftFreqDisplay.style.color = 'var(--neon-cyan)';
            } else {
                this.fftFreqDisplay.textContent = 'Not detected';
                this.fftFreqDisplay.style.color = 'var(--neon-red)';
            }
        }

        if (this.autocorrFreqDisplay) {
            if (autocorrOnly && autocorrOnly.frequency > 0) {
                this.autocorrFreqDisplay.textContent = `${autocorrOnly.frequency.toFixed(2)} Hz`;
                this.autocorrFreqDisplay.style.color = 'var(--neon-cyan)';
            } else {
                this.autocorrFreqDisplay.textContent = 'Not detected';
                this.autocorrFreqDisplay.style.color = 'var(--neon-red)';
            }
        }

        // Show FFT confidence and threshold
        if (this.fftConfidenceDisplay && fftOnly) {
            if (fftOnly.confidence !== undefined) {
                this.fftConfidenceDisplay.textContent = `${fftOnly.confidence.toFixed(1)} dB`;
                if (fftOnly.passedThreshold) {
                    this.fftConfidenceDisplay.style.color = 'var(--neon-green)';
                } else {
                    this.fftConfidenceDisplay.style.color = 'var(--neon-red)';
                }
            } else {
                this.fftConfidenceDisplay.textContent = '--';
            }
        }

        if (this.fftThresholdDisplay && fftOnly) {
            if (fftOnly.threshold !== undefined) {
                this.fftThresholdDisplay.textContent = `${fftOnly.threshold.toFixed(0)} dB`;
            } else {
                this.fftThresholdDisplay.textContent = '--';
            }
        }

        // Store RMS history
        this.rmsHistory.push({ time: Date.now(), rms, volume });

        // Trim history
        if (this.rmsHistory.length > this.maxHistoryLength) {
            this.rmsHistory.shift();
        }
        if (this.pitchHistory.length > this.maxHistoryLength) {
            this.pitchHistory.shift();
        }

        // Draw waveform and spectrum
        this.drawWaveform();
        this.drawSpectrum();
    }

    handleDiagnosticData(data) {
        if (data.type === 'autocorrelate') {
            this.rmsThresholdDisplay.textContent = data.rmsThreshold.toFixed(6);

            // Update RMS display color based on threshold
            if (data.belowThreshold) {
                this.rmsDisplay.style.color = 'var(--neon-red)';
            } else {
                this.rmsDisplay.style.color = 'var(--neon-green)';
            }
        }
    }

    drawWaveform() {
        if (!this.waveformCanvas || !this.waveformCtx) return;

        const waveformData = this.pitchDetector.getWaveformData();
        if (!waveformData) return;

        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        const ctx = this.waveformCtx;

        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Draw waveform
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = width / waveformData.length;
        let x = 0;

        for (let i = 0; i < waveformData.length; i++) {
            const v = (waveformData[i] + 1) / 2; // Normalize to 0-1
            const y = v * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.stroke();

        // Draw zero line
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Draw clipping indicators
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.01);
        ctx.lineTo(width, height * 0.01);
        ctx.moveTo(0, height * 0.99);
        ctx.lineTo(width, height * 0.99);
        ctx.stroke();
    }

    drawSpectrum() {
        if (!this.spectrumCanvas || !this.spectrumCtx) return;

        const analyser = window.audioManager.getAnalyser();
        if (!analyser) return;

        const width = this.spectrumCanvas.width;
        const height = this.spectrumCanvas.height;
        const ctx = this.spectrumCtx;

        // Get frequency data
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        analyser.getFloatFrequencyData(dataArray);

        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Calculate frequency range to display (50 Hz to 2000 Hz)
        const sampleRate = window.audioManager.getAudioContext().sampleRate;
        const nyquist = sampleRate / 2;
        const minBin = Math.floor((50 / nyquist) * bufferLength);
        const maxBin = Math.ceil((2000 / nyquist) * bufferLength);
        const displayBins = maxBin - minBin;

        // Draw spectrum
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const barWidth = width / displayBins;

        for (let i = 0; i < displayBins; i++) {
            const binIndex = minBin + i;
            const value = dataArray[binIndex];

            // Map dB range (-100 to 0) to canvas height
            const normalizedValue = (value + 100) / 100;
            const barHeight = normalizedValue * height;
            const x = i * barWidth;
            const y = height - barHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Draw frequency labels
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText('50 Hz', 5, height - 5);
        ctx.fillText('500 Hz', width / 2 - 20, height - 5);
        ctx.fillText('2000 Hz', width - 50, height - 5);

        // Draw dB scale
        ctx.fillText('0 dB', 5, 15);
        ctx.fillText('-50 dB', 5, height / 2);
        ctx.fillText('-100 dB', 5, height - 15);

        // Draw threshold line
        const threshold = -100; // Current FFT threshold
        const thresholdY = height - ((threshold + 100) / 100) * height;
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, thresholdY);
        ctx.lineTo(width, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff00ff';
        ctx.fillText('Threshold', width - 70, thresholdY - 5);
    }

    analyzeTestResults() {
        if (this.pitchHistory.length === 0) {
            this.addResult('⚠ No data collected during test.');
            return;
        }

        const totalSamples = this.pitchHistory.length;
        const detectedSamples = this.pitchHistory.filter(p => p.freq !== null).length;
        const detectionRate = (detectedSamples / totalSamples) * 100;

        const avgRMS = this.rmsHistory.reduce((sum, r) => sum + r.rms, 0) / this.rmsHistory.length;
        const maxRMS = Math.max(...this.rmsHistory.map(r => r.rms));
        const minRMS = Math.min(...this.rmsHistory.map(r => r.rms));

        this.addResult('─────────────────────────────');
        this.addResult(`Test Results for ${this.currentTest}:`);
        this.addResult(`Detection Rate: ${detectionRate.toFixed(1)}%`);
        this.addResult(`Samples: ${detectedSamples}/${totalSamples}`);
        this.addResult(`RMS Average: ${avgRMS.toFixed(6)}`);
        this.addResult(`RMS Range: ${minRMS.toFixed(6)} - ${maxRMS.toFixed(6)}`);

        // Analyze patterns
        if (detectionRate < 50) {
            this.addResult('⚠ LOW DETECTION RATE');
            this.addResult('→ Possible Issue: RMS threshold too high');
            this.addResult('→ Possible Issue: Autocorrelation failing on sustained tones');
            this.addResult('→ Try increasing microphone gain');
        }

        if (avgRMS < 0.001) {
            this.addResult('⚠ RMS VERY LOW');
            this.addResult('→ Possible Issue: Microphone gain too low');
            this.addResult('→ Possible Issue: Wrong microphone selected');
            this.addResult('→ Try speaking/singing louder or increase gain');
        }

        if (maxRMS >= 0.99) {
            this.addResult('⚠ CLIPPING DETECTED');
            this.addResult('→ Signal is too loud and distorting');
            this.addResult('→ Reduce microphone gain');
        }

        // Check for RMS dropoff pattern (singing issue)
        if (this.currentTest === 'singing') {
            const firstHalf = this.rmsHistory.slice(0, Math.floor(this.rmsHistory.length / 2));
            const secondHalf = this.rmsHistory.slice(Math.floor(this.rmsHistory.length / 2));

            const avgFirstHalf = firstHalf.reduce((sum, r) => sum + r.rms, 0) / firstHalf.length;
            const avgSecondHalf = secondHalf.reduce((sum, r) => sum + r.rms, 0) / secondHalf.length;

            if (avgSecondHalf < avgFirstHalf * 0.5) {
                this.addResult('⚠ RMS DROPOFF DETECTED');
                this.addResult('→ RMS decreased significantly during sustained singing');
                this.addResult('→ This suggests browser/OS AGC may still be active');
                this.addResult('→ Or autocorrelation is treating pure tone as noise');
            }
        }

        this.addResult('─────────────────────────────');
    }

    addResult(message) {
        this.testResults.push(message);
        this.updateResultsDisplay();
    }

    updateResultsDisplay() {
        if (!this.resultsContainer) return;

        // Keep only last 50 messages
        if (this.testResults.length > 50) {
            this.testResults.shift();
        }

        this.resultsContainer.innerHTML = this.testResults
            .map(msg => `<div class="diag-result-line">${msg}</div>`)
            .join('');

        // Auto-scroll to bottom
        this.resultsContainer.scrollTop = this.resultsContainer.scrollHeight;
    }

    async copyLogToClipboard() {
        if (this.detailedLog.length === 0) {
            alert('No diagnostic data collected yet. Run a test first.');
            return;
        }

        // Get system information
        const analyser = window.audioManager.getAnalyser();
        const audioContext = window.audioManager.getAudioContext();
        const stream = window.audioManager ? window.audioManager.micStream : null;

        let deviceInfo = 'N/A';
        if (stream) {
            const tracks = stream.getAudioTracks();
            if (tracks.length > 0) {
                deviceInfo = tracks[0].label || 'Unknown Device';
            }
        }

        // Create condensed log for token efficiency
        const detectedEntries = this.detailedLog.filter(l => l.detectedPitch !== null);
        const notDetectedEntries = this.detailedLog.filter(l => l.detectedPitch === null);

        // Frequency distribution analysis (for detected pitches)
        const frequencyMap = {};
        detectedEntries.forEach(entry => {
            const freq = Math.round(entry.detectedPitch.frequency);
            frequencyMap[freq] = (frequencyMap[freq] || 0) + 1;
        });

        // Get most common frequencies
        const topFrequencies = Object.entries(frequencyMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([freq, count]) => ({ frequency: parseInt(freq), count, note: this.pitchDetector.frequencyToNote(parseInt(freq)) }));

        // Detection method stats
        const methodStats = {
            hybrid: detectedEntries.filter(l => l.detectedPitch.method === 'hybrid').length,
            fftOnly: detectedEntries.filter(l => l.detectedPitch.method === 'fft-only').length,
            autocorrFallback: detectedEntries.filter(l => l.detectedPitch.method === 'autocorr-fallback').length,
            none: notDetectedEntries.length
        };

        // Rejection reason stats
        const rejectionReasons = {};
        notDetectedEntries.forEach(entry => {
            if (entry.fftOnly && entry.fftOnly.rejectionReason) {
                const reason = entry.fftOnly.rejectionReason;
                rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
            }
        });

        const logReport = {
            timestamp: new Date().toISOString(),
            testType: this.currentTest,
            systemInfo: {
                device: deviceInfo,
                sampleRate: audioContext ? audioContext.sampleRate : null,
                fftSize: analyser ? analyser.fftSize : null,
                smoothingTimeConstant: analyser ? analyser.smoothingTimeConstant : null,
                microphoneGain: window.audioManager ? window.audioManager.getGain() : null
            },
            summary: {
                totalSamples: this.detailedLog.length,
                detectedSamples: detectedEntries.length,
                detectionRate: ((detectedEntries.length / this.detailedLog.length) * 100).toFixed(1) + '%',
                avgRMS: (this.detailedLog.reduce((sum, l) => sum + l.rms, 0) / this.detailedLog.length).toFixed(6),
                maxRMS: Math.max(...this.detailedLog.map(l => l.rms)).toFixed(6),
                minRMS: Math.min(...this.detailedLog.map(l => l.rms)).toFixed(6),
                clippingOccurred: this.detailedLog.some(l => l.isClipping)
            },
            detectionMethods: methodStats,
            rejectionReasons: rejectionReasons,
            topDetectedFrequencies: topFrequencies,
            // Condensed samples: first 5 detected, first 5 not-detected, last 5 detected, last 5 not-detected
            sampleDetected: {
                first5: detectedEntries.slice(0, 5),
                last5: detectedEntries.slice(-5)
            },
            sampleNotDetected: {
                first5: notDetectedEntries.slice(0, 5),
                last5: notDetectedEntries.slice(-5)
            }
        };

        const logText = JSON.stringify(logReport, null, 2);

        try {
            await navigator.clipboard.writeText(logText);
            this.addResult('✓ Diagnostic log copied to clipboard!');
            this.addResult('→ Paste it back to analyze the issue.');

            // Also update button text temporarily
            if (this.copyLogBtn) {
                const originalText = this.copyLogBtn.textContent;
                this.copyLogBtn.textContent = '✓ Copied!';
                this.copyLogBtn.style.background = 'rgba(0, 255, 0, 0.2)';
                setTimeout(() => {
                    this.copyLogBtn.textContent = originalText;
                    this.copyLogBtn.style.background = '';
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.addResult('⚠ Failed to copy to clipboard. Check console for log.');
            console.log('DIAGNOSTIC LOG:', logText);
        }
    }

    exit() {
        // Stop test
        if (this.isRunning) {
            this.stopTest();
        }

        // Cleanup
        this.pitchDetector.disableDiagnostics();
        this.pitchDetector.stop();
        this.toneGenerator.stopTone();

        // Stop microphone stream
        if (window.audioManager && window.audioManager.isInitialized) {
            window.audioManager.stop();
        }

        // Return to main app
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        if (window.mainApp) {
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize exercise
window.audioDiagnostics = new AudioDiagnostics();
