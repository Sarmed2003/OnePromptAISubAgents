class Obstacle {
  constructor(lane) {
    this.lane = lane;
    this.x = lane * 120 + 40;
    this.y = 0;
    this.width = 40;
    this.height = 40;
    this.speed = 5;
  }

  update() {
    this.y += this.speed;
  }

  isOffScreen() {
    return this.y > 600;
  }
}

window.Obstacle = Obstacle;
window.obstacles = [];

let lastSpawnLane = -1;
let frameCounter = 0;
const SPAWN_INTERVAL = 80;

function spawnObstacle() {
  frameCounter++;

  if (frameCounter >= SPAWN_INTERVAL) {
    frameCounter = 0;

    let randomLane = Math.floor(Math.random() * 3);
    while (randomLane === lastSpawnLane) {
      randomLane = Math.floor(Math.random() * 3);
    }

    lastSpawnLane = randomLane;
    const newObstacle = new Obstacle(randomLane);
    window.obstacles.push(newObstacle);
  }
}

window.spawnObstacle = spawnObstacle;

function updateObstacles() {
  for (let i = window.obstacles.length - 1; i >= 0; i--) {
    window.obstacles[i].update();
    if (window.obstacles[i].isOffScreen()) {
      window.obstacles.splice(i, 1);
    }
  }
}

function renderObstacles(ctx) {
  ctx.fillStyle = 'red';
  for (let obstacle of window.obstacles) {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }
}

window.updateObstacles = updateObstacles;
window.renderObstacles = renderObstacles;