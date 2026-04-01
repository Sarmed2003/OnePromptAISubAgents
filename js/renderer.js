class Renderer {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.backgroundColor = '#1a1f2e';
  }

  clear() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0f1419');
    gradient.addColorStop(1, '#1a1f2e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawLaneMarkers() {
    const laneHeight = this.canvas.height / 4;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([10, 10]);

    for (let i = 1; i < 4; i++) {
      const y = i * laneHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]);
  }

  drawObstacles(obstacles) {
    this.ctx.fillStyle = '#ff4444';
    for (const obstacle of obstacles) {
      this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  }

  drawCoins(coins) {
    this.ctx.fillStyle = '#ffff00';
    for (const coin of coins) {
      this.ctx.beginPath();
      this.ctx.arc(coin.x + coin.radius, coin.y + coin.radius, coin.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawPlayer(player) {
    this.ctx.save();
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.fillRect(player.x, player.y, player.width, player.height);
    
    this.ctx.fillStyle = '#000000';
    const eyeRadius = 3;
    const eyeY = player.y + 6;
    this.ctx.beginPath();
    this.ctx.arc(player.x + 6, eyeY, eyeRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(player.x + player.width - 6, eyeY, eyeRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  draw(ctx, player, obstacles, coins, gameState) {
    this.drawBackground();
    this.drawLaneMarkers();
    this.drawObstacles(obstacles);
    this.drawCoins(coins);
    this.drawPlayer(player);
  }
}

export default Renderer;