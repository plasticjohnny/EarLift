/**
 * Training Data Management
 *
 * Handles storage and retrieval of training data using cookies.
 * Tracks user performance, unlocks, and spaced repetition scheduling.
 */

class TrainingData {
    constructor() {
        this.cookieName = 'tonedeath_training_data';
        this.cookieExpireDays = 365;
        this.data = this.loadData();
    }

    /**
     * Initialize default data structure
     */
    getDefaultData() {
        return {
            version: 1,
            unlocked: ['unison'], // Start with only unison unlocked
            forceUnlocked: [], // Exercises force-unlocked by user
            exercises: {
                // Exercise data structure:
                // 'intervalType': {
                //     attempts: [
                //         {
                //             timestamp: Date,
                //             difficulty: 'easy'|'medium'|'hard'|'failed',
                //             direction: 'up'|'down'|'none',
                //             range: 'low'|'middle'|'high',
                //             exerciseIndex: 0-2 (which system exercise)
                //         }
                //     ],
                //     lastPracticed: Date,
                //     nextReview: Date,
                //     easeFactor: 2.5, // For spaced repetition
                //     interval: 1 // Days until next review
                // }
            },
            settings: {
                // Future: allow customization of unlock thresholds, etc.
                unlockThreshold: 0.75, // 75% of last 10 must be "easy"
                unlockWindow: 10, // Last 10 attempts
                priorityBoost: 1.5 // Multiplier for fundamental exercises
            }
        };
    }

    /**
     * Load data from cookie
     */
    loadData() {
        const cookieData = this.getCookie(this.cookieName);
        if (cookieData) {
            try {
                const data = JSON.parse(decodeURIComponent(cookieData));
                // Migrate old data if needed
                return this.migrateData(data);
            } catch (e) {
                console.error('Failed to parse training data:', e);
                return this.getDefaultData();
            }
        }
        return this.getDefaultData();
    }

    /**
     * Save data to cookie
     */
    saveData() {
        const jsonData = JSON.stringify(this.data);
        const encodedData = encodeURIComponent(jsonData);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + this.cookieExpireDays);

        document.cookie = `${this.cookieName}=${encodedData}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
    }

    /**
     * Get cookie by name
     */
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    /**
     * Migrate data from old versions
     */
    migrateData(data) {
        // Add migration logic here if data structure changes
        if (!data.version) {
            data.version = 1;
        }

        // Ensure all required fields exist
        const defaultData = this.getDefaultData();
        return {
            ...defaultData,
            ...data,
            settings: { ...defaultData.settings, ...data.settings }
        };
    }

    /**
     * Record an exercise attempt
     */
    recordAttempt(intervalType, difficulty, direction, range, exerciseIndex) {
        if (!this.data.exercises[intervalType]) {
            this.data.exercises[intervalType] = {
                attempts: [],
                lastPracticed: null,
                nextReview: null,
                easeFactor: 2.5,
                interval: 1
            };
        }

        const exercise = this.data.exercises[intervalType];
        const now = new Date().toISOString();

        // Add attempt
        exercise.attempts.push({
            timestamp: now,
            difficulty: difficulty,
            direction: direction,
            range: range,
            exerciseIndex: exerciseIndex
        });

        // Update spaced repetition data
        exercise.lastPracticed = now;
        this.updateSpacedRepetition(intervalType, difficulty);

        // Check for unlocks
        this.checkUnlocks();

        this.saveData();
    }

    /**
     * Update spaced repetition scheduling
     * Based on SM-2 algorithm
     */
    updateSpacedRepetition(intervalType, difficulty) {
        const exercise = this.data.exercises[intervalType];
        if (!exercise) return;

        let qualityFactor;
        switch (difficulty) {
            case 'easy':
                qualityFactor = 5;
                break;
            case 'medium':
                qualityFactor = 3;
                break;
            case 'hard':
                qualityFactor = 2;
                break;
            case 'failed':
                qualityFactor = 0;
                break;
            default:
                qualityFactor = 3;
        }

        // SM-2 algorithm
        if (qualityFactor < 3) {
            exercise.interval = 1;
            exercise.easeFactor = Math.max(1.3, exercise.easeFactor - 0.2);
        } else {
            if (exercise.interval === 1) {
                exercise.interval = 6;
            } else {
                exercise.interval = Math.round(exercise.interval * exercise.easeFactor);
            }
            exercise.easeFactor = exercise.easeFactor + (0.1 - (5 - qualityFactor) * (0.08 + (5 - qualityFactor) * 0.02));
        }

        // Calculate next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + exercise.interval);
        exercise.nextReview = nextReview.toISOString();
    }

    /**
     * Check if new exercises should be unlocked
     * Cascading unlock system based on mastery
     */
    checkUnlocks() {
        const { unlockThreshold, unlockWindow } = this.data.settings;
        let newUnlocks = [];

        // Tier 1: Unison unlocks the foundational intervals
        if (this.isExerciseReady('unison', unlockThreshold, unlockWindow)) {
            // Unison → Octave, Fifth, Major Third (in order of fundamentals)
            const tier1 = ['octave', 'fifth', 'major-third'];
            tier1.forEach(interval => {
                if (!this.data.unlocked.includes(interval)) {
                    this.data.unlocked.push(interval);
                    newUnlocks.push(interval);
                }
            });
        }

        // Cascading unlocks: Each fundamental interval unlocks related intervals

        // Major Third → 2nds (seconds)
        if (this.isExerciseReady('major-third', unlockThreshold, unlockWindow)) {
            const unlockSet = ['major-second', 'minor-second'];
            unlockSet.forEach(interval => {
                if (!this.data.unlocked.includes(interval)) {
                    this.data.unlocked.push(interval);
                    newUnlocks.push(interval);
                }
            });
        }

        // Fifth → 4th (fourth)
        if (this.isExerciseReady('fifth', unlockThreshold, unlockWindow)) {
            const unlockSet = ['fourth'];
            unlockSet.forEach(interval => {
                if (!this.data.unlocked.includes(interval)) {
                    this.data.unlocked.push(interval);
                    newUnlocks.push(interval);
                }
            });
        }

        // Octave → 6ths (sixths)
        if (this.isExerciseReady('octave', unlockThreshold, unlockWindow)) {
            const unlockSet = ['major-sixth', 'minor-sixth'];
            unlockSet.forEach(interval => {
                if (!this.data.unlocked.includes(interval)) {
                    this.data.unlocked.push(interval);
                    newUnlocks.push(interval);
                }
            });
        }

        // Advanced tier: 2nds, 4th, or 6ths unlock the remaining intervals
        const advancedPrereqs = ['major-second', 'minor-second', 'fourth', 'major-sixth', 'minor-sixth'];
        const hasAdvancedPrereq = advancedPrereqs.some(interval =>
            this.data.unlocked.includes(interval) &&
            this.isExerciseReady(interval, unlockThreshold, unlockWindow)
        );

        if (hasAdvancedPrereq) {
            const advanced = ['minor-third', 'tritone', 'minor-seventh', 'major-seventh'];
            advanced.forEach(interval => {
                if (!this.data.unlocked.includes(interval)) {
                    this.data.unlocked.push(interval);
                    newUnlocks.push(interval);
                }
            });
        }

        // Log new unlocks
        if (newUnlocks.length > 0) {
            console.log('New intervals unlocked:', newUnlocks);
        }

        return newUnlocks;
    }

    /**
     * Check if an exercise meets the unlock threshold
     */
    isExerciseReady(intervalType, threshold, window) {
        const exercise = this.data.exercises[intervalType];
        if (!exercise || !exercise.attempts || exercise.attempts.length < window) {
            return false;
        }

        // Get last N attempts
        const lastAttempts = exercise.attempts.slice(-window);
        const easyCount = lastAttempts.filter(a => a.difficulty === 'easy').length;

        return (easyCount / window) >= threshold;
    }

    /**
     * Check if all intervals in list are unlocked
     */
    areAllUnlocked(intervals) {
        return intervals.every(interval => this.data.unlocked.includes(interval));
    }

    /**
     * Get unlocked exercises
     */
    getUnlockedExercises() {
        return [...this.data.unlocked, ...this.data.forceUnlocked];
    }

    /**
     * Force unlock an exercise
     */
    forceUnlock(intervalType) {
        if (!this.data.forceUnlocked.includes(intervalType) && !this.data.unlocked.includes(intervalType)) {
            this.data.forceUnlocked.push(intervalType);
            this.saveData();
        }
    }

    /**
     * Get statistics for an interval
     */
    getStats(intervalType) {
        const exercise = this.data.exercises[intervalType];
        if (!exercise || !exercise.attempts || exercise.attempts.length === 0) {
            return {
                totalAttempts: 0,
                easyCount: 0,
                mediumCount: 0,
                hardCount: 0,
                failedCount: 0,
                upAccuracy: 0,
                downAccuracy: 0,
                lowRangeAccuracy: 0,
                midRangeAccuracy: 0,
                highRangeAccuracy: 0
            };
        }

        const attempts = exercise.attempts;
        const stats = {
            totalAttempts: attempts.length,
            easyCount: attempts.filter(a => a.difficulty === 'easy').length,
            mediumCount: attempts.filter(a => a.difficulty === 'medium').length,
            hardCount: attempts.filter(a => a.difficulty === 'hard').length,
            failedCount: attempts.filter(a => a.difficulty === 'failed').length
        };

        // Calculate direction accuracy (easy / total for each direction)
        const upAttempts = attempts.filter(a => a.direction === 'up');
        const downAttempts = attempts.filter(a => a.direction === 'down');
        stats.upAccuracy = upAttempts.length > 0
            ? upAttempts.filter(a => a.difficulty === 'easy').length / upAttempts.length
            : 0;
        stats.downAccuracy = downAttempts.length > 0
            ? downAttempts.filter(a => a.difficulty === 'easy').length / downAttempts.length
            : 0;

        // Calculate range accuracy
        const lowAttempts = attempts.filter(a => a.range === 'low');
        const midAttempts = attempts.filter(a => a.range === 'middle');
        const highAttempts = attempts.filter(a => a.range === 'high');
        stats.lowRangeAccuracy = lowAttempts.length > 0
            ? lowAttempts.filter(a => a.difficulty === 'easy').length / lowAttempts.length
            : 0;
        stats.midRangeAccuracy = midAttempts.length > 0
            ? midAttempts.filter(a => a.difficulty === 'easy').length / midAttempts.length
            : 0;
        stats.highRangeAccuracy = highAttempts.length > 0
            ? highAttempts.filter(a => a.difficulty === 'easy').length / highAttempts.length
            : 0;

        return stats;
    }

    /**
     * Reset all data
     */
    reset() {
        this.data = this.getDefaultData();
        this.saveData();
    }

    /**
     * Get fundamental priority for an interval
     * Lower number = more fundamental (higher priority)
     * Based on unlock order
     */
    getFundamentalPriority(intervalType) {
        const priorityOrder = [
            'unison',           // 0 - Most fundamental
            'octave',           // 1
            'fifth',            // 2
            'major-third',      // 3
            'major-second',     // 4
            'minor-second',     // 5
            'fourth',           // 6
            'major-sixth',      // 7
            'minor-sixth',      // 8
            'minor-third',      // 9
            'tritone',          // 10
            'minor-seventh',    // 11
            'major-seventh'     // 12 - Least fundamental
        ];

        const index = priorityOrder.indexOf(intervalType);
        return index !== -1 ? index : 999; // Unknown intervals get lowest priority
    }

    /**
     * Export data for debugging
     */
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }
}
