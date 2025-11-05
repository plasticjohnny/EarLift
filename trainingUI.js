/**
 * Training UI
 *
 * Handles all UI interactions for the Training Mode system.
 */

class TrainingUI {
    constructor(profileName = 'Default') {
        this.profileName = profileName;
        this.trainingData = new TrainingData(profileName);
        this.trainingSystem = new TrainingSystem(this.trainingData);
        this.currentExercise = null;
        this.currentLevel = 1;
        this.isInTrainingMode = false;

        // Initialize vocal range
        this.initializeVocalRange();
    }

    initializeVocalRange() {
        const range = appSettings.getVocalRange();
        if (range && range.low && range.high) {
            this.trainingSystem.setVocalRange(range.low.frequency, range.high.frequency);
        }
    }

    /**
     * Switch to a different profile
     */
    switchProfile(profileName) {
        console.log('[TrainingUI] Switching profile from', this.profileName, 'to', profileName);
        this.profileName = profileName;
        this.trainingData = new TrainingData(profileName);
        this.trainingSystem = new TrainingSystem(this.trainingData);
        this.initializeVocalRange();
        this.updateTrainingMenuStats();
    }

    /**
     * Show Training Mode main menu
     */
    showTrainingMenu() {
        // Hide main app
        document.getElementById('appContainer').style.display = 'none';

        // Show training menu
        const trainingMenu = document.getElementById('trainingMenu');
        trainingMenu.style.display = 'block';

        // Update stats display
        this.updateTrainingMenuStats();
    }

    /**
     * Hide Training Mode and return to main app
     */
    hideTrainingMenu() {
        document.getElementById('trainingMenu').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        this.isInTrainingMode = false;
    }

    /**
     * Update stats on training menu
     */
    updateTrainingMenuStats() {
        const unlocked = this.trainingData.getUnlockedExercises();
        const allIntervals = ['unison', 'octave', 'fifth', 'major-third', 'fourth',
                              'major-second', 'minor-second', 'minor-third',
                              'major-sixth', 'minor-sixth', 'major-seventh', 'minor-seventh', 'tritone'];

        // Update unlock count
        document.getElementById('trainingUnlockCount').textContent =
            `${unlocked.length} / ${allIntervals.length} intervals unlocked`;

        // Calculate total practice count
        let totalPractices = 0;
        Object.values(this.trainingData.data.exercises).forEach(ex => {
            totalPractices += ex.attempts ? ex.attempts.length : 0;
        });
        document.getElementById('trainingPracticeCount').textContent =
            `${totalPractices} exercises completed`;

        // Update progress indicators
        this.updateProgressDisplay();
    }

    /**
     * Start Train Now mode
     */
    startTrainNow() {
        this.isInTrainingMode = true;

        // Select next exercise
        const exercise = this.trainingSystem.selectNextExercise();
        console.log('[Training] Selected exercise:', exercise);

        if (!exercise) {
            alert('No exercises available. Please check your settings.');
            return;
        }

        this.currentExercise = exercise;

        // Hide all containers
        document.getElementById('trainingMenu').style.display = 'none';
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('systemExerciseMenu').style.display = 'none';

        // Start the system exercise
        this.startSystemExercise(exercise.intervalType, exercise.exerciseIndex, exercise.targetNote);
    }

    /**
     * Start a system exercise with specific parameters
     */
    startSystemExercise(intervalType, exerciseIndex, targetNote) {
        console.log('[Training] Starting system exercise:', intervalType, exerciseIndex, targetNote);
        console.log('[Training] isInTrainingMode before starting:', this.isInTrainingMode);

        const config = getIntervalConfig(intervalType);

        if (!config) {
            console.error(`[Training] No config found for interval type: ${intervalType}`);
            alert(`System exercise for ${intervalType} not available`);
            this.showTrainingMenu();
            return;
        }

        console.log('[Training] Got config:', config);

        // Store reference for completion callback
        this.currentIntervalType = intervalType;
        this.currentExerciseIndex = exerciseIndex;
        this.currentTargetNote = targetNote;

        // Get current level for this exercise from trainingData
        const exerciseData = this.trainingData.data.exercises[intervalType];
        this.currentLevel = exerciseData?.currentLevel || 1;

        try {
            // Create or reuse system exercise instance
            if (!window.systemExerciseInstance || !(window.systemExerciseInstance instanceof IntervalSystemExercise)) {
                console.log('[Training] Creating new IntervalSystemExercise instance');
                window.systemExerciseInstance = new IntervalSystemExercise(config, 'intervalSystemExercise');
            } else {
                console.log('[Training] Reusing existing IntervalSystemExercise instance');
                // Update config for new interval
                window.systemExerciseInstance.intervalConfig = config;
                window.systemExerciseInstance.intervalType = config.intervalType;
                window.systemExerciseInstance.intervalName = config.intervalName;
                window.systemExerciseInstance.isUnison = config.intervalType === 'unison';
                window.systemExerciseInstance.isTutorial = config.intervalType === 'tutorial';
                window.systemExerciseInstance.exercises = getSystemExercisesForInterval(config.intervalType);
            }

            // Set starting exercise index and level
            window.systemExerciseInstance.currentExerciseIndex = exerciseIndex;
            window.systemExerciseInstance.currentLevel = this.currentLevel;
            window.systemExerciseInstance.doAllExercises = false; // Single exercise mode
            window.systemExerciseInstance.maxRepetitions = 1; // Only 1 repetition in training mode
            window.systemExerciseInstance.practiceMode = false; // Disable practice mode in training mode

            // IMPORTANT: Reset repetition counter for training mode
            window.systemExerciseInstance.repetitionsCompleted = 0;
            console.log('[Training] Reset repetitionsCompleted to 0');

            // Override the root frequency with our selected target note
            window.systemExerciseInstance.customRootFrequency = targetNote;
            console.log('[Training] Set customRootFrequency:', targetNote);

            // Ensure ALL other containers are hidden before starting
            document.getElementById('appContainer').style.display = 'none';
            document.getElementById('trainingMenu').style.display = 'none';
            document.getElementById('systemExerciseMenu').style.display = 'none';
            document.getElementById('trainingSettings').style.display = 'none';
            document.getElementById('trainingProgress').style.display = 'none';
            document.getElementById('trainingRatingUI').style.display = 'none';
            console.log('[Training] All menus hidden, only exercise should be visible');

            // Clear any button focus from previous exercise
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }

            // Start exercise
            console.log('[Training] Calling start() on exercise instance');
            window.systemExerciseInstance.start();

            // Add completion callback
            this.attachCompletionCallback();

            console.log('[Training] Exercise started successfully');

        } catch (error) {
            console.error('[Training] Error initializing system exercise:', error);
            alert('Error starting system exercise: ' + error.message);
            this.showTrainingMenu();
        }
    }

    /**
     * Attach callback to intercept exercise completion
     */
    attachCompletionCallback() {
        console.log('[Training] Attaching completion callback, isInTrainingMode:', this.isInTrainingMode);

        // Store the original exit if we haven't already
        if (!window.systemExerciseInstance._originalExit) {
            window.systemExerciseInstance._originalExit = window.systemExerciseInstance.exit.bind(window.systemExerciseInstance);
            console.log('[Training] Stored original exit method');
        }

        // Prevent multiple attachments - check if already overridden for training
        if (window.systemExerciseInstance._trainingCallbackAttached) {
            console.log('[Training] Callback already attached, skipping');
            return;
        }

        window.systemExerciseInstance._trainingCallbackAttached = true;

        // Create a bound reference to this TrainingUI instance
        const trainingUI = this;

        // Override the exit method
        window.systemExerciseInstance.exit = function() {
            console.log('[Training] Exit called, isInTrainingMode:', trainingUI.isInTrainingMode);
            console.log('[Training] repetitionsCompleted:', this.repetitionsCompleted, 'maxRepetitions:', this.maxRepetitions);

            if (trainingUI.isInTrainingMode) {
                // Check if exercise was completed or user hit back early
                const wasCompleted = this.repetitionsCompleted >= this.maxRepetitions;

                console.log('[Training] wasCompleted:', wasCompleted);

                // Stop audio but don't show appContainer
                this.stopAll();
                // Hide exercise screen
                document.getElementById('intervalSystemExercise').style.display = 'none';

                if (wasCompleted) {
                    // Check if this is a unison exercise with self-rating
                    if (trainingUI.currentIntervalType === 'unison' && this.lastUnisonRating) {
                        const rating = this.lastUnisonRating;
                        console.log('[Training] Unison completed with self-rating:', rating);

                        // Get frequencies
                        const rootFreq = this.rootFrequency || trainingUI.currentTargetNote;
                        const intervalFreq = rootFreq; // For unison, interval = root

                        // Record result directly without showing separate rating UI
                        const result = trainingUI.trainingSystem.recordExerciseResult(
                            trainingUI.currentIntervalType,
                            rating,
                            rootFreq,
                            intervalFreq,
                            trainingUI.currentExerciseIndex,
                            trainingUI.currentLevel
                        );

                        // Clear the rating for next exercise
                        this.lastUnisonRating = null;

                        // Show unlock and level-up notifications
                        if (result.newUnlocks && result.newUnlocks.length > 0) {
                            trainingUI.showUnlockNotification(result.newUnlocks);
                        }
                        if (result.leveledUp) {
                            trainingUI.showLevelUpNotification(result.leveledUp);
                        }

                        // Continue to next exercise
                        trainingUI.continueToNextExercise();
                    } else {
                        // Normal completion - show rating UI for intervals
                        console.log('[Training] Exercise completed, showing rating UI');
                        trainingUI.showRatingUI();
                    }
                } else {
                    // User hit back early - treat as skip (record as failed)
                    console.log('[Training] Exercise skipped via back button, recording as failed');
                    trainingUI.handleSkip();
                }
            } else {
                // Normal exit behavior
                console.log('[Training] Normal exit (not in training mode)');
                // Clear the flag when exiting normally
                window.systemExerciseInstance._trainingCallbackAttached = false;
                window.systemExerciseInstance._originalExit();
            }
        };
    }

    /**
     * Show difficulty rating UI
     */
    showRatingUI() {
        console.log('[Training] Showing rating UI');

        // Hide all other containers
        document.getElementById('intervalSystemExercise').style.display = 'none';
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('systemExerciseMenu').style.display = 'none';
        document.getElementById('trainingMenu').style.display = 'none';

        // Show rating UI
        const ratingUI = document.getElementById('trainingRatingUI');
        ratingUI.style.display = 'flex';

        // Get interval name for display
        const config = getIntervalConfig(this.currentIntervalType);
        document.getElementById('ratingIntervalName').textContent = config ? config.intervalName : this.currentIntervalType;
    }

    /**
     * Handle difficulty rating selection
     */
    handleRating(difficulty) {
        // Get the actual root and interval frequencies from the exercise
        const rootFreq = window.systemExerciseInstance.rootFrequency || this.currentTargetNote;
        const intervalFreq = window.systemExerciseInstance.intervalFrequency || rootFreq;

        // Record the result
        const result = this.trainingSystem.recordExerciseResult(
            this.currentIntervalType,
            difficulty,
            rootFreq,
            intervalFreq,
            this.currentExerciseIndex,
            this.currentLevel
        );

        // Hide rating UI
        document.getElementById('trainingRatingUI').style.display = 'none';

        // Show unlock and level-up notifications
        if (result.newUnlocks && result.newUnlocks.length > 0) {
            this.showUnlockNotification(result.newUnlocks);
        }
        if (result.leveledUp) {
            this.showLevelUpNotification(result.leveledUp);
        }

        // Continue to next exercise
        this.continueToNextExercise();
    }

    /**
     * Handle skip (back button pressed during exercise)
     */
    handleSkip() {
        console.log('[Training] Handling skip - returning to training menu');

        // Get the actual root and interval frequencies from the exercise
        const rootFreq = window.systemExerciseInstance.rootFrequency || this.currentTargetNote;
        const intervalFreq = window.systemExerciseInstance.intervalFrequency || rootFreq;

        // Record as failed
        const result = this.trainingSystem.recordExerciseResult(
            this.currentIntervalType,
            'failed',
            rootFreq,
            intervalFreq,
            this.currentExerciseIndex,
            this.currentLevel
        );

        // Show notifications (unlikely with a failed attempt)
        if (result.newUnlocks && result.newUnlocks.length > 0) {
            this.showUnlockNotification(result.newUnlocks);
        }
        if (result.leveledUp) {
            this.showLevelUpNotification(result.leveledUp);
        }

        // Exit training mode and return to menu instead of continuing
        this.exitTrainingMode();
    }

    /**
     * Show unlock notification
     */
    showUnlockNotification(newUnlocks) {
        const notification = document.getElementById('trainingUnlockNotification');
        const list = document.getElementById('trainingUnlockList');

        // Build list of unlocked intervals
        list.innerHTML = newUnlocks.map(intervalType => {
            const config = getIntervalConfig(intervalType);
            return `<li>${config ? config.intervalName : intervalType}</li>`;
        }).join('');

        notification.style.display = 'flex';

        // Auto-hide after 4 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 4000);
    }

    /**
     * Show level-up notification
     */
    showLevelUpNotification(newLevel) {
        // Create a simple notification
        alert(`🎉 Level Up! You've unlocked Level ${newLevel}!`);
    }

    /**
     * Continue to next exercise
     */
    continueToNextExercise() {
        console.log('[Training] Continue to next exercise');

        // Select next exercise
        const exercise = this.trainingSystem.selectNextExercise();
        if (!exercise) {
            alert('No more exercises available.');
            this.showTrainingMenu();
            return;
        }

        this.currentExercise = exercise;
        console.log('[Training] Next exercise selected:', exercise);

        // Ensure all menus are hidden before transitioning
        document.getElementById('trainingMenu').style.display = 'none';
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('systemExerciseMenu').style.display = 'none';
        document.getElementById('trainingRatingUI').style.display = 'none';

        // Small delay for smooth transition
        setTimeout(() => {
            this.startSystemExercise(exercise.intervalType, exercise.exerciseIndex, exercise.targetNote);
        }, 300);
    }

    /**
     * Exit training mode (from rating UI or during exercise)
     */
    exitTrainingMode() {
        this.isInTrainingMode = false;

        // Hide all training UIs
        document.getElementById('trainingRatingUI').style.display = 'none';
        document.getElementById('intervalSystemExercise').style.display = 'none';

        // Return to main page
        this.hideTrainingMenu();
    }

    /**
     * Show Settings menu
     */
    showSettings() {
        // Hide main app (in case called from main page)
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('trainingMenu').style.display = 'none';
        document.getElementById('trainingSettings').style.display = 'block';

        // Update settings values
        this.updateSettingsDisplay();
    }

    /**
     * Hide Settings menu
     */
    hideSettings() {
        document.getElementById('trainingSettings').style.display = 'none';
        // Return to main page instead of training menu
        this.hideTrainingMenu();
    }

    /**
     * Update settings display with current values
     */
    updateSettingsDisplay() {
        const settings = this.trainingData.data.settings;

        // Update sliders/inputs
        document.getElementById('settingPriorityBoost').value = settings.priorityBoost;
        document.getElementById('settingPriorityBoostValue').textContent = settings.priorityBoost.toFixed(1);

        document.getElementById('settingUnlockThreshold').value = settings.unlockThreshold * 100;
        document.getElementById('settingUnlockThresholdValue').textContent = Math.round(settings.unlockThreshold * 100) + '%';

        document.getElementById('settingUnlockWindow').value = settings.unlockWindow;
        document.getElementById('settingUnlockWindowValue').textContent = settings.unlockWindow;

        // Update tutorial mode checkbox
        document.getElementById('settingEnableTutorialMode').checked = settings.enableTutorialMode || false;

        // Update force unlock checkboxes
        this.updateForceUnlockDisplay();
    }

    /**
     * Update force unlock checkboxes
     */
    updateForceUnlockDisplay() {
        const allIntervals = ['unison', 'octave', 'fifth', 'major-third', 'fourth',
                              'major-second', 'minor-second', 'minor-third',
                              'major-sixth', 'minor-sixth', 'major-seventh', 'minor-seventh', 'tritone'];

        const container = document.getElementById('forceUnlockContainer');
        container.innerHTML = '';

        allIntervals.forEach(intervalType => {
            const config = getIntervalConfig(intervalType);
            const isUnlocked = this.trainingData.data.unlocked.includes(intervalType);
            const isForceUnlocked = this.trainingData.data.forceUnlocked.includes(intervalType);

            const label = document.createElement('label');
            label.className = 'force-unlock-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = intervalType;
            checkbox.checked = isForceUnlocked;
            checkbox.disabled = isUnlocked; // Can't force unlock what's already unlocked

            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.trainingData.forceUnlock(intervalType);
                } else {
                    // Remove from force unlocked
                    const index = this.trainingData.data.forceUnlocked.indexOf(intervalType);
                    if (index > -1) {
                        this.trainingData.data.forceUnlocked.splice(index, 1);
                        this.trainingData.saveData();
                    }
                }
            });

            const text = document.createElement('span');
            text.textContent = config ? config.intervalName : intervalType;
            if (isUnlocked) {
                text.textContent += ' (unlocked)';
            }

            label.appendChild(checkbox);
            label.appendChild(text);
            container.appendChild(label);
        });
    }

    /**
     * Update setting value
     */
    updateSetting(settingName, value) {
        this.trainingData.data.settings[settingName] = parseFloat(value);
        this.trainingData.saveData();
        this.updateSettingsDisplay();
    }

    /**
     * Handle tutorial mode toggle
     */
    handleTutorialModeToggle(enabled) {
        console.log('[Training] Tutorial mode toggled:', enabled);

        // Update setting
        this.trainingData.data.settings.enableTutorialMode = enabled;

        // If enabling tutorial mode, add 'tutorial' to unlocked
        if (enabled) {
            if (!this.trainingData.data.unlocked.includes('tutorial')) {
                this.trainingData.data.unlocked.unshift('tutorial'); // Add at beginning (most fundamental)
                console.log('[Training] Added tutorial to unlocked exercises');
            }
        } else {
            // If disabling tutorial mode, remove 'tutorial' from unlocked
            const index = this.trainingData.data.unlocked.indexOf('tutorial');
            if (index > -1) {
                this.trainingData.data.unlocked.splice(index, 1);
                console.log('[Training] Removed tutorial from unlocked exercises');
            }
        }

        // Save changes
        this.trainingData.saveData();

        // Update display
        this.updateSettingsDisplay();
    }

    /**
     * Show Progress screen
     */
    showProgress() {
        // Hide main app (in case called from main page)
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('trainingMenu').style.display = 'none';
        document.getElementById('trainingProgress').style.display = 'block';

        this.updateProgressDisplay();
    }

    /**
     * Hide Progress screen
     */
    hideProgress() {
        document.getElementById('trainingProgress').style.display = 'none';
        // Return to main page instead of training menu
        this.hideTrainingMenu();
    }

    /**
     * Update progress display
     */
    updateProgressDisplay() {
        const unlocked = this.trainingData.getUnlockedExercises();
        const container = document.getElementById('progressContainer');
        container.innerHTML = '';

        unlocked.forEach(intervalType => {
            const stats = this.trainingData.getStats(intervalType);
            const config = getIntervalConfig(intervalType);

            const card = document.createElement('div');
            card.className = 'progress-card';

            // Header
            const header = document.createElement('h3');
            header.textContent = config ? config.intervalName : intervalType;
            card.appendChild(header);

            // Stats
            if (stats.totalAttempts > 0) {
                const accuracy = Math.round((stats.easyCount / stats.totalAttempts) * 100);

                const statsDiv = document.createElement('div');
                statsDiv.className = 'progress-stats';
                statsDiv.innerHTML = `
                    <div class="stat-item">
                        <span class="stat-label">Attempts:</span>
                        <span class="stat-value">${stats.totalAttempts}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Accuracy:</span>
                        <span class="stat-value">${accuracy}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Up:</span>
                        <span class="stat-value">${Math.round(stats.upAccuracy * 100)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Down:</span>
                        <span class="stat-value">${Math.round(stats.downAccuracy * 100)}%</span>
                    </div>
                `;
                card.appendChild(statsDiv);

                // Weakness indicators
                const weaknesses = [];
                if (stats.upAccuracy < 0.6) weaknesses.push('Struggles going up');
                if (stats.downAccuracy < 0.6) weaknesses.push('Struggles going down');
                if (stats.lowRangeAccuracy < 0.6) weaknesses.push('Struggles in low range');
                if (stats.highRangeAccuracy < 0.6) weaknesses.push('Struggles in high range');

                if (weaknesses.length > 0) {
                    const weaknessDiv = document.createElement('div');
                    weaknessDiv.className = 'weakness-indicators';
                    weaknessDiv.innerHTML = '<strong>Focus areas:</strong> ' + weaknesses.join(', ');
                    card.appendChild(weaknessDiv);
                }
            } else {
                const noData = document.createElement('p');
                noData.textContent = 'No practice data yet';
                noData.style.color = '#888';
                card.appendChild(noData);
            }

            container.appendChild(card);
        });
    }

    /**
     * Reset training data
     */
    resetTrainingData() {
        if (confirm('Are you sure you want to reset all training data? This cannot be undone.')) {
            this.trainingData.reset();
            this.updateTrainingMenuStats();
            this.updateSettingsDisplay();
            alert('Training data has been reset.');
        }
    }
}
