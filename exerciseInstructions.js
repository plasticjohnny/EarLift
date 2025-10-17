// Exercise Instructions Component
// Manages progressive instructions for exercises

class ExerciseInstructions {
    constructor(containerId, instructions) {
        this.containerId = containerId;
        this.instructions = instructions;
        this.currentStep = 0;

        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Instructions container not found: ${this.containerId}`);
        }
    }

    attachEventListeners() {
        // Event delegation for navigation buttons
        if (this.container) {
            this.container.addEventListener('click', (e) => {
                if (e.target.closest('.instruction-prev')) {
                    this.previousStep();
                } else if (e.target.closest('.instruction-next')) {
                    this.nextStep();
                }
            });
        }
    }

    render() {
        if (!this.container) return;

        const hasMultipleSteps = this.instructions.length > 1;
        const hasPrevious = this.currentStep > 0;
        const hasNext = this.currentStep < this.instructions.length - 1;

        this.container.innerHTML = `
            <div class="instruction-box">
                <div class="instruction-content">
                    <div class="instruction-text">${this.instructions[this.currentStep]}</div>
                </div>
                ${hasMultipleSteps ? `
                    <div class="instruction-nav">
                        <button class="instruction-prev ${!hasPrevious ? 'disabled' : ''}" ${!hasPrevious ? 'disabled' : ''}>
                            ← Previous
                        </button>
                        <div class="instruction-progress">
                            <span class="instruction-step">${this.currentStep + 1}</span>
                            <span class="instruction-separator">/</span>
                            <span class="instruction-total">${this.instructions.length}</span>
                        </div>
                        <button class="instruction-next ${!hasNext ? 'disabled' : ''}" ${!hasNext ? 'disabled' : ''}>
                            Next →
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    }

    nextStep() {
        if (this.currentStep < this.instructions.length - 1) {
            this.currentStep++;
            this.render();
        }
    }

    reset() {
        this.currentStep = 0;
        this.render();
    }

    setInstructions(instructions) {
        this.instructions = instructions;
        this.currentStep = 0;
        this.render();
    }
}
