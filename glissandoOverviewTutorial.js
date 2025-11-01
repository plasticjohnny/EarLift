/**
 * Glissando Overview Tutorial Data
 *
 * Teaches users about:
 * - Transitioning from Slider Glissando to vocal pitch matching
 * - Voice as a trainable muscle requiring practice
 * - The REPS method for effective vocal training
 * - Optimal listening setup (one ear in, one ear free)
 * - Using glissando to hunt for pitch and eliminate beat frequencies
 * - Patience and realistic expectations for vocal development
 */

const GLISSANDO_OVERVIEW_TUTORIAL_STEPS = [
    // ===== PHASE 1: Bridge from Slider Glissando (Steps 1-2) =====
    {
        text: "Congratulations! You've mastered <strong>Slider Glissando</strong> — you can hear beat frequencies and use controls to find perfect unison. Now it's time for the next challenge: <strong>using your voice instead of sliders.</strong>",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },
    {
        text: "Everything you learned with the sliders applies here. You'll still listen for those <strong>wobbling beat frequencies</strong> and adjust until they disappear. The only difference? You're adjusting with your voice, not your fingers.",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },

    // ===== PHASE 2: Voice as a Muscle (Steps 3-4) =====
    {
        text: "Here's the truth: <strong>your voice is a muscle.</strong> Just like building strength at the gym, developing vocal pitch control takes time, repetition, and patience. You're literally training the muscles in your larynx to make precise adjustments.",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },
    {
        text: "At first, it won't always work — and <strong>that's completely normal!</strong> Even experienced singers miss notes. What matters is that <strong>every attempt strengthens your ear-voice connection.</strong> Think of each try as a rep at the gym.",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },

    // ===== PHASE 3: The REPS Method (Steps 5-6) =====
    {
        text: "To help you succeed, remember <strong>REPS</strong> — your workout plan for vocal training:<br><br><strong>R</strong>elax — Keep your voice and body tension-free<br><strong>E</strong>ar isolated — One headphone in, one ear free (more on this next!)<br><strong>P</strong>atient practice — Progress takes time, be kind to yourself<br><strong>S</strong>low approach — Don't rush, move deliberately",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },
    {
        text: "These four principles will guide every vocal exercise you do. Print them on a sticky note, tattoo them on your arm (kidding!), but definitely keep them in mind. <strong>REPS.</strong> That's the formula.",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },

    // ===== PHASE 4: Optimal Listening Setup (Steps 7-8) =====
    {
        text: "<strong>The One-Ear Rule:</strong> For all voice exercises, wear <strong>one headphone in one ear, and leave the other ear completely free.</strong> This is absolutely crucial and not optional!",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },
    {
        text: "Why? You need to hear <strong>both the reference tone AND your voice at similar volumes</strong> to detect beat frequencies. With both earbuds in, your voice sounds quiet. With both out, the tone is too quiet. <strong>One in, one out</strong> — that's the sweet spot.",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },

    // ===== PHASE 5: Using Glissando Technique (Steps 9-10) =====
    {
        text: "Now, let's talk technique. <strong>Glissando</strong> means smoothly sliding from one pitch to another — like a siren or a slide trombone. This is your secret weapon for finding the right pitch.",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },
    {
        text: "Don't try to nail the pitch immediately. Instead, <strong>use your voice to explore</strong> — slide up and down, listen for where the beat frequency slows down and disappears. You're <strong>hunting</strong> for the pitch, using beats as your guide. Glissando gives you control.",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },

    // ===== PHASE 6: Beat Frequency Reminder (Step 11) =====
    {
        text: "<strong>Beat Frequency Refresher:</strong> When two close frequencies play together, they create that pulsing, wobbling sound. The closer you get to the target pitch, the slower the beats become. When the beats disappear completely — <strong>you've found unison!</strong>",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },

    // ===== PHASE 7: Reality Check & Encouragement (Steps 12-13) =====
    {
        text: "<strong>Real talk:</strong> You're not going to nail it every time, especially at first. Your voice might crack, your pitch might wander, you might feel frustrated. <strong>This is all part of the process.</strong> Even professional singers practice daily to maintain their skills.",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },
    {
        text: "Each attempt — successful or not — strengthens the connection between your ears and your vocal muscles. <strong>Take your time. Slow down. Breathe.</strong> Progress isn't linear, but it <strong>is</strong> inevitable if you keep practicing. You're building a skill that will last a lifetime.",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    },

    // ===== PHASE 8: Ready to Practice! (Step 14) =====
    {
        text: "You're ready! When you click <strong>Finish</strong>, you'll enter the <strong>Match the Tone</strong> exercise. A reference tone will play, and you'll use your voice (and glissando technique!) to match it.<br><br><strong>Remember REPS:</strong> Relax, Ear isolated, Patient practice, Slow approach.<br><br>Your voice is a muscle. Time to work it out! 💪",
        ui: {},
        viz: "none",
        audio: { action: "stop" }
    }
];

// Auto-generate step numbers based on array position
const GLISSANDO_OVERVIEW_TUTORIAL = GLISSANDO_OVERVIEW_TUTORIAL_STEPS.map((step, index) => ({
    ...step,
    step: index + 1
}));
