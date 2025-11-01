/**
 * FTUE Manager
 *
 * Manages First Time User Experience tutorial unlock progression.
 * Tracks completion state per profile and controls what tutorials/features are accessible.
 */

class FTUEManager {
    constructor(profileName = 'Default') {
        this.profileName = profileName;
        this.storageKey = `ftue_${profileName}`;

        // Tutorial order - must be completed in sequence to unlock Training Mode
        this.tutorialSequence = [
            'earTrainingOverview',
            'unisonOverview'
        ];

        // Bonus tutorials that unlock based on performance (not required for Training Mode)
        this.bonusTutorials = [
            'glissandoOverview',  // Unlocks when Slider Glissando threshold met
            'intervalOverview'    // Unlocks when Unison Match threshold met
        ];

        // Session-only temporary unlock flag (not persisted)
        this.temporarilyUnlockedAll = false;

        // Initialize state from localStorage or create new
        this.state = this.loadState();
    }

    /**
     * Load FTUE state from localStorage
     */
    loadState() {
        // Default state: only first tutorial unlocked
        const defaultState = {
            earTrainingOverview: { unlocked: true, completed: false },
            unisonOverview: { unlocked: false, completed: false },
            glissandoOverview: { unlocked: false, completed: false },
            intervalOverview: { unlocked: false, completed: false },
            trainingModeUnlocked: false,
            glissandoOverviewPromptActive: false // True when Glissando unlocked but not completed
        };

        const stored = localStorage.getItem(this.storageKey);

        if (stored) {
            try {
                const parsedState = JSON.parse(stored);

                // Merge stored state with default state to handle new tutorials added later
                // This ensures all expected keys exist even if loading old saved state
                return {
                    ...defaultState,
                    ...parsedState,
                    // Deep merge tutorial objects to preserve structure
                    earTrainingOverview: { ...defaultState.earTrainingOverview, ...parsedState.earTrainingOverview },
                    unisonOverview: { ...defaultState.unisonOverview, ...parsedState.unisonOverview },
                    glissandoOverview: { ...defaultState.glissandoOverview, ...parsedState.glissandoOverview },
                    intervalOverview: { ...defaultState.intervalOverview, ...parsedState.intervalOverview }
                };
            } catch (e) {
                console.error('Failed to parse FTUE state:', e);
            }
        }

        return defaultState;
    }

    /**
     * Save FTUE state to localStorage
     */
    saveState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    /**
     * Check if a tutorial is unlocked (accessible)
     */
    isTutorialUnlocked(tutorialName) {
        // Check temporary unlock flag first
        if (this.temporarilyUnlockedAll) {
            return true;
        }
        return this.state[tutorialName]?.unlocked || false;
    }

    /**
     * Check if a tutorial is completed
     */
    isTutorialCompleted(tutorialName) {
        return this.state[tutorialName]?.completed || false;
    }

    /**
     * Mark a tutorial as complete and unlock the next one
     * Returns the name of the newly unlocked tutorial (or 'trainingMode' if all required done)
     */
    markTutorialComplete(tutorialName) {
        console.log(`[FTUE] Marking ${tutorialName} as complete`);

        if (!this.state[tutorialName]) {
            console.warn(`[FTUE] Unknown tutorial: ${tutorialName}`);
            return null;
        }

        // Mark current tutorial as completed
        this.state[tutorialName].completed = true;

        // Special handling for glissandoOverview - clear the prompt flag
        if (tutorialName === 'glissandoOverview') {
            this.state.glissandoOverviewPromptActive = false;
        }

        // Find the next tutorial in sequence
        const currentIndex = this.tutorialSequence.indexOf(tutorialName);
        const nextTutorialName = this.tutorialSequence[currentIndex + 1];

        let unlockedItem = null;

        // Special progression for Unison Overview -> Training Mode (but NOT Glissando)
        if (tutorialName === 'unisonOverview') {
            // Unlock Training Mode immediately after Unison Overview
            this.state.trainingModeUnlocked = true;
            unlockedItem = 'trainingMode';
            console.log('[FTUE] Unison Overview complete! Training Mode unlocked!');
            // Note: Glissando Overview will be unlocked when Slider Glissando threshold is met
        } else if (nextTutorialName) {
            // For other tutorials, unlock next in sequence normally
            this.state[nextTutorialName].unlocked = true;
            unlockedItem = nextTutorialName;
            console.log(`[FTUE] Unlocked next tutorial: ${nextTutorialName}`);
        } else {
            // All required tutorials complete
            // Note: Interval Overview unlocks when user shows competency in Unison Match
            unlockedItem = 'allComplete';
            console.log('[FTUE] All required tutorials complete!');
        }

        this.saveState();
        return unlockedItem;
    }

    /**
     * Check if Training Mode is unlocked
     */
    isTrainingModeUnlocked() {
        // Check temporary unlock flag first
        if (this.temporarilyUnlockedAll) {
            return true;
        }
        return this.state.trainingModeUnlocked || false;
    }

    /**
     * Get progress information for unlocking Training Mode
     * Only counts tutorials required for Training Mode (not bonus tutorials)
     */
    getProgress() {
        const completed = this.tutorialSequence.filter(name =>
            this.state[name]?.completed
        ).length;

        return {
            completed,
            total: this.tutorialSequence.length,
            percentage: Math.round((completed / this.tutorialSequence.length) * 100)
        };
    }

    /**
     * Check if tutorials are actually completed (not just temporarily unlocked)
     */
    areAllTutorialsCompleted() {
        return this.tutorialSequence.every(name => this.state[name]?.completed);
    }

    /**
     * Unlock all tutorials and Training Mode instantly (for "Unlock All" button)
     * This is a TEMPORARY unlock that does NOT persist - on refresh, everything will be locked again
     */
    unlockAll() {
        console.log('[FTUE] Temporarily unlocking all tutorials and Training Mode (session only)');

        // Set session-only flag (not saved to localStorage)
        this.temporarilyUnlockedAll = true;

        // Do NOT save state - this unlock is temporary!
    }

    /**
     * Reset FTUE state (for profile reset or testing)
     */
    reset() {
        console.log('[FTUE] Resetting FTUE state');
        this.state = {
            earTrainingOverview: { unlocked: true, completed: false },
            unisonOverview: { unlocked: false, completed: false },
            glissandoOverview: { unlocked: false, completed: false },
            intervalOverview: { unlocked: false, completed: false },
            trainingModeUnlocked: false,
            glissandoOverviewPromptActive: false
        };
        this.saveState();
    }

    /**
     * Switch to a different profile
     */
    switchProfile(profileName) {
        this.profileName = profileName;
        this.storageKey = `ftue_${profileName}`;
        this.state = this.loadState();
        // Reset temporary unlock flag when switching profiles
        this.temporarilyUnlockedAll = false;
    }

    /**
     * Check if Slider Glissando threshold has been met
     * Called after each training attempt to see if Glissando Overview should unlock
     * Requires: trainingData instance to check performance
     */
    checkSliderGlissandoThreshold(trainingData) {
        // Only check if:
        // 1. Unison Overview is completed
        // 2. Glissando Overview is not yet unlocked
        // 3. Training Mode is unlocked (user is practicing)
        if (!this.state.unisonOverview.completed ||
            this.state.glissandoOverview.unlocked ||
            !this.state.trainingModeUnlocked) {
            return false;
        }

        // Check if user has unison exercise data
        const unisonExercise = trainingData.data.exercises['unison'];
        if (!unisonExercise || !unisonExercise.attempts || unisonExercise.attempts.length === 0) {
            return false;
        }

        // Filter for Slider Glissando attempts only (exerciseIndex === 1)
        const sliderAttempts = unisonExercise.attempts.filter(a => a.exerciseIndex === 1);

        if (sliderAttempts.length < 5) {
            return false; // Need at least 5 attempts
        }

        // Check threshold: 4/5 last attempts are "easy" OR 8/10 last attempts are "easy"/"medium"
        const last5 = sliderAttempts.slice(-5);
        const last10 = sliderAttempts.slice(-10);

        // Option 1: 4/5 easy
        const easyIn5 = last5.filter(a => a.difficulty === 'easy').length;
        if (easyIn5 >= 4) {
            this.unlockGlissandoOverview();
            return true;
        }

        // Option 2: 8/10 easy or medium (only if we have 10 attempts)
        if (sliderAttempts.length >= 10) {
            const easyOrMediumIn10 = last10.filter(a =>
                a.difficulty === 'easy' || a.difficulty === 'medium'
            ).length;
            if (easyOrMediumIn10 >= 8) {
                this.unlockGlissandoOverview();
                return true;
            }
        }

        return false;
    }

    /**
     * Unlock Glissando Overview and activate the prompt
     */
    unlockGlissandoOverview() {
        console.log('[FTUE] Slider Glissando threshold met! Unlocking Glissando Overview');
        this.state.glissandoOverview.unlocked = true;
        this.state.glissandoOverviewPromptActive = true;
        this.saveState();

        // Dispatch event so UI can respond (highlight card, show animations, etc.)
        window.dispatchEvent(new CustomEvent('glissandoOverviewUnlocked'));
    }

    /**
     * Check if Glissando Overview prompt is active
     * (unlocked but not completed - should prompt user to do it)
     */
    isGlissandoPromptActive() {
        return this.state.glissandoOverviewPromptActive || false;
    }

    /**
     * Check if Unison Match threshold has been met
     * Called after each training attempt to see if Interval Overview should unlock
     * Requires: trainingData instance to check performance
     */
    checkUnisonMatchThreshold(trainingData) {
        // Only check if:
        // 1. Glissando Overview is completed (user has learned vocal matching)
        // 2. Interval Overview is not yet unlocked
        if (!this.state.glissandoOverview.completed ||
            this.state.intervalOverview.unlocked) {
            return false;
        }

        // Check if user has unison exercise data
        const unisonExercise = trainingData.data.exercises['unison'];
        if (!unisonExercise || !unisonExercise.attempts || unisonExercise.attempts.length === 0) {
            return false;
        }

        // Filter for Unison Match attempts only (exerciseIndex === 0)
        const matchAttempts = unisonExercise.attempts.filter(a => a.exerciseIndex === 0);

        if (matchAttempts.length < 5) {
            return false; // Need at least 5 attempts
        }

        // Check threshold: 4/5 last attempts are "easy" OR 8/10 last attempts are "easy"/"medium"
        const last5 = matchAttempts.slice(-5);
        const last10 = matchAttempts.slice(-10);

        // Option 1: 4/5 easy
        const easyIn5 = last5.filter(a => a.difficulty === 'easy').length;
        if (easyIn5 >= 4) {
            this.unlockIntervalOverview();
            return true;
        }

        // Option 2: 8/10 easy or medium (only if we have 10 attempts)
        if (matchAttempts.length >= 10) {
            const easyOrMediumIn10 = last10.filter(a =>
                a.difficulty === 'easy' || a.difficulty === 'medium'
            ).length;
            if (easyOrMediumIn10 >= 8) {
                this.unlockIntervalOverview();
                return true;
            }
        }

        return false;
    }

    /**
     * Unlock Interval Overview
     */
    unlockIntervalOverview() {
        console.log('[FTUE] Unison Match threshold met! Unlocking Interval Overview');
        this.state.intervalOverview.unlocked = true;
        this.saveState();

        // Dispatch event so UI can respond (highlight card, show animations, etc.)
        window.dispatchEvent(new CustomEvent('intervalOverviewUnlocked'));
    }

    /**
     * Get display name for a tutorial
     */
    getTutorialDisplayName(tutorialName) {
        const displayNames = {
            'earTrainingOverview': 'Ear Training Overview',
            'unisonOverview': 'Unison Overview',
            'glissandoOverview': 'Glissando Overview',
            'intervalOverview': 'Interval Overview'
        };
        return displayNames[tutorialName] || tutorialName;
    }

    /**
     * Get the next locked tutorial name (for "Complete X first" messages)
     */
    getNextLockedTutorial() {
        for (const tutorialName of this.tutorialSequence) {
            if (!this.state[tutorialName].unlocked) {
                return tutorialName;
            }
        }
        return null;
    }

    /**
     * Get the previous tutorial name (for lock messages)
     */
    getPreviousTutorial(tutorialName) {
        const index = this.tutorialSequence.indexOf(tutorialName);
        if (index > 0) {
            return this.tutorialSequence[index - 1];
        }
        return null;
    }
}

// Export for use in other files
window.FTUEManager = FTUEManager;
