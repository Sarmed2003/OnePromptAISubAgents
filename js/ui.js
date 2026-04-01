class UI {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.gameOverModal = null;
    this.restartCallback = null;
    this.isGameOverVisible = false;
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
  }

  updateScore(score, coins) {
    if (!this.ctx) {
      console.error('UI not initialized. Call init(canvas) first.');
      return;
    }
    
    this.ctx.font = 'bold 28px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    const scoreText = `Score: ${score}`;
    const coinsText = `Coins: ${coins}`;
    
    this.ctx.fillText(scoreText, 10, 10);
    this.ctx.fillText(coinsText, 10, 45);
    
    this.ctx.shadowColor = 'transparent';
  }

  showGameOver(score, coins, onRestart) {
    if (this.isGameOverVisible) {
      return;
    }

    this.isGameOverVisible = true;
    this.restartCallback = onRestart;

    this.gameOverModal = document.createElement('div');
    this.gameOverModal.id = 'game-over-modal';
    this.gameOverModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: Arial, sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background-color: #2C3E50;
      padding: 40px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
    `;

    const title = document.createElement('h1');
    title.textContent = 'GAME OVER';
    title.style.cssText = `
      color: #FFFFFF;
      font-size: 48px;
      margin: 0 0 20px 0;
      font-weight: bold;
    `;

    const scoreDisplay = document.createElement('p');
    scoreDisplay.textContent = `Final Score: ${score}`;
    scoreDisplay.style.cssText = `
      color: #FFFFFF;
      font-size: 24px;
      margin: 10px 0;
    `;

    const coinsDisplay = document.createElement('p');
    coinsDisplay.textContent = `Coins Collected: ${coins}`;
    coinsDisplay.style.cssText = `
      color: #FFFFFF;
      font-size: 24px;
      margin: 10px 0 30px 0;
    `;

    const restartButton = document.createElement('button');
    restartButton.textContent = 'RESTART';
    restartButton.id = 'restart-button';
    restartButton.style.cssText = `
      background-color: #FF6B6B;
      color: #FFFFFF;
      border: none;
      padding: 12px 40px;
      font-size: 20px;
      font-weight: bold;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    `;

    restartButton.addEventListener('mouseover', () => {
      restartButton.style.backgroundColor = '#FF5252';
    });

    restartButton.addEventListener('mouseout', () => {
      restartButton.style.backgroundColor = '#FF6B6B';
    });

    restartButton.addEventListener('click', () => {
      this.hideGameOver();
      if (this.restartCallback) {
        this.restartCallback();
      }
    });

    modalContent.appendChild(title);
    modalContent.appendChild(scoreDisplay);
    modalContent.appendChild(coinsDisplay);
    modalContent.appendChild(restartButton);

    this.gameOverModal.appendChild(modalContent);
    document.body.appendChild(this.gameOverModal);
  }

  hideGameOver() {
    if (this.gameOverModal && this.gameOverModal.parentNode) {
      this.gameOverModal.parentNode.removeChild(this.gameOverModal);
      this.gameOverModal = null;
    }
    this.isGameOverVisible = false;
    this.restartCallback = null;
  }

  onRestartClick(callback) {
    this.restartCallback = callback;
  }
}

export { UI };
