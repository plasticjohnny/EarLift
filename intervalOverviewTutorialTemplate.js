/**
 * Interval Overview Tutorial Template
 *
 * Generates tutorial steps for any interval based on its configuration.
 * This template creates a consistent tutorial structure while allowing
 * interval-specific customization through the config object.
 *
 * Tutorial Phases:
 * 1. Introduction - Introduce the interval concept
 * 2. Comparison - Play root and interval separately, compare back and forth
 * 3. Together - Hear them together
 * 4. Wave Visualization - See the frequency relationship
 * 5. Interference Pattern - Understand spatial interaction
 * 6. Comparisons - Compare to other intervals
 * 7. Recognition Practice - Identify the interval
 * 8. Exploration - Free play
 * 9. Summary - Recap key points
 */

/**
 * Generate complete tutorial steps for a given interval
 * @param {Object} config - Interval configuration from intervalConfigs.js
 * @returns {Array} Array of tutorial step objects
 */
function generateIntervalTutorial(config) {
    if (!config) {
        console.error('generateIntervalTutorial: config is required');
        return [];
    }

    const steps = [];

    // ===== PHASE 1: Introduction (Step 1) =====
    steps.push({
        text: `Welcome to the ${config.intervalName} Overview! The <strong>${config.intervalName.toLowerCase()}</strong> is ${config.description}. It has a frequency ratio of <strong>${config.frequencyRatio}</strong>. ${config.tutorialEmphasis}<br><br>Let's hear the root note and the ${config.intervalName.toLowerCase()}:<br><div style='margin-top: 16px; display: flex; gap: 12px; justify-content: center;'><button class='tutorial-inline-btn' data-tutorial-action='play-root-only'>▶ Root (${config.rootFreq} Hz)</button><button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='play-interval'>▶ ${config.intervalName} (${Math.round(config.intervalFreq)} Hz)</button></div>`,
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: true },
            intervalArrows: { visible: false },
            intervalChromatic: { visible: false },
            vizSelection: { visible: true, enabled: false },
            advancedControls: { visible: false },
            controlsDivider: { visible: false }
        },
        viz: "wave",
        audio: {
            action: "play",
            which: "tone1",
            tone1: config.rootFreq,
            tone2: config.intervalFreq
        },
        waitForAction: "play-interval-inline"
    });

    // ===== PHASE 2: Together (Step 2) =====
    steps.push({
        text: `You can see what you're hearing in the wave visualization above. Let's overlay the waves to see their relationship more clearly. <button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='overlay-waves'>Overlay Waves</button><div data-tutorial-reveal='waves-overlaid' style='display:none; margin-top: 12px; visibility: hidden;'>${config.waveEmphasis}</div>`,
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
        viz: "wave",
        audio: {
            action: "play",
            which: "both",
            tone1: config.rootFreq,
            tone2: config.intervalFreq
        },
        waitForAction: "overlay-waves-inline",
        dynamicText: true
    });

    // ===== PHASE 3: Interference Pattern =====
    steps.push({
        text: `Let's see the ${config.intervalName.toLowerCase()} from a different perspective. The <strong>Interference Pattern</strong> shows how the sound waves interact in space. <button class='tutorial-inline-btn' data-tutorial-action='show-interference'>Show Interference Pattern</button>`,
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
        viz: "wave",
        waveMode: "overlay",
        audio: {
            action: "keep"
        },
        waitForAction: "show-interference-inline"
    });

    steps.push({
        text: `Notice the gravity well pattern created by the ${config.intervalName.toLowerCase()}. The waves from the root (left) and ${config.intervalName.toLowerCase()} (right) spread out and interact, creating this interference pattern. ${config.interferenceEmphasis} This visual pattern reflects the harmonic relationship between the two notes.`,
        ui: {
            simplifiedControls: { visible: false },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: true },
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
    });

    // ===== PHASE 6: Comparisons (Steps 11-13) =====
    if (config.comparisonIntervals && config.comparisonIntervals.length > 0) {
        config.comparisonIntervals.forEach((comparison, index) => {
            const comparisonFreq = comparison.freq;
            steps.push({
                text: `To appreciate the ${config.intervalName.toLowerCase()}, let's compare it to another interval. Here's a <strong>${comparison.name}</strong> (${Math.round(comparisonFreq)} Hz). Listen to how it sounds different — ${comparison.description}`,
                ui: {
                    simplifiedControls: { visible: false },
                    rootDisplay: { visible: true, enabled: true },
                    intervalDisplay: { visible: true, enabled: true },
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
                    tone1: config.rootFreq,
                    tone2: comparisonFreq
                }
            });

            // After first comparison, return to target interval
            if (index === 0) {
                steps.push({
                    text: `Now back to the ${config.intervalName.toLowerCase()} at ${Math.round(config.intervalFreq)} Hz. Notice the difference? The ${config.intervalName.toLowerCase()} is ${config.character}.`,
                    ui: {
                        simplifiedControls: { visible: false },
                        rootDisplay: { visible: true, enabled: true },
                        intervalDisplay: { visible: true, enabled: true },
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
                        tone1: config.rootFreq,
                        tone2: config.intervalFreq
                    }
                });
            }
        });
    }

    // ===== PHASE 7: Recognition Practice =====
    steps.push({
        text: `Now let's practice recognizing the ${config.intervalName.toLowerCase()}. I'll play random intervals — listen carefully and see if you can identify which ones are ${config.intervalName.toLowerCase()}s. About 35% of them will be the target interval. Listen for ${config.character}. <button class='tutorial-inline-btn tutorial-btn-pulse' data-tutorial-action='play-random-interval'>Play Random Interval</button>`,
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
            action: "stop"
        },
        practiceConfig: {
            targetProbability: 0.35,
            targetInterval: config.intervalFreq,
            comparisonIntervals: config.comparisonIntervals || []
        }
    });

    // ===== PHASE 8: Exploration =====
    steps.push({
        text: `Great! Now you can explore freely. Try different root notes and hear how the ${config.intervalName.toLowerCase()} relationship stays the same no matter what frequency you start with. The controls are unlocked — experiment with the visualizations!`,
        ui: {
            simplifiedControls: { visible: true },
            rootDisplay: { visible: true, enabled: true },
            intervalDisplay: { visible: true, enabled: true },
            intervalArrows: { visible: true },
            intervalChromatic: { visible: true },
            vizSelection: { visible: true, enabled: true },
            advancedControls: { visible: true },
            controlsDivider: { visible: true }
        },
        viz: "interference",
        audio: {
            action: "stop"
        }
    });

    // ===== PHASE 9: Summary =====
    const consonanceText = config.consonance === 'perfect'
        ? 'one of the most consonant intervals'
        : config.consonance === 'imperfect'
        ? 'a consonant interval'
        : 'a dissonant interval';

    steps.push({
        text: `You've learned about the <strong>${config.intervalName}</strong> — ${consonanceText}. Remember:<br><br>• The ${config.intervalName.toLowerCase()} has a <strong>${config.frequencyRatio} frequency ratio</strong><br>• It sounds <strong>${config.description}</strong><br>• It's characterized as <strong>${config.character}</strong><br>• It creates ${config.consonance === 'perfect' ? 'simple, stable' : config.consonance === 'imperfect' ? 'pleasant, moderately complex' : 'complex, tense'} interference patterns<br><br>In future exercises, you'll practice recognizing ${config.intervalName.toLowerCase()}s by ear!`,
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
    });

    // Auto-generate step numbers
    return steps.map((step, index) => ({
        ...step,
        step: index + 1
    }));
}

// Convenience function to generate and return tutorial for a specific interval type
function getIntervalTutorial(intervalType) {
    if (typeof getIntervalConfig !== 'function') {
        console.error('getIntervalTutorial: getIntervalConfig function not found. Make sure intervalConfigs.js is loaded.');
        return [];
    }

    const config = getIntervalConfig(intervalType);
    if (!config) {
        console.error(`getIntervalTutorial: No config found for interval type "${intervalType}"`);
        return [];
    }

    return generateIntervalTutorial(config);
}
