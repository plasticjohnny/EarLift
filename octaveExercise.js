// Octave Match Exercise
class OctaveExercise {
    constructor() {
        this.toneGeneratorLow = new ToneGenerator();
        this.toneGeneratorHigh = new ToneGenerator();
        this.currentBaseNote = null;
        this.currentOctaveNote = null;
        this.currentlyPlaying = null; // 'low', 'high', 'both', or null
        this.isPaused = false;
        this.vocalRange = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById('octaveExercise');
        this.noteDisplay = document.getElementById('octaveNote');
        this.freqDisplay = document.getElementById('octaveFreq');
        this.playLowBtn = document.getElementById('playLowOctaveBtn');
        this.playHighBtn = document.getElementById('playHighOctaveBtn');
        this.playBothBtn = document.getElementById('playBothOctaveBtn');
        this.lowPlayIcon = document.getElementById('octaveLowPlayIcon');
        this.highPlayIcon = document.getElementById('octaveHighPlayIcon');
        this.nextPairBtn = document.getElementById('nextOctavePairBtn');
        this.exitBtn = document.getElementById('exitOctaveExercise');

        this.lowAnimation = document.getElementById('octaveLowAnimation');
        this.highAnimation = document.getElementById('octaveHighAnimation');
    }

    attachEventListeners() {
        this.playLowBtn.addEventListener('click', () => this.toggleNote('low'));
        this.playHighBtn.addEventListener('click', () => this.toggleNote('high'));
        this.playBothBtn.addEventListener('click', () => this.playBoth());
        this.nextPairBtn.addEventListener('click', () => this.nextOctavePair());
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
        this.currentlyPlaying = null;
        this.isPaused = false;
        this.currentBaseNote = null;
        this.currentOctaveNote = null;

        // Generate first octave pair
        this.generateOctavePair();
    }

    generateOctavePair() {
        // Range Directive: Select a note where both it and its octave are within vocal range
        // F3 is approximately 174.61 Hz - use as minimum unless user's range is lower
        // This exercise always goes UP (lower note first)
        const MIN_FREQUENCY = 174.61; // F3
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;

        // Find notes that can go up an octave within range
        const maxBaseForUpOctave = highFreq / 2;

        if (maxBaseForUpOctave < lowFreq) {
            alert('Your vocal range is too narrow for octave up exercises. Please expand your range.');
            this.exit();
            return;
        }

        // Use log scale for more even distribution across notes
        const logMin = Math.log2(lowFreq);
        const logMax = Math.log2(Math.min(highFreq, maxBaseForUpOctave));
        const logRandom = logMin + Math.random() * (logMax - logMin);
        const baseFreq = Math.pow(2, logRandom);

        // Calculate octave note (always higher)
        const octaveFreq = baseFreq * 2;

        this.currentBaseNote = {
            frequency: baseFreq,
            note: this.frequencyToNote(baseFreq),
            direction: 'up'
        };

        this.currentOctaveNote = {
            frequency: octaveFreq,
            note: this.frequencyToNote(octaveFreq)
        };
    }

    toggleNote(type) {
        // If this note is currently playing, pause it
        if (this.currentlyPlaying === type && !this.isPaused) {
            // Pause
            this.stopAllTones();
            this.clearAnimations();
            this.isPaused = true;
            this.updatePlayIcon(type, '▶');
        } else if (this.currentlyPlaying === type && this.isPaused) {
            // Resume the same note
            this.playNote(type);
        } else {
            // Play a different note (or first note)
            this.playNote(type);
        }
    }

    playNote(type) {
        // Stop any currently playing tone
        this.stopAllTones();
        this.clearAnimations();
        this.resetAllPlayIcons();

        // Set which note we're playing
        this.currentlyPlaying = type;
        this.isPaused = false;

        // Get the note and generator
        const note = type === 'low' ? this.currentBaseNote : this.currentOctaveNote;
        const generator = type === 'low' ? this.toneGeneratorLow : this.toneGeneratorHigh;
        const animation = type === 'low' ? this.lowAnimation : this.highAnimation;

        if (note) {
            // Add small delay to ensure previous tone has stopped
            setTimeout(() => {
                generator.playTone(note.frequency);

                // Show animation on the correct button
                animation.classList.add('playing');

                // Update play icon to pause
                this.updatePlayIcon(type, '⏸');

                // Adjust animation speed based on frequency
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
            }, 70); // Wait for fade out to complete
        }
    }

    async playBoth() {
        // Stop any currently playing tones
        this.stopAllTones();
        this.clearAnimations();
        this.resetAllPlayIcons();

        // Set state
        this.currentlyPlaying = 'both';
        this.isPaused = false;

        if (this.currentBaseNote && this.currentOctaveNote) {
            // Add small delay to ensure previous tones have stopped
            setTimeout(async () => {
                // Play both tones simultaneously
                await Promise.all([
                    this.toneGeneratorLow.playTone(this.currentBaseNote.frequency),
                    this.toneGeneratorHigh.playTone(this.currentOctaveNote.frequency)
                ]);

                // Show animations on both buttons
                this.lowAnimation.classList.add('playing');
                this.highAnimation.classList.add('playing');

                // Update play icons to pause
                this.updatePlayIcon('low', '⏸');
                this.updatePlayIcon('high', '⏸');

                // Adjust animation speeds based on frequencies
                this.setAnimationSpeed(this.lowAnimation, this.currentBaseNote.frequency);
                this.setAnimationSpeed(this.highAnimation, this.currentOctaveNote.frequency);
            }, 70); // Wait for fade out to complete
        }
    }

    setAnimationSpeed(animation, frequency) {
        const minFreq = 174;
        const maxFreq = 1000;
        const minDuration = 0.2;
        const maxDuration = 1.2;
        const normalizedFreq = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
        const duration = maxDuration - (normalizedFreq * (maxDuration - minDuration));

        const waves = animation.querySelectorAll('.tone-wave');
        waves.forEach(wave => {
            wave.style.animationDuration = `${duration}s`;
        });
    }

    stopAllTones() {
        this.toneGeneratorLow.stopTone();
        this.toneGeneratorHigh.stopTone();
    }

    nextOctavePair() {
        // Stop current tones
        this.stopAllTones();
        this.clearAnimations();
        this.resetAllPlayIcons();

        // Generate new pair
        this.currentlyPlaying = null;
        this.isPaused = false;
        this.generateOctavePair();
    }

    clearAnimations() {
        this.lowAnimation.classList.remove('playing');
        this.highAnimation.classList.remove('playing');
    }

    updatePlayIcon(type, icon) {
        if (type === 'low') {
            this.lowPlayIcon.textContent = icon;
        } else if (type === 'high') {
            this.highPlayIcon.textContent = icon;
        }
    }

    resetAllPlayIcons() {
        this.lowPlayIcon.textContent = '▶';
        this.highPlayIcon.textContent = '▶';
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
        this.stopAllTones();
        this.clearAnimations();
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
window.octaveExercise = new OctaveExercise();
