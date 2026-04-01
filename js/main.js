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

    // Initialize all managers
    this.gameState = new GameState();
    this.player = new Player(1, this.gameWidth, this.gameHeight);
    this.obstacleManager = new ObstacleManager(this.gameWidth, this.gameHeight);
    this.coinManager = new CoinManager(this.gameWidth, this.gameHeight);
    this.collisionDetector = new CollisionDetector();
    this.renderer = new Renderer(this.ctx, this.gameWidth, this.gameHeight);
    this.inputHandler = new InputHandler();
    this.uiManager = new UIManager(this.gameWidth, this.gameHeight);

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

    // Update input
    this.updateInput();

    // Update game entities
    this.updateObstacles(deltaTime);
    this.updateCoins(deltaTime);

    // Check collisions
    this.checkCollisions();

    // Update game state
    this.updateGameState(deltaTime);

    // Render
    this.render();

    // Continue loop
    if (this.gameState.isGameActive) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    } else if (this.gameState.isGameOver) {
      this.handleGameOver();
    }
  };

  updateInput() {
    const moveDistance = 10; // Pixels per frame

    if (this.inputHandler.isKeyPressed('ArrowLeft') || this.inputHandler.isKeyPressed('a')) {
      this.player.moveLeft(moveDistance, this.gameWidth);
    }
    if (this.inputHandler.isKeyPressed('ArrowRight') || this.inputHandler.isKeyPressed('d')) {
      this.player.moveRight(moveDistance, this.gameWidth);
    }
  }

  updateObstacles(deltaTime) {
    // Spawn new obstacles
    this.obstacleManager.spawn();

    // Move obstacles down
    this.obstacleManager.update(deltaTime);

    // Remove obstacles that are off-screen
    this.obstacleManager.removeOffScreen();
  }

  updateCoins(deltaTime) {
    // Spawn new coins
    this.coinManager.spawn();

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
