/**
 * Interval Configuration Data
 *
 * Central configuration for all musical intervals used in the General Interval Overview exercises.
 * Each config contains metadata needed to generate a tutorial and exercise for that interval.
 *
 * Properties:
 * - intervalType: Unique identifier (e.g., 'octave', 'fifth')
 * - semitones: Number of semitones from root (0-12)
 * - intervalName: Display name (e.g., 'Perfect Octave')
 * - frequencyRatio: Simple frequency ratio (e.g., '2:1', '3:2')
 * - rootFreq: Default root frequency (Hz)
 * - intervalFreq: Calculated interval frequency (Hz)
 * - description: Brief description of the interval's sound
 * - character: Key characteristics to listen for
 * - consonance: Consonance level ('perfect', 'imperfect', 'dissonant')
 * - tutorialEmphasis: What to emphasize in the tutorial
 * - comparisonIntervals: Other intervals to compare against
 */

const INTERVAL_CONFIGS = Object.freeze({
    // Unison (Perfect Consonance)
    unison: {
        intervalType: 'unison',
        semitones: 0,
        intervalName: 'Unison',
        frequencyRatio: '1:1',
        rootFreq: 440,
        intervalFreq: 440,
        description: 'the same exact note',
        character: 'perfectly matched',
        consonance: 'perfect',
        tutorialEmphasis: 'Unison means singing the exact same note. It\'s the foundation of all pitch matching.',
        waveEmphasis: 'Unison shows <strong>identical waves</strong> perfectly aligned.',
        interferenceEmphasis: 'Unison creates <strong>perfect reinforcement</strong> with no interference pattern.',
        comparisonIntervals: []
    },

    // Perfect Consonances
    octave: {
        intervalType: 'octave',
        semitones: 12,
        intervalName: 'Perfect Octave',
        frequencyRatio: '2:1',
        rootFreq: 440,
        intervalFreq: 880,
        intervalFreqDown: 220,
        description: 'the same note, just higher or lower',
        character: 'unified and stable',
        consonance: 'perfect',
        tutorialEmphasis: 'Notice how it sounds like the same note, just at a different height. The octave preserves the note\'s identity.',
        waveEmphasis: 'The octave completes <strong>two full cycles</strong> for every <strong>one cycle</strong> of the root.',
        interferenceEmphasis: 'The octave creates one of the <strong>simplest and most stable</strong> interference patterns.',
        comparisonIntervals: [
            { name: 'fifth', semitones: 7, freq: 660, description: 'still consonant, but with more tension and a distinct character' },
            { name: 'major third', semitones: 4, freq: 554.37, description: 'a beautiful, warm interval but clearly two different notes' }
        ]
    },

    fifth: {
        intervalType: 'fifth',
        semitones: 7,
        intervalName: 'Perfect Fifth',
        frequencyRatio: '3:2',
        rootFreq: 440,
        intervalFreq: 660,
        description: 'strong, open, and stable',
        character: 'powerful and consonant',
        consonance: 'perfect',
        tutorialEmphasis: 'The perfect fifth is one of the most consonant intervals. It sounds strong, stable, and "open".',
        waveEmphasis: 'The fifth completes <strong>three cycles</strong> for every <strong>two cycles</strong> of the root.',
        interferenceEmphasis: 'The fifth creates a <strong>stable, organized</strong> interference pattern with a clear 3:2 relationship.',
        comparisonIntervals: [
            { name: 'octave', semitones: 12, freq: 880, description: 'even more unified — sounds like the same note' },
            { name: 'fourth', semitones: 5, freq: 587.33, description: 'the fifth\'s mirror — also consonant but slightly less open' },
            { name: 'tritone', semitones: 6, freq: 622.25, description: 'the most dissonant interval — unstable and tense' }
        ]
    },

    fourth: {
        intervalType: 'fourth',
        semitones: 5,
        intervalName: 'Perfect Fourth',
        frequencyRatio: '4:3',
        rootFreq: 440,
        intervalFreq: 587.33,
        description: 'stable and consonant',
        character: 'grounded and solid',
        consonance: 'perfect',
        tutorialEmphasis: 'The perfect fourth is consonant and stable. It\'s the inverse of the fifth and has a characteristic "solid" quality.',
        waveEmphasis: 'The fourth completes <strong>four cycles</strong> for every <strong>three cycles</strong> of the root.',
        interferenceEmphasis: 'The fourth creates a <strong>regular, consonant</strong> interference pattern.',
        comparisonIntervals: [
            { name: 'fifth', semitones: 7, freq: 660, description: 'the fourth\'s mirror — more open and powerful' },
            { name: 'major third', semitones: 4, freq: 554.37, description: 'warmer and sweeter, less neutral' },
            { name: 'tritone', semitones: 6, freq: 622.25, description: 'very close in pitch but completely different in character — unstable and tense' }
        ]
    },

    // Major intervals
    majorThird: {
        intervalType: 'major-third',
        semitones: 4,
        intervalName: 'Major Third',
        frequencyRatio: '5:4',
        rootFreq: 440,
        intervalFreq: 554.37,
        description: 'bright, warm, and happy',
        character: 'sweet and consonant',
        consonance: 'imperfect',
        tutorialEmphasis: 'The major third sounds bright, happy, and warm. It\'s the foundation of major chords.',
        waveEmphasis: 'The major third completes <strong>five cycles</strong> for every <strong>four cycles</strong> of the root.',
        interferenceEmphasis: 'The major third creates a <strong>more complex but still pleasant</strong> interference pattern.',
        comparisonIntervals: [
            { name: 'minor third', semitones: 3, freq: 523.25, description: 'darker and sadder — the minor version' },
            { name: 'fourth', semitones: 5, freq: 587.33, description: 'more neutral and stable' },
            { name: 'major second', semitones: 2, freq: 493.88, description: 'more tense and unstable' }
        ]
    },

    majorSixth: {
        intervalType: 'major-sixth',
        semitones: 9,
        intervalName: 'Major Sixth',
        frequencyRatio: '5:3',
        rootFreq: 440,
        intervalFreq: 880 * (5/8), // 733.33 Hz
        description: 'sweet and open',
        character: 'bright and consonant',
        consonance: 'imperfect',
        tutorialEmphasis: 'The major sixth is sweet and open, often described as yearning or romantic.',
        waveEmphasis: 'The major sixth completes <strong>five cycles</strong> for every <strong>three cycles</strong> of the root.',
        interferenceEmphasis: 'The major sixth creates a <strong>pleasant, relatively stable</strong> interference pattern.',
        comparisonIntervals: [
            { name: 'minor sixth', semitones: 8, freq: 440 * Math.pow(2, 8/12), description: 'darker and more melancholic' },
            { name: 'fifth', semitones: 7, freq: 660, description: 'more stable and powerful' },
            { name: 'minor seventh', semitones: 10, freq: 440 * Math.pow(2, 10/12), description: 'more tense and dissonant' }
        ]
    },

    // Minor intervals
    minorThird: {
        intervalType: 'minor-third',
        semitones: 3,
        intervalName: 'Minor Third',
        frequencyRatio: '6:5',
        rootFreq: 440,
        intervalFreq: 523.25,
        description: 'dark, sad, and somber',
        character: 'melancholic but consonant',
        consonance: 'imperfect',
        tutorialEmphasis: 'The minor third sounds dark, sad, and melancholic. It\'s the foundation of minor chords.',
        waveEmphasis: 'The minor third completes <strong>six cycles</strong> for every <strong>five cycles</strong> of the root.',
        interferenceEmphasis: 'The minor third creates a <strong>slightly more complex</strong> interference pattern than the major third.',
        comparisonIntervals: [
            { name: 'major third', semitones: 4, freq: 554.37, description: 'brighter and happier — the major version' },
            { name: 'major second', semitones: 2, freq: 493.88, description: 'more dissonant and tense' },
            { name: 'fourth', semitones: 5, freq: 587.33, description: 'more stable and neutral' }
        ]
    },

    minorSixth: {
        intervalType: 'minor-sixth',
        semitones: 8,
        intervalName: 'Minor Sixth',
        frequencyRatio: '8:5',
        rootFreq: 440,
        intervalFreq: 440 * Math.pow(2, 8/12), // ~659.26 Hz
        description: 'dark and melancholic',
        character: 'sad but stable',
        consonance: 'imperfect',
        tutorialEmphasis: 'The minor sixth has a dark, melancholic quality. It\'s often used to express sadness or longing.',
        waveEmphasis: 'The minor sixth completes <strong>eight cycles</strong> for every <strong>five cycles</strong> of the root.',
        interferenceEmphasis: 'The minor sixth creates a <strong>relatively stable but darker</strong> interference pattern.',
        comparisonIntervals: [
            { name: 'major sixth', semitones: 9, freq: 880 * (5/8), description: 'brighter and more optimistic' },
            { name: 'fifth', semitones: 7, freq: 660, description: 'more consonant and stable' },
            { name: 'minor seventh', semitones: 10, freq: 440 * Math.pow(2, 10/12), description: 'more dissonant and tense' }
        ]
    },

    // Dissonant intervals
    majorSecond: {
        intervalType: 'major-second',
        semitones: 2,
        intervalName: 'Major Second',
        frequencyRatio: '9:8',
        rootFreq: 440,
        intervalFreq: 493.88,
        description: 'tense and unstable',
        character: 'mildly dissonant',
        consonance: 'dissonant',
        tutorialEmphasis: 'The major second creates tension and wants to resolve. It\'s dissonant but not harsh.',
        waveEmphasis: 'The major second has a <strong>complex 9:8 ratio</strong>, creating noticeable beating.',
        interferenceEmphasis: 'The major second creates a <strong>complex, active</strong> interference pattern with visible tension.',
        comparisonIntervals: [
            { name: 'minor second', semitones: 1, freq: 466.16, description: 'even more dissonant — the most tense interval' },
            { name: 'minor third', semitones: 3, freq: 523.25, description: 'more consonant and stable' },
            { name: 'major third', semitones: 4, freq: 554.37, description: 'much more consonant and pleasant' }
        ]
    },

    minorSecond: {
        intervalType: 'minor-second',
        semitones: 1,
        intervalName: 'Minor Second',
        frequencyRatio: '16:15',
        rootFreq: 440,
        intervalFreq: 466.16,
        description: 'extremely tense and dissonant',
        character: 'harsh and unstable',
        consonance: 'dissonant',
        tutorialEmphasis: 'The minor second is one of the most dissonant intervals. It creates strong tension and wants to resolve immediately.',
        waveEmphasis: 'The minor second creates <strong>rapid beating</strong> due to the very close frequencies.',
        interferenceEmphasis: 'The minor second creates a <strong>highly complex, unstable</strong> interference pattern with strong beating.',
        comparisonIntervals: [
            { name: 'major second', semitones: 2, freq: 493.88, description: 'still dissonant but less harsh' },
            { name: 'unison', semitones: 0, freq: 440, description: 'perfectly stable — no tension' },
            { name: 'minor third', semitones: 3, freq: 523.25, description: 'much more consonant' }
        ]
    },

    tritone: {
        intervalType: 'tritone',
        semitones: 6,
        intervalName: 'Tritone',
        frequencyRatio: '√2:1',
        rootFreq: 440,
        intervalFreq: 622.25,
        description: 'unstable and tense',
        character: 'the most dissonant interval',
        consonance: 'dissonant',
        tutorialEmphasis: 'The tritone is the most dissonant interval. It divides the octave exactly in half and creates maximum tension.',
        waveEmphasis: 'The tritone has an <strong>irrational √2:1 ratio</strong>, creating complex, chaotic beating.',
        interferenceEmphasis: 'The tritone creates the <strong>most chaotic and unstable</strong> interference pattern.',
        comparisonIntervals: [
            { name: 'fourth', semitones: 5, freq: 587.33, description: 'consonant and stable — a huge contrast' },
            { name: 'fifth', semitones: 7, freq: 660, description: 'also consonant — the tritone sits right between them' },
            { name: 'octave', semitones: 12, freq: 880, description: 'perfectly consonant — the complete opposite' }
        ]
    },

    majorSeventh: {
        intervalType: 'major-seventh',
        semitones: 11,
        intervalName: 'Major Seventh',
        frequencyRatio: '15:8',
        rootFreq: 440,
        intervalFreq: 440 * Math.pow(2, 11/12), // ~830.61 Hz
        description: 'tense and yearning',
        character: 'dissonant but beautiful',
        consonance: 'dissonant',
        tutorialEmphasis: 'The major seventh is dissonant and tense, but often considered beautiful. It wants to resolve up to the octave.',
        waveEmphasis: 'The major seventh creates <strong>noticeable beating</strong> close to the octave.',
        interferenceEmphasis: 'The major seventh creates a <strong>tense, active</strong> interference pattern.',
        comparisonIntervals: [
            { name: 'octave', semitones: 12, freq: 880, description: 'the resolution point — stable and consonant' },
            { name: 'minor seventh', semitones: 10, freq: 440 * Math.pow(2, 10/12), description: 'darker and slightly more stable' },
            { name: 'major sixth', semitones: 9, freq: 880 * (5/8), description: 'more consonant and sweet' }
        ]
    },

    minorSeventh: {
        intervalType: 'minor-seventh',
        semitones: 10,
        intervalName: 'Minor Seventh',
        frequencyRatio: '16:9',
        rootFreq: 440,
        intervalFreq: 440 * Math.pow(2, 10/12), // ~783.99 Hz
        description: 'dark and tense',
        character: 'mildly dissonant',
        consonance: 'dissonant',
        tutorialEmphasis: 'The minor seventh is dissonant but less harsh than the major seventh. It has a bluesy, jazzy quality.',
        waveEmphasis: 'The minor seventh has a <strong>16:9 ratio</strong>, creating moderate complexity.',
        interferenceEmphasis: 'The minor seventh creates a <strong>moderately tense</strong> interference pattern.',
        comparisonIntervals: [
            { name: 'major seventh', semitones: 11, freq: 440 * Math.pow(2, 11/12), description: 'brighter and more tense' },
            { name: 'major sixth', semitones: 9, freq: 880 * (5/8), description: 'more consonant and sweet' },
            { name: 'octave', semitones: 12, freq: 880, description: 'the resolution — perfectly stable' }
        ]
    }
});

// Helper function to get interval config by type
function getIntervalConfig(intervalType) {
    return INTERVAL_CONFIGS[intervalType] || null;
}

// Helper function to get all interval types
function getAllIntervalTypes() {
    return Object.keys(INTERVAL_CONFIGS);
}

// Helper function to get intervals by consonance level
function getIntervalsByConsonance(consonanceLevel) {
    return Object.values(INTERVAL_CONFIGS).filter(
        config => config.consonance === consonanceLevel
    );
}
