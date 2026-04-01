class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.speed = 4;
    this.collected = false;
  }

  update() {
    this.y += this.speed;
  }

  isOffScreen() {
    return this.y > 600;
  }

  isCollected() {
    return this.collected;
  }

  setCollected() {
    this.collected = true;
  }

  draw(ctx) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.Coin = Coin;
window.coins = [];

let spawnCounter = 0;
let lastLane = -1;

function spawnCoin() {
  spawnCounter++;

  if (spawnCounter >= 120) {
    spawnCounter = 0;

    let lane;
    do {
      lane = Math.floor(Math.random() * 3);
    } while (lane === lastLane && window.coins.length > 0);
    lastLane = lane;

    const laneWidth = 800 / 3;
    const x = lane * laneWidth + (laneWidth - 20) / 2;
    const y = -20;

    const coin = new Coin(x, y);
    window.coins.push(coin);
  }
}

window.spawnCoin = spawnCoin;

window.updateCoins = function() {
  for (let i = window.coins.length - 1; i >= 0; i--) {
    window.coins[i].update();

    if (window.coins[i].isOffScreen() || window.coins[i].isCollected()) {
      window.coins.splice(i, 1);
    }
  }
};

window.drawCoins = function(ctx) {
  for (let coin of window.coins) {
    coin.draw(ctx);
  }
};