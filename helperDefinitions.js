/**
 * Helper Definitions System
 *
 * Manages contextual definitions for musical and technical terms throughout the app.
 * Definitions adapt based on user progress and current context.
 */

class DefinitionsManager {
    constructor() {
        this.viewedTerms = new Set();
        this.termDatabase = this.initializeTermDatabase();
        this.loadViewedTerms();
    }

    /**
     * Initialize the term definitions database
     */
    initializeTermDatabase() {
        return {
            // Core Audio Concepts
            'frequency': {
                term: 'Frequency',
                levels: {
                    beginner: {
                        text: 'Frequency is how fast something vibrates. In music, it determines the <strong>pitch</strong> of a sound—faster vibrations create higher notes, slower vibrations create lower notes.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Frequency measures how many complete vibration cycles occur per second, measured in <strong>Hertz (Hz)</strong>. For example, 440 Hz means the sound wave completes 440 cycles every second. Doubling the frequency raises the pitch by one <strong>octave</strong>.',
                        visual: null
                    },
                    advanced: {
                        text: 'Frequency (f) is the rate of oscillation measured in Hertz. Musical pitch follows a logarithmic relationship to frequency—each doubling of frequency (2:1 ratio) corresponds to one octave increase. The standard tuning reference is A4 = 440 Hz.',
                        visual: null
                    }
                }
            },

            'frequencies': {
                term: 'Frequency',
                levels: {
                    beginner: {
                        text: 'Frequency is how fast something vibrates. In music, it determines the <strong>pitch</strong> of a sound—faster vibrations create higher notes, slower vibrations create lower notes.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Frequency measures how many complete vibration cycles occur per second, measured in <strong>Hertz (Hz)</strong>. For example, 440 Hz means the sound wave completes 440 cycles every second. Doubling the frequency raises the pitch by one <strong>octave</strong>.',
                        visual: null
                    },
                    advanced: {
                        text: 'Frequency (f) is the rate of oscillation measured in Hertz. Musical pitch follows a logarithmic relationship to frequency—each doubling of frequency (2:1 ratio) corresponds to one octave increase. The standard tuning reference is A4 = 440 Hz.',
                        visual: null
                    }
                }
            },

            'hertz': {
                term: 'Hertz (Hz)',
                levels: {
                    beginner: {
                        text: 'Hertz (Hz) is the unit we use to measure <strong>frequency</strong>. One Hz means one vibration per second. So 440 Hz means 440 vibrations per second—this is the musical note A.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Hertz (Hz) is the standard unit for frequency, named after physicist Heinrich Hertz. In music, A4 (the A above middle C) is tuned to 440 Hz in modern concert pitch. Human hearing typically ranges from 20 Hz to 20,000 Hz.',
                        visual: null
                    },
                    advanced: {
                        text: 'The Hertz (Hz) unit measures cycles per second. Musical intervals are frequency ratios: octave = 2:1, perfect fifth = 3:2, major third = 5:4. The equal temperament system divides octaves into 12 equal semitones, each a factor of 2^(1/12) ≈ 1.059.',
                        visual: null
                    }
                }
            },

            'hz': {
                term: 'Hertz (Hz)',
                levels: {
                    beginner: {
                        text: 'Hz is short for Hertz—the unit we use to measure <strong>frequency</strong>. One Hz means one vibration per second. So 440 Hz means 440 vibrations per second.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Hz (Hertz) is the standard unit for frequency. In music, A4 is tuned to 440 Hz in modern concert pitch. Human hearing typically ranges from 20 Hz to 20,000 Hz.',
                        visual: null
                    },
                    advanced: {
                        text: 'Hz (Hertz) measures cycles per second. Musical intervals are frequency ratios: octave = 2:1, perfect fifth = 3:2, major third = 5:4.',
                        visual: null
                    }
                }
            },

            'waveform': {
                term: 'Waveform',
                levels: {
                    beginner: {
                        text: 'A waveform is a visual representation of sound. It shows how air pressure changes over time as sound travels. The pattern repeats based on the note\'s <strong>frequency</strong>—tighter waves mean higher notes.',
                        visual: null
                    },
                    intermediate: {
                        text: 'A waveform displays the amplitude (loudness) of a sound wave over time. The shape reveals the sound\'s timbre—sine waves are pure tones, while complex waveforms contain <strong>harmonics</strong>. The distance between repeating patterns shows the <strong>wavelength</strong>.',
                        visual: null
                    },
                    advanced: {
                        text: 'Waveforms represent the time-domain visualization of audio signals. Fourier analysis decomposes complex waveforms into constituent sine waves. The fundamental frequency determines pitch, while harmonic content defines timbre.',
                        visual: null
                    }
                }
            },

            'interval': {
                term: 'Interval',
                levels: {
                    beginner: {
                        text: 'An interval is the distance between two notes. Just like you can measure the distance between two places, we measure the distance between two musical pitches. Different intervals create different feelings—some sound happy, some sound sad, some sound tense.',
                        visual: null
                    },
                    intermediate: {
                        text: 'An interval is the musical distance between two pitches, measured in <strong>semitones</strong> (half-steps). Common intervals include the <strong>perfect fifth</strong> (7 semitones), <strong>major third</strong> (4 semitones), and <strong>octave</strong> (12 semitones). Each interval has a unique sound quality.',
                        visual: null
                    },
                    advanced: {
                        text: 'Intervals represent pitch relationships as frequency ratios. In just intonation, simple ratios (3:2, 5:4) create consonant intervals. Equal temperament approximates these ratios. Intervals are classified as major, minor, perfect, augmented, or diminished based on their size and quality.',
                        visual: null
                    }
                }
            },

            'unison': {
                term: 'Unison',
                levels: {
                    beginner: {
                        text: 'Unison means two sounds are at exactly the same pitch—the same <strong>frequency</strong>. When two notes are in unison, they sound perfectly locked together as one unified sound, with no wavering or beating.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Unison occurs when two tones vibrate at the exact same frequency (1:1 ratio). This is the most consonant possible relationship—the <strong>beat frequency</strong> approaches zero, and the <strong>interference pattern</strong> becomes perfectly symmetric. Unison is the reference point for tuning.',
                        visual: null
                    },
                    advanced: {
                        text: 'Unison (0 semitones, 1:1 frequency ratio) represents perfect phase coherence between two oscillators. Any frequency deviation creates audible beats at a rate equal to the difference frequency. Unison is fundamental to tuning, chorusing effects, and phase-locked synthesis.',
                        visual: null
                    }
                }
            },

            'beat frequency': {
                term: 'Beat Frequency',
                levels: {
                    beginner: {
                        text: 'Beat frequency is the "wah-wah-wah" pulsing sound you hear when two notes are close but not quite the same pitch. It\'s your ears literally hearing the <em>difference</em> between the two frequencies. The closer the notes, the slower the beats. At <strong>unison</strong>, the beats disappear completely.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Beat frequency results from acoustic interference between two similar frequencies. The beat rate (in Hz) equals the difference between the two frequencies. For example, 440 Hz and 442 Hz create 2 beats per second. Musicians use this phenomenon to fine-tune instruments to perfect <strong>unison</strong>.',
                        visual: null
                    },
                    advanced: {
                        text: 'Beat frequency (f_beat = |f1 - f2|) arises from amplitude modulation when two sinusoids interfere. The phenomenon demonstrates the superposition principle: cos(2πf1t) + cos(2πf2t) = 2cos(2π((f1+f2)/2)t)·cos(2π((f1-f2)/2)t). This forms the basis for heterodyne detection and analog tuning.',
                        visual: null
                    }
                }
            },

            'consonance': {
                term: 'Consonance',
                levels: {
                    beginner: {
                        text: 'Consonance describes sounds that feel pleasant, stable, and harmonious together. Consonant <strong>intervals</strong> sound smooth and resolved—like they "fit" together naturally. Examples include <strong>octaves</strong> and <strong>perfect fifths</strong>.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Consonance occurs when <strong>frequencies</strong> relate through simple ratios (like 2:1, 3:2, 4:3), causing their <strong>harmonics</strong> to align. This creates stable, pleasing sounds. The most consonant intervals are <strong>unison</strong>, <strong>octave</strong>, <strong>perfect fifth</strong>, and <strong>perfect fourth</strong>.',
                        visual: null
                    },
                    advanced: {
                        text: 'Consonance correlates with simple frequency ratios and minimal critical band roughness. Helmholtz\'s theory attributes consonance to harmonic coincidence and the absence of beating between partials. Modern psychoacoustics considers both sensory consonance (roughness minimization) and musical consonance (learned cultural patterns).',
                        visual: null
                    }
                }
            },

            'dissonance': {
                term: 'Dissonance',
                levels: {
                    beginner: {
                        text: 'Dissonance describes sounds that feel tense, unstable, or clashing. Dissonant <strong>intervals</strong> create a sense of tension that wants to resolve. The <strong>tritone</strong> is a famous example—it sounds unsettled and needs to move to something more stable.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Dissonance results from complex frequency ratios that cause <strong>beat frequencies</strong> and harmonic roughness. Intervals like the <strong>tritone</strong> (45:32 ratio) and <strong>minor second</strong> (16:15 ratio) are highly dissonant. Dissonance creates musical tension that drives harmonic progressions.',
                        visual: null
                    },
                    advanced: {
                        text: 'Dissonance arises from critical band roughness when partials fall within ~20-200 Hz separation, creating perceived beating. The dissonance curve shows maximum roughness at quarter-critical bandwidth. Context-dependent dissonance varies by musical style and learned expectations beyond pure psychoacoustic factors.',
                        visual: null
                    }
                }
            },

            'octave': {
                term: 'Octave',
                levels: {
                    beginner: {
                        text: 'An octave is a special <strong>interval</strong> where the higher note vibrates exactly twice as fast as the lower note. The two notes sound similar—like the same note but higher or lower. Octaves are fundamental to music—singing "Do-Re-Mi-Fa-So-La-Ti-Do" goes up one octave.',
                        visual: null
                    },
                    intermediate: {
                        text: 'An octave represents a 2:1 <strong>frequency</strong> ratio—the most consonant interval after <strong>unison</strong>. For example, A3 = 220 Hz and A4 = 440 Hz are one octave apart. In Western music, octaves are divided into 12 equal semitones. Octave equivalence means notes differing by octaves are perceived as having the same pitch class.',
                        visual: null
                    },
                    advanced: {
                        text: 'The octave (2:1 frequency ratio, 1200 cents, 12 semitones) exhibits special perceptual qualities due to harmonic alignment—every harmonic of the lower note coincides with a harmonic of the upper note. Octave equivalence is nearly universal across cultures. Logarithmic pitch perception means octaves represent equal perceptual distances.',
                        visual: null
                    }
                }
            },

            'glissando': {
                term: 'Glissando',
                levels: {
                    beginner: {
                        text: 'A glissando is a smooth slide from one note to another, passing through all the pitches in between. Think of sliding your finger up a guitar string or running your finger across piano keys—the pitch changes continuously rather than jumping.',
                        visual: null
                    },
                    intermediate: {
                        text: 'A glissando is a continuous pitch bend between two notes, as opposed to discrete steps. The <strong>frequency</strong> changes smoothly over time. Glissandos are natural for voice, strings, and trombones. In this app, glissandos help you hear how <strong>intervals</strong> relate and how <strong>beat frequencies</strong> change as pitches converge.',
                        visual: null
                    },
                    advanced: {
                        text: 'A glissando represents continuous frequency modulation, typically exponential for musical pitch perception (linear in log-frequency space). The term derives from French "glisser" (to slide). Portamento is similar but implies a specific starting/ending pitch, while glissando may encompass the full range. Used extensively in ear training to develop pitch tracking and interval recognition.',
                        visual: null
                    }
                }
            },

            'major third': {
                term: 'Major Third',
                levels: {
                    beginner: {
                        text: 'A major third is a bright, happy-sounding <strong>interval</strong>. It\'s the distance from the first note to the third note in a major scale (like Do-Mi). Major thirds give major chords their characteristic joyful sound.',
                        visual: null
                    },
                    intermediate: {
                        text: 'A major third spans 4 semitones (like C to E). In just intonation, it has a 5:4 <strong>frequency</strong> ratio, one of the most <strong>consonant</strong> intervals. In equal temperament, it\'s slightly wider (400 cents vs. 386 cents just). Major thirds are the defining interval of major triads.',
                        visual: null
                    },
                    advanced: {
                        text: 'The major third (4 semitones, 400 cents in equal temperament) approximates the 5:4 just ratio (386 cents). This 14-cent discrepancy creates mild beating in equal temperament tuning. The major third is the fifth harmonic relationship and defines major tonality. Combined with a minor third above creates a perfect fifth.',
                        visual: null
                    }
                }
            },

            'perfect fifth': {
                term: 'Perfect Fifth',
                levels: {
                    beginner: {
                        text: 'A perfect fifth is a strong, stable-sounding <strong>interval</strong>. It\'s the distance from the first note to the fifth note in a major scale (like Do-Sol). Perfect fifths sound hollow and powerful—they\'re the basis for power chords in rock music.',
                        visual: null
                    },
                    intermediate: {
                        text: 'A perfect fifth spans 7 semitones (like C to G). It has a simple 3:2 <strong>frequency</strong> ratio, making it highly <strong>consonant</strong>. Perfect fifths are so stable they\'re used as the basis for tuning systems. They appear prominently in melodies and harmonies across all musical styles.',
                        visual: null
                    },
                    advanced: {
                        text: 'The perfect fifth (7 semitones, 700 cents) closely approximates the 3:2 just ratio (702 cents)—only 2 cents flat in equal temperament. This third harmonic relationship creates maximum consonance after octaves and unison. The circle of fifths demonstrates that 12 fifths nearly equal 7 octaves (Pythagorean comma discrepancy).',
                        visual: null
                    }
                }
            },

            'tritone': {
                term: 'Tritone',
                levels: {
                    beginner: {
                        text: 'The tritone is one of the most tense, unsettled <strong>intervals</strong> in music. It\'s exactly halfway through an <strong>octave</strong>—three whole tones (six half-steps). Historically called "the devil\'s interval," it creates a strong feeling that needs to resolve to something more stable.',
                        visual: null
                    },
                    intermediate: {
                        text: 'The tritone spans 6 semitones (like C to F♯), dividing the <strong>octave</strong> exactly in half. Its complex <strong>frequency</strong> ratio (roughly 45:32 in just intonation) creates maximum <strong>dissonance</strong>. The tritone is the defining interval of dominant seventh chords and creates tension in tonal harmony.',
                        visual: null
                    },
                    advanced: {
                        text: 'The tritone (6 semitones, 600 cents, √2:1 ratio in equal temperament) is maximally ambiguous—inversionally equivalent to itself. Its high dissonance derives from complex ratios and critical band roughness. Functionally essential in V7-I cadences. The tritone substitution (♭II7 for V7) works because they share a tritone.',
                        visual: null
                    }
                }
            },

            'interference pattern': {
                term: 'Interference Pattern',
                levels: {
                    beginner: {
                        text: 'The interference pattern shows how sound waves interact in space—like ripples in water when you drop two stones. When two sounds play together, their waves combine to create beautiful, complex patterns. These patterns help us see what we\'re hearing.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Interference patterns visualize how sound waves add together in space (superposition principle). Where wave peaks align, they reinforce (constructive interference); where peaks meet troughs, they cancel (destructive interference). Different <strong>intervals</strong> create distinct interference patterns—<strong>unison</strong> creates perfect symmetry.',
                        visual: null
                    },
                    advanced: {
                        text: 'Interference patterns result from wave superposition in the spatial domain. Constructive interference occurs at points where phase difference = 2πn; destructive where phase difference = π(2n+1). The pattern\'s complexity correlates with the frequency ratio—simple ratios (consonant intervals) produce simpler, more periodic patterns. Used here as a top-down view of acoustic pressure fields.',
                        visual: null
                    }
                }
            },

            'solfege': {
                term: 'Solfège',
                levels: {
                    beginner: {
                        text: 'Solfège is the Do-Re-Mi-Fa-Sol-La-Ti-Do system for singing notes. Each syllable represents a specific note in a scale. It helps you learn to sing in tune by giving each note a name you can remember and practice.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Solfège (or solfeggio) is a method for sight-singing that assigns syllables to scale degrees. "Movable do" systems keep Do as the tonic regardless of key. This develops relative pitch—recognizing <strong>intervals</strong> and melodic patterns independent of absolute pitch. Widely used in ear training and choral music.',
                        visual: null
                    },
                    advanced: {
                        text: 'Solfège provides phonetic anchors for scale degrees, facilitating audiation and sight-singing. Movable-do systems emphasize functional relationships (tonic, dominant, etc.), while fixed-do assigns syllables to absolute pitches. Chromatic solfège extends the system with altered syllables (Di, Ri, Fi, etc.). Essential tool for developing intervallic hearing and tonal memory.',
                        visual: null
                    }
                }
            },

            'named note': {
                term: 'Named Note',
                levels: {
                    beginner: {
                        text: 'Named notes are the letters we use for pitches: A, B, C, D, E, F, and G. After G, it goes back to A again (but higher). Sharps (♯) make notes higher, flats (♭) make them lower. For example, A4 is the A above middle C, commonly tuned to 440 <strong>Hz</strong>.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Note names use letters A-G with octave numbers (A0, A1, A2, etc.). Middle C is C4. Accidentals modify pitch: ♯ (sharp) raises by one semitone, ♭ (flat) lowers by one semitone. Enharmonic equivalents are different names for the same pitch (like G♯ and A♭). Concert pitch standard sets A4 = 440 <strong>Hz</strong>.',
                        visual: null
                    },
                    advanced: {
                        text: 'Western note naming uses a seven-note diatonic system (A-G) with chromatic alterations (♯, ♭, ♮). Scientific pitch notation adds octave designators (C4 = middle C). MIDI note numbers provide an alternative: C4 = 60, A4 = 69. Frequency calculation: f = 440 × 2^((n-69)/12) where n is MIDI note number. Different systems exist globally.',
                        visual: null
                    }
                }
            },

            'higher frequencies': {
                term: 'Higher Frequencies',
                levels: {
                    beginner: {
                        text: 'Higher frequencies mean faster vibrations, which create higher-pitched sounds. Think of a whistle versus a drum—the whistle has much higher <strong>frequency</strong> and sounds higher.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Higher frequencies correspond to higher pitches. Doubling the <strong>frequency</strong> raises the pitch by one <strong>octave</strong>. Human hearing ranges from about 20 Hz (very low) to 20,000 Hz (very high), though this range decreases with age.',
                        visual: null
                    },
                    advanced: {
                        text: 'Frequency and pitch follow a logarithmic relationship. Each octave doubling represents equal perceptual distance. Temporal processing dominates low-frequency pitch perception; place coding dominates high frequencies. Human sensitivity peaks around 2-4 kHz (speech frequency range).',
                        visual: null
                    }
                }
            },

            'lower frequencies': {
                term: 'Lower Frequencies',
                levels: {
                    beginner: {
                        text: 'Lower frequencies mean slower vibrations, which create lower-pitched sounds. Think of a bass guitar versus a flute—the bass has much lower <strong>frequency</strong> and sounds deeper.',
                        visual: null
                    },
                    intermediate: {
                        text: 'Lower frequencies correspond to lower pitches. Bass notes in music typically range from about 40 Hz to 250 Hz. Lower frequencies have longer wavelengths and can travel through walls more easily than high frequencies.',
                        visual: null
                    },
                    advanced: {
                        text: 'Low-frequency perception relies primarily on phase-locking and temporal coding in the auditory nerve (below ~1.5 kHz). Bass perception involves both auditory and tactile sensation. Critical band width is narrower at low frequencies, affecting masking and consonance judgments.',
                        visual: null
                    }
                }
            }
        };
    }

    /**
     * Load viewed terms from storage
     */
    loadViewedTerms() {
        try {
            const stored = localStorage.getItem('helper_viewed_terms');
            if (stored) {
                this.viewedTerms = new Set(JSON.parse(stored));
            }
        } catch (err) {
            console.warn('[HelperDefinitions] Failed to load viewed terms:', err);
        }
    }

    /**
     * Save viewed terms to storage
     */
    saveViewedTerms() {
        try {
            localStorage.setItem('helper_viewed_terms', JSON.stringify([...this.viewedTerms]));
        } catch (err) {
            console.warn('[HelperDefinitions] Failed to save viewed terms:', err);
        }
    }

    /**
     * Mark a term as viewed
     * @param {string} term - The term that was viewed
     */
    markTermViewed(term) {
        const normalizedTerm = term.toLowerCase();
        this.viewedTerms.add(normalizedTerm);
        this.saveViewedTerms();
    }

    /**
     * Determine the appropriate definition level for a term based on user progress
     * @param {string} term - The term to check
     * @param {Object} context - Current context (exercise, tutorial, etc.)
     * @returns {string} - 'beginner', 'intermediate', or 'advanced'
     */
    getUserLevel(term, context = {}) {
        const normalizedTerm = term.toLowerCase();

        // Check if user has viewed this term before
        const hasViewed = this.viewedTerms.has(normalizedTerm);

        // Get profile completion data if available
        let completedExercises = 0;
        let completedTutorials = 0;

        if (window.profileManager) {
            try {
                const currentProfileName = window.profileManager.getCurrentProfileName();
                const profiles = window.profileManager.getProfiles();
                const currentProfile = profiles[currentProfileName];

                // Count completed items (this is a simplified check)
                // Profile manager stores metadata, not detailed completion data
                // So we'll use a simple heuristic based on usage
                completedExercises = 0; // Placeholder - profile doesn't track this granularly
                completedTutorials = 0; // Placeholder - profile doesn't track this granularly
            } catch (err) {
                console.warn('[HelperDefinitions] Error accessing profile data:', err);
            }
        }

        // Determine level based on progress and previous views
        if (hasViewed || completedExercises > 5 || completedTutorials > 2) {
            return 'intermediate';
        } else if (completedExercises > 10 || completedTutorials > 4) {
            return 'advanced';
        }

        return 'beginner';
    }

    /**
     * Get the definition for a term
     * @param {string} term - The term to look up
     * @param {Object} context - Current context
     * @returns {Object|null} - Definition object or null if not found
     */
    getDefinition(term, context = {}) {
        const normalizedTerm = term.toLowerCase();
        const termData = this.termDatabase[normalizedTerm];

        if (!termData) {
            console.warn(`[HelperDefinitions] Term not found: ${term}`);
            return null;
        }

        const level = this.getUserLevel(normalizedTerm, context);
        const definition = termData.levels[level];

        return {
            term: termData.term,
            text: definition.text,
            visual: definition.visual,
            level: level
        };
    }

    /**
     * Process HTML text to wrap known terms with helper spans
     * @param {string} html - HTML text containing terms
     * @returns {string} - Processed HTML with helper term spans
     */
    processTextForHelperTerms(html) {
        // Create a temporary element to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Get all text nodes that are inside <strong> tags
        const strongTags = temp.querySelectorAll('strong');

        strongTags.forEach(strong => {
            const text = strong.textContent.trim();
            const normalizedText = text.toLowerCase();

            // Check if this is a known term
            if (this.termDatabase[normalizedText]) {
                // Don't wrap if already wrapped
                if (!strong.classList.contains('helper-term')) {
                    // Replace the strong tag with our helper term span
                    const span = document.createElement('span');
                    span.className = 'helper-term';
                    span.setAttribute('data-term', normalizedText);
                    span.innerHTML = text + '<sup>?</sup>';
                    strong.replaceWith(span);
                }
            }
        });

        return temp.innerHTML;
    }

    /**
     * Check if a term exists in the database
     * @param {string} term - The term to check
     * @returns {boolean}
     */
    hasTerm(term) {
        return this.termDatabase.hasOwnProperty(term.toLowerCase());
    }
}

// Create global instance
window.helperDefinitionsManager = new DefinitionsManager();
