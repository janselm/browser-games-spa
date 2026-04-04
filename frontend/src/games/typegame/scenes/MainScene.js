import Phaser from 'phaser';
import DifficultySystem from '../systems/DifficultySystem.js';
import { saveScore } from '../services/LeaderboardService.js';
import { getDifficultyById } from '../config/difficultyConfig.js';
import { getMissileStyle } from '../services/SettingsService.js';
import {
  ANIMATION_CONFIG,
  CAMERA_SHAKE,
  FEEDBACK,
  DESIGN_WIDTH,
  DESIGN_HEIGHT
} from '../config/gameConfig.js';
import { play as playSound, playMusic, pauseMusic, resumeMusic, stopMusic } from '../../../services/AudioService.js';

const nuke_reward = 1000;
const life_reward = 2000;

/**
 * MainScene
 *
 * The main game scene with all fixes applied:
 * - Difficulty scaling with gentler progression
 * - Proper resize handling (Scale.FIT handles most)
 * - Animation timing with duration (not frameRate)
 * - Color feedback tracked in update loop
 * - Camera shake debouncing
 */
export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.scoreText = null;
    this.letters = null;
    this.letterTimer = null;
    this.difficultySystem = null;
    this.selectedDifficulty = 1;

    // Camera shake debouncing
    this.lastShakeTime = 0;
    this.pendingShake = false;

    // Color feedback tracking (not setTimeout)
    this.feedbackTimer = 0;
    this.isFeedbackActive = false;

    // Pause state
    this.isPaused = false;
    this.difficultyDisplay = null;

    // Lives system
    this.lives = 3;
    this.heartSprites = []; // Array of heart sprites

    // Nuke power-up
    this.hasNuke = false;
    this.nukeThreshold = nuke_reward;
    this.lastNukeScore = 0; // Track when last nuke was earned
    this.lifeThreshold = life_reward;
    this.lastLifeScore = 0; // Track when last extra life was earned
    this.nukeSprite = null;
    this.nukeCountdownText = null;
    this.nukeAlertSprite = null;

    // Game mode
    this.gameMode = 'letters'; // 'letters' or 'words'
    this.wordList = [];
    this.currentTyping = ''; // For words mode - tracks what user is typing
  }

  /**
   * Set the selected difficulty (called before scene starts)
   */
  setDifficulty(difficultyId) {
    this.selectedDifficulty = difficultyId;
  }

  /**
   * Set game mode and word list (called before scene starts)
   */
  setGameMode(mode, wordList = []) {
    this.gameMode = mode;
    this.wordList = wordList;
  }

  preload() {
    this.load.image('sky', 'img/city.jpg');
    // Load selected missile style from settings
    const missileStyle = getMissileStyle();
    this.load.image('laser', `img/missile${missileStyle}_inGame.png`);
    this.load.spritesheet('explosion', 'animations/explode/explosion%201.png', {
      frameWidth: 512,
      frameHeight: 512
    });
    // HUD icons (scaled versions)
    this.load.image('full_heart', 'animations/full_heart_50x52.png');
    this.load.image('empty_heart', 'animations/empty_heart_50x52.png');
    this.load.image('nuke_icon', 'animations/nuke_50x52.png');
    this.load.image('nuke_alert', 'animations/nuke_alert_512.512.png');
  }

  create() {
    const { width, height } = this.scale;

    // Initialize difficulty system
    this.difficultySystem = new DifficultySystem(this.selectedDifficulty);

    // Get score display element
    this.scoreText = document.getElementById('score');
    this.updateScoreDisplay();

    // Background
    this.bg = this.add.image(width / 2, height / 2, 'sky')
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // Letters group
    this.letters = this.add.group();

    // Create spawn timer with initial delay
    this.createLetterTimer();

    // Input handler
    this.input.keyboard.on('keydown', this.handleKey, this);

    // Resize handler (backup for Scale.FIT)
    this.scale.on('resize', this.onResize, this);

    // Create explosion animation with duration (not frameRate)
    this.anims.create({
      key: ANIMATION_CONFIG.explosion.key,
      frames: this.anims.generateFrameNumbers('explosion', {
        start: ANIMATION_CONFIG.explosion.frameStart,
        end: ANIMATION_CONFIG.explosion.frameEnd
      }),
      // FIX: Use duration instead of frameRate for consistent timing
      duration: ANIMATION_CONFIG.explosion.duration,
      hideOnComplete: ANIMATION_CONFIG.explosion.hideOnComplete
    });

    // Reset feedback state
    this.feedbackTimer = 0;
    this.isFeedbackActive = false;
    this.lastShakeTime = 0;
    this.pendingShake = false;
    this.isGameOver = false;
    this.isPaused = false;

    // Reset lives and nuke
    this.lives = 3;
    this.hasNuke = false;
    this.lastNukeScore = 0;

    // Setup difficulty display
    this.difficultyDisplay = document.getElementById('difficulty-display');
    this.updateDifficultyDisplay();

    // Create heart sprites in game area (top left)
    this.createHeartSprites();

    // Create nuke sprite (hidden initially, appears to right of hearts)
    this.createNukeSprite();

    // Create nuke countdown text
    this.createNukeCountdown();

    // Create nuke alert sprite (hidden, shown when nuke earned)
    this.createNukeAlert();

    // Reset game mode state
    this.currentTyping = '';

    // Setup pause functionality
    this.setupPauseHandlers();

    playMusic();
  }

  /**
   * Create or recreate the letter spawn timer
   */
  createLetterTimer() {
    if (this.letterTimer) {
      this.letterTimer.remove();
    }

    const delay = this.difficultySystem.getSpawnDelay();
    this.letterTimer = this.time.addEvent({
      delay: delay,
      callback: this.spawnLetter,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Handle window resize
   */
  onResize(gameSize) {
    const { width, height } = gameSize;

    if (this.bg) {
      this.bg.setPosition(width / 2, height / 2);
      this.bg.setDisplaySize(width, height);
    }
  }

  /**
   * Update difficulty display in DOM
   */
  updateDifficultyDisplay() {
    if (this.difficultyDisplay) {
      const preset = getDifficultyById(this.selectedDifficulty);
      this.difficultyDisplay.innerText = preset.name;
    }
  }

  /**
   * Create heart sprites in game area (bottom left)
   */
  createHeartSprites() {
    // Clear existing hearts
    this.heartSprites.forEach(heart => heart.destroy());
    this.heartSprites = [];

    const { height } = this.scale;
    const padding = 15;
    const spacing = 4;

    // Get icon dimensions (create temp image to measure)
    const tempHeart = this.add.image(0, 0, 'full_heart').setVisible(false);
    const heartWidth = tempHeart.width;
    const heartHeight = tempHeart.height;
    tempHeart.destroy();

    for (let i = 0; i < 3; i++) {
      const x = padding + (i * (heartWidth + spacing));
      const y = height - padding - heartHeight;

      const heart = this.add.image(x, y, 'full_heart')
        .setOrigin(0, 0)
        .setDepth(1000);

      this.heartSprites.push(heart);
    }

    // Store heart dimensions for nuke positioning
    this.heartIconWidth = heartWidth;
    this.heartIconSpacing = spacing;
  }

  /**
   * Create nuke sprite (hidden initially, bottom left after hearts)
   */
  createNukeSprite() {
    if (this.nukeSprite) {
      this.nukeSprite.destroy();
    }

    const { height } = this.scale;
    const padding = 5;
    const spacing = 1;

    // Position nuke to the right of hearts
    const heartsWidth = 3 * (this.heartIconWidth + spacing);
    const nukeX = padding + heartsWidth + spacing;

    // Get nuke height for positioning
    const tempNuke = this.add.image(0, 0, 'nuke_icon').setVisible(false);
    const nukeHeight = tempNuke.height;
    tempNuke.destroy();

    const y = height - padding - nukeHeight;

    this.nukeSprite = this.add.image(nukeX, y, 'nuke_icon')
      .setOrigin(0, 0)
      .setDepth(1000)
      .setVisible(false);
  }

  /**
   * Create nuke countdown text display (bottom left, after nuke icon position)
   */
  createNukeCountdown() {
    if (this.nukeCountdownText) {
      this.nukeCountdownText.destroy();
    }

    const { height } = this.scale;
    const padding = 5;

    // Position after the nuke icon area
    const heartsWidth = 3 * (this.heartIconWidth + 1);
    const nukeWidth = 50; // Approximate nuke icon width
    const x = padding + heartsWidth + nukeWidth + 10;
    const y = height - padding - 20;

    this.nukeCountdownText = this.add.text(x, y, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffcc00',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 }
    })
      .setOrigin(0, 1)
      .setDepth(1000);

    this.updateNukeCountdown();
  }

  /**
   * Create nuke alert sprite (bottom center, hidden by default)
   */
  createNukeAlert() {
    if (this.nukeAlertSprite) {
      this.nukeAlertSprite.destroy();
    }

    const { width, height } = this.scale;

    this.nukeAlertSprite = this.add.image(width / 2, height - 100, 'nuke_alert')
      .setOrigin(0.5, 1)
      .setScale(0.25)
      .setDepth(1001)
      .setVisible(false);
  }

  /**
   * Update nuke countdown display
   */
  updateNukeCountdown() {
    if (!this.nukeCountdownText) return;

    if (this.hasNuke) {
      this.nukeCountdownText.setText('');
    } else {
      const currentScore = this.difficultySystem ? this.difficultySystem.getScore() : 0;
      const nextThreshold = this.lastNukeScore + this.nukeThreshold;
      const pointsNeeded = nextThreshold - currentScore;
      this.nukeCountdownText.setText(`Nuke: ${pointsNeeded}`);
    }
  }

  /**
   * Show nuke alert for 3 seconds
   */
  showNukeAlert() {
    if (!this.nukeAlertSprite) return;

    this.nukeAlertSprite.setVisible(true);
    this.nukeAlertSprite.setAlpha(1);

    // Pulse animation
    this.tweens.add({
      targets: this.nukeAlertSprite,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut'
    });

    // Fade out after 3 seconds
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: this.nukeAlertSprite,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.nukeAlertSprite.setVisible(false);
        }
      });
    });
  }

  /**
   * Pulse the newly earned heart to signal extra life awarded
   */
  showLifeAlert() {
    const earnedHeart = this.heartSprites[this.lives - 1];
    if (!earnedHeart) return;

    this.tweens.add({
      targets: earnedHeart,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 150,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Update lives display - swap textures based on lives remaining
   */
  updateLivesDisplay() {
    this.heartSprites.forEach((heart, index) => {
      if (index < this.lives) {
        heart.setTexture('full_heart');
      } else {
        heart.setTexture('empty_heart');
      }
    });
  }

  /**
   * Update nuke display - show/hide nuke sprite
   */
  updateNukeDisplay() {
    if (this.nukeSprite) {
      this.nukeSprite.setVisible(this.hasNuke);
    }
  }

  /**
   * Setup pause menu handlers
   */
  setupPauseHandlers() {
    const pauseOverlay = document.getElementById('pause-overlay');
    const resumeBtn = document.getElementById('resume-button');
    const restartBtn = document.getElementById('pause-restart-button');
    const mainMenuBtn = document.getElementById('main-menu-button');

    // Store scene reference for handlers
    const scene = this;

    // Resume button
    resumeBtn.onclick = () => {
      scene.resumeGame();
    };

    // Restart button
    restartBtn.onclick = () => {
      pauseOverlay.classList.add('hidden');
      scene.isPaused = false;
      scene.scene.restart();
    };

    // Main menu button
    mainMenuBtn.onclick = () => {
      pauseOverlay.classList.add('hidden');
      scene.isPaused = false;
      // Destroy the game and show start overlay
      window.dispatchEvent(new Event('return-to-menu'));
    };
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.isGameOver) return;

    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  /**
   * Pause the game
   */
  pauseGame() {
    if (this.isPaused || this.isGameOver) return;

    this.isPaused = true;
    pauseMusic();
    this.scene.pause();

    const pauseOverlay = document.getElementById('pause-overlay');
    pauseOverlay.classList.remove('hidden');
  }

  /**
   * Resume the game
   */
  resumeGame() {
    if (!this.isPaused) return;

    this.isPaused = false;
    resumeMusic();
    this.scene.resume();

    const pauseOverlay = document.getElementById('pause-overlay');
    pauseOverlay.classList.add('hidden');
  }

  /**
   * Update score display in DOM
   */
  updateScoreDisplay() {
    if (this.scoreText) {
      this.scoreText.innerText = `Score: ${this.difficultySystem.getScore()}`;
    }
  }

  /**
   * Add score and handle difficulty changes
   */
  addScore(points) {
    const levelChanged = this.difficultySystem.addScore(points);
    this.updateScoreDisplay();

    if (levelChanged) {
      // Recreate timer with new delay
      this.createLetterTimer();
    }

    // Check for nuke reward (every 1000 points milestone)
    const currentScore = this.difficultySystem.getScore();
    const nextNukeThreshold = this.lastNukeScore + this.nukeThreshold;
    if (!this.hasNuke && currentScore >= nextNukeThreshold) {
      this.hasNuke = true;
      this.lastNukeScore = Math.floor(currentScore / this.nukeThreshold) * this.nukeThreshold;
      this.updateNukeDisplay();
      this.showNukeAlert();
    }

    // Check for extra life reward (every 2000 points), max 3 hearts
    if (this.lives < 3 && currentScore >= this.lastLifeScore + this.lifeThreshold) {
      this.lives++;
      this.lastLifeScore = Math.floor(currentScore / this.lifeThreshold) * this.lifeThreshold;
      this.updateLivesDisplay();
      this.showLifeAlert();
    }

    // Update nuke countdown
    this.updateNukeCountdown();
  }

  /**
   * Spawn a new falling letter or word
   */
  spawnLetter() {
    const { width } = this.scale;

    if (this.gameMode === 'words' && this.wordList.length > 0) {
      // Words mode - spawn a random word from the list
      this.spawnWord();
    } else {
      // Letters mode - spawn a single letter
      const letter = String.fromCharCode(65 + Phaser.Math.Between(0, 25));

      const text = this.add.text(
        Phaser.Math.Between(50, width - 50),
        0,
        letter,
        {
          fontSize: '32px',
          fontFamily: 'monospace',
          color: '#fff',
          backgroundColor: '#00000088',
          padding: { x: 8, y: 4 }
        }
      );

      text.letter = letter;
      text.hit = false;

      // Apply speed with multiplier (capped)
      const baseSpeed = this.difficultySystem.getBaseSpeed();
      const multiplier = this.difficultySystem.getSpeedMultiplier();
      text.speed = Phaser.Math.FloatBetween(baseSpeed.min, baseSpeed.max) * multiplier;

      this.letters.add(text);
    }
  }

  /**
   * Spawn a word (for words mode)
   */
  spawnWord() {
    const { width } = this.scale;
    const word = this.wordList[Phaser.Math.Between(0, this.wordList.length - 1)];

    const text = this.add.text(
      Phaser.Math.Between(50, width - 100),
      0,
      word,
      {
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#fff',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 }
      }
    );

    text.word = word;
    text.typedChars = 0; // Track how many characters have been typed
    text.hit = false;

    // Words fall slower than letters
    const baseSpeed = this.difficultySystem.getBaseSpeed();
    const multiplier = this.difficultySystem.getSpeedMultiplier();
    text.speed = Phaser.Math.FloatBetween(baseSpeed.min * 0.6, baseSpeed.max * 0.6) * multiplier;

    this.letters.add(text);
  }

  /**
   * Update word display to show typed progress
   */
  updateWordDisplay(wordObj) {
    const typed = wordObj.word.substring(0, wordObj.typedChars);
    const remaining = wordObj.word.substring(wordObj.typedChars);

    // Update text with colored typed portion
    wordObj.setText(typed + remaining);
    wordObj.setStyle({
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#fff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 }
    });

    // We'll use a different approach - recreate with highlight
    if (wordObj.typedChars > 0) {
      wordObj.setStyle({
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#4f4',
        backgroundColor: '#00000088',
        padding: { x: 8, y: 4 }
      });
      // Show remaining in different style - actually we need rich text
      // For simplicity, just change color based on progress
      const progress = wordObj.typedChars / wordObj.word.length;
      const green = Math.floor(255 * progress);
      wordObj.setColor(`rgb(${255 - green}, 255, ${255 - green})`);
    }
  }

  /**
   * Handle keyboard input
   */
  handleKey(event) {
    // Handle Escape key for pause (works even when paused)
    if (event.key === 'Escape') {
      this.togglePause();
      return;
    }

    // Ignore other keys if game is paused or over
    if (this.isPaused || this.isGameOver) return;

    // Handle Enter key for nuke activation
    if (event.key === 'Enter') {
      if (this.hasNuke) {
        this.activateNuke();
      }
      return;
    }

    const typedLetter = event.key.toUpperCase();

    // Only handle A-Z
    if (typedLetter.length !== 1 || typedLetter < 'A' || typedLetter > 'Z') {
      return;
    }

    if (this.gameMode === 'words') {
      this.handleWordInput(typedLetter);
    } else {
      this.handleLetterInput(typedLetter);
    }
  }

  /**
   * Handle letter input (letters mode)
   */
  handleLetterInput(typedLetter) {
    // Find matching letters (not already hit)
    const matches = this.letters.getChildren().filter(
      letterObj => letterObj.letter === typedLetter && !letterObj.hit
    );

    if (matches.length > 0) {
      // Hit the lowest (closest to bottom) matching letter
      const target = matches.reduce((a, b) => a.y > b.y ? a : b);
      target.hit = true;

      // Fire laser
      const laser = this.add.image(target.x, this.scale.height, 'laser')
        .setOrigin(0.1, 0);

      this.tweens.add({
        targets: laser,
        y: target.y + target.height + 45,
        duration: ANIMATION_CONFIG.laser.travelDuration,
        onComplete: () => {
          laser.destroy();

          // Explosion
          const explosion = this.add.sprite(target.x, target.y, 'explosion');
          explosion.play('explode');
          explosion.setScale(0.25);
          explosion.setDepth(100);
          explosion.once('animationcomplete', () => explosion.destroy());
          playSound('explosion');

          target.destroy();
          this.addScore(10);
        }
      });
    } else {
      // Mistype - penalty
      playSound('incorrect');
      this.addScore(-10);
      this.triggerCameraShake();
      this.triggerErrorFeedback();
    }
  }

  /**
   * Handle word input (words mode)
   */
  handleWordInput(typedLetter) {
    // Find words that are being typed or could start being typed
    const children = this.letters.getChildren().filter(obj => obj.word && !obj.hit);

    // First, check if we're continuing to type a word we've started
    const inProgressWords = children.filter(obj => obj.typedChars > 0);

    if (inProgressWords.length > 0) {
      // Continue typing the word closest to the bottom
      const target = inProgressWords.reduce((a, b) => a.y > b.y ? a : b);
      const nextChar = target.word[target.typedChars];

      if (nextChar === typedLetter) {
        target.typedChars++;
        this.updateWordDisplay(target);

        // Check if word is complete
        if (target.typedChars >= target.word.length) {
          this.completeWord(target);
        }
      } else {
        // Wrong letter - penalty and reset progress on this word
        target.typedChars = 0;
        this.updateWordDisplay(target);
        this.addScore(-10);
        this.triggerCameraShake();
        this.triggerErrorFeedback();
      }
    } else {
      // Try to start typing a new word
      const matchingWords = children.filter(obj =>
        obj.word[0] === typedLetter && obj.typedChars === 0
      );

      if (matchingWords.length > 0) {
        // Start typing the word closest to the bottom
        const target = matchingWords.reduce((a, b) => a.y > b.y ? a : b);
        target.typedChars = 1;
        this.updateWordDisplay(target);

        // Check if it's a single-letter word
        if (target.typedChars >= target.word.length) {
          this.completeWord(target);
        }
      } else {
        // No matching word - penalty
        this.addScore(-10);
        this.triggerCameraShake();
        this.triggerErrorFeedback();
      }
    }
  }

  /**
   * Complete a word (fire laser and destroy)
   */
  completeWord(target) {
    target.hit = true;

    // Fire laser
    const laser = this.add.image(target.x + target.width / 2, this.scale.height, 'laser')
      .setOrigin(0.1, 0);

    this.tweens.add({
      targets: laser,
      y: target.y + target.height + 45,
      duration: ANIMATION_CONFIG.laser.travelDuration,
      onComplete: () => {
        laser.destroy();

        // Explosion
        const explosion = this.add.sprite(target.x + target.width / 2, target.y, 'explosion');
        explosion.play('explode');
        explosion.setScale(0.25);
        explosion.setDepth(100);
        explosion.once('animationcomplete', () => explosion.destroy());
        playSound('explosion');

        // Award points based on word length (10 points per letter)
        const points = target.word.length * 10;
        this.addScore(points);

        target.destroy();
      }
    });
  }

  /**
   * Trigger camera shake with debouncing
   * FIX: Prevents shake stacking
   */
  triggerCameraShake() {
    const now = this.time.now;

    if (now - this.lastShakeTime >= CAMERA_SHAKE.debounceMs) {
      // Can shake immediately
      this.cameras.main.shake(CAMERA_SHAKE.duration, CAMERA_SHAKE.intensity);
      this.lastShakeTime = now;
      this.pendingShake = false;
    } else if (!this.pendingShake) {
      // Queue one shake
      this.pendingShake = true;
      this.time.delayedCall(CAMERA_SHAKE.debounceMs, () => {
        if (this.pendingShake) {
          this.cameras.main.shake(CAMERA_SHAKE.duration, CAMERA_SHAKE.intensity);
          this.lastShakeTime = this.time.now;
          this.pendingShake = false;
        }
      });
    }
    // Ignore additional shakes while one is pending (max 1 queued)
  }

  /**
   * Trigger error color feedback
   * FIX: Track in update loop instead of setTimeout
   */
  triggerErrorFeedback() {
    if (this.scoreText) {
      this.scoreText.style.color = FEEDBACK.errorColor;
    }
    this.feedbackTimer = FEEDBACK.feedbackDurationMs;
    this.isFeedbackActive = true;
  }

  /**
   * Activate the nuke power-up - destroys all letters on screen
   */
  activateNuke() {
    if (!this.hasNuke) return;

    // Get all letters and destroy them with explosions
    const children = this.letters.getChildren();
    let lettersDestroyed = 0;

    for (let i = children.length - 1; i >= 0; i--) {
      const letterObj = children[i];

      // Count letters (in words mode, count characters in the word)
      if (this.gameMode === 'words' && letterObj.word) {
        lettersDestroyed += letterObj.word.length;
      } else {
        lettersDestroyed += 1;
      }

      // Create explosion at each letter's position
      const explosion = this.add.sprite(letterObj.x, letterObj.y, 'explosion');
      explosion.play('explode');
      explosion.setScale(0.25);
      explosion.setDepth(100);
      explosion.once('animationcomplete', () => explosion.destroy());

      letterObj.destroy();
    }

    // Award points for destroyed letters (10 points each)
    if (lettersDestroyed > 0) {
      this.addScore(lettersDestroyed * 10);
    }

    playSound('nuke');

    // Screen flash effect
    this.cameras.main.flash(300, 255, 200, 100);

    // Camera shake for impact
    this.cameras.main.shake(300, 0.015);

    // Consume the nuke
    this.hasNuke = false;
    this.updateNukeDisplay();
    this.updateNukeCountdown();
  }

  /**
   * Main update loop
   */
  update(time, delta) {
    const { height } = this.scale;

    // FIX: Handle color feedback timer in update loop
    if (this.isFeedbackActive) {
      this.feedbackTimer -= delta;
      if (this.feedbackTimer <= 0) {
        if (this.scoreText) {
          this.scoreText.style.color = FEEDBACK.normalColor;
        }
        this.isFeedbackActive = false;
        this.feedbackTimer = 0;
      }
    }

    // Update letters
    const children = this.letters.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const letterObj = children[i];

      // Move letter down
      letterObj.y += letterObj.speed * (delta / 1000);

      // Check if letter hit bottom
      if (letterObj.y + letterObj.height >= height) {
        this.triggerCameraShake();
        letterObj.destroy(); // Remove the letter that hit bottom

        // Decrement lives
        this.lives--;
        playSound('fail');
        this.updateLivesDisplay();

        if (this.lives <= 0) {
          this.gameOver();
          return; // Stop processing
        }
      }
    }
  }

  /**
   * Handle game over
   */
  gameOver() {
    // Prevent multiple game over calls
    if (this.isGameOver) return;
    this.isGameOver = true;

    playSound('lose');
    stopMusic();

    // Pause the scene
    this.scene.pause();

    // Store reference for closure
    const scene = this;
    const score = this.difficultySystem.getScore();
    const difficulty = this.selectedDifficulty;

    // Use setTimeout instead of delayedCall (scene is paused, Phaser clock stops)
    setTimeout(() => {
      const overlay = document.getElementById('game-over-overlay');
      const finalScore = document.getElementById('final-score');
      const playerName = document.getElementById('player-name');
      const restartButton = document.getElementById('restart-button');

      finalScore.innerText = `Your Score: ${score}`;
      playerName.value = '';
      overlay.classList.remove('hidden');

      // Remove any existing save button first
      const existingSaveBtn = overlay.querySelector('.save-score-btn');
      if (existingSaveBtn) existingSaveBtn.remove();

      // Create save button
      const saveButton = document.createElement('button');
      saveButton.className = 'save-score-btn';
      saveButton.textContent = 'Save Score';
      saveButton.style.marginTop = '10px';
      saveButton.onclick = async () => {
        try {
          await saveScore({
            name: playerName.value || 'Anonymous',
            score: score,
            difficulty: difficulty
          });
          saveButton.textContent = 'Saved!';
          saveButton.disabled = true;

          // Refresh leaderboard
          window.dispatchEvent(new Event('refresh-leaderboard'));
        } catch (error) {
          console.error('Save error:', error);
          saveButton.textContent = 'Error';
        }
      };
      overlay.appendChild(saveButton);

      // Restart handler
      restartButton.onclick = () => {
        overlay.classList.add('hidden');
        saveButton.remove();
        scene.isGameOver = false;
        scene.scene.restart();
      };

      // Main menu handler
      const mainMenuButton = document.getElementById('gameover-menu-button');
      mainMenuButton.onclick = () => {
        overlay.classList.add('hidden');
        saveButton.remove();
        scene.isGameOver = false;
        window.dispatchEvent(new Event('return-to-menu'));
      };
    }, 200);
  }
}
