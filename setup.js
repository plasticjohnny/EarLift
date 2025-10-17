// First-time Setup Experience
class SetupFlow {
    constructor() {
        this.pitchDetector = new PitchDetector();
        this.lowNote = null;
        this.highNote = null;
        this.isRecording = false;
        this.detectionInterval = null;
        this.stableReadings = [];
        this.requiredStableReadings = 2; // Very forgiving - just need consistency
        this.stableCount = 0;
        this.requiredStableCount = 1; // Show button quickly
        this.buttonShown = false; // Track if button has been shown

        // Track pitch held readings for low note (similar to high note)
        this.lowNoteHeldReadings = [];

        // Track lowest and highest stable pitches
        this.lowestStablePitch = null;
        this.highestStablePitch = null;

        // Track pitch held time for high note (0.25s requirement)
        this.highNoteHeldReadings = []; // Array of {frequency, note, timestamp}
        this.lastDisplayUpdate = 0; // Throttle display updates
        this.displayUpdateInterval = 300; // ms between display updates

        // Load sensitivity settings from appSettings
        this.sensitivityConfig = null;

        this.initializeElements();
        this.attachEventListeners();
        this.loadSensitivitySettings();
    }

    loadSensitivitySettings() {
        // Always use "Very Forgiving" preset for setup, regardless of user's settings
        const presets = Settings.getSensitivityPresets();
        const veryForgiving = presets['very-forgiving'];

        this.sensitivityConfig = {
            ...veryForgiving,
            tolerance: 0.08 // Very forgiving tolerance for setup (8%)
        };
        console.log('Setup: Using very forgiving sensitivity config:', this.sensitivityConfig);
    }

    initializeElements() {
        // Choice screen
        this.stepChoice = document.getElementById('setupStepChoice');
        this.chooseStandardRangeBtn = document.getElementById('chooseStandardRangeBtn');
        this.chooseCustomRangeBtn = document.getElementById('chooseCustomRangeBtn');

        // Standard range selection
        this.stepStandard = document.getElementById('setupStepStandard');
        this.standardRangeBtns = document.querySelectorAll('.standard-range-btn');
        this.backToChoiceBtn = document.getElementById('backToChoiceBtn');

        // Prompt screens
        this.promptLow = document.getElementById('setupPromptLow');
        this.promptHigh = document.getElementById('setupPromptHigh');
        this.startLowNoteBtn = document.getElementById('startLowNoteBtn');
        this.startHighNoteBtn = document.getElementById('startHighNoteBtn');
        this.cancelPromptLowBtn = document.getElementById('cancelPromptLowBtn');
        this.cancelPromptHighBtn = document.getElementById('cancelPromptHighBtn');

        // Step 1 elements
        this.lowNoteName = document.getElementById('lowNoteName');
        this.lowNoteFreq = document.getElementById('lowNoteFreq');
        this.setLowBtn = document.getElementById('setLowBtn');
        this.lowRangeFill = document.getElementById('lowRangeFill');
        this.lowRangeMarker = document.getElementById('lowRangeMarker');

        // Step 2 elements
        this.highNoteName = document.getElementById('highNoteName');
        this.highNoteFreq = document.getElementById('highNoteFreq');
        this.setHighBtn = document.getElementById('setHighBtn');
        this.highRangeFill = document.getElementById('highRangeFill');
        this.highRangeMarker = document.getElementById('highRangeMarker');
        this.highLowMarker = document.getElementById('highLowMarker');

        // Step 3 elements
        this.summaryLowNote = document.getElementById('summaryLowNote');
        this.summaryHighNote = document.getElementById('summaryHighNote');
        this.redoSetupBtn = document.getElementById('redoSetupBtn');
        this.startAppBtn = document.getElementById('startAppBtn');

        // Step containers
        this.step1 = document.getElementById('setupStep1');
        this.step2 = document.getElementById('setupStep2');
        this.step3 = document.getElementById('setupStep3');

        // Cancel buttons
        this.cancelLowBtn = document.getElementById('cancelLowBtn');
        this.cancelHighBtn = document.getElementById('cancelHighBtn');

        // Vocal range constants (in Hz)
        // Human vocal range roughly: E2 (82 Hz) to G6 (1568 Hz)
        // These will adapt based on user's actual performance
        this.minVocalFreq = 80;
        this.maxVocalFreq = 1568; // G6
        this.adaptiveMin = 80;
        this.adaptiveMax = 1568;
    }

    attachEventListeners() {
        // Choice buttons
        this.chooseStandardRangeBtn.addEventListener('click', () => this.showStandardRanges());
        this.chooseCustomRangeBtn.addEventListener('click', () => this.showPromptLow());

        // Standard range buttons
        this.standardRangeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectStandardRange(btn.dataset.range));
        });
        this.backToChoiceBtn.addEventListener('click', () => this.showChoice());

        // Prompt buttons
        this.startLowNoteBtn.addEventListener('click', () => this.startLowNoteSetup());
        this.startHighNoteBtn.addEventListener('click', () => this.startHighNoteSetup());
        this.cancelPromptLowBtn.addEventListener('click', () => this.showChoice());
        this.cancelPromptHighBtn.addEventListener('click', () => this.goBackToPromptLow());

        // Custom setup buttons
        this.setLowBtn.addEventListener('click', () => this.setNote('low'));
        this.setHighBtn.addEventListener('click', () => this.setNote('high'));
        this.redoSetupBtn.addEventListener('click', () => this.redoSetup());
        this.startAppBtn.addEventListener('click', () => this.completeSetup());
        this.cancelLowBtn.addEventListener('click', () => this.showPromptLow());
        this.cancelHighBtn.addEventListener('click', () => this.showPromptHigh());
    }

    showChoice() {
        this.stepChoice.style.display = 'block';
        this.stepStandard.style.display = 'none';
        this.promptLow.style.display = 'none';
        this.promptHigh.style.display = 'none';
        this.step1.style.display = 'none';
        this.step2.style.display = 'none';
        this.step3.style.display = 'none';
    }

    showPromptLow() {
        this.stepChoice.style.display = 'none';
        this.stepStandard.style.display = 'none';
        this.promptLow.style.display = 'block';
        this.promptHigh.style.display = 'none';
        this.step1.style.display = 'none';
        this.step2.style.display = 'none';
        this.step3.style.display = 'none';
    }

    showPromptHigh() {
        this.stepChoice.style.display = 'none';
        this.stepStandard.style.display = 'none';
        this.promptLow.style.display = 'none';
        this.promptHigh.style.display = 'block';
        this.step1.style.display = 'none';
        this.step2.style.display = 'none';
        this.step3.style.display = 'none';
    }

    startLowNoteSetup() {
        this.promptLow.style.display = 'none';
        this.step1.style.display = 'block';
        this.autoStartRecording('low');
    }

    startHighNoteSetup() {
        this.promptHigh.style.display = 'none';
        this.step2.style.display = 'block';
        this.autoStartRecording('high');
    }

    goBackToPromptLow() {
        this.promptHigh.style.display = 'none';
        this.promptLow.style.display = 'block';
        this.highNote = null;
    }

    showStandardRanges() {
        this.stepChoice.style.display = 'none';
        this.stepStandard.style.display = 'block';
    }

    selectStandardRange(rangeType) {
        const ranges = {
            bass: { low: { frequency: 82.41, note: 'E2' }, high: { frequency: 329.63, note: 'E4' }, voiceType: 'Bass' },
            baritone: { low: { frequency: 110.00, note: 'A2' }, high: { frequency: 440.00, note: 'A4' }, voiceType: 'Baritone' },
            tenor: { low: { frequency: 130.81, note: 'C3' }, high: { frequency: 523.25, note: 'C5' }, voiceType: 'Tenor' },
            alto: { low: { frequency: 174.61, note: 'F3' }, high: { frequency: 698.46, note: 'F5' }, voiceType: 'Alto' },
            mezzo: { low: { frequency: 220.00, note: 'A3' }, high: { frequency: 880.00, note: 'A5' }, voiceType: 'Mezzo-Soprano' },
            soprano: { low: { frequency: 261.63, note: 'C4' }, high: { frequency: 1046.50, note: 'C6' }, voiceType: 'Soprano' }
        };

        const selectedRange = ranges[rangeType];
        if (selectedRange) {
            this.lowNote = selectedRange.low;
            this.highNote = selectedRange.high;

            // Save the range and voice type
            appSettings.setVocalRange(this.lowNote, this.highNote, selectedRange.voiceType);

            // Go directly to main menu
            this.completeSetup();
        }
    }

    showSummary() {
        // Hide all other steps and show summary
        this.stepChoice.style.display = 'none';
        this.stepStandard.style.display = 'none';
        this.step1.style.display = 'none';
        this.step2.style.display = 'none';
        this.step3.style.display = 'block';

        // Display summary
        this.summaryLowNote.textContent = `${this.lowNote.note} (${Math.round(this.lowNote.frequency)} Hz)`;
        this.summaryHighNote.textContent = `${this.highNote.note} (${Math.round(this.highNote.frequency)} Hz)`;
    }

    async autoStartRecording(type) {
        // Automatically start recording when a step is shown
        await this.startRecording(type);
    }

    cancelSetup() {
        this.pitchDetector.stop();
        document.getElementById('setupContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
    }

    async startRecording(type) {
        try {
            // Initialize pitch detector if not already done
            if (!this.pitchDetector.isListening) {
                // Get selected microphone device ID if available
                const deviceId = window.audioSettings ? window.audioSettings.getSelectedMicId() : null;
                await this.pitchDetector.initialize(deviceId);
            }

            this.isRecording = true;
            this.stableReadings = [];
            this.stableCount = 0;
            this.buttonShown = false;

            // Reset tracked extremes for this recording session
            if (type === 'low') {
                this.lowestStablePitch = null;
                this.lowNoteHeldReadings = [];
                this.lastDisplayUpdate = 0;
            } else {
                this.highestStablePitch = null;
                this.highNoteHeldReadings = [];
                this.lastDisplayUpdate = 0;
            }

            const setBtn = type === 'low' ? this.setLowBtn : this.setHighBtn;

            // Hide "Set Note" button initially
            setBtn.style.display = 'none';

            // Start pitch detection loop
            this.detectionInterval = setInterval(() => {
                this.detectAndDisplay(type);
            }, 100);

        } catch (error) {
            alert(error.message);
            this.stopRecording(type);
        }
    }

    frequencyToPercentage(frequency) {
        // Convert frequency to percentage with non-linear scaling
        // Expand the middle range, compress the extremes
        // Use adaptive range that adjusts to user's performance

        const clampedFreq = Math.max(this.adaptiveMin, Math.min(this.adaptiveMax, frequency));

        // Convert to linear 0-1 scale
        const linear = (clampedFreq - this.adaptiveMin) / (this.adaptiveMax - this.adaptiveMin);

        // Apply expansion curve
        // Expands middle range, compresses extremes

        // Shift to -1 to 1 range for symmetric processing
        const centered = (linear * 2) - 1;

        // Apply cubic expansion - reverses the previous compression
        // This expands the middle and compresses the edges
        const expanded = centered * (1 + 0.15 * centered * centered);

        // Shift back to 0-1 range
        const normalized = (expanded + 1) / 2;

        // Add slight bottom padding (5%) and top padding (5%)
        // This ensures markers don't hit absolute edges
        const padded = 0.05 + (normalized * 0.9);

        return padded * 100;
    }

    updateAdaptiveRange(type, frequency) {
        // Adapt the displayed range based on user's actual singing
        // This makes their range always feel substantial

        if (type === 'low') {
            // When setting low note, expand range around it
            const buffer = 300; // Hz buffer around the note
            this.adaptiveMin = Math.max(this.minVocalFreq, frequency - buffer);
            this.adaptiveMax = Math.min(this.maxVocalFreq, frequency + buffer * 3);
        } else if (type === 'high' && this.lowNote) {
            // When setting high note, use the actual range plus buffer
            const rangeSize = frequency - this.lowNote.frequency;
            const buffer = Math.max(100, rangeSize * 0.3);
            this.adaptiveMin = Math.max(this.minVocalFreq, this.lowNote.frequency - buffer);
            this.adaptiveMax = Math.min(this.maxVocalFreq, frequency + buffer);
        }
    }

    updateRangeVisualization(type, frequency) {
        const percentage = this.frequencyToPercentage(frequency);

        if (type === 'low') {
            // Update marker position
            this.lowRangeMarker.style.bottom = `${percentage}%`;
            // Fill from bottom to current note
            this.lowRangeFill.style.height = `${percentage}%`;
        } else {
            // Update current note marker
            this.highRangeMarker.style.bottom = `${percentage}%`;

            // Show low note marker
            if (this.lowNote) {
                const lowPercentage = this.frequencyToPercentage(this.lowNote.frequency);
                this.highLowMarker.style.bottom = `${lowPercentage}%`;

                // Fill between low and high notes
                const fillHeight = percentage - lowPercentage;
                this.highRangeFill.style.height = `${Math.max(0, fillHeight)}%`;
                this.highRangeFill.style.bottom = `${lowPercentage}%`;
            } else {
                // Fallback if low note not set
                this.highRangeFill.style.height = `${percentage}%`;
            }
        }
    }

    detectAndDisplay(type) {
        const pitch = this.pitchDetector.detectPitch();
        const now = Date.now();

        // Update debug mode with detected pitch
        if (window.debugMode) {
            const volume = this.pitchDetector.getVolume();
            const rms = this.pitchDetector.getRMS();
            window.debugMode.updateDetectedPitch(pitch, volume, rms);
        }

        if (pitch && pitch.frequency > 50 && pitch.frequency < 2000) {
            const nameElement = type === 'low' ? this.lowNoteName : this.highNoteName;
            const freqElement = type === 'low' ? this.lowNoteFreq : this.highNoteFreq;
            const setBtn = type === 'low' ? this.setLowBtn : this.setHighBtn;

            // For high note, track held readings with timestamps
            if (type === 'high') {
                // Reject only extreme octave jumps (smoothing filter handles small variations)
                if (this.highNoteHeldReadings.length > 2) {
                    const lastReading = this.highNoteHeldReadings[this.highNoteHeldReadings.length - 1];
                    const ratio = pitch.frequency / lastReading.frequency;

                    // Only reject clear octave jumps (2x or 0.5x)
                    if ((ratio > 1.9 && ratio < 2.1) || (ratio > 0.48 && ratio < 0.52)) {
                        if (window.debugMode) {
                            console.log(`HIGH: Rejecting octave jump: ${lastReading.frequency.toFixed(1)}Hz -> ${pitch.frequency.toFixed(1)}Hz (ratio: ${ratio.toFixed(2)})`);
                        }
                        return; // Skip this reading
                    }
                }

                // Add current reading with timestamp
                this.highNoteHeldReadings.push({
                    frequency: pitch.frequency,
                    note: pitch.note,
                    timestamp: now,
                    cents: pitch.cents
                });

                // Remove readings older than 0.2s
                this.highNoteHeldReadings = this.highNoteHeldReadings.filter(r => now - r.timestamp <= 200);

                // Check if we have readings spanning at least 0.2s
                if (this.highNoteHeldReadings.length > 0) {
                    const oldestReading = this.highNoteHeldReadings[0];
                    const timeSpan = now - oldestReading.timestamp;

                    if (timeSpan >= 200) {
                        // Check if readings are stable using MEDIAN (more resistant to outliers)
                        const frequencies = this.highNoteHeldReadings.map(r => r.frequency);
                        frequencies.sort((a, b) => a - b);
                        const medianFreq = frequencies[Math.floor(frequencies.length / 2)];

                        // Use very forgiving tolerance
                        const tolerance = medianFreq * this.sensitivityConfig.tolerance;
                        const maxDeviation = Math.max(...frequencies.map(f => Math.abs(f - medianFreq)));

                        // Debug logging
                        if (window.debugMode) {
                            console.log(`High note stability check: median=${medianFreq.toFixed(1)}Hz, deviation=${maxDeviation.toFixed(1)}Hz, tolerance=${tolerance.toFixed(1)}Hz, stable=${maxDeviation < tolerance}`);
                        }

                        if (maxDeviation < tolerance) {
                            // Valid stable reading held for 0.25s
                            // Update highest pitch if this is higher
                            if (this.highestStablePitch === null || medianFreq > this.highestStablePitch.frequency) {
                                this.highestStablePitch = {
                                    frequency: medianFreq,
                                    note: pitch.note
                                };
                                this.currentHighPitch = this.highestStablePitch;

                                // Update button text
                                setBtn.textContent = `Set Note (${pitch.note})`;

                                // Show button
                                setBtn.style.display = 'inline-block';
                                this.buttonShown = true;
                            }
                        }
                    }
                }

                // Throttle display updates - only update every 300ms
                if (now - this.lastDisplayUpdate >= this.displayUpdateInterval) {
                    this.lastDisplayUpdate = now;

                    // Show the highest note found so far, or current if none yet
                    const displayPitch = this.highestStablePitch || pitch;
                    nameElement.textContent = displayPitch.note;

                    // Calculate cents deviation and show visual feedback
                    const cents = Math.abs(pitch.cents || 0);
                    const accuracy = Math.max(0, 1 - (cents / 50));

                    // Apply brightness based on accuracy
                    const brightness = 0.5 + (accuracy * 0.5);
                    nameElement.style.filter = `brightness(${brightness})`;
                    nameElement.style.transform = `scale(${1 + accuracy * 0.2})`;

                    // Update adaptive range and visualization
                    this.updateAdaptiveRange(type, displayPitch.frequency);
                    this.updateRangeVisualization(type, displayPitch.frequency);
                }

                // Hide Hz display
                freqElement.style.display = 'none';

            } else {
                // Low note logic - use same 0.25s held system as high note
                // Reject only extreme octave jumps (smoothing filter handles small variations)
                if (this.lowNoteHeldReadings.length > 2) {
                    const lastReading = this.lowNoteHeldReadings[this.lowNoteHeldReadings.length - 1];
                    const ratio = pitch.frequency / lastReading.frequency;

                    // Only reject clear octave jumps (2x or 0.5x)
                    if ((ratio > 1.9 && ratio < 2.1) || (ratio > 0.48 && ratio < 0.52)) {
                        if (window.debugMode) {
                            console.log(`LOW: Rejecting octave jump: ${lastReading.frequency.toFixed(1)}Hz -> ${pitch.frequency.toFixed(1)}Hz (ratio: ${ratio.toFixed(2)})`);
                        }
                        return; // Skip this reading
                    }
                }

                // Add current reading with timestamp
                this.lowNoteHeldReadings.push({
                    frequency: pitch.frequency,
                    note: pitch.note,
                    timestamp: now,
                    cents: pitch.cents
                });

                // Remove readings older than 0.2s
                this.lowNoteHeldReadings = this.lowNoteHeldReadings.filter(r => now - r.timestamp <= 200);

                // Check if we have readings spanning at least 0.2s
                if (this.lowNoteHeldReadings.length > 0) {
                    const oldestReading = this.lowNoteHeldReadings[0];
                    const timeSpan = now - oldestReading.timestamp;

                    if (timeSpan >= 200) {
                        // Check if readings are stable using MEDIAN (more resistant to outliers)
                        const frequencies = this.lowNoteHeldReadings.map(r => r.frequency);
                        frequencies.sort((a, b) => a - b);
                        const medianFreq = frequencies[Math.floor(frequencies.length / 2)];

                        // Use very forgiving tolerance
                        const tolerance = medianFreq * this.sensitivityConfig.tolerance;
                        const maxDeviation = Math.max(...frequencies.map(f => Math.abs(f - medianFreq)));

                        // Debug logging
                        if (window.debugMode) {
                            console.log(`Low note stability check: median=${medianFreq.toFixed(1)}Hz, deviation=${maxDeviation.toFixed(1)}Hz, tolerance=${tolerance.toFixed(1)}Hz, stable=${maxDeviation < tolerance}`);
                        }

                        if (maxDeviation < tolerance) {
                            // Valid stable reading held for 0.25s
                            // Update lowest pitch if this is lower
                            if (this.lowestStablePitch === null || medianFreq < this.lowestStablePitch.frequency) {
                                this.lowestStablePitch = {
                                    frequency: medianFreq,
                                    note: pitch.note
                                };
                                this.currentLowPitch = this.lowestStablePitch;

                                // Update button text
                                setBtn.textContent = `Set Note (${pitch.note})`;

                                // Show button
                                setBtn.style.display = 'inline-block';
                                this.buttonShown = true;
                            }
                        }
                    }
                }

                // Throttle display updates - only update every 300ms
                if (now - this.lastDisplayUpdate >= this.displayUpdateInterval) {
                    this.lastDisplayUpdate = now;

                    // Show the lowest note found so far, or current if none yet
                    const displayPitch = this.lowestStablePitch || pitch;
                    nameElement.textContent = displayPitch.note;

                    // Calculate cents deviation and show visual feedback
                    const cents = Math.abs(pitch.cents || 0);
                    const accuracy = Math.max(0, 1 - (cents / 50));

                    // Apply brightness based on accuracy
                    const brightness = 0.5 + (accuracy * 0.5);
                    nameElement.style.filter = `brightness(${brightness})`;
                    nameElement.style.transform = `scale(${1 + accuracy * 0.2})`;

                    // Update adaptive range and visualization
                    this.updateAdaptiveRange(type, displayPitch.frequency);
                    this.updateRangeVisualization(type, displayPitch.frequency);
                }

                // Hide Hz display
                freqElement.style.display = 'none';
            }
        }
    }

    isStable() {
        if (this.stableReadings.length < this.requiredStableReadings) return false;

        const frequencies = this.stableReadings.map(r => r.frequency);
        const avg = frequencies.reduce((a, b) => a + b) / frequencies.length;
        const maxDeviation = Math.max(...frequencies.map(f => Math.abs(f - avg)));

        // Use the same tolerance as Pitch Hold exercise
        const allowedDeviation = avg * this.sensitivityConfig.tolerance;
        return maxDeviation < allowedDeviation;
    }

    stopRecording(type) {
        this.isRecording = false;
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }

    setNote(type) {
        // User manually locks in the current note
        const pitch = type === 'low' ? this.currentLowPitch : this.currentHighPitch;

        if (!pitch) {
            alert('No note detected. Please sing a note first.');
            return;
        }

        // Stop recording
        this.stopRecording(type);

        // Set the note
        if (type === 'low') {
            this.lowNote = {
                frequency: pitch.frequency,
                note: pitch.note
            };
            // Reset adaptive range for high note step
            // Start with a range centered on the low note, extending upward
            const buffer = 400;
            this.adaptiveMin = Math.max(this.minVocalFreq, pitch.frequency - buffer);
            this.adaptiveMax = Math.min(this.maxVocalFreq, pitch.frequency + buffer * 2);

            // Show high note prompt instead of going directly to step 2
            this.step1.style.display = 'none';
            this.showPromptHigh();
            // Hide set button
            this.setLowBtn.style.display = 'none';
        } else {
            this.highNote = {
                frequency: pitch.frequency,
                note: pitch.note
            };

            // Stop the pitch detector and turn off microphone
            if (this.pitchDetector) {
                this.pitchDetector.stop();
            }

            // Validate and move to step 3
            this.proceedToSummary();
            // Hide set button
            this.setHighBtn.style.display = 'none';
        }
    }

    proceedToSummary() {
        if (!this.highNote) return;

        // Validate that high note is higher than low note
        if (this.highNote.frequency <= this.lowNote.frequency) {
            alert('Your high note must be higher than your low note. Please try again.');
            this.highNote = null;
            this.highNoteName.textContent = '--';
            this.setHighBtn.style.display = 'none';
            this.recordHighBtn.textContent = 'Start Recording';
            return;
        }

        // Stop recording - we're done with pitch detection
        this.stopRecording('high');

        // Move to step 3
        this.step2.style.display = 'none';
        this.step3.style.display = 'block';

        // Display summary
        this.summaryLowNote.textContent = Settings.formatNote(this.lowNote);
        this.summaryHighNote.textContent = Settings.formatNote(this.highNote);
    }

    redoSetup() {
        // Reset state
        this.lowNote = null;
        this.highNote = null;
        this.isRecording = false;
        this.stableReadings = [];
        this.stableCount = 0;
        this.buttonShown = false;
        this.lowestStablePitch = null;
        this.highestStablePitch = null;
        this.lowNoteHeldReadings = [];
        this.highNoteHeldReadings = [];
        this.lastDisplayUpdate = 0;

        // Stop pitch detector if running
        if (this.pitchDetector) {
            this.pitchDetector.stop();
        }

        // Clear any intervals
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        // Hide step 3 and show choice screen
        this.step3.style.display = 'none';
        this.showChoice();
    }

    completeSetup() {
        // Save to settings
        appSettings.setVocalRange(this.lowNote, this.highNote);

        // Stop pitch detector
        this.pitchDetector.stop();

        // Show main app
        document.getElementById('setupContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        // Initialize main app
        if (window.mainApp) {
            window.mainApp.loadVocalRange();
        }
    }
}

// Initialize setup flow when needed
let setupFlow = null;

function startSetup() {
    setupFlow = new SetupFlow();
    // Show choice screen first
    setupFlow.showChoice();
}
