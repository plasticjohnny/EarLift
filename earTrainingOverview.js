// Ear Training Overview Tutorial Exercise
class EarTrainingOverview {
    constructor() {
        this.exerciseId = 'earTrainingOverview';
        this.containerId = 'earTrainingOverviewExercise';
        this.currentStep = 0;
        this.totalSteps = 5;

        this.steps = [
            {
                title: "Welcome to Ear Training!",
                content: "PLACEHOLDER: Introduction to ear training and why it's important for musicians."
            },
            {
                title: "Understanding Pitch",
                content: "PLACEHOLDER: Explanation of what pitch is and how we perceive it."
            },
            {
                title: "Intervals and Relationships",
                content: "PLACEHOLDER: Introduction to musical intervals and how notes relate to each other."
            },
            {
                title: "Practice Makes Progress",
                content: "PLACEHOLDER: Tips for effective ear training practice and building consistency."
            },
            {
                title: "Ready to Begin!",
                content: "PLACEHOLDER: Summary and encouragement to start the exercises."
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
            this.continueBtn.addEventListener('click', () => this.continueToNextTutorial());
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
            this.contentElement.textContent = step.content;
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

    continueToNextTutorial() {
        // TODO: Navigate to next tutorial exercise
        // For now, just exit to main menu
        console.log('Continue to next tutorial (not implemented yet)');
        this.exit();
    }

    exit() {
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        if (window.mainApp) {
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize exercise
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.earTrainingOverview = new EarTrainingOverview();
    });
} else {
    window.earTrainingOverview = new EarTrainingOverview();
}
