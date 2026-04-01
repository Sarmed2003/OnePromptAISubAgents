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
  difficultyScaleFactor: 0.0001 // per frame
};

// Get lane X position
function getLaneX(laneIndex) {
  const baseX = -GAME_CONFIG.laneSpacing;
  return baseX + laneIndex * GAME_CONFIG.laneSpacing;
}

// Input handling
function handleInput() {
  if (window.inputState) {
    if (window.inputState.left && window.gameState.playerTargetLane > 0) {
      window.gameState.playerTargetLane--;
      window.inputState.left = false;
    }
    if (window.inputState.right && window.gameState.playerTargetLane < 2) {
      window.gameState.playerTargetLane++;
      window.inputState.right = false;
    }
  }
}

// Update player position with smooth lane switching
function updatePlayerPosition() {
  const targetX = getLaneX(window.gameState.playerTargetLane);
  const currentX = getLaneX(window.gameState.playerLane) + 
                   (getLaneX(window.gameState.playerLane + 1) - getLaneX(window.gameState.playerLane)) * 
                   window.gameState.playerLaneTransition;
  
  if (window.gameState.playerLaneTransition < 1) {
    window.gameState.playerLaneTransition += GAME_CONFIG.laneTransitionSpeed;
    if (window.gameState.playerLaneTransition >= 1) {
      window.gameState.playerLaneTransition = 0;
      window.gameState.playerLane = window.gameState.playerTargetLane;
    }
  }
  
  if (window.player) {
    window.player.position.x = currentX;
  }
}

// Move ground (scroll effect)
function moveGround() {
  if (window.ground) {
    window.ground.position.z -= window.gameState.speed;
    
    // Reset ground position for infinite scroll
    if (window.ground.position.z < -50) {
      window.ground.position.z = 0;
    }
  }
}

// Update obstacles and coins
function updateObstaclesAndCoins() {
  if (window.obstacles) {
    for (let i = window.obstacles.length - 1; i >= 0; i--) {
      window.obstacles[i].position.z -= window.gameState.speed;
      
      // Remove if off-screen
      if (window.obstacles[i].position.z < -10) {
        window.obstacles[i].dispose();
        window.obstacles.splice(i, 1);
      }
    }
  }
  
  if (window.coins) {
    for (let i = window.coins.length - 1; i >= 0; i--) {
      window.coins[i].position.z -= window.gameState.speed;
      
      // Rotate coin for visual effect
      window.coins[i].rotation.y += 0.05;
      
      // Remove if off-screen
      if (window.coins[i].position.z < -10) {
        window.coins[i].dispose();
        window.coins.splice(i, 1);
      }
    }
  }
}

// Calculate spawn rate based on difficulty
function getSpawnRateMultiplier() {
  const difficultyFactor = Math.min(
    window.gameState.elapsedTime * GAME_CONFIG.difficultyScaleFactor,
    GAME_CONFIG.maxSpawnRate
  );
  return 1.0 + difficultyFactor;
}

// Spawn obstacles
function spawnObstacles() {
  const spawnInterval = Math.max(
    40,
    Math.floor(GAME_CONFIG.obstacleBaseSpawnInterval / getSpawnRateMultiplier())
  );
  
  if (window.gameState.frameCount - window.gameState.lastObstacleSpawn > spawnInterval) {
    window.gameState.lastObstacleSpawn = window.gameState.frameCount;
    
    if (window.createObstacle) {
      window.createObstacle();
    }
  }
}

// Spawn coins
function spawnCoins() {
  const spawnInterval = Math.max(
    50,
    Math.floor(GAME_CONFIG.coinBaseSpawnInterval / getSpawnRateMultiplier())
  );
  
  if (window.gameState.frameCount - window.gameState.lastCoinSpawn > spawnInterval) {
    window.gameState.lastCoinSpawn = window.gameState.frameCount;
    
    if (window.createCoin) {
      window.createCoin();
    }
  }
}

// Check collisions
function checkCollisions() {
  if (!window.player || !window.obstacles || !window.coins) return;
  
  const playerX = getLaneX(window.gameState.playerLane);
  const playerZ = window.player.position.z;
  const collisionRadius = 0.8;
  
  // Check obstacle collisions
  for (let obstacle of window.obstacles) {
    const dx = Math.abs(obstacle.position.x - playerX);
    const dz = Math.abs(obstacle.position.z - playerZ);
    
    if (dx < collisionRadius && dz < collisionRadius) {
      window.onGameOver();
      return;
    }
  }
  
  // Check coin collisions
  for (let i = window.coins.length - 1; i >= 0; i--) {
    const coin = window.coins[i];
    const dx = Math.abs(coin.position.x - playerX);
    const dz = Math.abs(coin.position.z - playerZ);
    
    if (dx < collisionRadius && dz < collisionRadius) {
      window.gameState.score += 10;
      coin.dispose();
      window.coins.splice(i, 1);
    }
  }
}

// Update HUD
function updateHUD() {
  if (window.updateScoreDisplay) {
    window.updateScoreDisplay(window.gameState.score);
  }
  
  if (window.updateSpeedDisplay) {
    window.updateSpeedDisplay(window.gameState.speed.toFixed(2));
  }
  
  if (window.updateLevelDisplay) {
    window.updateLevelDisplay(window.gameState.level);
  }
}

// Increase speed over time
function updateDifficulty() {
  const speedIncrease = GAME_CONFIG.speedIncreasePerFrame * getSpawnRateMultiplier();
  window.gameState.speed = Math.min(
    window.gameState.speed + speedIncrease,
    GAME_CONFIG.maxSpeed
  );
  
  // Update level based on time
  const newLevel = Math.floor(window.gameState.elapsedTime / 300) + 1;
  if (newLevel !== window.gameState.level) {
    window.gameState.level = newLevel;
  }
}

// Main game loop
function gameLoop() {
  if (window.gameState.isGameOver || window.gameState.isPaused) {
    return;
  }
  
  window.gameState.frameCount++;
  window.gameState.elapsedTime += 1 / 60; // Assuming 60 FPS
  
  handleInput();
  updatePlayerPosition();
  moveGround();
  updateObstaclesAndCoins();
  spawnObstacles();
  spawnCoins();
  checkCollisions();
  updateHUD();
  updateDifficulty();
}

// Register game loop with scene
if (window.scene) {
  window.scene.registerBeforeRender(() => {
    gameLoop();
  });
}

// Game over handler
window.onGameOver = function() {
  window.gameState.isGameOver = true;
  
  // Show game over modal
  const modal = document.getElementById('gameOverModal');
  if (modal) {
    modal.style.display = 'flex';
    const finalScoreElement = document.getElementById('finalScore');
    if (finalScoreElement) {
      finalScoreElement.textContent = window.gameState.score;
    }
  }
};

// Restart game handler
window.restartGame = function() {
  // Reset game state
  window.gameState.score = 0;
  window.gameState.speed = 1.0;
  window.gameState.isGameOver = false;
  window.gameState.isPaused = false;
  window.gameState.level = 1;
  window.gameState.frameCount = 0;
  window.gameState.elapsedTime = 0;
  window.gameState.lastObstacleSpawn = 0;
  window.gameState.lastCoinSpawn = 0;
  window.gameState.playerLane = 1;
  window.gameState.playerTargetLane = 1;
  window.gameState.playerLaneTransition = 0;
  
  // Clear obstacles
  if (window.obstacles) {
    for (let obstacle of window.obstacles) {
      obstacle.dispose();
    }
    window.obstacles = [];
  }
  
  // Clear coins
  if (window.coins) {
    for (let coin of window.coins) {
      coin.dispose();
    }
    window.coins = [];
  }
  
  // Reset player position
  if (window.player) {
    window.player.position.x = getLaneX(1);
    window.player.position.z = 0;
  }
  
  // Reset ground position
  if (window.ground) {
    window.ground.position.z = 0;
  }
  
  // Hide game over modal
  const modal = document.getElementById('gameOverModal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  // Update HUD
  updateHUD();
};

// Toggle pause handler
window.togglePause = function() {
  window.gameState.isPaused = !window.gameState.isPaused;
  
  const pauseModal = document.getElementById('pauseModal');
  if (pauseModal) {
    pauseModal.style.display = window.gameState.isPaused ? 'flex' : 'none';
  }
};

// Initialize obstacles and coins arrays if not already done
if (!window.obstacles) {
  window.obstacles = [];
}
if (!window.coins) {
  window.coins = [];
}
