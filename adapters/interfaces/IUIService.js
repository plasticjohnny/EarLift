/**
 * UI Service Interface
 * Platform-agnostic interface for user interface operations
 *
 * Implementations:
 * - Web: WebUIService (uses DOM)
 * - iOS: IOSUIService (uses UIKit)
 * - Android: AndroidUIService (uses Android Views)
 */
class IUIService {
    /**
     * Show a specific screen/view
     * @param {string} screenId - Screen identifier
     */
    showScreen(screenId) {
        throw new Error('IUIService.showScreen() must be implemented');
    }

    /**
     * Hide a specific screen/view
     * @param {string} screenId - Screen identifier
     */
    hideScreen(screenId) {
        throw new Error('IUIService.hideScreen() must be implemented');
    }

    /**
     * Update element/view with value
     * @param {string} elementId - Element identifier
     * @param {any} value - New value
     */
    updateElement(elementId, value) {
        throw new Error('IUIService.updateElement() must be implemented');
    }

    /**
     * Update element style/appearance
     * @param {string} elementId - Element identifier
     * @param {Object} styles - Style properties
     */
    updateElementStyle(elementId, styles) {
        throw new Error('IUIService.updateElementStyle() must be implemented');
    }

    /**
     * Show toast/snackbar message
     * @param {string} message - Message text
     * @param {string} type - Message type: 'info', 'success', 'warning', 'error'
     */
    showMessage(message, type = 'info') {
        throw new Error('IUIService.showMessage() must be implemented');
    }

    /**
     * Show confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @returns {Promise<boolean>} User's choice (true = confirmed, false = cancelled)
     */
    async showConfirmDialog(title, message) {
        throw new Error('IUIService.showConfirmDialog() must be implemented');
    }

    /**
     * Show alert dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     */
    async showAlertDialog(title, message) {
        throw new Error('IUIService.showAlertDialog() must be implemented');
    }

    /**
     * Add event listener to element
     * @param {string} elementId - Element identifier
     * @param {string} eventType - Event type (e.g., 'click', 'change')
     * @param {Function} handler - Event handler function
     */
    addEventListener(elementId, eventType, handler) {
        throw new Error('IUIService.addEventListener() must be implemented');
    }

    /**
     * Remove event listener from element
     * @param {string} elementId - Element identifier
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler function
     */
    removeEventListener(elementId, eventType, handler) {
        throw new Error('IUIService.removeEventListener() must be implemented');
    }

    /**
     * Enable/disable element
     * @param {string} elementId - Element identifier
     * @param {boolean} enabled - Enable state
     */
    setElementEnabled(elementId, enabled) {
        throw new Error('IUIService.setElementEnabled() must be implemented');
    }

    /**
     * Show/hide element
     * @param {string} elementId - Element identifier
     * @param {boolean} visible - Visibility state
     */
    setElementVisible(elementId, visible) {
        throw new Error('IUIService.setElementVisible() must be implemented');
    }

    /**
     * Draw on canvas/graphics context
     * @param {string} canvasId - Canvas identifier
     * @param {Function} drawFunction - Function that performs drawing operations
     */
    drawOnCanvas(canvasId, drawFunction) {
        throw new Error('IUIService.drawOnCanvas() must be implemented');
    }

    /**
     * Clear canvas/graphics context
     * @param {string} canvasId - Canvas identifier
     */
    clearCanvas(canvasId) {
        throw new Error('IUIService.clearCanvas() must be implemented');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IUIService;
}
