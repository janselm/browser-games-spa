import * as THREE from 'three'
import { play, playMusic, pauseMusic, resumeMusic, stopMusic, getMusicEnabled, setMusicEnabled } from '../../services/AudioService.js'

export function initPongGame() {
  // ─── Constants ────────────────────────────────────────────────────────────
  const PLAYER_SPEED = 12

  const DIFFICULTY_PRESETS = {
    easy:       { speed: 5.5,  reactDelay: 0.30, error: 1.6  },
    medium:     { speed: 8.0,  reactDelay: 0.12, error: 0.8  },
    hard:       { speed: 11.5, reactDelay: 0.05, error: 0.25 },
    impossible: { speed: 15.0, reactDelay: 0.0,  error: 0.0  },
  }

  const SPEED_PRESETS = {
    slow:    { initSpeed: 9,  maxSpeed: 18 },
    normal:  { initSpeed: 14, maxSpeed: 28 },
    fast:    { initSpeed: 20, maxSpeed: 38 },
    blazing: { initSpeed: 28, maxSpeed: 52 },
  }

  let currentDifficulty = DIFFICULTY_PRESETS.medium
  let currentSpeed      = SPEED_PRESETS.normal

  const PADDLE_HALF_X     = 1.5
  const WALL_BOUNCE_X     = 6.8
  const SCORE_Z_OPPONENT  = 15.5
  const SCORE_Z_PLAYER    = -15.5
  const PADDLE_Z_PLAYER   = 13.5
  const PADDLE_Z_OPPONENT = -13.5
  const PLAYER_CLAMP      = 5.5
  const SCORED_DELAY      = 1500

  // ─── State ────────────────────────────────────────────────────────────────
  const States = { WAITING: 0, PLAYING: 1, PAUSED: 2, SCORED: 3, GAMEOVER: 4 }
  let state         = States.WAITING
  let scorePlayer   = 0
  let scoreOpponent = 0
  let scoreLimit    = 7

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const container      = document.getElementById('canvas-container')
  const hudEl          = document.getElementById('hud')
  const overlayStart   = document.getElementById('overlay-start')
  const overlayPause   = document.getElementById('overlay-pause')
  const overlayGameover = document.getElementById('overlay-gameover')
  const gameoverTitle  = document.getElementById('gameover-title')
  const flashEl        = document.getElementById('score-flash')
  const pauseBtn       = document.getElementById('pause-btn')

  // ─── Touch state ──────────────────────────────────────────────────────────
  let activeTouchId = null
  let touchTargetX  = null

  // ─── Settings button wiring ───────────────────────────────────────────────
  // Sync music buttons to stored preference on load
  const musicKey = getMusicEnabled() ? 'on' : 'off';
  document.querySelectorAll(`.setting-btn[data-group="music"]`).forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`.setting-btn[data-group="music"][data-key="${musicKey}"]`).forEach(b => b.classList.add('active'));

  document.querySelectorAll('.setting-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group
      const key   = btn.dataset.key
      document.querySelectorAll(`.setting-btn[data-group="${group}"]`).forEach(b => b.classList.remove('active'))
      document.querySelectorAll(`.setting-btn[data-group="${group}"][data-key="${key}"]`).forEach(b => b.classList.add('active'))
      if (group === 'music') {
        setMusicEnabled(key === 'on')
      } else if (group === 'difficulty') {
        currentDifficulty = DIFFICULTY_PRESETS[key]
      } else if (group === 'speed') {
        currentSpeed = SPEED_PRESETS[key]
      } else if (group === 'points') {
        scoreLimit = parseInt(key, 10)
      }
    })
  })

  // ─── Renderer ─────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  // ─── Scene ────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a12)
  scene.fog = new THREE.Fog(0x0a0a12, 30, 60)

  // ─── Camera ───────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200)
  camera.position.set(0, 3.5, PADDLE_Z_PLAYER + 4.5)

  // ─── Lighting ─────────────────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xffffff, 0.35)
  scene.add(ambient)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
  dirLight.position.set(4, 12, 8)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.set(1024, 1024)
  dirLight.shadow.camera.near = 0.5
  dirLight.shadow.camera.far = 60
  dirLight.shadow.camera.left = -12
  dirLight.shadow.camera.right = 12
  dirLight.shadow.camera.top = 20
  dirLight.shadow.camera.bottom = -20
  scene.add(dirLight)

  const centerLight = new THREE.PointLight(0x88aaff, 1.2, 25)
  centerLight.position.set(0, 6, 0)
  scene.add(centerLight)

  // ─── Table ────────────────────────────────────────────────────────────────
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x1a4a2e })
  const tableGeo = new THREE.BoxGeometry(14, 0.2, 30)
  const table    = new THREE.Mesh(tableGeo, tableMat)
  table.receiveShadow = true
  scene.add(table)

  const lineGeo    = new THREE.PlaneGeometry(0.12, 30)
  const lineMat    = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
  const centerLine = new THREE.Mesh(lineGeo, lineMat)
  centerLine.rotation.x = -Math.PI / 2
  centerLine.position.set(0, 0.11, 0)
  scene.add(centerLine)

  for (let z = -14; z <= 14; z += 2) {
    const dashGeo = new THREE.PlaneGeometry(0.12, 0.8)
    const dash = new THREE.Mesh(dashGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.6, transparent: true }))
    dash.rotation.x = -Math.PI / 2
    dash.position.set(0, 0.111, z)
    scene.add(dash)
  }

  // ─── Walls ────────────────────────────────────────────────────────────────
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x888888 })
  const wallGeo = new THREE.BoxGeometry(0.2, 1, 30)

  const leftWall = new THREE.Mesh(wallGeo, wallMat)
  leftWall.position.set(-7.1, 0.5, 0)
  leftWall.castShadow = true
  leftWall.receiveShadow = true
  scene.add(leftWall)

  const rightWall = new THREE.Mesh(wallGeo, wallMat)
  rightWall.position.set(7.1, 0.5, 0)
  rightWall.castShadow = true
  rightWall.receiveShadow = true
  scene.add(rightWall)

  // ─── Paddles ──────────────────────────────────────────────────────────────
  const paddleGeo = new THREE.BoxGeometry(3, 0.5, 0.3)

  const playerPaddle = new THREE.Mesh(paddleGeo, new THREE.MeshLambertMaterial({ color: 0x4488ff }))
  playerPaddle.position.set(0, 0.35, PADDLE_Z_PLAYER)
  playerPaddle.castShadow = true
  scene.add(playerPaddle)

  const opponentPaddle = new THREE.Mesh(paddleGeo, new THREE.MeshLambertMaterial({ color: 0xff4444 }))
  opponentPaddle.position.set(0, 0.35, PADDLE_Z_OPPONENT)
  opponentPaddle.castShadow = true
  scene.add(opponentPaddle)

  const playerGlowMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.15 })
  const playerGlow = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 0.6), playerGlowMat)
  playerPaddle.add(playerGlow)

  const oppGlowMat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.15 })
  const oppGlow = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 0.6), oppGlowMat)
  opponentPaddle.add(oppGlow)

  // ─── Ball ─────────────────────────────────────────────────────────────────
  const ballGeo = new THREE.SphereGeometry(0.3, 16, 12)
  const ballMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 })
  const ball    = new THREE.Mesh(ballGeo, ballMat)
  ball.position.set(0, 0.45, 0)
  ball.castShadow = true
  scene.add(ball)

  const ballLight = new THREE.PointLight(0xffffff, 0.8, 4)
  ball.add(ballLight)

  // ─── Physics state ────────────────────────────────────────────────────────
  let ballVx = 0, ballVz = 0
  let ballPrevX = 0, ballPrevZ = 0

  // ─── AI state ─────────────────────────────────────────────────────────────
  let aiTarget = 0
  let aiTimer  = 0
  let aiError  = 0

  // ─── Input ────────────────────────────────────────────────────────────────
  const keys = new Set()

  function handleKeyDown(code) {
    if (code === 'Enter') {
      if (state === States.WAITING || state === States.PAUSED) startOrResume()
    }
    if (code === 'Escape') {
      if (state === States.PLAYING) pause()
      else if (state === States.PAUSED) startOrResume()
    }
  }

  const onKeyDown = (e) => { keys.add(e.code); handleKeyDown(e.code) }
  const onKeyUp   = (e) => keys.delete(e.code)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  // ─── Game flow ────────────────────────────────────────────────────────────
  function startOrResume() {
    if (state === States.WAITING) { serveBall(); playMusic() }
    else resumeMusic()
    state = States.PLAYING
    overlayStart.style.display = 'none'
    overlayPause.style.display = 'none'
    pauseBtn.style.display = 'flex'
  }

  function pause() {
    state = States.PAUSED
    pauseMusic()
    overlayPause.style.display = 'flex'
    pauseBtn.style.display = 'none'
  }

  function restartGame() {
    scorePlayer   = 0
    scoreOpponent = 0
    updateHUD()
    ball.position.set(0, 0.45, 0)
    ballVx = 0; ballVz = 0
    playerPaddle.position.x  = 0
    opponentPaddle.position.x = 0
    touchTargetX = null
    state = States.WAITING
    overlayPause.style.display    = 'none'
    overlayGameover.style.display = 'none'
    overlayStart.style.display    = 'flex'
    pauseBtn.style.display = 'none'
  }

  function showGameOver(playerWon) {
    state = States.GAMEOVER
    stopMusic()
    play(playerWon ? 'win' : 'lose')
    pauseBtn.style.display = 'none'
    gameoverTitle.textContent = playerWon ? 'YOU WIN!' : 'YOU LOSE'
    overlayGameover.className = `overlay ${playerWon ? 'overlay-win' : 'overlay-lose'}`
    overlayGameover.style.display = 'flex'
  }

  document.getElementById('restart-btn').addEventListener('click', restartGame)
  document.getElementById('play-again-btn').addEventListener('click', restartGame)
  document.getElementById('leave-game-btn').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('pong-leave'))
  })
  document.getElementById('gameover-leave-btn').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('pong-leave'))
  })
  pauseBtn.addEventListener('click', pause)

  // ─── Hold-to-activate buttons ─────────────────────────────────────────────
  function setupHoldButton(btn, onActivate) {
    let timer = null
    function start(e) {
      e.preventDefault()
      btn.classList.add('holding')
      timer = setTimeout(() => { btn.classList.remove('holding'); onActivate() }, 550)
    }
    function cancel() {
      clearTimeout(timer)
      btn.classList.remove('holding')
    }
    btn.addEventListener('mousedown', start)
    btn.addEventListener('touchstart', start, { passive: false })
    btn.addEventListener('mouseup', cancel)
    btn.addEventListener('mouseleave', cancel)
    btn.addEventListener('touchend', cancel)
    btn.addEventListener('touchcancel', cancel)
  }

  setupHoldButton(document.getElementById('start-game-btn'), startOrResume)

  const resumeBtn = document.getElementById('resume-btn')
  resumeBtn.addEventListener('click', startOrResume)
  resumeBtn.addEventListener('touchend', e => { e.preventDefault(); startOrResume() })

  // ─── Touch paddle control ─────────────────────────────────────────────────
  function applyTouchToX(clientX) {
    touchTargetX = (clientX / window.innerWidth) * 2 * PLAYER_CLAMP - PLAYER_CLAMP
  }

  const onTouchStart = (e) => {
    if (e.target.closest('button, .settings')) return
    if (state !== States.PLAYING && state !== States.SCORED) return
    activeTouchId = e.changedTouches[0].identifier
    applyTouchToX(e.changedTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    if (activeTouchId === null) return
    for (const t of e.changedTouches) {
      if (t.identifier === activeTouchId) { applyTouchToX(t.clientX); break }
    }
  }

  const onTouchEnd = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === activeTouchId) { activeTouchId = null; touchTargetX = null; break }
    }
  }

  document.addEventListener('touchstart', onTouchStart, { passive: true })
  document.addEventListener('touchmove',  onTouchMove,  { passive: true })
  document.addEventListener('touchend',   onTouchEnd,   { passive: true })

  // ─── Ball ─────────────────────────────────────────────────────────────────
  function serveBall() {
    ball.position.set(0, 0.45, 0)
    ballPrevX = 0
    ballPrevZ = 0
    const dir = Math.random() < 0.5 ? 1 : -1
    ballVz = currentSpeed.initSpeed * dir
    ballVx = (Math.random() * 10 - 5)
    aiTarget = 0
    aiTimer  = 0
    aiError  = (Math.random() * 2 - 1) * currentDifficulty.error
  }

  function scored(playerScored) {
    state = States.SCORED
    play(playerScored ? 'success' : 'fail')
    if (playerScored) {
      scorePlayer++
      showFlash('You Score!', 'player')
    } else {
      scoreOpponent++
      showFlash('Opponent Scores!', 'opponent')
    }
    updateHUD()
    if (scorePlayer >= scoreLimit) { showGameOver(true);  return }
    if (scoreOpponent >= scoreLimit) { showGameOver(false); return }
    setTimeout(() => {
      if (state === States.SCORED) {
        serveBall()
        state = States.PLAYING
      }
    }, SCORED_DELAY)
  }

  function updateHUD() {
    hudEl.textContent = `${scoreOpponent} :: ${scorePlayer}`
  }

  let flashTimeout = null
  function showFlash(text, cls) {
    flashEl.textContent = text
    flashEl.className   = cls
    flashEl.classList.add('visible')
    if (flashTimeout) clearTimeout(flashTimeout)
    flashTimeout = setTimeout(() => flashEl.classList.remove('visible'), 1200)
  }

  // ─── AI logic ─────────────────────────────────────────────────────────────
  function updateAI(dt) {
    if (ballVz < 0) {
      aiTimer -= dt
      if (aiTimer <= 0) {
        aiTimer  = currentDifficulty.reactDelay
        aiTarget = ball.position.x + aiError
        aiError  = (Math.random() * 2 - 1) * currentDifficulty.error
      }
    } else {
      aiTarget *= 0.97
    }
    const dx   = aiTarget - opponentPaddle.position.x
    const move = Math.sign(dx) * Math.min(Math.abs(dx), currentDifficulty.speed * dt)
    opponentPaddle.position.x = THREE.MathUtils.clamp(
      opponentPaddle.position.x + move,
      -PLAYER_CLAMP, PLAYER_CLAMP
    )
  }

  // ─── Paddle collision (swept) ─────────────────────────────────────────────
  function checkPaddleCollision(paddle, paddleZ, towardPlayer) {
    const ballR   = 0.3
    const paddleHZ = 0.15 + ballR
    const crossed = towardPlayer
      ? (ballPrevZ <= paddleZ + paddleHZ && ball.position.z >= paddleZ - paddleHZ)
        || (ball.position.z >= paddleZ - paddleHZ && ball.position.z <= paddleZ + paddleHZ)
      : (ballPrevZ >= paddleZ - paddleHZ && ball.position.z <= paddleZ + paddleHZ)
        || (ball.position.z <= paddleZ + paddleHZ && ball.position.z >= paddleZ - paddleHZ)
    if (!crossed) return false
    return Math.abs(ball.position.x - paddle.position.x) <= PADDLE_HALF_X + ballR
  }

  function deflectBall(paddle) {
    play('success')
    const offset = ball.position.x - paddle.position.x
    const norm   = offset / PADDLE_HALF_X
    const angle  = norm * (Math.PI / 4)
    let speed = Math.sqrt(ballVx * ballVx + ballVz * ballVz) * 1.05
    speed = Math.min(speed, currentSpeed.maxSpeed)
    const dir = ballVz > 0 ? -1 : 1
    ballVz = Math.cos(angle) * speed * dir
    ballVx = Math.sin(angle) * speed
  }

  // ─── Physics update ───────────────────────────────────────────────────────
  function updatePhysics(dt) {
    ballPrevX = ball.position.x
    ballPrevZ = ball.position.z
    ball.position.x += ballVx * dt
    ball.position.z += ballVz * dt

    if (ball.position.x <= -WALL_BOUNCE_X) {
      ball.position.x = -WALL_BOUNCE_X
      ballVx = Math.abs(ballVx)
    } else if (ball.position.x >= WALL_BOUNCE_X) {
      ball.position.x = WALL_BOUNCE_X
      ballVx = -Math.abs(ballVx)
    }

    if (ballVz > 0 && checkPaddleCollision(playerPaddle, PADDLE_Z_PLAYER, true)) {
      ball.position.z = PADDLE_Z_PLAYER - 0.46
      deflectBall(playerPaddle)
      ballVx += (playerPaddle.position.x - ballPrevX) * 0.5
    }

    if (ballVz < 0 && checkPaddleCollision(opponentPaddle, PADDLE_Z_OPPONENT, false)) {
      ball.position.z = PADDLE_Z_OPPONENT + 0.46
      deflectBall(opponentPaddle)
    }

    if (ball.position.z > SCORE_Z_OPPONENT) { scored(false); return }
    if (ball.position.z < SCORE_Z_PLAYER)   { scored(true);  return }
  }

  // ─── Player input ─────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (touchTargetX !== null) {
      playerPaddle.position.x = THREE.MathUtils.clamp(touchTargetX, -PLAYER_CLAMP, PLAYER_CLAMP)
      return
    }
    let dx = 0
    if (keys.has('KeyA') || keys.has('ArrowLeft'))  dx -= PLAYER_SPEED * dt
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += PLAYER_SPEED * dt
    playerPaddle.position.x = THREE.MathUtils.clamp(
      playerPaddle.position.x + dx,
      -PLAYER_CLAMP, PLAYER_CLAMP
    )
  }

  // ─── Camera ───────────────────────────────────────────────────────────────
  const camTargetX = { value: 0 }

  function updateCamera(dt) {
    const targetX  = playerPaddle.position.x
    const lerpRate = 8
    camTargetX.value += (targetX - camTargetX.value) * lerpRate * dt
    camera.position.x = camTargetX.value
    camera.position.y = 3.5
    camera.position.z = PADDLE_Z_PLAYER + 4.5
    camera.lookAt(playerPaddle.position.x * 0.3, 0.5, 0)
  }

  // ─── Resize ───────────────────────────────────────────────────────────────
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)

  // ─── Render loop ──────────────────────────────────────────────────────────
  let animFrameId = null
  let lastTime    = null

  function animate(ts) {
    animFrameId = requestAnimationFrame(animate)
    if (lastTime === null) lastTime = ts
    let dt = (ts - lastTime) / 1000
    lastTime = ts
    dt = Math.min(dt, 0.05)

    if (state === States.PLAYING) {
      updatePlayer(dt)
      updateAI(dt)
      updatePhysics(dt)
    }
    updateCamera(dt)
    renderer.render(scene, camera)
  }

  updateHUD()
  animFrameId = requestAnimationFrame(animate)

  // ─── Destroy ──────────────────────────────────────────────────────────────
  return function destroy() {
    if (animFrameId !== null) cancelAnimationFrame(animFrameId)
    if (flashTimeout !== null) clearTimeout(flashTimeout)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup',   onKeyUp)
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchmove',  onTouchMove)
    document.removeEventListener('touchend',   onTouchEnd)
    window.removeEventListener('resize', onResize)
    scene.clear()
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }
}
