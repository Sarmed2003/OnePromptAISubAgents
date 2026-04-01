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

// Main game loop - runs at ~60fps via requestAnimationFrame
window.gameLoop = function() {
  if (!window.gameRunning) {
    return;
  }

  // Step 1: Handle input
  handleInput();

  // Step 2: Update all entities
  window.player.update();
  
  for (let i = 0; i < window.obstacles.length; i++) {
    window.obstacles[i].update();
  }
  
  for (let i = 0; i < window.coins.length; i++) {
    window.coins[i].update();
  }

  // Step 3: Spawn obstacles and coins (increment timers)
  window.spawnTimer++;
  
  if (window.spawnTimer >= window.obstacleSpawnInterval) {
    const obstacle = new Obstacle();
    window.obstacles.push(obstacle);
    window.spawnTimer = 0;
  }
  
  // Spawn coins on a separate timer
  if (window.spawnTimer % Math.floor(window.obstacleSpawnInterval * 0.75) === 0) {
    const coin = new Coin();
    window.coins.push(coin);
  }

  // Step 4: Collision checks
  // Check player-obstacle collisions
  for (let i = 0; i < window.obstacles.length; i++) {
    if (checkCollision(window.player, window.obstacles[i])) {
      window.endGame();
      return;
    }
  }
  
  // Check player-coin collisions
  for (let i = window.coins.length - 1; i >= 0; i--) {
    if (checkCollision(window.player, window.coins[i])) {
      addScore(1);
      window.coins.splice(i, 1);
    }
  }

  // Step 5: Render
  render(window.player, window.obstacles, window.coins, window.score);

  // Step 6: Remove offscreen entities
  // Remove offscreen obstacles
  for (let i = window.obstacles.length - 1; i >= 0; i--) {
    if (window.obstacles[i].x + window.obstacles[i].width < 0 ||
        window.obstacles[i].x > window.canvas.width) {
      window.obstacles.splice(i, 1);
    }
  }
  
  // Remove offscreen coins
  for (let i = window.coins.length - 1; i >= 0; i--) {
    if (window.coins[i].x + window.coins[i].width < 0 ||
        window.coins[i].x > window.canvas.width) {
      window.coins.splice(i, 1);
    }
  }

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

// Collision detection - AABB (Axis-Aligned Bounding Box)
function checkCollision(entity1, entity2) {
  return entity1.x < entity2.x + entity2.width &&
         entity1.x + entity1.width > entity2.x &&
         entity1.y < entity2.y + entity2.height &&
         entity1.y + entity1.height > entity2.y;
}

// Add score and update UI
function addScore(points) {
  window.score += points;
  const scoreElement = document.getElementById('score');
  if (scoreElement) {
    scoreElement.textContent = window.score;
  }
}

// Start the game on page load
window.addEventListener('DOMContentLoaded', function() {
  // Initialize canvas and rendering context
  window.canvas = document.getElementById('gameCanvas');
  if (!window.canvas) {
    console.error('Canvas element with id "gameCanvas" not found');
    return;
  }
  
  window.ctx = window.canvas.getContext('2d');
  
  // Initialize game state
  initializeGameState();
  
  // Start the game loop
  window.gameLoopId = requestAnimationFrame(window.gameLoop);
  
  // Setup restart button
  const restartButton = document.getElementById('restartButton');
  if (restartButton) {
    restartButton.addEventListener('click', window.restartGame);
  }
});
