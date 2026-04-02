import Phaser from 'phaser';
import MainScene from '../scenes/MainScene.js';

/**
 * Game Configuration
 *
 * Phaser game config with Scale.FIT for proper viewport responsiveness.
 */

// Design resolution (16:9 aspect ratio)
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

/**
 * Create Phaser game config
 * @param {string} parentId - DOM element ID for game container
 * @returns {Phaser.Types.Core.GameConfig}
 */
export function createGameConfig(parentId = 'game') {
  return {
    type: Phaser.AUTO,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    parent: parentId,
    backgroundColor: '#000000',
    scene: MainScene,
    scale: {
      mode: Phaser.Scale.FIT,           // Was NONE - now scales to fit container
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DESIGN_WIDTH,
      height: DESIGN_HEIGHT
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false
      }
    },
    render: {
      pixelArt: false,
      antialias: true
    }
  };
}

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  explosion: {
    key: 'explode',
    frameStart: 0,
    frameEnd: 63,
    duration: 350,       // Was 2133 (64 frames / 30fps)
    hideOnComplete: true
  },
  laser: {
    travelDuration: 800
  }
};

/**
 * Camera shake configuration
 */
export const CAMERA_SHAKE = {
  duration: 200,
  intensity: 0.01,
  debounceMs: 150      // Minimum time between shakes
};

/**
 * Color feedback configuration
 */
export const FEEDBACK = {
  errorColor: 'red',
  normalColor: 'orange',
  feedbackDurationMs: 200
};
