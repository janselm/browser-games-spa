<script setup>
import { onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { createGameConfig } from '../games/typegame/config/gameConfig.js'
import MainScene from '../games/typegame/scenes/MainScene.js'
import { initDifficultySelector, resetDifficultySelector } from '../games/typegame/ui/DifficultySelector.js'
import { initSettingsUI } from '../games/typegame/ui/SettingsUI.js'
import { refreshLeaderboardUI } from '../games/typegame/services/LeaderboardService.js'
import '../games/typegame/style.css'

let game = null

function startGame(difficultyId, mode, wordList) {
  const config = createGameConfig('game')
  config.scene = class extends MainScene {
    create() {
      this.setDifficulty(difficultyId)
      this.setGameMode(mode, wordList)
      super.create()
    }
  }
  game = new Phaser.Game(config)
}

function returnToMenu() {
  if (game) { game.destroy(true); game = null }

  const gameContainer = document.getElementById('game')
  if (gameContainer) gameContainer.innerHTML = ''
  const scoreEl = document.getElementById('score')
  const diffEl = document.getElementById('difficulty-display')
  if (scoreEl) scoreEl.innerText = ''
  if (diffEl) diffEl.innerText = ''

  const overlay = document.getElementById('start-overlay')
  if (overlay) { overlay.classList.remove('fade-out'); overlay.style.display = 'flex' }

  refreshLeaderboardUI()
  initDifficultySelector(startGame)
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.body.style.background = '#000'
  window.addEventListener('return-to-menu', returnToMenu)
  window.addEventListener('refresh-leaderboard', refreshLeaderboardUI)
  refreshLeaderboardUI()
  initDifficultySelector(startGame)
  initSettingsUI()
})

onUnmounted(() => {
  if (game) { game.destroy(true); game = null }
  window.removeEventListener('return-to-menu', returnToMenu)
  window.removeEventListener('refresh-leaderboard', refreshLeaderboardUI)
  resetDifficultySelector()
  document.body.style.overflow = ''
  document.body.style.background = ''
})
</script>

<template>
  <div id="typegame-root">
    <div id="background"></div>
    <div id="game"></div>
    <div id="game-hud">
      <div id="pause-hint">[ESC] Pause</div>
      <div id="score"></div>
      <div id="difficulty-display"></div>
    </div>

    <div id="start-overlay">
      <!-- Back to Games Menu button -->
      <RouterLink
        to="/"
        class="back-to-games"
      >← Games Menu</RouterLink>

      <h1>Type Game</h1>

      <!-- Game Mode Selection -->
      <p>Select game mode:</p>
      <div id="mode-selection">
        <span class="mode selected" data-mode="letters">Letters</span>
        <span class="mode" data-mode="words">Words</span>
      </div>

      <!-- Words Input (hidden by default) -->
      <div id="words-input-container" class="hidden">
        <label for="words-input">Enter words (comma separated):</label>
        <textarea id="words-input" rows="3" placeholder="apple, banana, cherry, dog, cat"></textarea>
      </div>

      <p>Use the arrow keys to choose difficulty:</p>
      <div id="difficulty-selection">
        <span class="difficulty selected" data-level="1">Easy</span>
        <span class="difficulty" data-level="2">Medium</span>
        <span class="difficulty" data-level="3">Hard</span>
      </div>
      <p>Press <strong>Enter</strong> to start</p>
      <button id="settings-button">Settings</button>

      <!-- Leaderboard -->
      <div class="overlay-leaderboard">
        <h2>Leaderboard</h2>
        <div class="leaderboard-scroll">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Score</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="game-over-overlay" class="overlay hidden">
      <h1>Game Over</h1>
      <p id="final-score"></p>
      <label for="player-name">Enter your name:</label><br />
      <input type="text" id="player-name" maxlength="20" /><br />
      <button id="restart-button">Restart</button>
      <button id="gameover-menu-button">Main Menu</button>

      <!-- Leaderboard -->
      <div class="overlay-leaderboard">
        <h2>Leaderboard</h2>
        <div class="leaderboard-scroll">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Score</th>
                <th>Diff</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="pause-overlay" class="overlay hidden">
      <h1>Paused</h1>
      <div class="pause-menu">
        <button id="resume-button">Resume</button>
        <button id="pause-restart-button">Restart</button>
        <button id="main-menu-button">Main Menu</button>
      </div>
      <p class="pause-hint-text">Press [ESC] to resume</p>
    </div>

    <div id="settings-overlay" class="overlay hidden">
      <h1>Settings</h1>

      <!-- Missile Selection Carousel -->
      <div class="settings-section">
        <h2>Missile Style</h2>
        <div class="carousel">
          <button class="carousel-btn carousel-prev">&lt;</button>
          <div class="carousel-preview">
            <img id="missile-preview" src="/img/missile1_Menu.png" alt="Missile preview" />
          </div>
          <button class="carousel-btn carousel-next">&gt;</button>
        </div>
        <p class="carousel-label">Missile <span id="missile-number">1</span></p>
      </div>

      <button id="settings-back-button">Back</button>
    </div>
  </div>
</template>

<style>
#typegame-root { position: fixed; inset: 0; }

.back-to-games {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background-color: #0f3460;
  color: #eaeaea;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.back-to-games:hover {
  background-color: #e94560;
}
</style>
