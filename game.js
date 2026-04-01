// Game state initialization
window.player = null;
window.obstacles = [];
window.coins = [];
window.score = 0;
window.gameRunning = true;
window.spawnTimer = 0;
window.obstacleSpawnInterval = 120; // frames between obstacle spawns
window.coinSpawnInterval = 90; // frames between coin spawns
window.gameLoopId = null;

// Initialize game state
function initializeGameState() {
  window.player = new Player();
  window.obstacles = [];
  window.coins = [];
  window.score = 0;
  window.gameRunning = true;
  window.spawnTimer = 0;
}

// Update score display in UI
function addScore(points) {
  window.score += points;
  updateScoreDisplay();
}

// Main game loop - runs at ~60fps via requestAnimationFrame
window.gameLoop = function() {
  if (!window.gameRunning) {
    return;
  }

  // Step 1: Handle input
  handleInputUpdate();

  // Step 2: Update all entities
  window.player.update();
  
  for (let i = 0; i < window.obstacles.length; i++) {
    window.obstacles[i].update();
  }
  
  window.updateCoins();

  // Step 3: Spawn obstacles and coins (increment timers)
  window.spawnTimer++;
  
  if (window.spawnTimer >= window.obstacleSpawnInterval) {
    const obstacle = new Obstacle();
    window.obstacles.push(obstacle);
    window.spawnTimer = 0;
  }
  
  // Spawn coins
  window.spawnCoin();

  // Step 4: Collision checks
  // Check player-obstacle collisions
  if (checkPlayerObstacleCollision(window.player, window.obstacles)) {
    window.endGame();
    return;
  }
  
  // Check player-coin collisions
  const collectedIndices = checkPlayerCoinCollision(window.player, window.coins);
  if (collectedIndices.length > 0) {
    const result = removeCoinCollected(window.coins, collectedIndices);
    window.coins = result.coins;
    addScore(result.count);
  }

  // Step 5: Render
  render(window.ctx, window.player, window.obstacles, window.coins, window.score);

  // Step 6: Remove offscreen entities
  // Remove offscreen obstacles
  for (let i = window.obstacles.length - 1; i >= 0; i--) {
    if (window.obstacles[i].y > window.canvas.height) {
      window.obstacles.splice(i, 1);
    }
  }
  
  // Coins are handled by coins.js update

  // Schedule next frame
  window.gameLoopId = requestAnimationFrame(window.gameLoop);
};

// Restart the game - reset state and resume loop
window.restartGame = function() {
  // Cancel any pending animation frame
  if (window.gameLoopId) {
    cancelAnimationFrame(window.gameLoopId);
    window.gameLoopId = null;
  }

  // Reset all game state
  initializeGameState();
  
  // Hide game-over screen if it exists
  const gameOverScreen = document.getElementById('gameOverScreen');
  if (gameOverScreen) {
    gameOverScreen.style.display = 'none';
  }
  
  // Update score display
  updateScoreDisplay();
  
  // Restart the game loop
  window.gameLoopId = requestAnimationFrame(window.gameLoop);
};

// End the game - stop loop and show game-over screen
window.endGame = function() {
  window.gameRunning = false;
  
  // Cancel the animation frame
  if (window.gameLoopId) {
    cancelAnimationFrame(window.gameLoopId);
    window.gameLoopId = null;
  }
  
  // Display game-over screen with final score
  const gameOverScreen = document.getElementById('gameOverScreen');
  if (gameOverScreen) {
    gameOverScreen.style.display = 'flex';
    const finalScoreElement = document.getElementById('finalScore');
    if (finalScoreElement) {
      finalScoreElement.textContent = window.score;
    }
  }
};