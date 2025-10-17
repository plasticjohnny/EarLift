/**
 * Web Storage Service Implementation
 * Implements IStorageService using localStorage
 */
class WebStorageService {
    constructor(prefix = 'eartrainer_') {
        this.prefix = prefix;
    }

    _getKey(key) {
        return this.prefix + key;
    }

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this._getKey(key));
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error(`WebStorageService: Error getting key '${key}':`, error);
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(this._getKey(key), JSON.stringify(value));
        } catch (error) {
            console.error(`WebStorageService: Error setting key '${key}':`, error);
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this._getKey(key));
        } catch (error) {
            console.error(`WebStorageService: Error removing key '${key}':`, error);
        }
    }

    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('WebStorageService: Error clearing storage:', error);
        }
    }

    has(key) {
        return localStorage.getItem(this._getKey(key)) !== null;
    }

    keys() {
        const allKeys = Object.keys(localStorage);
        return allKeys
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.substring(this.prefix.length));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebStorageService;
}
