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

  drawPlayer(player) {
    player.render(this.ctx);
  }

  drawObstacles(obstacles) {
    for (const obstacle of obstacles) {
      obstacle.render(this.ctx);
    }
  }

  drawCoins(coins) {
    for (const coin of coins) {
      coin.render(this.ctx);
    }
  }

  render(player, obstacles, coins) {
    this.clear();
    this.drawLaneMarkers();
    this.drawPlayer(player);
    this.drawObstacles(obstacles);
    this.drawCoins(coins);
  }
}

export default Renderer;
