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
    // ===== PHASE 0: Introduction (Steps 1-4 adapted from Interval Overview) =====

    // Step 1: Play Tone introduction (adapted from Interval Overview Step 1)
    {
        text: "Musical tones have <strong>frequencies</strong>. Let's listen to one. <button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='play-tone'>Play Tone</button><div data-tutorial-reveal='tone-played' style='display:none; margin-top: 12px; visibility: hidden;'>A <strong>waveform</strong> is a common way to visualize tones. This shows the frequency oscillating.</div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
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

    // Step 2: Frequency/waveform explanation (adapted from Interval Overview Step 2)
    {
        text: "Try clicking <button class='tutorial-inline-btn' data-tutorial-action='play-random'>Play Random Tone <span data-tutorial-counter='random-count-unison'>(4)</span></button> a few times — notice how <strong>higher frequencies</strong> create tightly packed waves, while <strong>lower frequencies</strong> create spread out waves.<div data-tutorial-reveal='random-complete' style='display:none; margin-top: 12px; visibility: hidden;'>Feel free to look at different tones, and hit next when ready.</div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "wave",
        audio: {
            action: "keep"
        },
        dynamicText: true,
        waitForAction: "play-random-4x"
    },

    // Step 3: Play Second Tone (adapted from Interval Overview Step 3)
    {
        text: "Let's play a second tone — the same as the first! <button class='tutorial-inline-btn' data-tutorial-action='play-second-tone'>Play Second Tone</button><div data-tutorial-reveal='same-freq-shown' style='display:none; margin-top: 12px; visibility: hidden;'>Notice how both waves move at the same speed? That's because they're the same frequency!</div>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "wave",
        audio: {
            action: "set",
            tone1: 440,
            tone2: 440
        },
        waitForAction: "play-second-tone-inline"
    },

    // Step 4: Overlay Waves (NEW)
    {
        text: "Let's overlay the waves. <button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='overlay-waves-unison'>Overlay Waves</button>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "wave",
        waveMode: "sideBySide",
        audio: {
            action: "keep"
        },
        waitForAction: "overlay-waves-unison-inline"
    },

    // Step 5: Interference Pattern introduction (adapted from Interval Overview Step 7)
    {
        text: "Let's view the <strong>Interference Pattern</strong>. <button class='tutorial-inline-btn' data-tutorial-action='show-interference'>Show Interference Pattern</button>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "wave",
        waveMode: "overlay",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 440
        },
        disableNext: true
    },

    // ===== PHASE 1: Introduction to Unison (Steps 5-7) =====
    {
        text: "Sound waves from above — like ripples in water.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "keep"
        }
    },
    {
        text: "When two notes are at the <strong>exact same frequency</strong>, that's <strong>unison</strong>. Notice the perfect, symmetric pattern.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "animated-unison-entrance",
            tone1: 440,
            tone2: 440,
            delayTone2: 2000  // Start tone2 2 seconds after tone1
        }
    },

    // ===== PHASE 2: Comparing to Non-Unison (Steps 8-10) =====
    {
        text: "A note that's <strong>NOT</strong> in unison. Watch the pattern change.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
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
        text: "More complex pattern — the frequencies don't match.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
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
        text: "Back to <strong>unison</strong>. Same frequency = perfectly unified pattern.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 440
        }
    },

    // ===== PHASE 3: Beat Frequency Exploration (Steps 11-17) =====

    // Step 11: Starting at major sixth - move down to 460 Hz
    {
        text: "This interval is the same as about <strong>nine piano keys</strong>. <strong>Listen:</strong> Clear interval → wavering turbulence.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: true }
        },
        viz: "interference",
        audio: {
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 740
        },
        sliderConfig: {
            targetFrequency: 440,
            hashMarks: [740, 460, 450, 442, 441, 440],
            initialFrequency: 740
        },
        glissandoTarget: {
            tone1: 440,
            tone2: 460,
            duration: 15.0  // 280 Hz difference - major sixth down to minor second
        }
    },

    // Step 12: Continue bringing them together (460 → 450)
    {
        text: "<strong>Almost there</strong>. <strong>Listen:</strong> Wavering intensifies.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: true }
        },
        viz: "interference",
        audio: {
            action: "keep"
        },
        sliderConfig: {
            targetFrequency: 440,
            hashMarks: [740, 460, 450, 442, 441, 440],
            initialFrequency: 460
        },
        glissandoTarget: {
            tone1: 440,
            tone2: 450,
            duration: 8.0  // 10 Hz difference
        }
    },

    // Step 13: Move even closer (450 → 442) - Critical 2 Hz beat
    {
        text: "<strong>Very close</strong> — about 2/5 of a piano key away. <strong>Listen:</strong> Wavering → rhythmic pulsing.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: true }
        },
        viz: "interference",
        audio: {
            action: "keep"
        },
        sliderConfig: {
            targetFrequency: 440,
            hashMarks: [740, 460, 450, 442, 441, 440],
            initialFrequency: 450
        },
        glissandoTarget: {
            tone1: 440,
            tone2: 442,
            duration: 7.0  // 8 Hz difference
        }
    },

    // Step 14: Bring closer still (442 → 441) - Critical 1 Hz beat
    {
        text: "That pulsing is <strong>beat frequency</strong> — <strong>2 beats/sec</strong>. <strong>Listen:</strong> Beats slow from 2/sec → 1/sec.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: true }
        },
        viz: "interference",
        audio: {
            action: "keep"
        },
        sliderConfig: {
            targetFrequency: 440,
            hashMarks: [740, 460, 450, 442, 441, 440],
            initialFrequency: 442
        },
        glissandoTarget: {
            tone1: 440,
            tone2: 441,
            duration: 2.7  // 2 Hz difference
        }
    },

    // Step 15: Reach perfect unison (441 → 440)
    {
        text: "<strong>1 beat/sec</strong>. <strong>Listen:</strong> Beat fades → perfect alignment.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: true }
        },
        viz: "interference",
        audio: {
            action: "keep"
        },
        sliderConfig: {
            targetFrequency: 440,
            hashMarks: [740, 460, 450, 442, 441, 440],
            initialFrequency: 441
        },
        glissandoTarget: {
            tone1: 440,
            tone2: 440,
            duration: 2.7  // 1 Hz difference
        }
    },

    // Step 16: Perfect unison reflection
    {
        text: "<strong>Perfect unison!</strong> Beats gone. Notice the <strong>locked-in feeling</strong>? Perfectly symmetric.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "interference",
        audio: {
            action: "keep"
        }
    },

    // Step 17: Repeat option
    {
        text: "Journey complete: 9 piano keys → unison. Beat frequency guided you: fast wavering → slow beats → silence. <button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='repeat-beat-frequency'>Repeat</button>",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: true }
        },
        viz: "interference",
        audio: {
            action: "keep"
        },
        sliderConfig: {
            targetFrequency: 440,
            hashMarks: [740, 460, 450, 442, 441, 440],
            initialFrequency: 440
        },
        waitForAction: "repeat-beat-frequency-inline"
    },

    // ===== PHASE 4: Transition to Voice (Steps 18-19) =====
    // Step 18: Understanding Unison
    {
        text: "In the <strong>Feel the Unison</strong> exercise, you'll use your <strong>voice</strong> to match a tone.",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "none",
        audio: {
            action: "stop"
        }
    },

    // Step 25: Trust Your Ears
    {
        text: "We won't tell you when you've found it. Listen for that <strong>locked-in feeling</strong>. Trust your ears!",
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: false },
            intervalDisplay: { visible: false },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false },
            waveSettingsPanel: { visible: false },
            sliderGlissandoControls: { visible: false }
        },
        viz: "none",
        audio: {
            action: "keep"
        }
    }
];

// Auto-generate step numbers based on array position
const UNISON_OVERVIEW_TUTORIAL = UNISON_OVERVIEW_TUTORIAL_STEPS.map((step, index) => ({
    ...step,
    step: index + 1
}));
