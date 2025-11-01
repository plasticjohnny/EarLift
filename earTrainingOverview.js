// Ear Training Overview Tutorial Exercise
class EarTrainingOverview {
    constructor() {
        this.exerciseId = 'earTrainingOverview';
        this.containerId = 'earTrainingOverviewExercise';
        this.currentStep = 0;
        this.totalSteps = 5;

        this.steps = [
            {
                title: "Welcome to the Ear Gym",
                content: "<p style='font-size: 1.05rem; line-height: 1.6;'>Just like building physical strength, <strong>your musical ear is a muscle</strong> that needs training. You're here to develop the ability to hear and recognize musical relationships—melodies, harmonies, and intervals.</p><p style='font-size: 1.05rem; line-height: 1.6;'>This helps with singing, playing instruments, and understanding music. And yes, <strong>it's challenging at first.</strong> That's the whole point.</p>"
            },
            {
                title: "The Foundation: Unison",
                content: "<p style='font-size: 1.05rem; line-height: 1.6;'>The EarLift Method starts with the most fundamental skill: <strong>matching pitch</strong> (unison). Two notes at the same frequency create a special feeling—you'll learn to recognize it.</p><p style='font-size: 1.05rem; line-height: 1.6;'><strong>Master unison, and everything else unlocks.</strong> It's like learning to walk before you run. Every interval, every chord—it all builds from this foundation.</p>"
            },
            {
                title: "You'll Use Your Voice",
                content: "<p style='font-size: 1.05rem; line-height: 1.6;'>Throughout these exercises, you'll sing. Don't worry—<strong>this isn't about sounding pretty.</strong> Your voice is simply a tool for building the connection between what you <em>hear</em> and what you <em>feel</em>.</p><p style='font-size: 1.05rem; line-height: 1.6;'>You're literally training the muscles in your larynx and brain to work together. It's physical. It's mental. <strong>It's a workout.</strong></p>"
            },
            {
                title: "It Takes Reps",
                content: "<p style='font-size: 1.05rem; line-height: 1.6;'>Like any training program, <strong>progress takes time and repetition.</strong> Your first attempts might feel impossible. You might miss notes. You might feel frustrated. <em>That's completely normal.</em></p><p style='font-size: 1.05rem; line-height: 1.6;'><strong>Every attempt strengthens the muscle.</strong> Every rep counts. Don't rush. Don't judge yourself harshly. Just show up and put in the work. The gains will come.</p>"
            },
            {
                title: "You're the Judge",
                content: "<p style='font-size: 1.05rem; line-height: 1.6;'>Here's the challenge: <strong>you'll learn to judge your own success.</strong> No computer will tell you when you're right—you have to <em>feel</em> it. This is called <strong>internalization</strong>, and it's the most powerful part of the method.</p><p style='font-size: 1.05rem; line-height: 1.6;'>It's hard at first. But as you train, your ear gets sharper. You <em>will</em> get there. <strong>Let's get started!</strong> 💪</p>"
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
        console.log('[EarTrainingOverview] Tutorial completed, notifying FTUE system');

        // Notify FTUE system of completion
        if (window.handleTutorialCompletion) {
            window.handleTutorialCompletion('earTrainingOverview');
        }

        // Exit already clears URL, so just call it
        this.exit();
    }

    exit() {
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
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
