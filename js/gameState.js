class GameState {
  constructor() {
    this.score = 0;
    this.coinsCollected = 0;
    this.gameRunning = false;
    this.gameTime = 0;
    this.difficulty = 1;
  }

  startGame() {
    this.gameRunning = true;
    this.gameTime = 0;
    this.score = 0;
    this.coinsCollected = 0;
    this.difficulty = 1;
  }

  endGame() {
    this.gameRunning = false;
  }

  addScore(points) {
    this.score += points;
  }

  addCoin() {
    this.coinsCollected += 1;
    this.addScore(10);
  }

  updateTime() {
    this.gameTime += 1;
    this.difficulty = 1 + this.gameTime / 3000;
  }

  getGameState() {
    return {
      score: this.score,
      coinsCollected: this.coinsCollected,
      gameRunning: this.gameRunning,
      gameTime: this.gameTime,
      difficulty: this.difficulty
    };
  }

  resetGame() {
    this.score = 0;
    this.coinsCollected = 0;
    this.gameRunning = false;
    this.gameTime = 0;
    this.difficulty = 1;
  }
}

const gameStateManager = new GameState();

export { GameState, gameStateManager };