// Octave Match Down Exercise
class OctaveDownExercise {
    constructor() {
        this.toneGenerator = new ToneGenerator();
        this.currentBaseNote = null;
        this.currentOctaveNote = null;
        this.showingSecondNote = false;
        this.vocalRange = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById('octaveDownExercise');
        this.noteDisplay = document.getElementById('octaveDownNote');
        this.freqDisplay = document.getElementById('octaveDownFreq');
        this.instructionDisplay = document.getElementById('octaveDownInstruction');
        this.animation = document.getElementById('octaveDownToneAnimation');
        this.stopBtn = document.getElementById('stopOctaveDownToneBtn');
        this.nextBtn = document.getElementById('nextOctaveDownBtn');
        this.backBtn = document.getElementById('backOctaveDownBtn');
        this.exitBtn = document.getElementById('exitOctaveDownExercise');
    }

    attachEventListeners() {
        this.nextBtn.addEventListener('click', () => this.handleNext());
        this.backBtn.addEventListener('click', () => this.handleBack());
        this.stopBtn.addEventListener('click', () => this.stopTone());
        this.exitBtn.addEventListener('click', () => this.exit());
    }

    start() {
        // Get user's vocal range
        this.vocalRange = appSettings.getVocalRange();

        if (!this.vocalRange || !this.vocalRange.low || !this.vocalRange.high) {
            alert('Please set your vocal range first!');
            return;
        }

        // Show exercise container
        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';

        // Reset state
        this.showingSecondNote = false;
        this.currentBaseNote = null;
        this.currentOctaveNote = null;

        // Generate first octave pair
        this.generateOctavePair();

        // Update UI
        this.updateUI();
    }

    generateOctavePair() {
        // Range Directive: Select a note where both it and its octave are within vocal range
        // F3 is approximately 174.61 Hz - use as minimum unless user's range is lower
        // This exercise always goes DOWN (higher note first)
        const MIN_FREQUENCY = 174.61; // F3
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;

        // Find notes that can go down an octave within range
        const minBaseForDownOctave = lowFreq * 2;

        if (minBaseForDownOctave > highFreq) {
            alert('Your vocal range is too narrow for octave down exercises. Please expand your range.');
            this.exit();
            return;
        }

        // Use log scale for more even distribution across notes
        const logMin = Math.log2(Math.max(lowFreq, minBaseForDownOctave));
        const logMax = Math.log2(highFreq);
        const logRandom = logMin + Math.random() * (logMax - logMin);
        const baseFreq = Math.pow(2, logRandom);

        // Calculate octave note (always lower)
        const octaveFreq = baseFreq * 0.5;

        this.currentBaseNote = {
            frequency: baseFreq,
            note: this.frequencyToNote(baseFreq),
            direction: 'down'
        };

        this.currentOctaveNote = {
            frequency: octaveFreq,
            note: this.frequencyToNote(octaveFreq)
        };
    }

    handleNext() {
        if (!this.showingSecondNote) {
            // Play second note (octave)
            this.showingSecondNote = true;
            this.playCurrentNote();
            this.updateUI();
        } else {
            // Generate new octave pair
            this.showingSecondNote = false;
            this.generateOctavePair();
            this.playCurrentNote();
            this.updateUI();
        }
    }

    handleBack() {
        if (this.showingSecondNote) {
            // Go back to first note
            this.showingSecondNote = false;
            this.playCurrentNote();
            this.updateUI();
        }
    }

    playCurrentNote() {
        const note = this.showingSecondNote ? this.currentOctaveNote : this.currentBaseNote;

        if (note) {
            this.toneGenerator.playTone(note.frequency);
            this.noteDisplay.textContent = note.note;
            this.freqDisplay.textContent = `${Math.round(note.frequency)} Hz`;
            this.animation.classList.add('playing');

            // Adjust animation speed based on frequency
            const minFreq = 174;
            const maxFreq = 1000;
            const minDuration = 0.2;
            const maxDuration = 1.2;
            const normalizedFreq = Math.max(0, Math.min(1, (note.frequency - minFreq) / (maxFreq - minFreq)));
            const duration = maxDuration - (normalizedFreq * (maxDuration - minDuration));

            const waves = this.animation.querySelectorAll('.tone-wave');
            waves.forEach(wave => {
                wave.style.animationDuration = `${duration}s`;
            });

            this.stopBtn.style.display = 'flex';
            this.nextBtn.style.display = 'none';
            this.backBtn.style.display = 'none';

            // Auto-stop after 3 seconds
            setTimeout(() => {
                if (this.toneGenerator.isPlaying) {
                    this.stopTone();
                }
            }, 3000);
        }
    }

    stopTone() {
        this.toneGenerator.stopTone();
        this.animation.classList.remove('playing');
        this.stopBtn.style.display = 'none';
        this.updateUI();
    }

    updateUI() {
        if (!this.currentBaseNote) return;

        const nextBtnText = document.getElementById('nextOctaveDownText');

        if (!this.showingSecondNote) {
            // First note state
            if (nextBtnText) {
                nextBtnText.textContent = 'Play Octave Lower';
            }
            this.nextBtn.style.display = 'flex';
            this.backBtn.style.display = 'none';
        } else {
            // Second note state
            if (nextBtnText) {
                nextBtnText.textContent = 'Next Pair';
            }
            this.nextBtn.style.display = 'flex';
            this.backBtn.style.display = 'flex';
        }
    }

    frequencyToNote(frequency) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);

        const halfSteps = 12 * Math.log2(frequency / C0);
        const octave = Math.floor(halfSteps / 12);
        const noteIndex = Math.round(halfSteps % 12);

        return noteNames[noteIndex] + octave;
    }

    exit() {
        this.stopTone();
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        // Add fade-in
        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize exercise
window.octaveDownExercise = new OctaveDownExercise();
