const gameState = {
  state: 'playing',
  score: 0,
  coinsCollected: 0,

  setState(newState) {
    if (newState === 'playing' || newState === 'gameOver' || newState === 'paused') {
      this.state = newState;
    }
  },

  getState() {
    return this.state;
  },

  addScore(points) {
    this.score += points;
  },

  addCoin() {
    this.coinsCollected += 1;
  },

  resetGame() {
    this.state = 'playing';
    this.score = 0;
    this.coinsCollected = 0;
  }
};

export { gameState };
