import {
  getDifficultyById,
  calculateSpawnDelay,
  calculateSpeedMultiplier,
  SCALING
} from '../config/difficultyConfig.js';

/**
 * DifficultySystem
 *
 * Manages difficulty progression with smoother scaling curves.
 */
export default class DifficultySystem {
  /**
   * @param {number} difficultyId - Initial difficulty (1=Easy, 2=Medium, 3=Hard)
   */
  constructor(difficultyId) {
    this.preset = getDifficultyById(difficultyId);
    this.difficultyId = difficultyId;
    this.level = this.preset.initialLevel;
    this.score = 0;
  }

  /**
   * Update score and recalculate difficulty
   * @param {number} points - Points to add (can be negative)
   * @returns {boolean} - True if level changed
   */
  addScore(points) {
    this.score += points;
    if (this.score < 0) this.score = 0;

    const newLevel = this.calculateLevel();
    if (newLevel !== this.level) {
      this.level = newLevel;
      return true;
    }
    return false;
  }

  /**
   * Calculate current level based on score
   * @returns {number}
   */
  calculateLevel() {
    const baseLevel = Math.floor(this.score / this.preset.pointsPerLevel);
    const effectiveLevel = this.preset.initialLevel + baseLevel;
    return Math.min(effectiveLevel, SCALING.maxLevel);
  }

  /**
   * Get current spawn delay
   * @returns {number} - Delay in milliseconds
   */
  getSpawnDelay() {
    return calculateSpawnDelay(this.preset.baseSpawnDelay, this.level);
  }

  /**
   * Get current speed multiplier
   * @returns {number}
   */
  getSpeedMultiplier() {
    return calculateSpeedMultiplier(this.level);
  }

  /**
   * Get base speed range for current difficulty
   * @returns {{ min: number, max: number }}
   */
  getBaseSpeed() {
    return this.preset.baseSpeed;
  }

  /**
   * Get current score
   * @returns {number}
   */
  getScore() {
    return this.score;
  }

  /**
   * Get current level
   * @returns {number}
   */
  getLevel() {
    return this.level;
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.score = 0;
    this.level = this.preset.initialLevel;
  }
}
