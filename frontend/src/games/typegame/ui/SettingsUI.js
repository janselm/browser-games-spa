/**
 * SettingsUI
 *
 * Handles the settings overlay and missile carousel.
 */

import {
  getMissileStyle,
  setMissileStyle,
  getMissileImagePath,
  MISSILE_COUNT
} from '../services/SettingsService.js';
import { getMusicEnabled, setMusicEnabled } from '../../../services/AudioService.js';

let currentMissile = 1;

/**
 * Initialize settings UI
 */
export function initSettingsUI() {
  const settingsButton = document.getElementById('settings-button');
  const settingsOverlay = document.getElementById('settings-overlay');
  const backButton = document.getElementById('settings-back-button');
  const prevButton = document.querySelector('.carousel-prev');
  const nextButton = document.querySelector('.carousel-next');
  const missilePreview = document.getElementById('missile-preview');
  const missileNumber = document.getElementById('missile-number');
  const startOverlay = document.getElementById('start-overlay');

  // Load saved missile style
  currentMissile = getMissileStyle();
  updateCarousel();

  // Music toggle
  const musicOnBtn  = document.getElementById('music-on-btn');
  const musicOffBtn = document.getElementById('music-off-btn');

  function updateMusicButtons() {
    const enabled = getMusicEnabled();
    musicOnBtn.classList.toggle('active', enabled);
    musicOffBtn.classList.toggle('active', !enabled);
  }

  updateMusicButtons();

  musicOnBtn.addEventListener('click', () => {
    setMusicEnabled(true);
    updateMusicButtons();
  });

  musicOffBtn.addEventListener('click', () => {
    setMusicEnabled(false);
    updateMusicButtons();
  });

  // Settings button click
  settingsButton.addEventListener('click', () => {
    startOverlay.style.display = 'none';
    settingsOverlay.classList.remove('hidden');
  });

  // Back button click
  backButton.addEventListener('click', () => {
    settingsOverlay.classList.add('hidden');
    startOverlay.style.display = 'flex';
  });

  // Previous button
  prevButton.addEventListener('click', () => {
    currentMissile--;
    if (currentMissile < 1) {
      currentMissile = MISSILE_COUNT;
    }
    updateCarousel();
    setMissileStyle(currentMissile);
  });

  // Next button
  nextButton.addEventListener('click', () => {
    currentMissile++;
    if (currentMissile > MISSILE_COUNT) {
      currentMissile = 1;
    }
    updateCarousel();
    setMissileStyle(currentMissile);
  });

  /**
   * Update the carousel display
   */
  function updateCarousel() {
    missilePreview.src = getMissileImagePath(currentMissile);
    missileNumber.textContent = currentMissile;
  }
}
