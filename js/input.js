/**
 * Input System
 * Handles keyboard and touch input for player movement
 */

(function() {
  let inputState = {
    leftPressed: false,
    rightPressed: false,
    upPressed: false,
    downPressed: false
  };

  /**
   * Setup input handlers
   */
  window.setupInput = function() {
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Touch events for mobile
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchend', handleTouchEnd, false);
  };

  /**
   * Handle keyboard down events
   */
  function handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        inputState.leftPressed = true;
        event.preventDefault();
        break;
      case 'd':
      case 'arrowright':
        inputState.rightPressed = true;
        event.preventDefault();
        break;
      case ' ':
        event.preventDefault();
        break;
    }
    updatePlayerMovement();
  }

  /**
   * Handle keyboard up events
   */
  function handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        inputState.leftPressed = false;
        break;
      case 'd':
      case 'arrowright':
        inputState.rightPressed = false;
        break;
    }
    updatePlayerMovement();
  }

  /**
   * Handle touch start events
   */
  function handleTouchStart(event) {
    const touchX = event.touches[0].clientX;
    const screenWidth = window.innerWidth;

    if (touchX < screenWidth / 3) {
      inputState.leftPressed = true;
    } else if (touchX > (2 * screenWidth) / 3) {
      inputState.rightPressed = true;
    }
    updatePlayerMovement();
  }

  /**
   * Handle touch end events
   */
  function handleTouchEnd(event) {
    inputState.leftPressed = false;
    inputState.rightPressed = false;
    updatePlayerMovement();
  }

  /**
   * Update player movement based on input state
   */
  function updatePlayerMovement() {
    if (!window.player) {
      return;
    }

    if (inputState.leftPressed && !inputState.rightPressed) {
      window.changePlayerLane(-1);
    } else if (inputState.rightPressed && !inputState.leftPressed) {
      window.changePlayerLane(1);
    }
  }

  /**
   * Get current input state
   */
  window.getInputState = function() {
    return Object.assign({}, inputState);
  };
})();
