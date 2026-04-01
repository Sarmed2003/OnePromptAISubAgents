// Input state management
window.inputState = {
  leftPressed: false,
  rightPressed: false,
  spacePressed: false,
  rPressed: false,
  lastLaneSwitchTime: 0,
  laneSwitchCooldown: 150 // milliseconds
};

// Debounce configuration for lane switches
const LANE_SWITCH_DEBOUNCE_MS = 150;

/**
 * Initialize keyboard input listeners
 */
function initializeInput() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

/**
 * Handle key down events
 */
function handleKeyDown(event) {
  // Check if game is over - disable input
  if (window.gameState && window.gameState.isGameOver) {
    return;
  }

  const key = event.key.toLowerCase();
  const code = event.code;

  // Left arrow or A key
  if (code === 'ArrowLeft' || key === 'a') {
    event.preventDefault();
    if (!window.inputState.leftPressed) {
      window.inputState.leftPressed = true;
      debouncedLaneSwitch('left');
    }
  }

  // Right arrow or D key
  if (code === 'ArrowRight' || key === 'd') {
    event.preventDefault();
    if (!window.inputState.rightPressed) {
      window.inputState.rightPressed = true;
      debouncedLaneSwitch('right');
    }
  }

  // Spacebar for pause/resume
  if (code === 'Space') {
    event.preventDefault();
    if (!window.inputState.spacePressed) {
      window.inputState.spacePressed = true;
      if (window.togglePause) {
        window.togglePause();
      }
    }
  }

  // R key for restart
  if (key === 'r') {
    event.preventDefault();
    if (!window.inputState.rPressed) {
      window.inputState.rPressed = true;
      if (window.restartGame) {
        window.restartGame();
      }
    }
  }
}

/**
 * Handle key up events
 */
function handleKeyUp(event) {
  const key = event.key.toLowerCase();
  const code = event.code;

  // Left arrow or A key
  if (code === 'ArrowLeft' || key === 'a') {
    window.inputState.leftPressed = false;
  }

  // Right arrow or D key
  if (code === 'ArrowRight' || key === 'd') {
    window.inputState.rightPressed = false;
  }

  // Spacebar
  if (code === 'Space') {
    window.inputState.spacePressed = false;
  }

  // R key
  if (key === 'r') {
    window.inputState.rPressed = false;
  }
}

/**
 * Debounced lane switch to prevent multiple rapid switches
 */
function debouncedLaneSwitch(direction) {
  const now = Date.now();
  const timeSinceLastSwitch = now - window.inputState.lastLaneSwitchTime;

  if (timeSinceLastSwitch >= window.inputState.laneSwitchCooldown) {
    window.inputState.lastLaneSwitchTime = now;
    if (window.player && window.player.switchLane) {
      window.player.switchLane(direction);
    }
  }
}

/**
 * Disable all input (called when game ends)
 */
function disableInput() {
  window.inputState.leftPressed = false;
  window.inputState.rightPressed = false;
  window.inputState.spacePressed = false;
  window.inputState.rPressed = false;
}

/**
 * Enable input
 */
function enableInput() {
  // Input is re-enabled by checking gameState.isGameOver in keydown handler
}

// Initialize input when this script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeInput);
} else {
  initializeInput();
}
