// Overview Tutorial Exercise
class OverviewExercise {
    constructor() {
        this.exerciseId = 'overview';
        this.containerId = 'overviewExercise';
        this.currentStep = 0;
        this.totalSteps = 4;
        this.autoAdvanceTimer = null;

        // Settings
        this.settings = {
            autoAdvance: false,
            showProgress: true,
            compactMode: false
        };

        this.steps = [
            {
                title: "Exercise Types",
                content: "This app contains several types of exercises:\n\n• **Unison Exercises**: Match a single pitch exactly\n• **Interval Exercises**: Learn to recognize and sing intervals (half-steps, whole-steps, octaves)\n• **Scale Exercises**: Identify and sing scale degrees\n• **Progression Exercises**: Coming soon!"
            },
            {
                title: "Exercise Formats",
                content: "Each exercise type comes in different formats:\n\n• **Feel the Root**: Toggle between notes to internalize the sound\n• **Slide**: Use a slider to gradually approach the target pitch\n• **Darts**: Test your accuracy by hitting the target pitch"
            },
            {
                title: "Progression Path",
                content: "Start with the basics and build up:\n\n1. **Unison**: Learn to match a single pitch\n2. **Octaves**: Recognize the same note an octave higher\n3. **Half-Steps**: Feel the smallest interval\n4. **Scales**: Understand the relationship between scale degrees"
            },
            {
                title: "Ready to Practice!",
                content: "You're all set to begin your ear training journey. Remember:\n\n• Practice regularly for best results\n• Start with easier exercises and work your way up\n• Use headphones for the best experience\n• Be patient with yourself - ear training takes time!"
            }
        ];

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById(this.containerId);
        this.exitBtn = document.getElementById(`${this.exerciseId}ExitBtn`);
        this.titleElement = document.getElementById(`${this.exerciseId}Title`);
        this.contentElement = document.getElementById(`${this.exerciseId}Content`);
        this.stepIndicator = document.getElementById(`${this.exerciseId}StepIndicator`);
        this.prevBtn = document.getElementById(`${this.exerciseId}PrevBtn`);
        this.nextBtn = document.getElementById(`${this.exerciseId}NextBtn`);
        this.finalButtons = document.getElementById(`${this.exerciseId}FinalButtons`);
        this.mainMenuBtn = document.getElementById(`${this.exerciseId}MainMenuBtn`);
        this.continueBtn = document.getElementById(`${this.exerciseId}ContinueBtn`);

        // Settings elements
        this.autoAdvanceCheckbox = document.getElementById(`${this.exerciseId}AutoAdvance`);
        this.showProgressCheckbox = document.getElementById(`${this.exerciseId}ShowProgress`);
        this.compactModeCheckbox = document.getElementById(`${this.exerciseId}CompactMode`);
    }

    attachEventListeners() {
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => this.exit());
        }

        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousStep());
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextStep());
        }

        if (this.mainMenuBtn) {
            this.mainMenuBtn.addEventListener('click', () => this.exit());
        }

        if (this.continueBtn) {
            this.continueBtn.addEventListener('click', () => this.continueToFirstExercise());
        }

        // Settings listeners
        if (this.autoAdvanceCheckbox) {
            this.autoAdvanceCheckbox.addEventListener('change', (e) => {
                this.settings.autoAdvance = e.target.checked;
                if (this.settings.autoAdvance) {
                    this.startAutoAdvance();
                } else {
                    this.stopAutoAdvance();
                }
            });
        }

        if (this.showProgressCheckbox) {
            this.showProgressCheckbox.addEventListener('change', (e) => {
                this.settings.showProgress = e.target.checked;
                this.updateProgressVisibility();
            });
        }

        if (this.compactModeCheckbox) {
            this.compactModeCheckbox.addEventListener('change', (e) => {
                this.settings.compactMode = e.target.checked;
                this.updateCompactMode();
            });
        }
    }

    start() {
        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';

        this.currentStep = 0;
        this.showStep(this.currentStep);
    }

    showStep(stepIndex) {
        const step = this.steps[stepIndex];

        if (this.titleElement) {
            this.titleElement.textContent = step.title;
        }

        if (this.contentElement) {
            // Convert markdown-style formatting to HTML
            let htmlContent = step.content
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            this.contentElement.innerHTML = htmlContent;
        }

        if (this.stepIndicator) {
            this.stepIndicator.textContent = `${stepIndex + 1} / ${this.totalSteps}`;
        }

        // Show/hide navigation buttons
        if (this.prevBtn) {
            this.prevBtn.style.display = stepIndex > 0 ? 'block' : 'none';
        }

        // On last step, show final buttons instead of next button
        const isLastStep = stepIndex === this.totalSteps - 1;

        if (this.nextBtn) {
            this.nextBtn.style.display = isLastStep ? 'none' : 'block';
        }

        if (this.finalButtons) {
            this.finalButtons.style.display = isLastStep ? 'flex' : 'none';
        }

        // Restart auto-advance if enabled
        if (this.settings.autoAdvance && !isLastStep) {
            this.startAutoAdvance();
        } else {
            this.stopAutoAdvance();
        }
    }

    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    continueToFirstExercise() {
        // Navigate to the first unison exercise
        this.exit();
        if (window.pitchExercise) {
            setTimeout(() => {
                window.pitchExercise.start();
            }, 100);
        }
    }

    exit() {
        this.stopAutoAdvance();
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        if (window.mainApp) {
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }

    // Settings helper methods
    startAutoAdvance() {
        this.stopAutoAdvance();
        this.autoAdvanceTimer = setTimeout(() => {
            this.nextStep();
        }, 3000);
    }

    stopAutoAdvance() {
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
    }

    updateProgressVisibility() {
        const stepIndicatorContainer = document.querySelector('.tutorial-step-indicator');
        if (stepIndicatorContainer) {
            stepIndicatorContainer.style.display = this.settings.showProgress ? 'flex' : 'none';
        }
    }

    updateCompactMode() {
        const contentArea = document.querySelector('.tutorial-content-area');
        if (contentArea) {
            if (this.settings.compactMode) {
                contentArea.style.fontSize = '14px';
                contentArea.style.lineHeight = '1.4';
            } else {
                contentArea.style.fontSize = '';
                contentArea.style.lineHeight = '';
            }
        }
    }
}

// Initialize exercise
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.overviewExercise = new OverviewExercise();
    });
} else {
    window.overviewExercise = new OverviewExercise();
}
