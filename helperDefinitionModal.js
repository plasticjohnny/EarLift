/**
 * Helper Definition Modal Component
 *
 * Displays contextual definitions for musical terms when user clicks on helper terms.
 */

class HelperDefinitionModal {
    constructor() {
        this.modalElement = null;
        this.currentTerm = null;
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create the modal DOM structure
     */
    createModal() {
        // Create modal container
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'helper-definition-modal';
        this.modalElement.style.display = 'none';

        // Create modal content
        this.modalElement.innerHTML = `
            <div class="helper-modal-backdrop"></div>
            <div class="helper-modal-content">
                <button class="helper-modal-close" aria-label="Close">×</button>
                <h2 class="helper-modal-title"></h2>
                <div class="helper-modal-level"></div>
                <div class="helper-modal-text"></div>
                <div class="helper-modal-visual" style="display: none;"></div>
            </div>
        `;

        // Append to body
        document.body.appendChild(this.modalElement);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        const closeBtn = this.modalElement.querySelector('.helper-modal-close');
        closeBtn.addEventListener('click', () => this.hide());

        // Backdrop click
        const backdrop = this.modalElement.querySelector('.helper-modal-backdrop');
        backdrop.addEventListener('click', () => this.hide());

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalElement.style.display === 'flex') {
                this.hide();
            }
        });

        // Prevent clicks inside modal content from closing
        const content = this.modalElement.querySelector('.helper-modal-content');
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Show the modal with a term definition
     * @param {string} term - The term to display
     * @param {Object} context - Current context
     */
    show(term, context = {}) {
        if (!window.helperDefinitionsManager) {
            console.error('[HelperModal] DefinitionsManager not found');
            return;
        }

        // Get definition
        const definition = window.helperDefinitionsManager.getDefinition(term, context);

        if (!definition) {
            console.warn('[HelperModal] No definition found for:', term);
            return;
        }

        this.currentTerm = term;

        // Update modal content
        const titleElement = this.modalElement.querySelector('.helper-modal-title');
        const levelElement = this.modalElement.querySelector('.helper-modal-level');
        const textElement = this.modalElement.querySelector('.helper-modal-text');
        const visualElement = this.modalElement.querySelector('.helper-modal-visual');

        titleElement.textContent = definition.term;

        // Show level indicator (subtle)
        levelElement.textContent = `${this.capitalize(definition.level)} explanation`;

        // Process text to allow nested helper terms
        textElement.innerHTML = definition.text;

        // Handle visual if present
        if (definition.visual) {
            this.loadVisual(definition.visual, visualElement);
            visualElement.style.display = 'block';
        } else {
            visualElement.style.display = 'none';
        }

        // Mark term as viewed
        window.helperDefinitionsManager.markTermViewed(term);

        // Show modal with fade-in animation
        this.modalElement.style.display = 'flex';
        // Force reflow for animation
        void this.modalElement.offsetWidth;
        this.modalElement.classList.add('helper-modal-visible');

        // Log for analytics (if available)
        console.log(`[HelperModal] Showed definition for: ${term} (${definition.level})`);
    }

    /**
     * Hide the modal
     */
    hide() {
        this.modalElement.classList.remove('helper-modal-visible');

        // Wait for fade-out animation
        setTimeout(() => {
            this.modalElement.style.display = 'none';
            this.currentTerm = null;
        }, 300);
    }

    /**
     * Load a visual example
     * @param {string} visualType - Type of visual to load
     * @param {HTMLElement} container - Container element for visual
     */
    loadVisual(visualType, container) {
        // Placeholder for future visual implementations
        // Could load SVGs, canvas animations, or images based on visualType
        container.innerHTML = `<div class="helper-visual-placeholder">Visual: ${visualType}</div>`;
    }

    /**
     * Capitalize first letter
     * @param {string} str
     * @returns {string}
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Check if modal is currently visible
     * @returns {boolean}
     */
    isVisible() {
        return this.modalElement.style.display === 'flex';
    }
}

// Create global instance
window.helperDefinitionModal = new HelperDefinitionModal();
