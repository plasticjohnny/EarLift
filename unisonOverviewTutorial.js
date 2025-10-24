/**
 * Unison Overview Tutorial Data
 *
 * Teaches users about:
 * - What unison is and how it looks
 * - Beat frequencies and how they help find unison
 * - How to use beat frequency pulses to narrow in on unison
 * - Preparing for the Feel the Unison exercise
 */

const UNISON_OVERVIEW_TUTORIAL_STEPS = [
    // ===== PHASE 1: Introduction to Unison (Steps 1-2) =====
    {
        text: "Welcome to the Unison Overview! When two notes are at the <strong>exact same frequency</strong>, they create what's called <strong>unison</strong>. Right now, you're hearing just the root note at 440 Hz.<br><br><div style='margin-top: 16px; text-align: center;'><button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='play-unison' style='font-size: 18px; font-weight: bold; padding: 12px 24px;'>▶ Play Unison</button></div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 440
        },
        waitForAction: "play-unison-inline"
    },
    {
        text: "Notice how the interference pattern creates a perfect, symmetric bloom. You're hearing unison at 440 Hz. The two tones align perfectly, creating a stable, unified sound.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
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

    // ===== PHASE 2: Comparing to Non-Unison (Steps 3-5) =====
    {
        text: "Now you're hearing a note that's <strong>NOT</strong> in unison. This is a <strong style='color: rgba(100, 200, 255, 1);'>perfect fifth (Sol)</strong> — a beautiful interval. Watch how the pattern changes.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 660
        }
    },
    {
        text: "See how the pattern is more complex? The two frequencies don't match, so the interference pattern shows their interaction. Now you're hearing a <strong style='color: rgba(100, 200, 255, 1);'>major third (Mi)</strong>.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 554.37
        }
    },
    {
        text: "Now you're back to <strong style='color: rgba(100, 200, 255, 1);'>unison (Do)</strong>. Notice the difference? When two tones are at the exact same frequency, the pattern becomes perfectly unified — no complexity, just pure alignment.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 440
        }
    },

    // ===== PHASE 3: Beat Frequency Introduction (Steps 6-7) =====
    {
        text: "When two tones are <strong>close but not quite</strong> at unison, they create a <strong>beat frequency</strong> — a pulsing sound. The closer they are, the slower the pulse. You're hearing it right now at 452 Hz.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 452
        }
    },
    {
        text: "<div data-tutorial-feedback='beat-freq'>Hear that pulsing? That's a 12 Hz difference creating 12 beats per second. Use these buttons to explore the beat frequency around 440 Hz. Notice how it changes as you get closer to unison.</div><div style='margin-top: 16px; display: flex; gap: 12px; justify-content: center; align-items: center;'><button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='step-down-to-unison' style='font-size: 22px; font-weight: bold; padding: 8px 16px;'>▼ (-1 Hz)</button><span style='color: rgba(0, 255, 136, 0.9); font-size: 20px; font-weight: bold; min-width: 80px; text-align: center;' data-tutorial-tone2-display='step-down'>452 Hz</span><button class='tutorial-inline-btn' data-tutorial-action='step-up-tone2' style='font-size: 22px; font-weight: bold; padding: 8px 16px;'>▲ (+1 Hz)</button></div><div data-tutorial-reveal='stepped-down' style='display:none; margin-top: 16px; visibility: hidden;'>Perfect! Notice how the pulses disappeared completely when you reached unison!</div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "keep"
        },
        waitForAction: "step-down-to-unison-inline",
        dynamicText: true,
        stepDownMode: true
    },

    // ===== PHASE 4: Using Beat Frequency to Find Unison (Steps 8-9) =====
    {
        text: "This pulsing is your <strong>secret weapon</strong> for finding unison. The slower the pulse, the closer you are. When the pulse disappears, you've found it! Now let's practice.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 440
        }
    },
    {
        text: "You're hearing two tones. One is somewhere within 75% of an octave of the other. Use this slider to find the unison — listen for the beat frequency to slow down and disappear! <div style='margin-top: 16px;'><div style='display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; color: rgba(255, 255, 255, 0.6);'><span>277 Hz</span><span>698 Hz</span></div><input type='range' data-tutorial-slider='unison-finder' class='tutorial-color-slider' style='width: 100%;' min='277' max='698' value='550' step='1'><div style='text-align: center; margin-top: 12px; color: rgba(0, 255, 136, 0.8);' data-tutorial-feedback='unison-finder'>Move the slider to find the unison</div></div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 550
        },
        customInteraction: "unison-finder-slider"
    },

    // ===== PHASE 5: Practice Attempts (Steps 10-12) =====
    {
        text: "Great! Let's try again with a different starting point. Use the beat frequency to guide you — when the pulsing stops, you've found unison. <div style='margin-top: 16px;'><div style='display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; color: rgba(255, 255, 255, 0.6);'><span>277 Hz</span><span>698 Hz</span></div><input type='range' data-tutorial-slider='unison-finder-2' class='tutorial-color-slider' style='width: 100%;' min='277' max='698' value='330' step='1'><div style='text-align: center; margin-top: 12px; color: rgba(0, 255, 136, 0.8);' data-tutorial-feedback='unison-finder-2'>Listen for the beat frequency</div></div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 330
        },
        customInteraction: "unison-finder-slider-2"
    },
    {
        text: "Excellent! One more time. Remember: fast pulse = far away, slow pulse = getting close, no pulse = unison! <div style='margin-top: 16px;'><div style='display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; color: rgba(255, 255, 255, 0.6);'><span>277 Hz</span><span>698 Hz</span></div><input type='range' data-tutorial-slider='unison-finder-3' class='tutorial-color-slider' style='width: 100%;' min='277' max='698' value='620' step='1'><div style='text-align: center; margin-top: 12px; color: rgba(0, 255, 136, 0.8);' data-tutorial-feedback='unison-finder-3'>Use your ears to find it</div></div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 620
        },
        customInteraction: "unison-finder-slider-3"
    },

    // ===== PHASE 6: Transition to Voice (Step 13) =====
    {
        text: "Perfect! You've learned to use beat frequency to find unison. In the <strong>Feel the Unison</strong> exercise, you'll do exactly this — but using your <strong>voice</strong> instead of a slider.<br><br>We won't tell you when you've found it — <strong>you'll have to find it within yourself</strong>. Listen deeply for the beat frequency. When the pulsing disappears and the tones feel unified, you've achieved unison. Trust your ears!",
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
const UNISON_OVERVIEW_TUTORIAL = UNISON_OVERVIEW_TUTORIAL_STEPS.map((step, index) => ({
    ...step,
    step: index + 1
}));
