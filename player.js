class Player {
  constructor() {
    this.width = 40;
    this.height = 40;
    this.speed = 15;
    this.currentLane = 1; // 0 = left, 1 = middle, 2 = right
    this.updatePosition();
  }

  updatePosition() {
    const laneWidth = 800 / 3;
    this.x = this.currentLane * laneWidth + (laneWidth - this.width) / 2;
    this.y = 550; // Near bottom of screen
  }

  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.updatePosition();
    }
  }

  moveRight() {
    if (this.currentLane < 2) {
      this.currentLane++;
      this.updatePosition();
    }
  }

  update() {
    // Player position is controlled by movement input
  }

  draw(ctx) {
    ctx.fillStyle = '#667eea';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}