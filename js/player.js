class Player {
  constructor(startLane, canvasWidth, canvasHeight) {
    if (![0, 1, 2].includes(startLane)) {
      throw new Error('Lane must be 0, 1, or 2');
    }
    
    this.lane = startLane;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.width = 40;
    this.height = 40;
    this.radius = 20;
    this.y = canvasHeight - 60;
    this.targetLane = startLane;
    this.animationStartTime = null;
    this.animationDuration = 200;
    this.startX = this._getLaneX(startLane);
    this.x = this.startX;
  }

  _getLaneX(lane) {
    const laneWidth = this.canvasWidth / 3;
    return (lane + 0.5) * laneWidth;
  }

  setLane(laneIndex) {
    if (![0, 1, 2].includes(laneIndex)) {
      throw new Error('Lane must be 0, 1, or 2');
    }
    
    if (laneIndex === this.lane && this.animationStartTime === null) {
      return;
    }
    
    this.targetLane = laneIndex;
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

  getCollisionBox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.width,
      height: this.height
    };
  }

  draw(ctx) {
    this._updateAnimation();
    
    // Draw player body (purple circle with radius 20)
    ctx.fillStyle = '#9932cc';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw left eye white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x - 7, this.y - 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw right eye white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x + 7, this.y - 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw left pupil (black)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(this.x - 7, this.y - 5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw right pupil (black)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(this.x + 7, this.y - 5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export { Player };