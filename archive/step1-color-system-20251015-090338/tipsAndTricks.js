// Tips and Tricks System
class TipsAndTricks {
    constructor() {
        this.tips = [
            {
                id: 'phone-speaker-position',
                title: 'Phone Speaker Location',
                text: 'If using your phone speaker, keep it a few inches away from your ear at the side of your head.',
                image: '🔊', // Emoji placeholder for now
                tags: ['phone', 'audio', 'setup', 'beginner']
            },
            {
                id: 'glissando-technique',
                title: 'Finding Notes with Glissando',
                text: 'Use the Glissando exercise to smoothly slide through your range and find target pitches more easily.',
                image: '🎵',
                tags: ['technique', 'pitch-match', 'glissando']
            },
            {
                id: 'quiet-environment',
                title: 'Practice Environment',
                text: 'Find a quiet space for practice. Background noise can interfere with pitch detection.',
                image: '🤫',
                tags: ['setup', 'audio', 'beginner']
            },
            {
                id: 'warm-up',
                title: 'Warm Up Your Voice',
                text: 'Start with lower notes and gradually work up to your higher range. Your voice performs better when warmed up.',
                image: '🔥',
                tags: ['technique', 'vocal-health', 'beginner']
            },
            {
                id: 'microphone-distance',
                title: 'Microphone Distance',
                text: 'Keep a consistent distance from your microphone for best pitch detection results.',
                image: '🎤',
                tags: ['audio', 'setup', 'pitch-detection']
            },
            {
                id: 'speaker-vibrations',
                title: 'Speaker',
                text: "You'll hear the note vibrations better when using the app via a speaker.",
                image: '🔈',
                tags: ['speaker', 'audio', 'setup', 'beginner']
            },
            {
                id: 'glissando-main-technique',
                title: 'Glissando',
                text: 'Glissando, where you smoothly shift pitch up and down, is the main technique to help you match pitches.',
                image: '🎶',
                tags: ['glissando', 'technique', 'beginner', 'pitch-match']
            },
            {
                id: 'posture',
                title: 'Posture',
                text: 'Sit up straight for clear tone and wider range.',
                image: '🧘',
                tags: ['physical', 'technique', 'beginner']
            },
            {
                id: 'jaw',
                title: 'Jaw',
                text: 'Keep your jaw relaxed to hit higher and cleaner notes.',
                image: '😮',
                tags: ['physical', 'technique']
            },
            {
                id: 'phone-microphone',
                title: 'Phone Microphone',
                text: 'If using a phone microphone keep it about six inches away from your mouth.',
                image: '📱',
                tags: ['hardware', 'setup', 'phone']
            },
            {
                id: 'feeling',
                title: 'Feeling',
                text: 'Really try to feel with your whole body to match pitches.',
                image: '💫',
                tags: ['ear', 'technique', 'pitch-match']
            },
            {
                id: 'vibrations',
                title: 'Vibrations',
                text: 'Different pitches have different vibrations - try and feel for those.',
                image: '〰️',
                tags: ['technique', 'pitch-match', 'ear']
            },
            {
                id: 'headphones',
                title: 'Headphones',
                text: "If you're going to use headphones only have one ear covered.",
                image: '🎧',
                tags: ['hardware', 'setup', 'audio']
            },
            {
                id: 'pitch-match-technique',
                title: 'Pitch Match',
                text: 'Use glissando and listen when your pitch matches the tone playing. When you have held that for a bit hit next tone.',
                image: '🎯',
                tags: ['pitch-match', 'technique', 'beginner']
            },
            {
                id: 'tone-slide-technique',
                title: 'Tone Slide',
                text: 'Use the Tone Slide to explore continuous frequencies across the full piano range. Drag the slider to hear any frequency between the lowest and highest notes.',
                image: '🎚️',
                tags: ['tone-slide', 'technique', 'ear', 'beginner']
            },
            {
                id: 'note-matching',
                title: 'Note Matching',
                text: "When trying to match notes, you'll know you're getting closer when you feel stronger vibrations, and even closer as they slow down in speed.",
                image: '🎵',
                tags: ['technique', 'pitch-match', 'ear', 'beginner', 'tone-slide']
            }
        ];

        this.currentTipIndex = 0;
        this.shownTips = new Set(); // Track which tips have been shown
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.modal = document.getElementById('tipsModal');
        this.tipTitle = document.getElementById('tipTitle');
        this.tipImage = document.getElementById('tipImage');
        this.tipText = document.getElementById('tipText');
        this.closeTipBtn = document.getElementById('closeTipBtn');
        this.nextTipBtn = document.getElementById('nextTipBtn');
        this.prevTipBtn = document.getElementById('prevTipBtn');
        this.tipsBrowseBtn = document.getElementById('tipsBrowseBtn');
    }

    attachEventListeners() {
        if (this.closeTipBtn) {
            this.closeTipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideTip();
            });
        }

        if (this.nextTipBtn) {
            this.nextTipBtn.addEventListener('click', () => this.showNextTip());
        }

        if (this.prevTipBtn) {
            this.prevTipBtn.addEventListener('click', () => this.showPreviousTip());
        }

        if (this.tipsBrowseBtn) {
            this.tipsBrowseBtn.addEventListener('click', () => this.openBrowseMode());
        }

        // Close modal when clicking outside
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideTip();
                }
            });
        }
    }

    // Show a specific tip by ID
    showTipById(tipId) {
        const tip = this.tips.find(t => t.id === tipId);
        if (tip) {
            const index = this.tips.indexOf(tip);
            this.showTip(index);
        }
    }

    // Show a random tip, optionally filtered by tag
    // Prioritizes tips with matching tags even if they've been shown before
    showRandomTip(tag = null) {
        let filteredTips = this.tips;

        if (tag) {
            // Filter by tag - prioritize relevant tips regardless of shown status
            filteredTips = this.tips.filter(t => t.tags.includes(tag));
        }

        if (filteredTips.length === 0) return;

        const randomIndex = Math.floor(Math.random() * filteredTips.length);
        const randomTip = filteredTips[randomIndex];
        const actualIndex = this.tips.indexOf(randomTip);

        this.showTip(actualIndex);
    }

    // Show tip at specific index
    showTip(index) {
        if (index < 0 || index >= this.tips.length) return;

        this.currentTipIndex = index;
        const tip = this.tips[index];

        // Stop any playing tones from various sources
        if (window.toneGenerator) {
            window.toneGenerator.stopTone();
        }

        // Stop tones from exercises
        if (window.intonationExercise && window.intonationExercise.toneGenerator) {
            window.intonationExercise.toneGenerator.stopTone();
        }
        if (window.octaveExercise && window.octaveExercise.toneGenerator) {
            window.octaveExercise.toneGenerator.stopTone();
        }
        if (window.scaleExercise && window.scaleExercise.toneGenerator) {
            window.scaleExercise.toneGenerator.stopTone();
        }
        if (window.toneSlideExercise) {
            window.toneSlideExercise.stopAllTones();
        }

        this.tipTitle.textContent = tip.title;
        this.tipImage.textContent = tip.image;
        this.tipText.textContent = tip.text;

        this.modal.style.display = 'flex';
        this.shownTips.add(tip.id);

        // Update navigation buttons
        this.updateNavigationButtons();
    }

    showNextTip() {
        const nextIndex = (this.currentTipIndex + 1) % this.tips.length;
        this.showTip(nextIndex);
    }

    showPreviousTip() {
        const prevIndex = (this.currentTipIndex - 1 + this.tips.length) % this.tips.length;
        this.showTip(prevIndex);
    }

    updateNavigationButtons() {
        // Always enable navigation buttons for cycling through all tips
        if (this.prevTipBtn) {
            this.prevTipBtn.disabled = false;
        }
        if (this.nextTipBtn) {
            this.nextTipBtn.disabled = false;
        }
    }

    hideTip() {
        this.modal.style.display = 'none';
    }

    openBrowseMode() {
        // Start from first tip when opening browse mode
        this.showTip(0);
    }

    // Get tips by tag
    getTipsByTag(tag) {
        return this.tips.filter(t => t.tags.includes(tag));
    }

    // Check if a tip has been shown
    hasTipBeenShown(tipId) {
        return this.shownTips.has(tipId);
    }
}

// Initialize tips and tricks system
window.tipsAndTricks = new TipsAndTricks();
