<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { initPongGame } from '../games/pong/PongGame.js'
import '../games/pong/pong.css'

const router = useRouter()
let destroy = null

function onLeave() {
  router.push('/')
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.body.style.background = '#000'
  window.addEventListener('pong-leave', onLeave)
  destroy = initPongGame()
})

onUnmounted(() => {
  if (destroy) { destroy(); destroy = null }
  window.removeEventListener('pong-leave', onLeave)
  document.body.style.overflow = ''
  document.body.style.background = ''
})
</script>

<template>
  <div id="pong-root">
    <div id="canvas-container"></div>

    <div id="hud">0 :: 0</div>

    <div id="overlay-start" class="overlay">
      <h1>PONG</h1>
      <!-- Back to Games Menu button -->
      <RouterLink to="/" class="pong-back-btn">← Games Menu</RouterLink>
      <button class="action-btn" id="start-game-btn">Hold to Start<div class="hold-fill"></div></button>
      <div class="controls">
        Touch &amp; hold — Start / Resume<br>
        Slide &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Move paddle<br>
        A / D &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Move paddle<br>
        ESC &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— Pause
      </div>
      <div class="settings">
        <div class="setting-row">
          <span class="setting-label">Difficulty</span>
          <button class="setting-btn" data-group="difficulty" data-key="easy">Easy</button>
          <button class="setting-btn active" data-group="difficulty" data-key="medium">Medium</button>
          <button class="setting-btn" data-group="difficulty" data-key="hard">Hard</button>
          <button class="setting-btn" data-group="difficulty" data-key="impossible">Impossible</button>
        </div>
        <div class="setting-row">
          <span class="setting-label">Ball Speed</span>
          <button class="setting-btn" data-group="speed" data-key="slow">Slow</button>
          <button class="setting-btn active" data-group="speed" data-key="normal">Normal</button>
          <button class="setting-btn" data-group="speed" data-key="fast">Fast</button>
          <button class="setting-btn" data-group="speed" data-key="blazing">Blazing</button>
        </div>
        <div class="setting-row">
          <span class="setting-label">Points</span>
          <button class="setting-btn" data-group="points" data-key="5">5</button>
          <button class="setting-btn active" data-group="points" data-key="7">7</button>
          <button class="setting-btn" data-group="points" data-key="10">10</button>
        </div>
        <div class="setting-row">
          <span class="setting-label">Music</span>
          <button class="setting-btn active" data-group="music" data-key="on">On</button>
          <button class="setting-btn" data-group="music" data-key="off">Off</button>
        </div>
      </div>
    </div>

    <div id="overlay-pause" class="overlay" style="display:none;">
      <h1>PAUSED</h1>
      <button class="action-btn orange" id="resume-btn">Resume<div class="hold-fill"></div></button>
      <div class="settings">
        <div class="setting-row">
          <span class="setting-label">Difficulty</span>
          <button class="setting-btn" data-group="difficulty" data-key="easy">Easy</button>
          <button class="setting-btn active" data-group="difficulty" data-key="medium">Medium</button>
          <button class="setting-btn" data-group="difficulty" data-key="hard">Hard</button>
          <button class="setting-btn" data-group="difficulty" data-key="impossible">Impossible</button>
        </div>
        <div class="setting-row">
          <span class="setting-label">Ball Speed</span>
          <button class="setting-btn" data-group="speed" data-key="slow">Slow</button>
          <button class="setting-btn active" data-group="speed" data-key="normal">Normal</button>
          <button class="setting-btn" data-group="speed" data-key="fast">Fast</button>
          <button class="setting-btn" data-group="speed" data-key="blazing">Blazing</button>
        </div>
        <div class="setting-row">
          <span class="setting-label">Points</span>
          <button class="setting-btn" data-group="points" data-key="5">5</button>
          <button class="setting-btn active" data-group="points" data-key="7">7</button>
          <button class="setting-btn" data-group="points" data-key="10">10</button>
        </div>
        <div class="setting-row">
          <span class="setting-label">Music</span>
          <button class="setting-btn active" data-group="music" data-key="on">On</button>
          <button class="setting-btn" data-group="music" data-key="off">Off</button>
        </div>
      </div>
      <button class="restart-btn" id="restart-btn">Restart Game</button>
      <button class="restart-btn leave-btn" id="leave-game-btn">Leave Game</button>
    </div>

    <div id="overlay-gameover" class="overlay" style="display:none;">
      <h1 id="gameover-title">YOU WIN!</h1>
      <button class="action-btn" id="play-again-btn">Play Again<div class="hold-fill"></div></button>
      <button class="restart-btn leave-btn" id="gameover-leave-btn">Leave Game</button>
    </div>

    <button id="pause-btn">⏸</button>
    <div id="score-flash"></div>
  </div>
</template>

<style>
#pong-root { position: fixed; inset: 0; }

.pong-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border-radius: 0.5rem;
  background-color: #0f3460;
  color: #eaeaea;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.8rem;
  text-decoration: none;
  letter-spacing: 1px;
  margin-top: 8px;
  transition: background-color 0.2s;
}
.pong-back-btn:hover {
  background-color: #e94560;
}

.leave-btn {
  margin-top: 8px;
  border-color: #4488ff66;
  color: #4488ff;
}
.leave-btn:hover {
  border-color: #4488ff;
  box-shadow: 0 0 8px #4488ff44;
}
</style>
