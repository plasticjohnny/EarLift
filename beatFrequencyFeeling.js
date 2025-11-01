/**
 * Beat Frequency Feeling Exercise
 *
 * Helps users learn to recognize and feel beat frequencies when their voice
 * is slightly off-pitch from a reference tone.
 *
 * Flow:
 * 1. Setup Modal - Test microphone
 * 2. Stabilize - User sings and holds a stable pitch
 * 3. Demonstrate - App plays glissando through offsets while user keeps singing
 * 4. Complete - User can try another note
 */

class BeatFrequencyFeeling {
    constructor() {
        // Exercise phases: 'modal' → 'stabilizing' → 'demonstrating' → 'complete'
        this.phase = 'modal';

        // Audio components
        this.pitchDetector = null;
        this.toneGenerator = null;
        this.referenceOscillator = null;
        this.referenceGainNode = null;

        // Pitch tracking
        this.currentUserPitch = null;
        this.stabilityBuffer = [];
        this.requiredStableTime = 2500; // 2.5 seconds
        this.stabilityThresholdCents = 5; // ±5 cents

        // Glissando demo
        this.glissandoOffset = 100; // Start at +100 cents
        this.glissandoSpeed = 0.6; // Cents per 50ms tick (~24 cents/second)
        this.demoInterval = null;
        this.detectionInterval = null;

        // Round tracking
        this.roundCount = 0;
        this.rangePrompts = [
            'Sing and hold a comfortable low note',
            'Now try a note in the middle of your range',
            'Try a higher note, near the top of your range',
            'Pick any comfortable note you like'
        ];

        // DOM elements
        this.container = null;
        this.setupModal = null;
        this.mainContainer = null;
        this.testMicBtn = null;
        this.micFeedback = null;
        this.volumeFill = null;
        this.testPitch = null;
        this.micStatus = null;
        this.startExerciseBtn = null;
        this.rangePrompt = null;
        this.rootIndicator = null;
        this.rootNote = null;
        this.phaseStatus = null;
        this.demoDisplay = null;
        this.offsetDisplay = null;
        this.beatFreqDisplay = null;
        this.offsetDescription = null;
        this.glissandoProgress = null;
        this.nextBtn = null;
        this.exitBtn = null;

        // Testing interval
        this.testInterval = null;
    }

    /**
     * Initialize and start the exercise (shows modal)
     */
    async start() {
        this.container = document.getElementById('beatFrequencyFeeling');
        this.initializeElements();
        this.attachEventListeners();

        // Show modal first
        this.showSetupModal();
    }

    /**
     * Find all DOM elements
     */
    initializeElements() {
        // Modal elements
        this.setupModal = this.container.querySelector('[data-bff="setup-modal"]');
        this.testMicBtn = this.container.querySelector('[data-bff="test-mic-btn"]');
        this.micFeedback = this.container.querySelector('[data-bff="mic-feedback"]');
        this.volumeFill = this.container.querySelector('[data-bff="volume-fill"]');
        this.testPitch = this.container.querySelector('[data-bff="test-pitch"]');
        this.micStatus = this.container.querySelector('[data-bff="mic-status"]');
        this.startExerciseBtn = this.container.querySelector('[data-bff="start-exercise-btn"]');

        // Main exercise elements
        this.mainContainer = this.container.querySelector('[data-bff="main-container"]');
        this.rangePrompt = this.container.querySelector('[data-bff="range-prompt"]');
        this.rootIndicator = this.container.querySelector('[data-bff="root-indicator"]');
        this.rootNote = this.container.querySelector('[data-bff="root-note"]');
        this.phaseStatus = this.container.querySelector('[data-bff="phase-status"]');
        this.demoDisplay = this.container.querySelector('[data-bff="demo-display"]');
        this.offsetDisplay = this.container.querySelector('[data-bff="offset-display"]');
        this.beatFreqDisplay = this.container.querySelector('[data-bff="beat-freq"]');
        this.offsetDescription = this.container.querySelector('[data-bff="offset-description"]');
        this.glissandoProgress = this.container.querySelector('[data-bff="glissando-progress"]');
        this.nextBtn = this.container.querySelector('[data-bff="next-btn"]');
        this.exitBtn = this.container.querySelector('[data-bff="exit-btn"]');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.testMicBtn.addEventListener('click', () => this.handleTestMicrophone());
        this.startExerciseBtn.addEventListener('click', () => this.handleStartExercise());
        this.nextBtn.addEventListener('click', () => this.handleNext());
        this.exitBtn.addEventListener('click', () => this.handleExit());
    }

    /**
     * Show setup modal
     */
    showSetupModal() {
        this.setupModal.classList.remove('hidden');
        this.mainContainer.classList.add('hidden');
    }

    /**
     * Handle Test Microphone button
     */
    async handleTestMicrophone() {
        try {
            this.testMicBtn.disabled = true;
            this.testMicBtn.textContent = 'Testing...';

            // Initialize pitch detector
            if (!this.pitchDetector) {
                this.pitchDetector = new PitchDetector();
            }

            const deviceId = window.audioSettings?.getSelectedMicId();
            await this.pitchDetector.initialize(deviceId);

            // Show feedback area
            this.micFeedback.classList.remove('hidden');

            // Start detection loop for testing
            this.testInterval = setInterval(() => {
                const pitch = this.pitchDetector.detectPitch();

                // Update volume
                const volume = this.pitchDetector.getVolume() || 0;
                this.volumeFill.style.width = `${Math.min(100, volume)}%`;

                if (pitch && pitch.frequency) {
                    this.testPitch.textContent = `${pitch.note} (${Math.round(pitch.frequency)} Hz)`;
                    this.micStatus.classList.add('show');
                    this.startExerciseBtn.disabled = false;
                } else {
                    this.testPitch.textContent = 'Sing a note...';
                }
            }, 100);

            this.testMicBtn.textContent = 'Testing...';

        } catch (error) {
            console.error('Failed to test microphone:', error);
            alert('Failed to access microphone. Please check your permissions and try again.');
            this.testMicBtn.disabled = false;
            this.testMicBtn.textContent = 'Test Microphone';
        }
    }

    /**
     * Handle Start Exercise button
     */
    handleStartExercise() {
        // Stop test interval
        if (this.testInterval) {
            clearInterval(this.testInterval);
            this.testInterval = null;
        }

        // Hide modal, show main exercise
        this.setupModal.classList.add('hidden');
        this.mainContainer.classList.remove('hidden');

        // Start Phase 1
        this.startPhase1();
    }

    /**
     * Phase 1: Stabilize
     * User sings and holds a stable pitch
     */
    startPhase1() {
        this.phase = 'stabilizing';
        this.stabilityBuffer = [];
        this.currentUserPitch = null;

        // Update UI
        this.rangePrompt.textContent = this.getRangePrompt();
        this.rootNote.textContent = 'Not singing';
        this.rootIndicator.className = 'bff-root-indicator';
        this.phaseStatus.textContent = 'Hold your pitch steady...';
        this.demoDisplay.classList.add('hidden');
        this.nextBtn.classList.add('hidden');

        // Start pitch detection
        this.detectionInterval = setInterval(() => this.checkPitchStability(), 50);
    }

    /**
     * Check if user's pitch is stable
     */
    checkPitchStability() {
        const pitch = this.pitchDetector.detectPitch();

        if (pitch && pitch.frequency) {
            // Show detected pitch
            this.rootNote.textContent = `${pitch.note} ${Math.round(pitch.frequency)} Hz`;
            this.rootIndicator.classList.add('detecting');

            // Add to stability buffer
            this.stabilityBuffer.push({
                frequency: pitch.frequency,
                timestamp: Date.now()
            });

            // Keep only recent readings (last 3 seconds)
            const cutoff = Date.now() - 3000;
            this.stabilityBuffer = this.stabilityBuffer.filter(r => r.timestamp > cutoff);

            // Check if stable enough
            if (this.stabilityBuffer.length > 50) { // ~2.5 seconds at 50ms intervals
                const avgFreq = this.stabilityBuffer.reduce((sum, r) => sum + r.frequency, 0) / this.stabilityBuffer.length;
                const allStable = this.stabilityBuffer.every(r => {
                    const cents = 1200 * Math.log2(r.frequency / avgFreq);
                    return Math.abs(cents) <= this.stabilityThresholdCents;
                });

                if (allStable) {
                    // Stable! Lock pitch and advance to Phase 2
                    this.currentUserPitch = avgFreq;
                    this.rootIndicator.classList.remove('detecting');
                    this.rootIndicator.classList.add('stable');
                    this.phaseStatus.textContent = 'Locked! ✓';

                    setTimeout(() => this.startPhase2(), 800);
                }
            }
        } else {
            // No pitch detected
            this.rootNote.textContent = 'Not singing';
            this.rootIndicator.className = 'bff-root-indicator';
            this.stabilityBuffer = [];
        }
    }

    /**
     * Phase 2: Demonstrate
     * Play glissando through beat frequencies while user keeps singing
     */
    async startPhase2() {
        this.phase = 'demonstrating';

        // Stop stability checking
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }

        // Update UI
        this.phaseStatus.textContent = 'Keep singing! Feel the beat frequencies as we get closer...';
        this.demoDisplay.classList.remove('hidden');

        // Initialize reference oscillator
        await this.initializeReferenceOscillator();

        // Reset glissando
        this.glissandoOffset = 100;

        // Start glissando demo
        this.demoInterval = setInterval(() => this.updateGlissandoDemo(), 50);

        // Start pitch tracking (to adjust for voice drift)
        this.detectionInterval = setInterval(() => this.trackUserPitch(), 50);
    }

    /**
     * Initialize reference oscillator for playing tones
     */
    async initializeReferenceOscillator() {
        const audioContext = window.audioManager.getAudioContext();
        await audioContext.resume();

        // Create gain node
        this.referenceGainNode = audioContext.createGain();
        this.referenceGainNode.connect(audioContext.destination);

        // Fade in
        this.referenceGainNode.gain.setValueAtTime(0, audioContext.currentTime);
        this.referenceGainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);

        // Create oscillator
        this.referenceOscillator = audioContext.createOscillator();
        this.referenceOscillator.type = 'sine';

        // Start at +100 cents
        const startFreq = this.currentUserPitch * Math.pow(2, 100 / 1200);
        this.referenceOscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);

        this.referenceOscillator.connect(this.referenceGainNode);
        this.referenceOscillator.start(audioContext.currentTime);
    }

    /**
     * Track user's pitch during demo (auto-adjust if voice drifts)
     */
    trackUserPitch() {
        const pitch = this.pitchDetector.detectPitch();

        if (pitch && pitch.frequency) {
            // Update current user pitch (smoothly)
            if (this.currentUserPitch) {
                // Smooth update (don't jump too much)
                const ratio = pitch.frequency / this.currentUserPitch;
                if (ratio > 0.98 && ratio < 1.02) {
                    // Small drift, adjust smoothly
                    this.currentUserPitch = this.currentUserPitch * 0.9 + pitch.frequency * 0.1;
                }
            } else {
                this.currentUserPitch = pitch.frequency;
            }

            // Update display
            this.rootNote.textContent = `${pitch.note} ${Math.round(this.currentUserPitch)} Hz`;
        }
    }

    /**
     * Update glissando demonstration
     */
    updateGlissandoDemo() {
        if (!this.currentUserPitch || !this.referenceOscillator) return;

        // Decrement offset (glissando down)
        this.glissandoOffset -= this.glissandoSpeed;

        // Check if demo is complete
        if (this.glissandoOffset < -100) {
            this.completePhase2();
            return;
        }

        // Calculate target frequency
        const targetFreq = this.currentUserPitch * Math.pow(2, this.glissandoOffset / 1200);

        // Update oscillator smoothly
        const audioContext = window.audioManager.getAudioContext();
        this.referenceOscillator.frequency.setValueAtTime(targetFreq, audioContext.currentTime);

        // Calculate beat frequency
        const beatFreq = Math.abs(targetFreq - this.currentUserPitch);

        // Update display
        this.offsetDisplay.textContent = `${this.glissandoOffset >= 0 ? '+' : ''}${Math.round(this.glissandoOffset)} cents`;
        this.beatFreqDisplay.textContent = `${beatFreq.toFixed(1)} Hz apart`;
        this.offsetDescription.textContent = this.getOffsetDescription(this.glissandoOffset);

        // Update progress bar (0% at +100, 100% at -100)
        const progress = ((100 - this.glissandoOffset) / 200) * 100;
        this.glissandoProgress.style.width = `${progress}%`;
    }

    /**
     * Get description for current offset
     */
    getOffsetDescription(cents) {
        const absCents = Math.abs(cents);
        const direction = cents > 0 ? 'higher' : (cents < 0 ? 'lower' : '');

        if (absCents >= 90) return `One piano key ${direction}`;
        if (absCents >= 40) return `Half a piano key ${direction}`;
        if (absCents >= 15) return `Slightly ${direction}`;
        if (absCents >= 5) return `Very close ${direction}`;
        if (absCents >= 2) return `Extremely close ${direction} - feel those slow beats!`;
        return 'Perfect unison - no beats!';
    }

    /**
     * Complete Phase 2
     */
    completePhase2() {
        this.phase = 'complete';

        // Stop intervals
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
            this.demoInterval = null;
        }
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        // Stop reference oscillator
        this.stopReferenceOscillator();

        // Update UI
        this.phaseStatus.textContent = 'Did you feel it? Try another note or exit.';
        this.nextBtn.classList.remove('hidden');
    }

    /**
     * Stop reference oscillator
     */
    stopReferenceOscillator() {
        if (this.referenceOscillator) {
            try {
                const audioContext = window.audioManager.getAudioContext();

                // Fade out
                if (this.referenceGainNode) {
                    this.referenceGainNode.gain.setValueAtTime(
                        this.referenceGainNode.gain.value,
                        audioContext.currentTime
                    );
                    this.referenceGainNode.gain.linearRampToValueAtTime(
                        0,
                        audioContext.currentTime + 0.2
                    );
                }

                // Stop after fade
                setTimeout(() => {
                    if (this.referenceOscillator) {
                        this.referenceOscillator.stop();
                        this.referenceOscillator.disconnect();
                        this.referenceOscillator = null;
                    }
                    if (this.referenceGainNode) {
                        this.referenceGainNode.disconnect();
                        this.referenceGainNode = null;
                    }
                }, 250);
            } catch (e) {
                console.error('Error stopping reference oscillator:', e);
            }
        }
    }

    /**
     * Handle Next button
     */
    handleNext() {
        this.roundCount++;
        this.startPhase1();
    }

    /**
     * Get range prompt for current round
     */
    getRangePrompt() {
        const index = this.roundCount % this.rangePrompts.length;
        return this.rangePrompts[index];
    }

    /**
     * Handle Exit button
     */
    handleExit() {
        this.destroy();

        // Clear URL state
        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
        }

        // Hide exercise, show main app
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        // Stop all intervals
        if (this.testInterval) {
            clearInterval(this.testInterval);
            this.testInterval = null;
        }
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
            this.demoInterval = null;
        }

        // Stop audio
        this.stopReferenceOscillator();

        // Stop pitch detector
        if (this.pitchDetector) {
            this.pitchDetector.stop();
        }
    }
}

// Make available globally
window.BeatFrequencyFeeling = BeatFrequencyFeeling;
