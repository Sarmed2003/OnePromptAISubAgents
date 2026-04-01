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
    this.gameState = gameState;
    this.player = new Player(1, this.gameWidth, this.gameHeight);
    this.obstacleManager = new Obstacles();
    this.coinManager = new Coins();
    this.renderer = new Renderer(this.ctx, this.gameWidth, this.gameHeight);
    this.inputHandler = new Input();
    this.uiManager = new UI(this.gameWidth, this.gameHeight);

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
    if (this.isRunning) {
      return; // Prevent multiple starts
    }

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

    // Calculate delta time for frame-rate independence
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    // Update game logic
    this.update(deltaTime);

    // Render
    this.render();

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  update(deltaTime) {
    // Update game speed based on time
    const elapsedSeconds = (Date.now() - this.lastFrameTime) / 1000;
    this.currentGameSpeed = Math.min(
      this.baseGameSpeed + (elapsedSeconds / 10) * this.speedIncreaseRate,
      this.maxGameSpeed
    );

    // Convert speed to pixels per frame
    const speedPerFrame = this.currentGameSpeed * deltaTime;

    // Update player
    this.player.update(this.gameWidth, this.gameHeight);

    // Update obstacles
    this.obstacleManager.update(speedPerFrame);

    // Update coins
    this.coinManager.update(speedPerFrame);

    // Spawn obstacles
    this.obstacleSpawnTimer += deltaTime * 1000;
    if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
      const randomLane = Math.floor(Math.random() * 3);
      this.obstacleManager.spawn(randomLane, this.gameWidth, this.gameHeight);
      this.obstacleSpawnTimer = 0;
    }

    // Spawn coins
    this.coinSpawnTimer += deltaTime * 1000;
    if (this.coinSpawnTimer >= this.coinSpawnInterval) {
      const randomLane = Math.floor(Math.random() * 3);
      this.coinManager.spawn(randomLane, this.gameWidth, this.gameHeight);
      this.coinSpawnTimer = 0;
    }

    // Check collisions
    const playerBox = this.player.getBoundingBox();
    const obstacleIndex = checkPlayerObstacle(playerBox, this.obstacleManager.getObstacles());
    if (obstacleIndex !== -1) {
      this.gameOver();
    }

    const coinIndex = checkPlayerCoin(playerBox, this.coinManager.getCoins());
    if (coinIndex !== -1) {
      this.gameState.addCoin();
      this.gameState.addScore(10);
      this.coinManager.removeCoin(coinIndex);
    }
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

    // Render all game objects
    this.renderer.drawPlayer(this.player);
    this.renderer.drawObstacles(this.obstacleManager);
    this.renderer.drawCoins(this.coinManager);
    this.renderer.drawUI(this.gameState);
  }

  gameOver() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    this.uiManager.showGameOver(this.gameState.score);
  }

  restart() {
    this.gameState.resetGame();
    this.obstacleManager.obstacles = [];
    this.coinManager.coins = [];
    this.player.reset();
    this.startGame();
  }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new Game();
  });
} else {
  new Game();
}
