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
    // ===== TUTORIAL SYSTEM =====
    tutorial: [
        {
            name: "Glissando",
            randomizeDirection: true,
            hideRootIndicator: true,
            steps: [
                {
                    command: "Sing",
                    instruction: "a steady low note towards the bottom of your range",
                    instructionDown: "a steady high note towards the top of your range",
                    audioState: "none",
                    userAction: "sing-root"
                },
                {
                    command: "Glide",
                    instruction: "steadily raising the pitch to higher notes to the top of your range",
                    instructionDown: "steadily lowering the pitch to lower notes to the bottom of your range",
                    audioState: "none",
                    userAction: "glissando-up"
                }
            ]
        }
    ],

    // ===== UNISON =====
    unison: [
        {
            name: "Unison Match Up",
            steps: [
                {
                    command: "Listen",
                    instruction: "to the tone and how it feels inside of you",
                    audioState: "root",
                    userAction: "listen"
                },
                {
                    command: "Start singing",
                    instruction: "a low note at the bottom of your range and use glissando until you match the note. ",
                    audioState: "root",
                    userAction: "match-root"
                },
                {
                    command: "Listen to",
                    instruction: "how it feels to sing in unison. Try and move your singing pitch up and down a bit to learn the feel.",
                    audioState: "root",
                    userAction: "match-root"
                },
            ]

        },
        {
            name: "Unison Match Down",
            steps: [
                {
                    command: "Listen",
                    instruction: "to the tone and how it feels inside of you",
                    audioState: "root",
                    userAction: "listen"
                },
                {
                    command: "Start singing",
                    instruction: "a high note at the top of your range and use glissando until you match the note. ",
                    audioState: "root",
                    userAction: "match-root"
                },
                {
                    command: "Listen to",
                    instruction: "how it feels to sing in unison. Try and move your singing pitch up and down a bit to better learn the feel.",
                    audioState: "root",
                    userAction: "match-root"
                },
            ]

        },

    ],

    // ===== INTERVALS (Minor 2nd through Octave) =====
    // These exercises apply to all intervals except unison

    intervals: [
        // Exercise 1: Hear the interval
        {
            name: "Hear the Combo",
            steps: [
                {
                    command: "Match",
                    instruction: "the root note with your voice and hold the root note.",
                    audioState: "root",
                    userAction: "match-root"
                },
                {
                    command: "Keep singing",
                    instruction: "the root and hear both notes together. Listen to how the note your singing and the interval feel.",
                    audioState: "both",
                    userAction: "listen"
                }
            ]
        },


        // Exercise 2: Stay on Root
        {
            name: "Stay on Root",
            steps: [
                {
                    command: "Match",
                    instruction: "the root note with your voice and hold the root note.",
                    audioState: "root",
                    userAction: "match-root"
                },
                {
                    command: "Keep singing",
                    instruction: "the root and your singing with the interval. Listen to how they feel together.",
                    audioState: "interval",
                    userAction: "listen"
                },
                {
                    command: "Listen back",
                    instruction: "- keep singing the root and check if you're still on it",
                    audioState: "root",
                    userAction: "listen"
                }
            ]
        },

        // Exercise 3: Back and forth
        {
            name: "Back and Forth",
            steps: [
                {
                    command: "Match",
                    instruction: "the root note with your voice",
                    audioState: "root",
                    userAction: "match-root"
                },
                {
                    command: "Match the interval",
                    instruction: "by smoothly changing the pitch of your voice.",
                    audioState: "interval",
                    userAction: "match-interval"
                },
                {
                    command: "Jump back to root",
                    instruction: "And try to remember the difference in your head and body.",
                    audioState: "root",
                    userAction: "match-root"
                },
                {
                    command: "Jump to interval",
                    instruction: "and switch up to it again. If you can't jump to it use glissando. You can go back and forth on this exercise until you get it.",
                    audioState: "interval",
                    userAction: "match-interval"
                }
            ]
        },

        // Exercise 4: Root Holding
        {
            name: "Root Holding",
            steps: [
                {
                    command: "Match",
                    instruction: "the root note with your voice",
                    audioState: "root",
                    userAction: "match-root"
                },
                {
                    command: "Hear Both",
                    instruction: "while keeping holding the root",
                    audioState: "both",
                    userAction: "match-root"
                },
                {
                    command: "Shift Up",
                    instruction: "to the interval",
                    audioState: "both",
                    userAction: "match-interval"
                },
                {
                    command: "Interval Only",
                    instruction: "- hold it steady",
                    audioState: "interval",
                    userAction: "match-interval"
                }
            ]
        },

        // Exercise 5: Match and sing
        {
            name: "Match and Sing",
            steps: [
                {
                    command: "Match",
                    instruction: "the root note with your voice",
                    audioState: "root",
                    userAction: "match-root"
                },
                {
                    command: "Sing It",
                    instruction: "from memory",
                    audioState: "none",
                    userAction: "sing-interval"
                },
                {
                    command: "Listen",
                    instruction: "- keep singing and adjust with glissando if needed",
                    audioState: "interval",
                    userAction: "listen"
                },
                {
                    command: "Hear Root",
                    instruction: "and return to it",
                    audioState: "root",
                    userAction: "match-root"
                }
            ]
        },

        // Exercise 6: Hear and Sing
        {
            name: "Hear and Sing",
            steps: [
                {
                    command: "Listen",
                    instruction: "to the root note - don't sing yet",
                    audioState: "root",
                    userAction: "listen"
                },
                {
                    command: "Sing It",
                    instruction: "from memory",
                    audioState: "none",
                    userAction: "sing-interval"
                },
                {
                    command: "Listen",
                    instruction: "- keep singing and adjust with glissando if needed",
                    audioState: "interval",
                    userAction: "listen"
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
