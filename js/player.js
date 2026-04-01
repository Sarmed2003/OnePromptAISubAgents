class Player {
  constructor(lane = 1) {
    if (![0, 1, 2].includes(lane)) {
      throw new Error('Lane must be 0, 1, or 2');
    }
    
    this.lane = lane;
    this.width = 40;
    this.height = 40;
    this.speed = 5;
    this.y = 550;
    this.targetLane = lane;
    this.animationStartTime = null;
    this.animationDuration = 200; // milliseconds
    this.startX = this._getLaneX(lane);
    this.x = this.startX;
  }

  _getLaneX(lane) {
    const lanePositions = {
      0: 100,   // left
      1: 400,   // center
      2: 700    // right
    };
    return lanePositions[lane];
  }

  moveTo(newLane) {
    if (![0, 1, 2].includes(newLane)) {
      throw new Error('Lane must be 0, 1, or 2');
    }
    
    if (newLane === this.lane && this.animationStartTime === null) {
      return;
    }
    
    this.targetLane = newLane;
    this.animationStartTime = Date.now();
    this.startX = this.x;
  }

  _updateAnimation() {
    if (this.animationStartTime === null) {
      return;
    }
    
    const elapsed = Date.now() - this.animationStartTime;
    
    if (elapsed >= this.animationDuration) {
      this.lane = this.targetLane;
      this.x = this._getLaneX(this.targetLane);
      this.animationStartTime = null;
      return;
    }
    
    const progress = elapsed / this.animationDuration;
    const targetX = this._getLaneX(this.targetLane);
    this.x = this.startX + (targetX - this.startX) * progress;
  }

  getPosition() {
    return {
      x: this.x,
      y: this.y,
      lane: this.lane
    };
  }

  render(ctx) {
    this._updateAnimation();
    
    // Draw player body (purple circle with radius 20)
    ctx.fillStyle = '#9932cc';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw left eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x - 7, this.y - 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw right eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x + 7, this.y - 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export { Player };