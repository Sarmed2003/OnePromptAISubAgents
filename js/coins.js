class Coin {
  constructor(lane, speed) {
    this.lane = lane;
    this.speed = speed;
    this.radius = 15;
    this.x = lane * 100 + 50;
    this.y = -30;
  }

  update() {
    this.y += this.speed;
  }

  isOffScreen() {
    return this.y > 650;
  }

  render(ctx) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', this.x, this.y);
  }
}

class CoinManager {
  constructor() {
    this.coins = [];
    this.collected = 0;
    this.spawnRate = 120;
    this.frameCounter = 0;
  }

  spawn(lane) {
    const speed = 3 + (this.gameTime || 0) / 5000;
    const coin = new Coin(lane, speed);
    this.coins.push(coin);
  }

  update(gameTime) {
    this.gameTime = gameTime;
    this.frameCounter++;

    if (this.frameCounter >= this.spawnRate) {
      const randomLane = Math.floor(Math.random() * 8);
      this.spawn(randomLane);
      this.frameCounter = 0;
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      this.coins[i].update();
      if (this.coins[i].isOffScreen()) {
        this.coins.splice(i, 1);
      }
    }
  }

  getCoins() {
    return this.coins;
  }

  render(ctx) {
    for (const coin of this.coins) {
      coin.render(ctx);
    }
  }

  collectCoin(coinIndex) {
    if (coinIndex >= 0 && coinIndex < this.coins.length) {
      this.coins.splice(coinIndex, 1);
      this.collected++;
    }
  }
}

export { Coin, CoinManager };
