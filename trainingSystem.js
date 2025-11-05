/**
 * Training System
 *
 * Handles exercise selection algorithm using spaced repetition,
 * fundamental priorities, and weakness targeting.
 */

class TrainingSystem {
    constructor(trainingData) {
        this.trainingData = trainingData;
        this.vocalRange = null;
    }

    /**
     * Initialize with vocal range for direction/range detection
     */
    setVocalRange(lowFreq, highFreq) {
        this.vocalRange = {
            low: lowFreq,
            high: highFreq,
            lowThird: lowFreq + (highFreq - lowFreq) / 3,
            highThird: lowFreq + 2 * (highFreq - lowFreq) / 3
        };
    }

    /**
     * Select the next exercise to practice
     * Returns: { intervalType, exerciseIndex, targetNote }
     */
    selectNextExercise() {
        const unlockedIntervals = this.trainingData.getUnlockedExercises();

        if (unlockedIntervals.length === 0) {
            console.error('No unlocked intervals available');
            return null;
        }

        // Calculate weight for each unlocked interval
        const candidates = unlockedIntervals.map(intervalType => {
            const weight = this.calculateExerciseWeight(intervalType);
            return { intervalType, weight };
        });

        // Sort by weight (higher = more important to practice)
        candidates.sort((a, b) => b.weight - a.weight);

        // Use weighted random selection from top candidates
        const topCandidates = candidates.slice(0, Math.min(5, candidates.length));
        const selected = this.weightedRandomSelect(topCandidates);

        // Select exercise variant (0-2 for most intervals, 0-2 for unison)
        const exerciseIndex = this.selectExerciseVariant(selected.intervalType);

        // Select target note (considering weak areas)
        const targetNote = this.selectTargetNote(selected.intervalType);

        return {
            intervalType: selected.intervalType,
            exerciseIndex: exerciseIndex,
            targetNote: targetNote
        };
    }

    /**
     * Calculate weight for an interval
     * Higher weight = higher priority to practice
     */
    calculateExerciseWeight(intervalType) {
        const settings = this.trainingData.data.settings;
        let weight = 1.0;

        // Factor 1: Spaced repetition timing
        const timingWeight = this.getTimingWeight(intervalType);
        weight *= timingWeight;

        // Factor 2: Fundamental priority (configurable boost)
        const fundamentalPriority = this.trainingData.getFundamentalPriority(intervalType);
        const maxPriority = 12; // Highest priority value
        const priorityNormalized = (maxPriority - fundamentalPriority) / maxPriority;
        const fundamentalWeight = 1.0 + (priorityNormalized * (settings.priorityBoost - 1.0));
        weight *= fundamentalWeight;

        // Factor 3: Weakness targeting (lower accuracy = higher weight)
        const weaknessWeight = this.getWeaknessWeight(intervalType);
        weight *= weaknessWeight;

        return weight;
    }

    /**
     * Calculate timing weight based on when exercise is due for review
     * Returns multiplier (0.5 to 3.0)
     */
    getTimingWeight(intervalType) {
        const exercise = this.trainingData.data.exercises[intervalType];

        // If never practiced, give high priority
        if (!exercise || !exercise.lastPracticed) {
            return 2.5;
        }

        const now = new Date();
        const nextReview = new Date(exercise.nextReview);
        const lastPracticed = new Date(exercise.lastPracticed);

        // If overdue for review, give high priority
        if (now >= nextReview) {
            const daysOverdue = (now - nextReview) / (1000 * 60 * 60 * 24);
            return Math.min(3.0, 2.0 + daysOverdue * 0.2);
        }

        // If recently practiced, lower priority
        const hoursSinceLastPractice = (now - lastPracticed) / (1000 * 60 * 60);
        if (hoursSinceLastPractice < 1) {
            return 0.5; // Just practiced, very low priority
        }

        // Not yet due, but give some weight based on how close
        const daysUntilDue = (nextReview - now) / (1000 * 60 * 60 * 24);
        if (daysUntilDue <= 1) {
            return 1.5; // Due soon
        } else if (daysUntilDue <= 3) {
            return 1.2; // Coming up
        } else {
            return 1.0; // Not close to due
        }
    }

    /**
     * Calculate weakness weight - target areas where user struggles
     * Returns multiplier (1.0 to 2.5)
     */
    getWeaknessWeight(intervalType) {
        const stats = this.trainingData.getStats(intervalType);

        if (stats.totalAttempts === 0) {
            return 1.5; // New exercise, moderate priority
        }

        // Calculate overall accuracy
        const overallAccuracy = stats.easyCount / stats.totalAttempts;

        // Lower accuracy = higher weight
        if (overallAccuracy < 0.5) {
            return 2.5; // Struggling, high priority
        } else if (overallAccuracy < 0.7) {
            return 1.8; // Some difficulty
        } else if (overallAccuracy < 0.85) {
            return 1.3; // Decent but needs practice
        } else {
            return 1.0; // Doing well
        }
    }

    /**
     * Weighted random selection from candidates
     */
    weightedRandomSelect(candidates) {
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let random = Math.random() * totalWeight;

        for (const candidate of candidates) {
            random -= candidate.weight;
            if (random <= 0) {
                return candidate;
            }
        }

        return candidates[0]; // Fallback
    }

    /**
     * Select exercise variant based on weak areas
     */
    selectExerciseVariant(intervalType) {
        // Special progressive logic for unison exercises (Slider Glissando vs Match the Tone)
        if (intervalType === 'unison') {
            return this.selectUnisonExerciseVariant();
        }

        const stats = this.trainingData.getStats(intervalType);

        // Get system exercises for this interval
        const config = getIntervalConfig(intervalType);
        if (!config) return 0;

        const exercises = getSystemExercisesForInterval(intervalType);
        const numExercises = exercises.length;

        // If not enough data, random selection
        if (stats.totalAttempts < 5) {
            return Math.floor(Math.random() * numExercises);
        }

        // Weight each exercise variant by its performance
        const variantWeights = [];
        for (let i = 0; i < numExercises; i++) {
            const variantAttempts = this.trainingData.data.exercises[intervalType]?.attempts.filter(
                a => a.exerciseIndex === i
            ) || [];

            if (variantAttempts.length === 0) {
                variantWeights.push(2.0); // Never tried, high priority
            } else {
                const easyCount = variantAttempts.filter(a => a.difficulty === 'easy').length;
                const accuracy = easyCount / variantAttempts.length;
                variantWeights.push(accuracy < 0.7 ? 1.8 : 1.0);
            }
        }

        // Weighted random selection
        return this.weightedRandomSelect(
            variantWeights.map((weight, index) => ({ index, weight }))
        ).index;
    }

    /**
     * Select unison exercise variant with progressive prioritization
     * Slider Glissando is prioritized initially to teach beat frequency detection,
     * then phases out in favor of Match the Tone once competency is demonstrated.
     */
    selectUnisonExerciseVariant() {
        const MATCH_THE_TONE_INDEX = 0;
        const SLIDER_GLISSANDO_INDEX = 1;

        // Testing mode: Always skip Slider Glissando, use Match the Tone only
        if (window.earTrainerApp && window.earTrainerApp.isTestingMode) {
            console.log('[Testing Mode] Unison: Skipping Slider Glissando, using Match the Tone');
            return MATCH_THE_TONE_INDEX;
        }

        const exercise = this.trainingData.data.exercises['unison'];

        // If never practiced, start with Slider Glissando
        if (!exercise || !exercise.attempts || exercise.attempts.length === 0) {
            console.log('[Training] Unison: First time, starting with Slider Glissando');
            return SLIDER_GLISSANDO_INDEX;
        }

        // Check if Slider Glissando threshold is met
        const sliderThresholdMet = this.isSliderGlissandoThresholdMet();

        if (!sliderThresholdMet) {
            // Before threshold: ONLY Slider Glissando
            console.log('[Training] Unison: Slider threshold not met, continuing with Slider Glissando');
            return SLIDER_GLISSANDO_INDEX;
        }

        console.log('[Training] Unison: Slider threshold MET, transitioning to Match the Tone');

        // After threshold: Check if user is struggling with Match the Tone
        const matchAttempts = exercise.attempts.filter(a => a.exerciseIndex === MATCH_THE_TONE_INDEX);

        if (matchAttempts.length === 0) {
            // Haven't tried Match the Tone yet, start with it
            console.log('[Training] Unison: First time with Match the Tone');
            return MATCH_THE_TONE_INDEX;
        }

        // Check Match the Tone performance (last 5 attempts)
        const recentMatchAttempts = matchAttempts.slice(-5);
        const matchEasyCount = recentMatchAttempts.filter(a => a.difficulty === 'easy').length;
        const matchStrugglingThreshold = 3; // Need at least 3/5 easy to be doing well

        const isStrugglingWithMatch = recentMatchAttempts.length >= 5 &&
                                       matchEasyCount < matchStrugglingThreshold;

        if (isStrugglingWithMatch) {
            // Struggling with Match the Tone: 50/50 chance between both
            const selected = Math.random() < 0.5 ? MATCH_THE_TONE_INDEX : SLIDER_GLISSANDO_INDEX;
            console.log('[Training] Unison: Struggling with Match, selected:', selected === 0 ? 'Match' : 'Slider');
            return selected;
        }

        // Doing well: Mostly Match the Tone, occasionally Slider Glissando (10% chance)
        const selected = Math.random() < 0.9 ? MATCH_THE_TONE_INDEX : SLIDER_GLISSANDO_INDEX;
        console.log('[Training] Unison: Doing well, selected:', selected === 0 ? 'Match' : 'Slider');
        return selected;
    }

    /**
     * Check if Slider Glissando threshold is met
     * Threshold 1: 4 out of last 5 attempts are "easy"
     * Threshold 2: 8 out of last 10 attempts are "easy" or "medium"
     */
    isSliderGlissandoThresholdMet() {
        const SLIDER_GLISSANDO_INDEX = 1;
        const exercise = this.trainingData.data.exercises['unison'];

        if (!exercise || !exercise.attempts) {
            return false;
        }

        const sliderAttempts = exercise.attempts.filter(a => a.exerciseIndex === SLIDER_GLISSANDO_INDEX);

        if (sliderAttempts.length < 5) {
            return false; // Need at least 5 attempts
        }

        // Threshold 1: 4 out of last 5 are "easy"
        const last5 = sliderAttempts.slice(-5);
        const last5EasyCount = last5.filter(a => a.difficulty === 'easy').length;

        if (last5EasyCount >= 4) {
            console.log('[Training] Slider threshold met: 4/5 last attempts were easy');
            return true;
        }

        // Threshold 2: 8 out of last 10 are "easy" or "medium"
        if (sliderAttempts.length >= 10) {
            const last10 = sliderAttempts.slice(-10);
            const last10EasyOrMediumCount = last10.filter(a =>
                a.difficulty === 'easy' || a.difficulty === 'medium'
            ).length;

            if (last10EasyOrMediumCount >= 8) {
                console.log('[Training] Slider threshold met: 8/10 last attempts were easy/medium');
                return true;
            }
        }

        return false;
    }

    /**
     * Select target note considering weak areas in direction/range
     * Returns frequency
     */
    selectTargetNote(intervalType) {
        if (!this.vocalRange) {
            // Fallback: middle of a default range
            return 220 + Math.random() * 220; // A3 to A4
        }

        const stats = this.trainingData.getStats(intervalType);
        const config = getIntervalConfig(intervalType);

        if (!config) {
            // Fallback to middle of range
            return (this.vocalRange.low + this.vocalRange.high) / 2;
        }

        // Determine target range based on weaknesses
        let targetRange;
        if (stats.totalAttempts < 5) {
            // Not enough data, use middle
            targetRange = 'middle';
        } else {
            // Target the weakest range
            const rangeAccuracies = {
                low: stats.lowRangeAccuracy,
                middle: stats.midRangeAccuracy,
                high: stats.highRangeAccuracy
            };

            // Find lowest accuracy range
            targetRange = Object.entries(rangeAccuracies).reduce((min, [range, accuracy]) =>
                accuracy < rangeAccuracies[min] ? range : min, 'middle'
            );

            // 70% chance to target weakness, 30% random (for variety)
            if (Math.random() > 0.7) {
                const ranges = ['low', 'middle', 'high'];
                targetRange = ranges[Math.floor(Math.random() * ranges.length)];
            }
        }

        // Select frequency within target range
        let minFreq, maxFreq;
        if (targetRange === 'low') {
            minFreq = this.vocalRange.low;
            maxFreq = this.vocalRange.lowThird;
        } else if (targetRange === 'high') {
            minFreq = this.vocalRange.highThird;
            maxFreq = this.vocalRange.high;
        } else { // middle
            minFreq = this.vocalRange.lowThird;
            maxFreq = this.vocalRange.highThird;
        }

        // Adjust for interval direction weaknesses
        const semitones = config.semitones;
        if (semitones > 0 && stats.totalAttempts >= 5) {
            // Check if user struggles with up or down
            if (stats.downAccuracy < stats.upAccuracy - 0.15) {
                // Struggles with down, target higher notes (so interval goes down)
                minFreq = (minFreq + maxFreq) / 2;
            } else if (stats.upAccuracy < stats.downAccuracy - 0.15) {
                // Struggles with up, target lower notes (so interval goes up)
                maxFreq = (minFreq + maxFreq) / 2;
            }
        }

        // Return random frequency in target range
        return minFreq + Math.random() * (maxFreq - minFreq);
    }

    /**
     * Detect direction and range from actual practiced note
     */
    detectDirectionAndRange(rootFreq, intervalFreq) {
        // Detect direction
        let direction = 'none';
        if (intervalFreq > rootFreq * 1.01) {
            direction = 'up';
        } else if (intervalFreq < rootFreq * 0.99) {
            direction = 'down';
        }

        // Detect range (based on root note position in vocal range)
        let range = 'middle';
        if (this.vocalRange) {
            if (rootFreq <= this.vocalRange.lowThird) {
                range = 'low';
            } else if (rootFreq >= this.vocalRange.highThird) {
                range = 'high';
            }
        }

        return { direction, range };
    }

    /**
     * Record exercise result
     */
    recordExerciseResult(intervalType, difficulty, rootFreq, intervalFreq, exerciseIndex, level = 1) {
        const { direction, range } = this.detectDirectionAndRange(rootFreq, intervalFreq);

        const result = this.trainingData.recordAttempt(
            intervalType,
            difficulty,
            direction,
            range,
            exerciseIndex,
            level
        );

        // Check for new unlocks
        const newUnlocks = this.trainingData.checkUnlocks();

        // Return both interval unlocks and level-up info
        return {
            newUnlocks: newUnlocks,
            leveledUp: result.leveledUp
        };
    }
}
