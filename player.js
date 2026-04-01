class Player {
  constructor() {
    this.laneIndex = 1; // Current lane (0, 1, or 2)
    this.lanePositions = [150, 380, 610]; // X positions for each lane
    this.x = this.lanePositions[this.laneIndex];
    this.y = 500;
    this.width = 40;
    this.height = 40;
    this.speed = 100; // milliseconds for lane transition
    
    // Animation state
    this.targetLaneIndex = this.laneIndex;
    this.transitionStartTime = null;
    this.isTransitioning = false;
  }

  switchLane(direction) {
    // direction: 1 for right, -1 for left
    const newLaneIndex = this.laneIndex + direction;
    
    // Clamp to valid lane range (0-2)
    if (newLaneIndex < 0 || newLaneIndex > 2) {
      return;
    }
    
    this.targetLaneIndex = newLaneIndex;
    this.transitionStartTime = Date.now();
    this.isTransitioning = true;
  }

  update() {
    if (!this.isTransitioning) {
      return;
    }
    
    const now = Date.now();
    const elapsed = now - this.transitionStartTime;
    const progress = Math.min(elapsed / this.speed, 1);
    
    // Interpolate between current lane position and target lane position
    const currentLaneX = this.lanePositions[this.laneIndex];
    const targetLaneX = this.lanePositions[this.targetLaneIndex];
    this.x = currentLaneX + (targetLaneX - currentLaneX) * progress;
    
    // When transition completes, update lane index and stop transitioning
    if (progress >= 1) {
      this.laneIndex = this.targetLaneIndex;
      this.x = this.lanePositions[this.laneIndex];
      this.isTransitioning = false;
    }
  }

  render(ctx) {
    // Draw purple circle (body)
    ctx.fillStyle = '#9D4EDD';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw left eye (white)
    const eyeRadius = 5;
    const eyeOffsetX = -8;
    const eyeOffsetY = -8;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(this.x + eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw right eye (white)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(this.x - eyeOffsetX, this.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.Player = Player;
