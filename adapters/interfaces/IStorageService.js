/**
 * Storage Service Interface
 * Platform-agnostic interface for persistent data storage
 *
 * Implementations:
 * - Web: WebStorageService (uses localStorage)
 * - iOS: IOSStorageService (uses UserDefaults)
 * - Android: AndroidStorageService (uses SharedPreferences)
 */
class IStorageService {
    /**
     * Get value from storage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Stored value or default
     */
    get(key, defaultValue = null) {
        throw new Error('IStorageService.get() must be implemented');
    }

    /**
     * Set value in storage
     * @param {string} key - Storage key
     * @param {any} value - Value to store (will be JSON serialized)
     */
    set(key, value) {
        throw new Error('IStorageService.set() must be implemented');
    }

    /**
     * Remove value from storage
     * @param {string} key - Storage key
     */
    remove(key) {
        throw new Error('IStorageService.remove() must be implemented');
    }

    /**
     * Clear all storage
     */
    clear() {
        throw new Error('IStorageService.clear() must be implemented');
    }

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    has(key) {
        throw new Error('IStorageService.has() must be implemented');
    }

    /**
     * Get all keys
     * @returns {Array<string>}
     */
    keys() {
        throw new Error('IStorageService.keys() must be implemented');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IStorageService;
}
