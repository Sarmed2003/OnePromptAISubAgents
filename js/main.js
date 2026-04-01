// Game Loop and Orchestrator
// Initializes all managers and runs the main game loop

class Game {
  constructor() {
    // Canvas setup
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Game configuration
    this.gameWidth = this.canvas.width;
    this.gameHeight = this.canvas.height;
    this.targetFps = 60;
    this.frameTime = 1000 / this.targetFps;
    this.lastFrameTime = 0;
    this.animationFrameId = null;
    this.isRunning = false;

    // Spawn timing
    this.obstacleSpawnTimer = 0;
    this.obstacleSpawnInterval = 750; // 0.75 seconds average (0.5-1s range)
    this.coinSpawnTimer = 0;
    this.coinSpawnInterval = 2500; // 2.5 seconds average (2-3s range)

    // Game speed progression
    this.baseGameSpeed = 200; // pixels per second
    this.maxGameSpeed = 400; // pixels per second
    this.speedIncreaseRate = 50; // pixels per second, per 10 seconds
    this.currentGameSpeed = this.baseGameSpeed;

    // Initialize all managers
    this.gameState = new GameState();
    this.player = new Player(1, this.gameWidth, this.gameHeight);
    this.obstacleManager = new ObstacleManager(this.gameWidth, this.gameHeight);
    this.coinManager = new CoinManager(this.gameWidth, this.gameHeight);
    this.collisionDetector = new CollisionDetector();
    this.renderer = new Renderer(this.ctx, this.gameWidth, this.gameHeight);
    this.inputHandler = new InputHandler();
    this.uiManager = new UIManager(this.gameWidth, this.gameHeight);

    // Set initial game speed for managers
    this.obstacleManager.gameSpeed = this.currentGameSpeed;
    this.coinManager.gameSpeed = this.currentGameSpeed;

    // Event listeners
    this.setupEventListeners();

    // Auto-start game on load
    this.startGame();
  }

  setupEventListeners() {
    // Start button
    const startButton = document.getElementById('startButton');
    if (startButton) {
      startButton.addEventListener('click', () => this.startGame());
    }

    // Restart button
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
      restartButton.addEventListener('click', () => this.restart());
    }
  }

  resizeCanvas() {
    const container = this.canvas.parentElement || document.body;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.gameWidth = this.canvas.width;
    this.gameHeight = this.canvas.height;

    // Update manager dimensions if they exist
    if (this.obstacleManager) {
      this.obstacleManager.gameWidth = this.gameWidth;
      this.obstacleManager.gameHeight = this.gameHeight;
    }
    if (this.coinManager) {
      this.coinManager.gameWidth = this.gameWidth;
      this.coinManager.gameHeight = this.gameHeight;
    }
    if (this.renderer) {
      this.renderer.gameWidth = this.gameWidth;
      this.renderer.gameHeight = this.gameHeight;
    }
    if (this.uiManager) {
      this.uiManager.gameWidth = this.gameWidth;
      this.uiManager.gameHeight = this.gameHeight;
    }
  }

  startGame() {
    if (this.gameState.isGameOver || this.gameState.isGameActive) {
      return; // Prevent multiple starts
    }

    this.gameState.startGame();
    this.isRunning = true;
    this.lastFrameTime = Date.now();
    this.obstacleSpawnTimer = 0;
    this.coinSpawnTimer = 0;
    this.currentGameSpeed = this.baseGameSpeed;

    // Hide UI elements that should be hidden during gameplay
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    if (startButton) startButton.style.display = 'none';
    if (restartButton) restartButton.style.display = 'none';

    // Start the game loop
    this.gameLoop();
  }

  gameLoop = (currentTime = Date.now()) => {
    if (!this.isRunning) {
      return;
    }

    // Calculate delta time for frame-rate independent updates
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Clamp delta time to prevent huge jumps (e.g., tab switch)
    const clampedDeltaTime = Math.min(deltaTime, 50);

    // Update game speed based on elapsed time
    this.updateGameSpeed(clampedDeltaTime);

    // Update input and player position
    this.updateInput();

    // Spawn and update game entities
    this.updateSpawning(clampedDeltaTime);
    this.updateObstacles(clampedDeltaTime);
    this.updateCoins(clampedDeltaTime);

    // Check collisions
    this.checkCollisions();

    // Update game state
    this.updateGameState(clampedDeltaTime);

    // Render
    this.render();

    // Continue loop
    if (this.gameState.isGameActive) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    } else if (this.gameState.isGameOver) {
      this.handleGameOver();
    }
  };

  updateGameSpeed(deltaTime) {
    // Increase game speed over time
    const elapsedSeconds = this.gameState.elapsedTime / 1000;
    const speedIncrease = Math.floor(elapsedSeconds / 10) * this.speedIncreaseRate;
    this.currentGameSpeed = Math.min(
      this.baseGameSpeed + speedIncrease,
      this.maxGameSpeed
    );

    // Update managers with current speed
    this.obstacleManager.gameSpeed = this.currentGameSpeed;
    this.coinManager.gameSpeed = this.currentGameSpeed;
  }

  updateSpawning(deltaTime) {
    // Update obstacle spawn timer
    this.obstacleSpawnTimer += deltaTime;
    if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
      this.obstacleManager.spawn();
      // Add randomness: 0.5-1.0 seconds
      this.obstacleSpawnInterval = 500 + Math.random() * 500;
      this.obstacleSpawnTimer = 0;
    }

    // Update coin spawn timer
    this.coinSpawnTimer += deltaTime;
    if (this.coinSpawnTimer >= this.coinSpawnInterval) {
      this.coinManager.spawn();
      // Add randomness: 2-3 seconds
      this.coinSpawnInterval = 2000 + Math.random() * 1000;
      this.coinSpawnTimer = 0;
    }
  }

  updateInput() {
    const moveDistance = 15; // Pixels per frame

    if (this.inputHandler.isKeyPressed('ArrowLeft') || this.inputHandler.isKeyPressed('a')) {
      this.player.moveLeft(moveDistance, this.gameWidth);
    }
    if (this.inputHandler.isKeyPressed('ArrowRight') || this.inputHandler.isKeyPressed('d')) {
      this.player.moveRight(moveDistance, this.gameWidth);
    }
  }

  updateObstacles(deltaTime) {
    // Move obstacles down
    this.obstacleManager.update(deltaTime);

    // Remove obstacles that are off-screen
    this.obstacleManager.removeOffScreen();
  }

  updateCoins(deltaTime) {
    // Move coins down
    this.coinManager.update(deltaTime);

    // Remove coins that are off-screen
    this.coinManager.removeOffScreen();
  }

  checkCollisions() {
    // Check player-obstacle collisions
    for (const obstacle of this.obstacleManager.obstacles) {
      if (this.collisionDetector.checkCollision(this.player, obstacle)) {
        this.gameState.endGame();
        this.isRunning = false;
        return; // Stop further collision checks
      }
    }

    // Check player-coin collisions
    const coinsToRemove = [];
    for (let i = 0; i < this.coinManager.coins.length; i++) {
      const coin = this.coinManager.coins[i];
      if (this.collisionDetector.checkCollision(this.player, coin)) {
        this.gameState.addScore(coin.value);
        coinsToRemove.push(i);
      }
    }

    // Remove collected coins (iterate backwards to avoid index issues)
    for (let i = coinsToRemove.length - 1; i >= 0; i--) {
      this.coinManager.coins.splice(coinsToRemove[i], 1);
    }
  }

  updateGameState(deltaTime) {
    if (this.gameState.isGameActive) {
      this.gameState.incrementTime(deltaTime);
    }
  }

  render() {
    // Clear canvas
    this.renderer.clear();

    // Draw game elements
    this.renderer.drawBackground();
    this.renderer.drawPlayer(this.player);
    this.renderer.drawObstacles(this.obstacleManager.obstacles);
    this.renderer.drawCoins(this.coinManager.coins);

    // Draw UI
    this.uiManager.drawScore(this.gameState.score);
    this.uiManager.drawTime(this.gameState.elapsedTime);
  }

  handleGameOver() {
    // Draw game-over screen
    this.renderer.clear();
    this.renderer.drawBackground();
    this.uiManager.drawGameOverScreen(this.gameState.score);

    // Show restart button
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
      restartButton.style.display = 'block';
    }
  }

  restart() {
    // Reset all managers
    this.gameState.reset();
    this.player.reset();
    this.obstacleManager.reset();
    this.coinManager.reset();
    this.inputHandler.reset();

    // Reset game speed
    this.currentGameSpeed = this.baseGameSpeed;
    this.obstacleSpawnTimer = 0;
    this.coinSpawnTimer = 0;

    // Hide restart button
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
      restartButton.style.display = 'none';
    }

    // Restart game
    this.startGame();
  }
}

// Initialize game on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
} else {
  window.game = new Game();
}
