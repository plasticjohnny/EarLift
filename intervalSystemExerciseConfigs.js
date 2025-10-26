/**
 * Interval System Exercise Configurations
 *
 * Defines guided singing exercises for each interval type.
 * These are "System Exercises" designed for spaced repetition learning.
 *
 * Exercise Step Actions:
 * - Match: User should sing the note while it's playing
 * - Sing: User should sing the note while it's NOT playing
 * - Listen: User should listen (not sing)
 * - Test: User plays the note while singing to check accuracy
 * - Stop: User stops singing
 *
 * Audio States:
 * - root: Only root note playing
 * - interval: Only interval note playing
 * - both: Both notes playing
 * - none: No audio playing
 */

const INTERVAL_SYSTEM_EXERCISES = Object.freeze({
    // ===== UNISON =====
    unison: [
        {
            name: "Unison Match",
            steps: [
                {
                    instruction: "Listen to the tone carefully",
                    audioState: "root",
                    userAction: "listen",
                    actionButtonLabel: "then Match It"
                },
                {
                    instruction: "Match the tone with your voice and hold it steady",
                    audioState: "root",
                    userAction: "match-root",
                    actionButtonLabel: "then Sing Alone"
                },
                {
                    instruction: "Keep singing on pitch",
                    audioState: "none",
                    userAction: "sing-root",
                    actionButtonLabel: "then Check Pitch"
                },
                {
                    instruction: "Check your pitch - are you still matching?",
                    audioState: "root",
                    userAction: "test-root",
                    actionButtonLabel: "Next Note"
                }
            ]
        },
        {
            name: "Glissando",
            randomizeDirection: true,
            hideRootIndicator: true,
            steps: [
                {
                    instruction: "Sing a steady low note towards the bottom of your range",
                    instructionDown: "Sing a steady high note towards the top of your range",
                    audioState: "none",
                    userAction: "sing-root",
                    actionButtonLabel: "then Glide"
                },
                {
                    instruction: "Steadily raise the pitch to higher notes to the top of your range",
                    instructionDown: "Steadily lower the pitch to lower notes to the bottom of your range",
                    audioState: "none",
                    userAction: "glissando-up",
                    actionButtonLabel: "Done"
                }
            ]
        }
    ],

    // ===== INTERVALS (Minor 2nd through Octave) =====
    // These exercises apply to all intervals except unison

    intervals: [
        // Exercise 1: Hear the interval
        {
            name: "Hear the Interval",
            steps: [
                {
                    instruction: "Match the root note with your voice",
                    audioState: "root",
                    userAction: "match-root",
                    actionButtonLabel: "then Hear Both"
                },
                {
                    instruction: "Listen to both notes together while holding the root",
                    audioState: "both",
                    userAction: "listen",
                    actionButtonLabel: "Next Note"
                }
            ]
        },

        // Exercise 2: Stay on Root
        {
            name: "Stay on Root",
            steps: [
                {
                    instruction: "Match the root note with your voice",
                    audioState: "root",
                    userAction: "match-root",
                    actionButtonLabel: "then Hear Both"
                },
                {
                    instruction: "Keep singing the root - don't follow the interval",
                    audioState: "both",
                    userAction: "match-root",
                    actionButtonLabel: "then Interval Only"
                },
                {
                    instruction: "Hold the root note steady",
                    audioState: "interval",
                    userAction: "sing-root",
                    actionButtonLabel: "then Check Root"
                },
                {
                    instruction: "Check your pitch - are you still on the root?",
                    audioState: "root",
                    userAction: "test-root",
                    actionButtonLabel: "Next Note"
                }
            ]
        },

        // Exercise 3: Back and forth
        {
            name: "Back and Forth",
            steps: [
                {
                    instruction: "Match the root note with your voice",
                    audioState: "root",
                    userAction: "match-root",
                    actionButtonLabel: "then Hear Interval"
                },
                {
                    instruction: "Switch up to match the interval note",
                    audioState: "interval",
                    userAction: "match-interval",
                    actionButtonLabel: "then Hear Root"
                },
                {
                    instruction: "Switch back down to the root note",
                    audioState: "root",
                    userAction: "match-root",
                    actionButtonLabel: "then Hear Interval"
                },
                {
                    instruction: "Switch up to the interval again",
                    audioState: "interval",
                    userAction: "match-interval",
                    actionButtonLabel: "Next Note"
                }
            ]
        },

        // Exercise 4: Root Holding
        {
            name: "Root Holding",
            steps: [
                {
                    instruction: "Match the root note with your voice",
                    audioState: "root",
                    userAction: "match-root",
                    actionButtonLabel: "then Hear Both"
                },
                {
                    instruction: "Keep holding the root",
                    audioState: "both",
                    userAction: "match-root",
                    actionButtonLabel: "then Shift Up"
                },
                {
                    instruction: "Shift your voice up to the interval",
                    audioState: "both",
                    userAction: "match-interval",
                    actionButtonLabel: "then Interval Only"
                },
                {
                    instruction: "Hold the interval note steady",
                    audioState: "interval",
                    userAction: "match-interval",
                    actionButtonLabel: "Next Note"
                }
            ]
        },

        // Exercise 5: Match and sing
        {
            name: "Match and Sing",
            steps: [
                {
                    instruction: "Match the root note with your voice",
                    audioState: "root",
                    userAction: "match-root",
                    actionButtonLabel: "then Sing It"
                },
                {
                    instruction: "Sing the interval from memory",
                    audioState: "none",
                    userAction: "sing-interval",
                    actionButtonLabel: "then Check It"
                },
                {
                    instruction: "Check how close you were - adjust with glissando",
                    audioState: "interval",
                    userAction: "test-interval",
                    actionButtonLabel: "then Hear Root"
                },
                {
                    instruction: "Back to the root note",
                    audioState: "root",
                    userAction: "match-root",
                    actionButtonLabel: "Next Note"
                }
            ]
        },

        // Exercise 6: Hear and Sing
        {
            name: "Hear and Sing",
            steps: [
                {
                    instruction: "Listen to the root note - don't sing yet",
                    audioState: "root",
                    userAction: "listen",
                    actionButtonLabel: "then Sing It"
                },
                {
                    instruction: "Sing the interval from memory",
                    audioState: "none",
                    userAction: "sing-interval",
                    actionButtonLabel: "then Check It"
                },
                {
                    instruction: "Check your accuracy - adjust with glissando",
                    audioState: "interval",
                    userAction: "test-interval",
                    actionButtonLabel: "Next Note"
                }
            ]
        }
    ]
});

/**
 * Get system exercises for a specific interval type
 * @param {string} intervalType - 'unison', 'minor-second', 'major-second', etc.
 * @returns {Array} Array of exercise objects
 */
function getSystemExercisesForInterval(intervalType) {
    if (intervalType === 'unison') {
        return INTERVAL_SYSTEM_EXERCISES.unison;
    }
    // All other intervals use the same 6 exercises
    return INTERVAL_SYSTEM_EXERCISES.intervals;
}

/**
 * Get total number of exercises for an interval type
 * @param {string} intervalType - 'unison', 'minor-second', etc.
 * @returns {number} Number of exercises
 */
function getSystemExerciseCount(intervalType) {
    const exercises = getSystemExercisesForInterval(intervalType);
    return exercises.length;
}
