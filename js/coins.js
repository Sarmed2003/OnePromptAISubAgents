class Coins {
  constructor() {
    this.coins = [];
    this.spawnCounter = 0;
    this.spawnRate = 5; // Spawn every 5 frames (~20% spawn rate at 60fps)
  }

  spawn(lane, canvasWidth, canvasHeight) {
    const coin = {
      x: lane * (canvasWidth / 8) + (canvasWidth / 16),
      y: 0,
      radius: 10,
      lane: lane
    };
    this.coins.push(coin);
  }

  update(speed) {
    // Move all coins down
    for (let i = this.coins.length - 1; i >= 0; i--) {
      this.coins[i].y += speed;
      
      // Remove coins that have gone off screen
      if (this.coins[i].y - this.coins[i].radius > 650) {
        this.coins.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const coin of this.coins) {
      // Draw yellow circle
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw border to make it distinct
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  getCoins() {
    return this.coins;
  }

  removeCoin(index) {
    if (index >= 0 && index < this.coins.length) {
      this.coins.splice(index, 1);
    }
  }
}

export { Coins };
