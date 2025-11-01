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
        text: "Musical tones have <strong><span class='helper-term' data-term='frequencies'>frequencies</span></strong>. Let's listen to one. <button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='play-tone'>Play Tone</button><div data-tutorial-reveal='tone-played' style='display:none; margin-top: 12px; visibility: hidden;'>A <strong><span class='helper-term' data-term='waveform'>waveform</span></strong> is a common way to visualize tones. This shows the <span class='helper-term' data-term='frequency'>frequency</span> oscillating.</div>",
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
        text: "Try clicking <button class='tutorial-inline-btn' data-tutorial-action='play-random'>Play Random Tone <span data-tutorial-counter='random-count-unison'>(4)</span></button> a few times — notice how <strong><span class='helper-term' data-term='higher frequencies'>higher frequencies</span></strong> create tightly packed waves, while <strong><span class='helper-term' data-term='frequencies'>lower frequencies</span></strong> create spread out waves.<div data-tutorial-reveal='random-complete' style='display:none; margin-top: 12px; visibility: hidden;'>Feel free to look at different tones, and hit next when ready.</div>",
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
        waitForAction: "play-random-4x",
        disableNext: true  // Disable Next button until 4 random tones are played
    },

    // Step 3: Play Second Tone (adapted from Interval Overview Step 3)
    {
        text: "Let's play a second tone — the same as the first! <button class='tutorial-inline-btn' data-tutorial-action='play-second-tone'>Play Second Tone</button><div data-tutorial-reveal='same-freq-shown' style='display:none; margin-top: 12px; visibility: hidden;'>Notice how both waves move at the same speed? That's because they're the same <span class='helper-term' data-term='frequency'>frequency</span>!</div>",
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
            action: "play",
            which: "tone1",
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
        text: "Another way to view this same thing is an <strong><span class='helper-term' data-term='interference pattern'>Interference Pattern</span></strong>. <button class='tutorial-inline-btn' data-tutorial-action='show-interference'>Show Interference Pattern</button>",
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
        }
    },

    // ===== PHASE 1: Introduction to Unison (Steps 5-7) =====
    {
        text: "You're now looking at the sound waves <strong>from above</strong> — like ripples in water spreading outward.",
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
        text: "When two notes are at the <strong>exact same <span class='helper-term' data-term='frequency'>frequency</span></strong>, that's <strong><span class='helper-term' data-term='unison'>unison</span></strong>. Notice the perfect, symmetric pattern.",
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
            action: "play",
            which: "both",
            tone1: 440,
            tone2: 440,
            preventExpansion: true
        }
    },

    // ===== PHASE 2: Comparing to Non-Unison (Steps 8-10) =====
    {
        text: "A note that's <strong>NOT</strong> in <span class='helper-term' data-term='unison'>unison</span>. Watch the pattern change.",
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
            tone2: 660,
            preventExpansion: true
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
            tone2: 554.37,
            preventExpansion: true
        }
    },
    {
        text: "Back to <strong><span class='helper-term' data-term='unison'>unison</span></strong>. Same <span class='helper-term' data-term='frequency'>frequency</span> = perfectly unified pattern.",
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
            tone2: 440,
            preventExpansion: true
        }
    },

    // ===== PHASE 3: Beat Frequency Exploration (Steps 11-17) =====

    // Step 11: NEW - Text-only introduction to beat frequency concept
    {
        text: "The secret to finding <span class='helper-term' data-term='unison'>unison</span> is listening for the <strong><span class='helper-term' data-term='beat frequency'>beat frequency</span></strong> to slow down and disappear. When two tones are close but not quite matched, you'll hear a pulsing or \"wah-wah\" sound. As the <span class='helper-term' data-term='frequencies'>frequencies</span> get closer, the pulsing slows down. When it stops completely — that's perfect <span class='helper-term' data-term='unison'>unison</span>!",
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
        },
        customNextButtonText: "Let's Demonstrate"
    },

    // Step 12: NEW - Close-range wah-wah demonstration
    {
        text: "Now let's start really close to <span class='helper-term' data-term='unison'>unison</span>. <strong>Listen carefully</strong> to the distinctive <strong>\"wah-wah\"</strong> pulsing of the <span class='helper-term' data-term='beat frequency'>beat frequency</span>. Even this close, you can clearly hear it. Use the small buttons to move towards perfect <span class='helper-term' data-term='unison'>unison</span>, where the pulsing disappears completely.",
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
            tone2: 428
        },
        sliderConfig: {
            targetFrequency: 440,
            minFrequency: 425,
            maxFrequency: 455,
            hashMarks: [428, 432, 436, 440, 444, 448, 452],
            initialFrequency: 428,
            enabledButtons: ['small-down', 'small-up'],
            explorationMode: true,
            requireUnison: true  // Enable directional button logic and unison detection
        },
        preventExpansion: true,
        disableNext: true  // Disable Next button until unison is found
    },

    // Step 13: NEW - Consolidated dynamic beat frequency demonstration
    {
        text: "This interval is the same as about <strong>nine piano keys</strong>. Use the buttons to <strong>move towards <span class='helper-term' data-term='unison'>unison</span></strong>. <strong>Listen:</strong> Clear interval → wavering turbulence.",
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
            initialFrequency: 740,
            explorationMode: true,
            requireUnison: true  // Enable directional button logic with distance-based enabling
        },
        dynamicTextRanges: [
            {
                minFreq: 461,
                maxFreq: 740,
                text: "This interval is the same as about <strong>nine piano keys</strong>. Use the buttons to <strong>move towards <span class='helper-term' data-term='unison'>unison</span></strong>. <strong>Listen:</strong> Clear interval → wavering turbulence."
            },
            {
                minFreq: 451,
                maxFreq: 460.99,
                text: "<strong>Almost there</strong>. <strong>Listen:</strong> Wavering intensifies."
            },
            {
                minFreq: 443,
                maxFreq: 450.99,
                text: "<strong>Very close</strong> — about 2/5 of a piano key away. <strong>Listen:</strong> Wavering → rhythmic pulsing."
            },
            {
                minFreq: 441.5,
                maxFreq: 442.99,
                text: "That pulsing is <strong><span class='helper-term' data-term='beat frequency'>beat frequency</span></strong> — <strong>2 beats/sec</strong>. <strong>Listen:</strong> Beats slow from 2/sec → 1/sec."
            },
            {
                minFreq: 440.5,
                maxFreq: 441.49,
                text: "<strong>1 beat/sec</strong>. <strong>Listen:</strong> The slowest <span class='helper-term' data-term='beat frequency'>beat frequency</span> - almost <span class='helper-term' data-term='unison'>unison</span>."
            },
            {
                minFreq: 439.5,
                maxFreq: 440.49,
                text: "<strong>Perfect <span class='helper-term' data-term='unison'>unison</span>!</strong> Beats gone. Notice the <strong>locked-in feeling</strong>? Perfectly symmetric. Explore by moving the <span class='helper-term' data-term='frequency'>frequency</span> around."
            }
        ],
        disableNext: true  // Disable Next button until unison is found
    },

    // Step 17: Motivational transition to exercises
    {
        text: "Don't forget to <strong>use your ear</strong> and be patient with yourself. The key to hearing <span class='helper-term' data-term='unison'>Unison</span> is <strong>listening for the <span class='helper-term' data-term='beat frequency'>beat frequencies</span></strong>. You'll start with exercises involving the slider and buttons - to help you have the confidence you can hear. Then it will transition to using your <strong>voice to match notes</strong>. This is the <strong>most foundational and important skill</strong> to train!",
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
    }
];

// Auto-generate step numbers based on array position
const UNISON_OVERVIEW_TUTORIAL = UNISON_OVERVIEW_TUTORIAL_STEPS.map((step, index) => ({
    ...step,
    step: index + 1
}));
