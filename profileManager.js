/**
 * Profile Manager
 *
 * Manages multiple user profiles for training data, vocal ranges, and settings.
 * Provides profile creation, switching, deletion, and reset functionality.
 */

class ProfileManager {
    constructor() {
        this.storageKeys = {
            enabled: 'earlift_profile_system_enabled',
            autoLoadPref: 'earlift_auto_load_preference',
            currentProfile: 'earlift_current_profile',
            lastUsedProfile: 'earlift_last_used_profile',
            profiles: 'earlift_profiles'
        };

        // Load profile system state
        this.enabled = this.loadEnabled();
        this.autoLoadPreference = this.loadAutoLoadPreference();
        this.currentProfileName = this.loadCurrentProfileName();
        this.profiles = this.loadProfiles();

        // Ensure Default profile exists
        if (!this.profiles['Default']) {
            this.profiles['Default'] = {
                name: 'Default',
                created: new Date().toISOString(),
                lastUsed: new Date().toISOString()
            };
            this.saveProfiles();
        }
    }

    /**
     * Check if profile system is enabled
     */
    isEnabled() {
        return this.enabled === true;
    }

    /**
     * Enable or disable the profile system
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem(this.storageKeys.enabled, JSON.stringify(enabled));
        return true;
    }

    /**
     * Get auto-load preference ("last" or "default")
     */
    getAutoLoadPreference() {
        return this.autoLoadPreference;
    }

    /**
     * Set auto-load preference
     */
    setAutoLoadPreference(preference) {
        if (preference !== 'last' && preference !== 'default') {
            console.error('Invalid auto-load preference:', preference);
            return false;
        }
        this.autoLoadPreference = preference;
        localStorage.setItem(this.storageKeys.autoLoadPref, preference);
        return true;
    }

    /**
     * Get current profile name
     */
    getCurrentProfileName() {
        return this.currentProfileName;
    }

    /**
     * Get profile to load on startup based on auto-load preference
     */
    getStartupProfile() {
        if (!this.isEnabled()) {
            return 'Default';
        }

        if (this.autoLoadPreference === 'default') {
            return 'Default';
        } else if (this.autoLoadPreference === 'last') {
            const lastUsed = localStorage.getItem(this.storageKeys.lastUsedProfile);
            // Verify the profile still exists
            if (lastUsed && this.profiles[lastUsed]) {
                return lastUsed;
            }
        }

        return 'Default';
    }

    /**
     * Get all profile names
     */
    getProfileNames() {
        return Object.keys(this.profiles).sort();
    }

    /**
     * Get all profiles metadata
     */
    getProfiles() {
        return this.profiles;
    }

    /**
     * Check if profile name is valid
     */
    isValidProfileName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Profile name is required' };
        }

        const trimmed = name.trim();

        if (trimmed.length === 0) {
            return { valid: false, error: 'Profile name cannot be empty' };
        }

        if (trimmed.length > 20) {
            return { valid: false, error: 'Profile name must be 20 characters or less' };
        }

        // Only allow letters, numbers, spaces, hyphens, and underscores
        if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
            return { valid: false, error: 'Profile name can only contain letters, numbers, spaces, hyphens, and underscores' };
        }

        if (this.profiles[trimmed]) {
            return { valid: false, error: 'A profile with this name already exists' };
        }

        return { valid: true, name: trimmed };
    }

    /**
     * Create a new profile
     */
    createProfile(name) {
        const validation = this.isValidProfileName(name);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const profileName = validation.name;

        // Create new profile metadata
        this.profiles[profileName] = {
            name: profileName,
            created: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };

        this.saveProfiles();

        console.log('[ProfileManager] Created new profile:', profileName);
        return { success: true, profileName: profileName };
    }

    /**
     * Switch to a different profile
     */
    switchProfile(profileName) {
        if (!this.profiles[profileName]) {
            return { success: false, error: 'Profile does not exist' };
        }

        const oldProfile = this.currentProfileName;

        // Update current profile
        this.currentProfileName = profileName;
        localStorage.setItem(this.storageKeys.currentProfile, profileName);

        // Update last used
        localStorage.setItem(this.storageKeys.lastUsedProfile, profileName);
        this.profiles[profileName].lastUsed = new Date().toISOString();
        this.saveProfiles();

        console.log('[ProfileManager] Switched from', oldProfile, 'to', profileName);
        return { success: true, oldProfile: oldProfile, newProfile: profileName };
    }

    /**
     * Delete a profile
     */
    deleteProfile(profileName) {
        // Cannot delete Default profile
        if (profileName === 'Default') {
            return { success: false, error: 'Cannot delete the Default profile' };
        }

        // Cannot delete current profile
        if (profileName === this.currentProfileName) {
            return { success: false, error: 'Cannot delete the currently active profile. Switch to another profile first.' };
        }

        if (!this.profiles[profileName]) {
            return { success: false, error: 'Profile does not exist' };
        }

        // Delete profile metadata
        delete this.profiles[profileName];
        this.saveProfiles();

        // Delete profile data (training data and settings)
        this.deleteProfileData(profileName);

        console.log('[ProfileManager] Deleted profile:', profileName);
        return { success: true };
    }

    /**
     * Reset a profile (clear all data but keep the profile)
     */
    resetProfile(profileName) {
        if (!this.profiles[profileName]) {
            return { success: false, error: 'Profile does not exist' };
        }

        // Delete profile data
        this.deleteProfileData(profileName);

        // Update metadata
        this.profiles[profileName].lastUsed = new Date().toISOString();
        this.saveProfiles();

        console.log('[ProfileManager] Reset profile:', profileName);
        return { success: true };
    }

    /**
     * Delete all data associated with a profile
     */
    deleteProfileData(profileName) {
        // Delete training data cookie
        const trainingCookieName = `earlift_training_data_${profileName}`;
        document.cookie = `${trainingCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;

        // Delete settings from localStorage
        const settingsKey = `earTrainerSettings_${profileName}`;
        localStorage.removeItem(settingsKey);

        // Delete FTUE state from localStorage (locks training mode after reset)
        const ftueKey = `ftue_${profileName}`;
        localStorage.removeItem(ftueKey);

        console.log('[ProfileManager] Deleted data for profile:', profileName);
    }

    // ===== Private helper methods =====

    loadEnabled() {
        try {
            const stored = localStorage.getItem(this.storageKeys.enabled);
            return stored === 'true' || stored === true;
        } catch (error) {
            console.error('Error loading profile system enabled state:', error);
            return false;
        }
    }

    loadAutoLoadPreference() {
        try {
            const stored = localStorage.getItem(this.storageKeys.autoLoadPref);
            if (stored === 'last' || stored === 'default') {
                return stored;
            }
            return 'last'; // Default to loading last used profile
        } catch (error) {
            console.error('Error loading auto-load preference:', error);
            return 'last';
        }
    }

    loadCurrentProfileName() {
        try {
            const stored = localStorage.getItem(this.storageKeys.currentProfile);
            if (stored) {
                return stored;
            }
            return 'Default';
        } catch (error) {
            console.error('Error loading current profile name:', error);
            return 'Default';
        }
    }

    loadProfiles() {
        try {
            const stored = localStorage.getItem(this.storageKeys.profiles);
            if (stored) {
                return JSON.parse(stored);
            }
            return {};
        } catch (error) {
            console.error('Error loading profiles:', error);
            return {};
        }
    }

    saveProfiles() {
        try {
            localStorage.setItem(this.storageKeys.profiles, JSON.stringify(this.profiles));
            return true;
        } catch (error) {
            console.error('Error saving profiles:', error);
            return false;
        }
    }
}
