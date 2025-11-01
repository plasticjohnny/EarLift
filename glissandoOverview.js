/**
 * Glissando Overview
 *
 * Tutorial wrapper for the Glissando exercise.
 * Uses TutorialController to guide users through glissando concepts before
 * letting them practice with the full exercise.
 */

class GlissandoOverview {
    constructor(options = {}) {
        this.container = options.container || document.getElementById('glissandoOverviewExercise');

        if (!this.container) {
            console.error('GlissandoOverview: container not found');
            return;
        }

        // Initialize tutorial
        this.initializeTutorial();
    }

    initializeTutorial() {
        const resolve = (selector) => this.container.querySelector(selector);

        const prevBtn = resolve('[data-tutorial="prev"]');
        const nextBtn = resolve('[data-tutorial="next"]');
        const exitBtn = resolve('[data-glissando-overview="exit"]');

        if (typeof TutorialController === 'function' && typeof GLISSANDO_OVERVIEW_TUTORIAL !== 'undefined') {
            this.tutorialController = new TutorialController(this, GLISSANDO_OVERVIEW_TUTORIAL, 'glissandoOverview');

            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.tutorialController.prev();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.tutorialController.next();
                });
            }

            if (exitBtn) {
                exitBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleExit();
                });
            }
        } else {
            console.warn('GlissandoOverview: TutorialController or GLISSANDO_OVERVIEW_TUTORIAL not available');
        }
    }

    start() {
        console.log('[GlissandoOverview] Starting tutorial');

        // Clear URL hash to ensure tutorial always starts at step 1
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';

        // Start tutorial if available
        if (this.tutorialController) {
            this.tutorialController.start();
        }
    }

    handleExit() {
        console.log('[GlissandoOverview] Exiting tutorial');

        // Stop tutorial if running
        if (this.tutorialController && this.tutorialController.isActive) {
            this.tutorialController.stop();
        }

        // Clear exercise from URL
        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
        }

        // Return to main menu
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        if (window.mainApp) {
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize on page load
function initializeGlissandoOverview() {
    if (!window.glissandoOverview) {
        window.glissandoOverview = new GlissandoOverview();
    }
}

// Initialize immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGlissandoOverview);
} else {
    initializeGlissandoOverview();
}
