/**
 * Interval Overview Tutorial Data
 *
 * Comprehensive tutorial that guides users through:
 * - Understanding frequency and pitch
 * - Visualizing sound waves
 * - Exploring the piano frequency range
 * - Learning about intervals
 * - Understanding consonance and dissonance
 * - Exploring interference patterns
 *
 * Each step controls:
 * - Text displayed to the user
 * - UI element visibility/enabled states
 * - Audio playback states
 * - Visualization visibility
 *
 * Step numbers are auto-generated based on array position.
 * To reference steps in conversation, use their current position (1-based index).
 */

const INTERVAL_OVERVIEW_TUTORIAL_STEPS = [
    // ===== PHASE 1: Introduction to Frequency (Step 1) =====
    {
        text: "Welcome! All musical tones have <strong>frequencies</strong> that control their pitch. Let's start by listening to a simple tone. <button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='play-tone'>Play Tone</button><div data-tutorial-reveal='tone-played' style='display:none; margin-top: 12px; visibility: hidden;'>A <strong>waveform</strong> is a common way to visualize tones. This shows the frequency oscillating.</div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "none",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 440
        },
        waitForAction: "play-tone-inline",
        dynamicText: true
    },

    // ===== PHASE 2: Visualizing Waves (Step 2) =====
    {
        text: "Frequency is measured in <strong>Hertz (Hz)</strong>. This tone is <strong>440 Hz</strong>, vibrating 440 times per second. Try clicking <button class='tutorial-inline-btn' data-tutorial-action='play-random'>Play Random Tone</button> a few times — notice how <strong>higher frequencies</strong> create tightly packed waves, while <strong>lower frequencies</strong> create spread out waves.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "wave",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 440
        },
        dynamicText: true
    },

    // ===== PHASE 3: Exploring Intervals (Step 3) =====
    {
        text: "When we play two notes together, the distance between them is called an <strong>interval</strong>. Let's play a second tone at 440 Hz — the same as the first! <button class='tutorial-inline-btn' data-tutorial-action='play-second-tone'>Play Second Tone</button><div data-tutorial-reveal='same-freq-shown' style='display:none; margin-top: 12px; visibility: hidden;'>Notice how both waves move at the same speed? That's because they're both at 440 Hz — the same frequency!</div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "wave",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 440
        },
        waitForAction: "play-second-tone-inline"
    },

    // ===== PHASE 4: Consonance & Dissonance (Steps 4-7) =====
    {
        text: "Different intervals create different feelings. This interval is a <strong>major third</strong> — bright, warm, and happy. Listen to how the waves align, creating <strong>consonance</strong> — a pleasant, stable sound.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "wave",
        waveMode: "overlay",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 554.37
        }
    },
    {
        text: "Different intervals create different feelings. This interval is a <strong>perfect fifth</strong>. Listen to how the waves align in a simple ratio, creating <strong>consonance</strong> — a stable, pleasant sound.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "wave",
        waveMode: "overlay",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 660
        }
    },
    {
        text: "Now a <strong>tritone</strong> — one of the most tense intervals. It's easy to hear how these waves interact to create the complex, clashing pattern, but harder to see.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "wave",
        waveMode: "overlay",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 622
        }
    },

    // ===== PHASE 6: Interference Pattern Introduction (Steps 12-14) =====
    {
        text: "Going back to unison with two 440 Hz tones. It's easier to see what's happening with a different view called the <strong>Interference Pattern</strong>. <button class='tutorial-inline-btn' data-tutorial-action='show-interference'>Show Interference Pattern</button>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "wave",
        waveMode: "overlay",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 440
        },
        waitForAction: "show-interference-inline"
    },
    {
        text: "This view shows sound waves from above — like watching ripples when you drop something into water. The waves spread out and interact in space.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "keep"
        }
    },
    {
        text: "Look at where the waves intersect — the pattern they create. With unison notes, it almost looks as if they're creating a third note in between them.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "keep"
        }
    },
    {
        text: "Different intervals create different intersection patterns. Try clicking <button class='tutorial-inline-btn' data-tutorial-action='play-random-tone2'>Play Random Tone <span data-tutorial-counter='random-count-4'>(3)</span></button> to explore how the overlap areas create different feelings.<div data-tutorial-reveal='interval-interaction-shown' style='display:none; margin-top: 12px; visibility: hidden;'>Pay particular attention to how the overlap area changes with each interval!</div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: true },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: true },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "keep"
        },
        dynamicText: true,
        waitForAction: "play-random-tone2-step13-3x"
    },

    // ===== PHASE 7: Final Exploration (Step 14) =====
    {
        text: "Now it's your turn! Try clicking <button class='tutorial-inline-btn' data-tutorial-action='play-random-major'>Play Random Note</button> to explore different intervals. These notes are from the major scale, one octave above the root. Notice how each creates a different pattern and feeling!",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: true },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: true },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "keep"
        }
    },

    // ===== PHASE 8: Summary (Step 15) =====
    {
        text: "You've learned how <strong>frequency</strong> determines pitch, visualized <strong>waveforms</strong> oscillating at different rates, and explored how <strong>intervals</strong> create unique patterns of consonance and dissonance. The <strong>interference patterns</strong> show how sound waves interact in space. These fundamentals will help you understand and recognize musical intervals by ear!",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "none",
        audio: {
            action: "stop"
        }
    }
];

// Auto-generate step numbers based on array position
const INTERVAL_OVERVIEW_TUTORIAL = INTERVAL_OVERVIEW_TUTORIAL_STEPS.map((step, index) => ({
    ...step,
    step: index + 1
}));
