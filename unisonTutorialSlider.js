/**
 * Unison Tutorial Slider Module
 *
 * Handles Slider Glissando functionality within the Unison Overview tutorial.
 * Supports custom configurations per step including:
 * - Target frequencies and ranges
 * - Hash mark rendering
 * - Button enable/disable states
 * - Custom jump amounts
 * - Completion criteria
 */

class UnisonTutorialSlider {
    constructor(container) {
        this.container = container;
        this.config = null;
        this.oscillator = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.currentFrequency = 440;
        this.completionCallback = null;
        this.completionTimer = null;
        this.completionStartTime = null;

        // Cache DOM elements
        this.sliderElement = container.querySelector('[data-slider="diagonal-slider"]');
        this.targetFreqDisplay = container.querySelector('[data-slider="target-freq"]');
        this.currentFreqDisplay = container.querySelector('[data-slider="current-freq"]');
        this.playPauseIndicator = container.querySelector('[data-slider="play-pause"]');
        this.playIcon = container.querySelector('[data-slider="play-icon"]');
        this.pauseIcon = container.querySelector('[data-slider="pause-icon"]');
        this.pauseIcon2 = container.querySelector('[data-slider="pause-icon-2"]');
        this.instructionText = container.querySelector('[data-slider="instruction"]');
        this.helperText = container.querySelector('[data-slider="helper-text"]');
        this.hashMarksContainer = container.querySelector('[data-slider="hash-marks-container"]');

        // Get all buttons
        this.buttons = {
            'big-up': container.querySelector('[data-slider-btn="big-up"]'),
            'medium-up': container.querySelector('[data-slider-btn="medium-up"]'),
            'small-up': container.querySelector('[data-slider-btn="small-up"]'),
            'big-down': container.querySelector('[data-slider-btn="big-down"]'),
            'medium-down': container.querySelector('[data-slider-btn="medium-down"]'),
            'small-down': container.querySelector('[data-slider-btn="small-down"]')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Play/pause indicator
        this.playPauseIndicator.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stopTone();
            } else {
                this.playTone();
            }
        });

        // Slider input
        this.sliderElement.addEventListener('input', (e) => {
            const frequency = parseFloat(e.target.value);
            this.updateCurrentFrequency(frequency);
        });

        // Button clicks
        for (const [buttonType, button] of Object.entries(this.buttons)) {
            button.addEventListener('click', () => {
                this.handleButtonClick(buttonType);
            });
        }
    }

    /**
     * Initialize slider with step configuration
     * @param {Object} config - Step slider configuration
     * @param {Function} completionCallback - Called when completion criteria met
     */
    async initialize(config, completionCallback) {
        console.log('[TutorialSlider] Initializing with config:', config);

        this.config = config;
        this.completionCallback = completionCallback;

        // Calculate frequency range
        let minFreq, maxFreq;
        if (config.rangeFromTarget) {
            minFreq = config.targetFrequency - config.rangeFromTarget.below;
            maxFreq = config.targetFrequency + config.rangeFromTarget.above;
        } else {
            minFreq = config.minFrequency || 220;
            maxFreq = config.maxFrequency || 880;
        }

        // Set up slider range
        this.sliderElement.min = minFreq;
        this.sliderElement.max = maxFreq;
        this.sliderElement.step = 0.1;

        // Set initial position
        const initialFreq = this.calculateInitialPosition(config.initialPosition, config.targetFrequency, minFreq, maxFreq);
        this.sliderElement.value = initialFreq;
        this.currentFrequency = initialFreq;

        // Update displays
        this.targetFreqDisplay.textContent = `${Math.round(config.targetFrequency)} Hz`;
        this.currentFreqDisplay.textContent = `${Math.round(initialFreq)} Hz`;

        // Update instruction text
        if (config.instructionText) {
            this.instructionText.textContent = config.instructionText;
        }

        // Show/hide helper text
        if (config.helperText) {
            this.helperText.textContent = config.helperText;
            this.helperText.style.display = 'block';
        } else {
            this.helperText.style.display = 'none';
        }

        // Render hash marks
        if (config.hashMarks && config.hashMarks.enabled) {
            this.renderHashMarks(config.targetFrequency, minFreq, maxFreq, config.hashMarks);
        } else {
            this.clearHashMarks();
        }

        // Configure button states
        this.configureButtons(config.enabledButtons || []);

        // Auto-play if configured
        if (config.autoPlayOnStart) {
            await this.playTone();
        }

        // Initialize completion checking
        this.initializeCompletionCriteria();
    }

    /**
     * Calculate initial slider position
     */
    calculateInitialPosition(positionConfig, targetFreq, minFreq, maxFreq) {
        if (typeof positionConfig === 'number') {
            return positionConfig;
        }

        const range = maxFreq - minFreq;

        switch (positionConfig) {
            case 'random-far':
                // Random position at least 30% away from target
                const distanceFromTarget = 0.3 + Math.random() * 0.4; // 30-70% away
                const isBelow = Math.random() < 0.5;
                if (isBelow) {
                    return Math.max(minFreq, targetFreq - distanceFromTarget * (targetFreq - minFreq));
                } else {
                    return Math.min(maxFreq, targetFreq + distanceFromTarget * (maxFreq - targetFreq));
                }

            case 'random-close':
                // Random position within 20% of target
                const offset = (Math.random() * 0.4 - 0.2) * range; // ±20%
                return Math.max(minFreq, Math.min(maxFreq, targetFreq + offset));

            case 'target':
                return targetFreq;

            case 'min':
                return minFreq;

            case 'max':
                return maxFreq;

            default:
                return targetFreq;
        }
    }

    /**
     * Render hash marks along slider
     */
    renderHashMarks(targetFreq, minFreq, maxFreq, hashConfig) {
        this.clearHashMarks();

        const color = hashConfig.color || 'rgba(255,255,255,0.3)';
        const length = hashConfig.length || '8px';
        const width = hashConfig.width || '2px';
        const range = maxFreq - minFreq;
        const isMobile = window.innerWidth <= 768;
        const sliderWidth = isMobile ? 300 : 400;
        const thumbWidth = isMobile ? 35 : 40;

        let frequencies = [];

        // Check if specific frequencies are provided
        if (hashConfig.frequencies && Array.isArray(hashConfig.frequencies)) {
            // Use specific frequencies
            frequencies = hashConfig.frequencies.filter(f => f >= minFreq && f <= maxFreq);
            console.log(`[TutorialSlider] Using specific frequencies for hash marks:`, frequencies);
        } else {
            // Use interval-based approach
            const interval = hashConfig.interval || 1;
            const numMarks = Math.floor(range / interval) + 1;

            // Warn if too many marks
            if (numMarks > 100) {
                console.warn(`[TutorialSlider] High number of hash marks (${numMarks}). Consider increasing interval.`);
            }

            for (let i = 0; i < numMarks; i++) {
                const frequency = minFreq + (i * interval);
                if (frequency <= maxFreq) {
                    frequencies.push(frequency);
                }
            }
        }

        // Create marks for each frequency
        frequencies.forEach(frequency => {
            // Calculate position accounting for thumb offset
            // Range inputs position thumb center from (thumbWidth/2) to (sliderWidth - thumbWidth/2)
            const percentage = (frequency - minFreq) / range;
            const thumbOffset = thumbWidth / 2;
            const availableTravel = sliderWidth - thumbWidth;
            const position = thumbOffset + (percentage * availableTravel);

            // Create mark element
            const mark = document.createElement('div');
            mark.className = 'slider-hash-mark';
            mark.style.left = `${position}px`;
            mark.style.background = color;
            mark.style.height = length;
            mark.style.width = width;

            this.hashMarksContainer.appendChild(mark);
        });

        console.log(`[TutorialSlider] Rendered ${frequencies.length} hash marks`);
    }

    /**
     * Clear all hash marks
     */
    clearHashMarks() {
        if (this.hashMarksContainer) {
            this.hashMarksContainer.innerHTML = '';
        }
    }

    /**
     * Configure which buttons are enabled
     */
    configureButtons(enabledButtons) {
        // Disable all buttons first
        for (const [buttonType, button] of Object.entries(this.buttons)) {
            button.disabled = !enabledButtons.includes(buttonType);
            button.style.opacity = button.disabled ? '0.3' : '1';
            button.style.cursor = button.disabled ? 'not-allowed' : 'pointer';
        }
    }

    /**
     * Handle button click with custom or default jump amounts
     */
    handleButtonClick(buttonType) {
        const button = this.buttons[buttonType];
        if (!button || button.disabled) return;

        const direction = buttonType.includes('up') ? 1 : -1;
        const size = buttonType.split('-')[0]; // 'big', 'medium', or 'small'

        // Check for custom jump amount
        let jumpAmount;
        if (this.config.customJumpAmounts && this.config.customJumpAmounts[buttonType]) {
            jumpAmount = this.config.customJumpAmounts[buttonType];
        } else {
            // Default jump amounts
            jumpAmount = this.getDefaultJumpAmount(size);
        }

        // Calculate new frequency
        let newFrequency;
        if (jumpAmount < 50) {
            // Assume it's Hz if less than 50
            newFrequency = this.currentFrequency + (direction * jumpAmount);
        } else {
            // Assume it's cents or treat as semitones
            const semitones = jumpAmount / 100; // Convert cents to semitones
            newFrequency = this.currentFrequency * Math.pow(2, (direction * semitones) / 12);
        }

        // Clamp to range
        const minFreq = parseFloat(this.sliderElement.min);
        const maxFreq = parseFloat(this.sliderElement.max);
        newFrequency = Math.max(minFreq, Math.min(maxFreq, newFrequency));

        // Update slider and frequency
        this.sliderElement.value = newFrequency;
        this.updateCurrentFrequency(newFrequency);
    }

    /**
     * Get default jump amount for button size
     */
    getDefaultJumpAmount(size) {
        switch (size) {
            case 'big':
                return 6 + Math.floor(Math.random() * 5); // 6-10 semitones
            case 'medium':
                return 1 + Math.floor(Math.random() * 3); // 1-3 semitones
            case 'small':
                // Adaptive based on distance to target
                const distance = Math.abs(this.currentFrequency - this.config.targetFrequency);
                if (distance < 5) {
                    return 1 + Math.floor(Math.random() * 3); // 1-3 Hz
                } else if (distance < 20) {
                    return 3 + Math.floor(Math.random() * 6); // 3-8 Hz
                } else {
                    return 5 + Math.floor(Math.random() * 11); // 5-15 Hz
                }
            default:
                return 5;
        }
    }

    /**
     * Update current frequency and check completion
     */
    updateCurrentFrequency(frequency) {
        this.currentFrequency = frequency;
        this.currentFreqDisplay.textContent = `${Math.round(frequency)} Hz`;

        // Update oscillator frequency if playing
        if (this.isPlaying && this.oscillator) {
            const audioContext = window.audioManager?.getAudioContext();
            if (audioContext) {
                this.oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            }
        }

        // Check completion criteria
        this.checkCompletionCriteria();
    }

    /**
     * Initialize completion criteria checking
     */
    initializeCompletionCriteria() {
        // Clear any existing timer
        if (this.completionTimer) {
            clearInterval(this.completionTimer);
            this.completionTimer = null;
        }

        const criteria = this.config.completionCriteria;
        if (!criteria) return;

        switch (criteria.type) {
            case 'within-range':
            case 'exact-match':
                // Check on every frequency update (handled in checkCompletionCriteria)
                break;

            case 'time-based':
                // Enable after duration
                setTimeout(() => {
                    if (this.completionCallback) {
                        this.completionCallback(true);
                    }
                }, criteria.duration || 5000);
                break;

            case 'button-clicks':
                // Track clicks (would need to add click counter)
                break;

            case 'manual':
                // Always enabled
                if (this.completionCallback) {
                    this.completionCallback(true);
                }
                break;
        }
    }

    /**
     * Check if completion criteria are met
     */
    checkCompletionCriteria() {
        const criteria = this.config.completionCriteria;
        if (!criteria || !this.completionCallback) return;

        switch (criteria.type) {
            case 'within-range':
                const distance = Math.abs(this.currentFrequency - this.config.targetFrequency);
                const threshold = criteria.threshold || 10;
                const inRange = distance <= threshold;

                if (inRange) {
                    // Start timer if needed
                    if (criteria.duration && !this.completionStartTime) {
                        this.completionStartTime = Date.now();
                        console.log(`[TutorialSlider] Within range, starting timer for ${criteria.duration}ms`);
                    }

                    // Check if duration requirement met
                    if (criteria.duration) {
                        const elapsed = Date.now() - this.completionStartTime;
                        if (elapsed >= criteria.duration) {
                            console.log('[TutorialSlider] Completion criteria met (within range + duration)');
                            this.completionCallback(true);
                        }
                    } else {
                        // No duration requirement
                        console.log('[TutorialSlider] Completion criteria met (within range)');
                        this.completionCallback(true);
                    }
                } else {
                    // Reset timer if moved out of range
                    this.completionStartTime = null;
                    this.completionCallback(false);
                }
                break;

            case 'exact-match':
                const exactDistance = Math.abs(this.currentFrequency - this.config.targetFrequency);
                const exactMatch = exactDistance <= 2; // ±2 Hz
                this.completionCallback(exactMatch);
                break;
        }
    }

    /**
     * Play the target tone
     */
    async playTone() {
        if (this.isPlaying) return;

        try {
            // Get audio context
            const audioContext = window.audioManager?.getAudioContext();
            if (!audioContext) {
                console.error('[TutorialSlider] AudioContext not available');
                return;
            }

            // Create oscillator
            this.oscillator = audioContext.createOscillator();
            this.gainNode = audioContext.createGain();

            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(this.currentFrequency, audioContext.currentTime);

            this.gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(audioContext.destination);

            this.oscillator.start();
            this.isPlaying = true;

            // Update UI - add playing class and toggle icons
            this.playPauseIndicator.classList.add('playing');
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
            if (this.pauseIcon2) this.pauseIcon2.style.display = 'block';

            console.log('[TutorialSlider] Playing tone at', this.currentFrequency, 'Hz');
        } catch (error) {
            console.error('[TutorialSlider] Error playing tone:', error);
        }
    }

    /**
     * Stop the tone
     */
    stopTone() {
        if (!this.isPlaying) return;

        try {
            if (this.oscillator) {
                const audioContext = window.audioManager?.getAudioContext();
                if (audioContext && this.gainNode) {
                    // Fade out
                    this.gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
                }

                setTimeout(() => {
                    if (this.oscillator) {
                        this.oscillator.stop();
                        this.oscillator.disconnect();
                        this.oscillator = null;
                    }
                    if (this.gainNode) {
                        this.gainNode.disconnect();
                        this.gainNode = null;
                    }
                }, 60);
            }

            this.isPlaying = false;

            // Update UI - remove playing class and toggle icons
            this.playPauseIndicator.classList.remove('playing');
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
            if (this.pauseIcon2) this.pauseIcon2.style.display = 'none';

            console.log('[TutorialSlider] Stopped tone');
        } catch (error) {
            console.error('[TutorialSlider] Error stopping tone:', error);
        }
    }

    /**
     * Clean up and reset slider
     */
    cleanup() {
        console.log('[TutorialSlider] Cleaning up');

        // Stop audio
        this.stopTone();

        // Clear timers
        if (this.completionTimer) {
            clearInterval(this.completionTimer);
            this.completionTimer = null;
        }

        // Clear hash marks
        this.clearHashMarks();

        // Reset state
        this.config = null;
        this.completionCallback = null;
        this.completionStartTime = null;
    }
}

// Export for use in tutorial
window.UnisonTutorialSlider = UnisonTutorialSlider;
