// Game state initialization
window.gameState = {
  score: 0,
  speed: 1.0,
  isGameOver: false,
  isPaused: false,
  level: 1,
  frameCount: 0,
  elapsedTime: 0,
  lastObstacleSpawn: 0,
  lastCoinSpawn: 0,
  playerLane: 1, // 0=left, 1=center, 2=right
  playerTargetLane: 1,
  playerLaneTransition: 0 // 0 to 1 for smooth animation
};

// Game configuration
const GAME_CONFIG = {
  laneWidth: 2,
  laneSpacing: 2.5,
  spawnDistance: 30,
  obstacleBaseSpawnInterval: 120, // frames
  coinBaseSpawnInterval: 80, // frames
  maxSpawnRate: 0.3, // multiplier cap
  speedIncreasePerFrame: 0.0008,
  maxSpeed: 8.0,
  laneTransitionSpeed: 0.15,
  difficultyScaleFactor: 0.0001
};

// Initialize game
window.initGame = function() {
  // Verify all required systems are loaded
  if (!window.scene) {
    console.error('Scene not initialized');
    return false;
  }
  if (!window.player) {
    console.error('Player not initialized');
    return false;
  }
  if (!window.setupInput) {
    console.error('Input system not initialized');
    return false;
  }

  // Set up input handlers
  window.setupInput();

  // Initialize game state
  window.gameState.score = 0;
  window.gameState.speed = 1.0;
  window.gameState.isGameOver = false;
  window.gameState.isPaused = false;
  window.gameState.frameCount = 0;
  window.gameState.elapsedTime = 0;

  // Clear previous game objects
  if (window.clearCoins) window.clearCoins();
  if (window.clearObstacles) window.clearObstacles();

  // Start the game loop
  window.startGameLoop();

  return true;
};

// Game over handler
window.onGameOver = function() {
  window.gameState.isGameOver = true;
  if (window.showGameOverModal) {
    window.showGameOverModal(window.gameState.score);
  }
};

// Restart game
window.restartGame = function() {
  window.gameState.isGameOver = false;
  window.gameState.isPaused = false;
  if (window.hideGameOverModal) {
    window.hideGameOverModal();
  }
  window.initGame();
};

// Main game loop
window.startGameLoop = function() {
  if (!window.engine || !window.scene) {
    console.error('Engine or Scene not initialized');
    return;
  }

  window.engine.runRenderLoop(function() {
    const deltaTime = window.engine.getDeltaTime() / 1000; // Convert to seconds

    if (!window.gameState.isPaused && !window.gameState.isGameOver) {
      // Update game systems
      window.gameState.frameCount++;
      window.gameState.elapsedTime += deltaTime;

      // Update speed based on difficulty
      const speedMultiplier = 1.0 + (window.gameState.score * GAME_CONFIG.difficultyScaleFactor);
      window.gameState.speed = Math.min(
        1.0 + (window.gameState.frameCount * GAME_CONFIG.speedIncreasePerFrame * speedMultiplier),
        GAME_CONFIG.maxSpeed
      );

      // Update game entities
      if (window.updatePlayer) {
        window.updatePlayer(deltaTime);
      }
      if (window.updateCoins) {
        window.updateCoins(deltaTime);
      }
      if (window.updateObstacles) {
        window.updateObstacles(deltaTime);
      }
      if (window.updateParticles) {
        window.updateParticles(deltaTime);
      }

      // Check collisions
      if (window.checkCollisions) {
        window.checkCollisions();
      }

      // Update UI
      if (window.updateUI) {
        window.updateUI();
      }
    }

    // Always render
    window.scene.render();
  });

  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.engine) {
      window.engine.resize();
    }
  });
};

// Start game when page loads
window.addEventListener('DOMContentLoaded', function() {
  // Give other scripts time to initialize
  setTimeout(function() {
    window.initGame();
  }, 100);
});
