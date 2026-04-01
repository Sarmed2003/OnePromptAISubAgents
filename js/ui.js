class UIManager {
  constructor() {
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.restartButtonBounds = null;
  }

  init(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  drawScore(ctx, score, coinsCollected) {
    ctx.font = '24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const scoreText = `Score: ${score} | Coins: ${coinsCollected}`;
    ctx.fillText(scoreText, 10, 10);
  }

  drawGameOver(ctx, finalScore, finalCoins) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', this.canvasWidth / 2, this.canvasHeight / 2 - 80);

    ctx.font = '28px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Final Score: ${finalScore}`, this.canvasWidth / 2, this.canvasHeight / 2 - 20);
    ctx.fillText(`Coins Collected: ${finalCoins}`, this.canvasWidth / 2, this.canvasHeight / 2 + 20);

    const buttonWidth = 120;
    const buttonHeight = 50;
    const buttonX = this.canvasWidth / 2 - buttonWidth / 2;
    const buttonY = this.canvasHeight / 2 + 80;

    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RESTART', this.canvasWidth / 2, buttonY + buttonHeight / 2);

    this.restartButtonBounds = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight
    };
  }

  drawUI(ctx, gameState) {
    this.drawScore(ctx, gameState.score, gameState.coinsCollected);
  }

  getRestartButtonBounds() {
    return this.restartButtonBounds;
  }
}

export { UIManager };