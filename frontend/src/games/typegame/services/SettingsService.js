/**
 * SettingsService
 *
 * Handles game settings storage using localStorage.
 */

const STORAGE_KEY = 'typegame_settings';

// Available missile options (update this when adding more missiles)
export const MISSILE_COUNT = 3;

/**
 * Get default settings
 * @returns {Object}
 */
function getDefaultSettings() {
  return {
    missileStyle: 1
  };
}

/**
 * Load settings from localStorage
 * @returns {Object}
 */
export function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...getDefaultSettings(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return getDefaultSettings();
}

/**
 * Save settings to localStorage
 * @param {Object} settings
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Get the selected missile style (1-indexed)
 * @returns {number}
 */
export function getMissileStyle() {
  return loadSettings().missileStyle;
}

/**
 * Set the selected missile style
 * @param {number} style - Missile style number (1-indexed)
 */
export function setMissileStyle(style) {
  const settings = loadSettings();
  settings.missileStyle = style;
  saveSettings(settings);
}

/**
 * Get the missile image path for a given style
 * @param {number} style - Missile style number (1-indexed)
 * @returns {string}
 */
export function getMissileImagePath(style) {
  return `/img/missile${style}_Menu.png`;
}
