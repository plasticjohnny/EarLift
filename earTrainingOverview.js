// Ear Training Overview Tutorial Exercise
class EarTrainingOverview {
    constructor() {
        this.exerciseId = 'earTrainingOverview';
        this.containerId = 'earTrainingOverviewExercise';
        this.currentStep = 0;
        this.totalSteps = 5;

        this.steps = [
            {
                title: "About Ear Training",
                content: "<p>The goal of ear training is to help you recognize what's happening musically when you hear melodies and chords.</p><p>This can be challenging at first, but like any skill, you can learn and improve with practice.</p>"
            },
            {
                title: "A More Effective Method",
                content: "<p>There are many approaches to ear training, but most show limited results despite requiring significant effort.</p><p>This method has been proven to be the most effective and efficient way to develop your musical ear.</p>"
            },
            {
                title: "Feel First, Hear Second",
                content: "<p>The core principle is not focusing on your ears, but instead on your body.</p><p><strong>If you can feel the differences between notes, you can hear the differences.</strong></p><p>This body-centered approach helps you internalize musical relationships in a deeper, more intuitive way.</p>"
            },
            {
                title: "You'll Be Asked to Sing",
                content: "<p>Core to this program is using your voice. You will be asked to sing different pitches throughout the exercises.</p><p>If you feel intimidated, don't worry—<strong>it's not about how good your voice sounds.</strong></p><p>It's about developing the muscles and skills within your body to internalize pitch and musical relationships.</p>"
            },
            {
                title: "Follow the Order",
                content: "<p>The exercises are arranged in a very specific sequence, with more fundamental skills appearing first.</p><p><strong>Try to tackle them in order</strong> for the best results—each builds upon the previous skills.</p><p>Good luck on your ear training journey!</p>"
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
            this.contentElement.innerHTML = step.content;
        }

        if (this.stepIndicator) {
            this.stepIndicator.textContent = `${stepIndex + 1} / ${this.totalSteps}`;
        }

        // Show/hide navigation buttons
        if (this.prevBtn) {
            this.prevBtn.style.display = stepIndex > 0 ? 'inline-block' : 'none';
        }

        // On last step, show final buttons instead of next button
        const isLastStep = stepIndex === this.totalSteps - 1;

        if (this.nextBtn) {
            this.nextBtn.style.display = isLastStep ? 'none' : 'inline-block';
        }

        if (this.nextBtn && this.nextBtn.parentElement) {
            this.nextBtn.parentElement.style.display = isLastStep ? 'none' : 'flex';
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
