class Input {
  constructor() {
    this.laneChangeCallback = null;
    this.currentLane = 1;
    this.touchStartX = null;
    this.touchStartY = null;
    this.minSwipeDistance = 50;
    this.lastInputTime = 0;
    this.debounceDelay = 100;
  }

  handleKeyDown(event) {
    let direction = null;

    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        direction = -1;
        break;
      case 'ArrowRight':
      case 'KeyD':
        direction = 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.processLaneChange(direction);
  }

  handleTouchStart(event) {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  handleTouchEnd(event) {
    if (this.touchStartX === null || this.touchStartY === null) {
      this.touchStartX = null;
      this.touchStartY = null;
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    this.touchStartX = null;
    this.touchStartY = null;

    // Only process horizontal swipes (ignore vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) >= this.minSwipeDistance) {
      const direction = deltaX > 0 ? 1 : -1;
      this.processLaneChange(direction);
    }
  }

  processLaneChange(direction) {
    const now = Date.now();
    if (now - this.lastInputTime < this.debounceDelay) {
      return;
    }
    this.lastInputTime = now;

    const newLane = this.currentLane + direction;
    if (this.laneChangeCallback) {
      this.laneChangeCallback(newLane);
    }
  }

  onLaneChange(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    this.laneChangeCallback = callback;
  }

  attachListeners() {
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    document.addEventListener('touchstart', (event) => this.handleTouchStart(event), { passive: true });
    document.addEventListener('touchend', (event) => this.handleTouchEnd(event), { passive: true });
  }
}
