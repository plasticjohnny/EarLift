// Scale Match Up Exercise - All Notes Layout
class ScaleExercise {
    constructor() {
        // Create separate tone generator for each note to allow simultaneous playback
        this.toneGenerators = [];
        for (let i = 0; i < 8; i++) {
            this.toneGenerators[i] = new ToneGenerator();
        }
        this.rootNote = null;
        this.scaleNotes = [];
        this.playingNotes = new Set(); // Track which notes are currently playing
        this.vocalRange = null;

        // Major scale intervals in semitones from root
        this.majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11, 12];

        // Solfege syllables
        this.solfegeSyllables = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById('scaleExercise');

        // All 8 note buttons
        this.noteButtons = [];
        this.noteAnimations = [];
        this.notePlayIcons = [];
        for (let i = 0; i < 8; i++) {
            this.noteButtons[i] = document.getElementById(`scaleNote${i}Btn`);
            this.noteAnimations[i] = document.getElementById(`scaleNote${i}Animation`);
            this.notePlayIcons[i] = document.getElementById(`scaleNote${i}PlayIcon`);
        }

        // New Scale button
        this.newScaleBtn = document.getElementById('newScaleBtn');
        this.exitBtn = document.getElementById('exitScaleExercise');
    }

    attachEventListeners() {
        // Attach listeners to all 8 note buttons
        for (let i = 0; i < 8; i++) {
            if (this.noteButtons[i]) {
                this.noteButtons[i].addEventListener('click', () => this.toggleNote(i));
            }
        }

        if (this.newScaleBtn) {
            this.newScaleBtn.addEventListener('click', () => this.newScale());
        }
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => this.exit());
        }
    }

    toggleNote(index) {
        // If this note is currently playing, stop it
        if (this.playingNotes.has(index)) {
            // Stop this note
            this.toneGenerators[index].stopTone();
            this.playingNotes.delete(index);
            this.noteAnimations[index].classList.remove('playing');
            this.updatePlayIcon(index, '▶');
        } else {
            // Play this note (others can continue playing)
            this.playNote(index);
        }
    }

    start() {
        this.vocalRange = appSettings.getVocalRange();

        if (!this.vocalRange || !this.vocalRange.low || !this.vocalRange.high) {
            alert('Please set your vocal range first!');
            return;
        }

        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';

        this.playingNotes.clear();
        this.generateScale();
        this.updateUI();
    }

    newScale() {
        this.stopAllNotes();
        this.clearAnimations();
        this.resetAllPlayIcons();
        this.playingNotes.clear();
        this.generateScale();
        this.updateUI();
    }

    generateScale() {
        const MIN_FREQUENCY = 174.61; // F3
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;

        const maxRootFreq = highFreq / 2;

        if (maxRootFreq < lowFreq) {
            alert('Your vocal range is too narrow for scale exercises. Please expand your range.');
            this.exit();
            return;
        }

        const logMin = Math.log2(lowFreq);
        const logMax = Math.log2(Math.min(highFreq, maxRootFreq));
        const logRandom = logMin + Math.random() * (logMax - logMin);
        const rootFreq = Math.pow(2, logRandom);

        this.rootNote = {
            frequency: rootFreq,
            note: this.frequencyToNote(rootFreq)
        };

        this.scaleNotes = this.majorScaleIntervals.map((semitones, index) => {
            const freq = rootFreq * Math.pow(2, semitones / 12);
            return {
                frequency: freq,
                note: this.frequencyToNote(freq),
                interval: semitones,
                solfege: this.solfegeSyllables[index]
            };
        });
    }

    playNote(index) {
        if (index < 0 || index >= this.scaleNotes.length) return;

        const note = this.scaleNotes[index];

        if (note) {
            // Play using this note's dedicated tone generator
            this.toneGenerators[index].playTone(note.frequency);
            this.playingNotes.add(index);

            // Show animation for this note
            const animation = this.noteAnimations[index];
            if (animation) {
                animation.classList.add('playing');

                const minFreq = 174;
                const maxFreq = 1000;
                const minDuration = 0.2;
                const maxDuration = 1.2;
                const normalizedFreq = Math.max(0, Math.min(1, (note.frequency - minFreq) / (maxFreq - minFreq)));
                const duration = maxDuration - (normalizedFreq * (maxDuration - minDuration));

                const waves = animation.querySelectorAll('.tone-wave');
                waves.forEach(wave => {
                    wave.style.animationDuration = `${duration}s`;
                });
            }

            // Update play icon to pause
            this.updatePlayIcon(index, '⏸');

            this.updateUI();
        }
    }

    clearAnimations() {
        for (let i = 0; i < 8; i++) {
            this.noteAnimations[i].classList.remove('playing');
        }
    }

    updatePlayIcon(index, icon) {
        if (index >= 0 && index < 8 && this.notePlayIcons[index]) {
            this.notePlayIcons[index].textContent = icon;
        }
    }

    resetAllPlayIcons() {
        for (let i = 0; i < 8; i++) {
            if (this.notePlayIcons[i]) {
                this.notePlayIcons[i].textContent = '▶';
            }
        }
    }

    updateUI() {
        if (!this.scaleNotes || this.scaleNotes.length === 0) return;

        // Update all buttons to highlight currently playing notes
        for (let i = 0; i < 8; i++) {
            if (this.playingNotes.has(i)) {
                this.noteButtons[i].classList.add('current-note');
            } else {
                this.noteButtons[i].classList.remove('current-note');
            }
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

    stopAllNotes() {
        // Stop all tone generators
        for (let i = 0; i < 8; i++) {
            this.toneGenerators[i].stopTone();
        }
        this.playingNotes.clear();
    }

    exit() {
        this.stopAllNotes();
        this.clearAnimations();
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize when DOM is ready and expose globally
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.scaleExerciseInstance = new ScaleExercise();
    });
} else {
    window.scaleExerciseInstance = new ScaleExercise();
}
