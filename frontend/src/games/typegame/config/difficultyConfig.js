/**
 * Difficulty Configuration
 *
 * Defines difficulty presets and scaling parameters for the game.
 */

export const DIFFICULTY_PRESETS = {
  EASY: {
    id: 1,
    name: 'Easy',
    label: 'E',
    initialLevel: 0,
    pointsPerLevel: 150,      // More points needed per level (was 100)
    baseSpawnDelay: 1200,     // Slower initial spawning
    baseSpeed: { min: 40, max: 100 }
  },
  MEDIUM: {
    id: 2,
    name: 'Medium',
    label: 'M',
    initialLevel: 1,
    pointsPerLevel: 120,
    baseSpawnDelay: 1000,
    baseSpeed: { min: 50, max: 130 }
  },
  HARD: {
    id: 3,
    name: 'Hard',
    label: 'H',
    initialLevel: 2,
    pointsPerLevel: 100,
    baseSpawnDelay: 800,
    baseSpeed: { min: 60, max: 150 }
  }
};

export const SCALING = {
  minSpawnDelay: 400,           // Was 200 - gives more reaction time
  spawnDelayReduction: 80,      // Was 200 - slower progression
  maxSpeedMultiplier: 2.5,      // Was unlimited - caps max speed
  speedIncreasePerLevel: 0.1,   // Was 0.2 - gentler speed increase
  maxLevel: 15                   // Cap difficulty level
};

/**
 * Calculate spawn delay for a given level using easing curve
 * @param {number} baseDelay - Starting spawn delay
 * @param {number} level - Current difficulty level
 * @returns {number} - Spawn delay in ms
 */
export function calculateSpawnDelay(baseDelay, level) {
  // Use easing curve for smoother progression
  const effectiveLevel = Math.min(level, SCALING.maxLevel);

  // Ease-out curve: faster early gains, slower later gains
  const progress = effectiveLevel / SCALING.maxLevel;
  const easedProgress = 1 - Math.pow(1 - progress, 2);

  const totalReduction = (baseDelay - SCALING.minSpawnDelay) * easedProgress;
  return Math.max(SCALING.minSpawnDelay, baseDelay - totalReduction);
}

/**
 * Calculate speed multiplier for a given level
 * @param {number} level - Current difficulty level
 * @returns {number} - Speed multiplier
 */
export function calculateSpeedMultiplier(level) {
  const effectiveLevel = Math.min(level, SCALING.maxLevel);
  const multiplier = 1 + (effectiveLevel * SCALING.speedIncreasePerLevel);
  return Math.min(multiplier, SCALING.maxSpeedMultiplier);
}

/**
 * Get difficulty preset by ID
 * @param {number} id - Difficulty ID (1, 2, or 3)
 * @returns {Object} - Difficulty preset
 */
export function getDifficultyById(id) {
  switch (id) {
    case 1: return DIFFICULTY_PRESETS.EASY;
    case 2: return DIFFICULTY_PRESETS.MEDIUM;
    case 3: return DIFFICULTY_PRESETS.HARD;
    default: return DIFFICULTY_PRESETS.EASY;
  }
}
