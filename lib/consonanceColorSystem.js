/**
 * Consonance Color System
 *
 * Calculates colors based on frequency relationships and consonance/dissonance.
 *
 * - Consonant intervals (unison, perfect 5th, octave) → Cyan/Blue (home/pleasurable)
 * - Dissonant intervals (tritone, minor 2nd, major 7th) → Red/Orange (tension)
 * - All other intervals → Colors based on their position in the harmonic series
 *
 * Usage:
 *   const color = ConsonanceColorSystem.getFrequencyColor(554, 440);
 *   const rgb = ConsonanceColorSystem.hexToRgb('#00ffff');
 */

class ConsonanceColorSystem {
    /**
     * Calculate dissonance value (0.0 = consonant, 1.0 = dissonant) for a given interval in cents
     * @param {number} cents - Interval in cents (1200 cents = 1 octave)
     * @returns {number} Dissonance value between 0.0 and 1.0
     */
    static getDissonanceCurve(cents) {
        const normalizedCents = cents % 1200;
        const dissonanceMap = [
            { cents: 0, dissonance: 0.0 },      // Unison - perfect consonance
            { cents: 100, dissonance: 0.9 },    // Minor 2nd - very dissonant
            { cents: 200, dissonance: 0.5 },    // Major 2nd - moderately clear
            { cents: 300, dissonance: 0.2 },    // Minor 3rd - consonant
            { cents: 400, dissonance: 0.15 },   // Major 3rd - very consonant
            { cents: 500, dissonance: 0.1 },    // Perfect 4th - extremely consonant
            { cents: 600, dissonance: 1.0 },    // Tritone - most dissonant
            { cents: 700, dissonance: 0.05 },   // Perfect 5th - most consonant
            { cents: 800, dissonance: 0.25 },   // Minor 6th - fairly consonant
            { cents: 900, dissonance: 0.2 },    // Major 6th - consonant
            { cents: 1000, dissonance: 0.6 },   // Minor 7th - somewhat dissonant
            { cents: 1100, dissonance: 0.75 },  // Major 7th - dissonant
            { cents: 1200, dissonance: 0.0 }    // Octave - perfect consonance
        ];

        let prev = dissonanceMap[0];
        let next = dissonanceMap[1];

        for (let i = 0; i < dissonanceMap.length - 1; i++) {
            if (normalizedCents >= dissonanceMap[i].cents && normalizedCents <= dissonanceMap[i + 1].cents) {
                prev = dissonanceMap[i];
                next = dissonanceMap[i + 1];
                break;
            }
        }

        const range = next.cents - prev.cents;
        const position = (normalizedCents - prev.cents) / range;
        return prev.dissonance + (next.dissonance - prev.dissonance) * position;
    }

    /**
     * Get color for a frequency based on its relationship to a root frequency
     * @param {number} freq - The frequency to colorize
     * @param {number} rootFreq - The root/reference frequency
     * @returns {string} Hex color string (e.g., '#00ffff')
     */
    static getFrequencyColor(freq, rootFreq) {
        const ratio = freq / rootFreq;
        const cents = 1200 * Math.log2(ratio);
        const normalizedCents = ((cents % 1200) + 1200) % 1200;
        const dissonance = this.getDissonanceCurve(cents);

        // Map cents to hue values
        // Consonant intervals get cyan/blue hues (180-220)
        // Dissonant intervals get red/orange hues (0-40)
        let hue;
        if (normalizedCents < 100) {
            // Unison to minor 2nd: cyan → red
            hue = 180 - (normalizedCents / 100) * 180;
        } else if (normalizedCents < 200) {
            // Minor 2nd to major 2nd: red → orange
            hue = 0 + ((normalizedCents - 100) / 100) * 40;
        } else if (normalizedCents < 300) {
            // Major 2nd to minor 3rd: orange → yellow-green
            const t = (normalizedCents - 200) / 100;
            hue = 40 + t * 80;
        } else if (normalizedCents < 400) {
            // Minor 3rd to major 3rd: yellow-green → green
            const t = (normalizedCents - 300) / 100;
            hue = 120 + t * 40;
        } else if (normalizedCents < 500) {
            // Major 3rd to perfect 4th: green → cyan
            const t = (normalizedCents - 400) / 100;
            hue = 160 + t * 40;
        } else if (normalizedCents < 600) {
            // Perfect 4th to tritone: cyan → red (through blue)
            const t = (normalizedCents - 500) / 100;
            hue = 200 - t * 200;
        } else if (normalizedCents < 700) {
            // Tritone to perfect 5th: red → cyan-blue
            const t = (normalizedCents - 600) / 100;
            hue = 0 + t * 220;
        } else if (normalizedCents < 800) {
            // Perfect 5th to minor 6th: cyan-blue → blue
            const t = (normalizedCents - 700) / 100;
            hue = 220 + t * 60;
        } else if (normalizedCents < 900) {
            // Minor 6th to major 6th: blue → purple
            const t = (normalizedCents - 800) / 100;
            hue = 280 + t * 20;
        } else if (normalizedCents < 1000) {
            // Major 6th to minor 7th: purple → yellow (warm)
            const t = (normalizedCents - 900) / 100;
            hue = 300 + t * 90;
        } else if (normalizedCents < 1100) {
            // Minor 7th to major 7th: yellow → orange
            const t = (normalizedCents - 1000) / 100;
            hue = 30 - t * 15;
        } else {
            // Major 7th to octave: orange → cyan
            const t = (normalizedCents - 1100) / 100;
            hue = 15 + t * 165;
        }

        // Saturation increases for consonant intervals (less dissonant = more saturated)
        const saturation = 60 + ((1.0 - dissonance) * 30);
        const lightness = 65;
        const finalHue = hue % 360;

        return this.hslToHex(finalHue, saturation, lightness);
    }

    /**
     * Convert HSL color to hex string
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {string} Hex color string (e.g., '#00ffff')
     */
    static hslToHex(h, s, l) {
        s = s / 100;
        l = l / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c/2;
        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
        else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
        else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
        else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
        else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
        else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Convert hex color to RGB array (normalized 0-1)
     * @param {string} hex - Hex color string (e.g., '#00ffff' or '00ffff')
     * @returns {number[]} RGB array [r, g, b] with values 0-1
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ] : [1, 1, 1]; // Default to white if parsing fails
    }
}
