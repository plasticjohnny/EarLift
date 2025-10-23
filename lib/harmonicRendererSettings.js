/**
 * Harmonic Renderer Settings
 *
 * Configuration for the dual-tone harmonic interference pattern WebGL renderer.
 * This module provides default settings and presets for different visualization styles.
 *
 * Usage:
 *   const settings = HarmonicRendererSettings.getDefault();
 *   const minimalSettings = HarmonicRendererSettings.getMinimal();
 *   const customSettings = HarmonicRendererSettings.merge(defaults, { amplitude: 2.0 });
 */

class HarmonicRendererSettings {
    /**
     * Get default settings with Pulsing Black Holes gravity wells
     * This is the current production configuration for Interval Visualization
     * @returns {Object} Default settings object
     */
    static getDefault() {
        return {
            // Core visualization
            amplitude: 1.0,
            harmonicOrder: 5,

            // Tone colors (dynamically calculated from consonance/dissonance)
            tone1Color: '#00ffff', // Cyan (default for root)
            tone2Color: '#00ffff', // Cyan (default for unison)

            // Visualization intensity
            rootIntensity: 1.0,
            intervalIntensity: 0.8,
            intersectionIntensity: 1.2,

            // Gravity Wells - Pulsing Black Holes variant
            gravityWell: true,
            gravityStrength: 170.0,
            gravityWellCount: 5,
            gravityVariant5: true, // Pulsing Black Holes
            eventHorizon: 10.0,
            pulseDepth: 0.5,
            wellJitter: true,
            jitterIntensity: 1.0,
            wellBreathing: true,
            consonantBreathSpeed: 0.1,
            dissonantPulseSpeed: 2.0,

            // Boundaries
            useBoundary: true,
            boundaryRadius: 300,
            speakerRadius: 30,

            // Color mode
            colorMode: 'consonance', // 'consonance' or 'piano'
            rootFreq: 440
        };
    }

    /**
     * Get minimal settings with no special effects
     * Good for performance testing or simple visualizations
     * @returns {Object} Minimal settings object
     */
    static getMinimal() {
        return {
            // Core visualization only
            amplitude: 1.0,
            harmonicOrder: 5,

            // Tone colors
            tone1Color: '#00ffff',
            tone2Color: '#00ffff',

            // Visualization intensity
            rootIntensity: 1.0,
            intervalIntensity: 0.8,
            intersectionIntensity: 1.2,

            // No gravity wells
            gravityWell: false,
            gravityStrength: 0,
            gravityWellCount: 0,
            gravityVariant5: false,
            eventHorizon: 0,
            pulseDepth: 0,
            wellJitter: false,
            jitterIntensity: 0,
            wellBreathing: false,
            consonantBreathSpeed: 0,
            dissonantPulseSpeed: 0,

            // Boundaries
            useBoundary: true,
            boundaryRadius: 300,
            speakerRadius: 30,

            // Color mode
            colorMode: 'consonance',
            rootFreq: 440
        };
    }

    /**
     * Get gravity wells preset with different variants
     * @param {number} variant - Which gravity well variant (1-6)
     * @returns {Object} Settings object with specified gravity variant
     */
    static getGravityWellsPreset(variant = 5) {
        const base = this.getDefault();

        // Reset all variants
        base.gravityVariant1 = false;
        base.gravityVariant2 = false;
        base.gravityVariant3 = false;
        base.gravityVariant4 = false;
        base.gravityVariant5 = false;
        base.gravityVariant6 = false;

        // Enable requested variant
        switch(variant) {
            case 5:
                base.gravityVariant5 = true;
                base.eventHorizon = 10.0;
                base.pulseDepth = 0.5;
                base.wellJitter = true;
                base.jitterIntensity = 1.0;
                base.wellBreathing = true;
                base.consonantBreathSpeed = 0.1;
                base.dissonantPulseSpeed = 2.0;
                break;
            default:
                console.warn(`Gravity well variant ${variant} not implemented. Using variant 5.`);
                base.gravityVariant5 = true;
        }

        return base;
    }

    /**
     * Merge custom settings with a base settings object
     * @param {Object} base - Base settings object
     * @param {Object} custom - Custom settings to override
     * @returns {Object} Merged settings object
     */
    static merge(base, custom) {
        return Object.assign({}, base, custom);
    }

    /**
     * Validate settings object and fill in missing values with defaults
     * @param {Object} settings - Settings object to validate
     * @returns {Object} Validated settings object with defaults filled in
     */
    static validate(settings) {
        const defaults = this.getDefault();
        const validated = {};

        // Ensure all required settings exist
        for (const key in defaults) {
            if (settings.hasOwnProperty(key)) {
                validated[key] = settings[key];
            } else {
                validated[key] = defaults[key];
                console.warn(`Missing setting "${key}", using default:`, defaults[key]);
            }
        }

        return validated;
    }

    /**
     * Create settings for a specific exercise type
     * @param {string} exerciseType - Type of exercise ('interval', 'feel-root', 'scale-darts', etc.)
     * @returns {Object} Settings object optimized for that exercise
     */
    static forExercise(exerciseType) {
        switch(exerciseType) {
            case 'interval':
            case 'interval-visualization':
                return this.getDefault();

            case 'feel-root':
                // Could use different settings for feel-root exercise
                return this.merge(this.getDefault(), {
                    gravityStrength: 150.0, // Slightly weaker gravity
                    boundaryRadius: 250
                });

            case 'minimal':
                return this.getMinimal();

            default:
                console.warn(`Unknown exercise type "${exerciseType}", using default settings`);
                return this.getDefault();
        }
    }
}

