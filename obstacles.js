class Obstacle {
  constructor() {
    this.width = 60;
    this.height = 40;
    this.speed = 6;
    this.lane = Math.floor(Math.random() * 3);
    this.setPosition();
  }

  setPosition() {
    const laneWidth = 800 / 3;
    this.x = this.lane * laneWidth + (laneWidth - this.width) / 2;
    this.y = -this.height;
  }

  update() {
    this.y += this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}