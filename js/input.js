class InputHandler {
  constructor() {
    this.callback = null;
    this.lastDirection = null;
    this.lastInputTime = 0;
    this.debounceDelay = 100;
    this.touchStartX = null;
    this.touchStartY = null;
    this.minSwipeDistance = 50;
  }

  init(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    this.callback = callback;
    this.attachKeyboardListeners();
    this.attachTouchListeners();
  }

  attachKeyboardListeners() {
    document.addEventListener('keydown', (event) => {
      const direction = this.getDirectionFromKey(event.code);
      if (direction) {
        event.preventDefault();
        this.handleInput(direction);
      }
    });
  }

  getDirectionFromKey(keyCode) {
    switch (keyCode) {
      case 'ArrowLeft':
      case 'KeyA':
        return 'left';
      case 'ArrowRight':
      case 'KeyD':
        return 'right';
      default:
        return null;
    }
  }

  attachTouchListeners() {
    document.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (event) => {
      if (this.touchStartX === null) {
        return;
      }
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;

      // Only process horizontal swipes (ignore vertical movement)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > this.minSwipeDistance) {
          this.handleInput('right');
          this.touchStartX = null;
        } else if (deltaX < -this.minSwipeDistance) {
          this.handleInput('left');
          this.touchStartX = null;
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      this.touchStartX = null;
      this.touchStartY = null;
    }, { passive: true });
  }

  handleInput(direction) {
    const now = Date.now();
    if (now - this.lastInputTime < this.debounceDelay) {
      return;
    }
    this.lastInputTime = now;
    this.lastDirection = direction;
    if (this.callback) {
      this.callback(direction);
    }
  }

  getLastInput() {
    return this.lastDirection;
  }
}

export default InputHandler;