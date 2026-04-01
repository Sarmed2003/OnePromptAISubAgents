// Input handler for player movement
// Manages keyboard input with debouncing to prevent spam

const INPUT_DEBOUNCE_MS = 100;
let lastInputTime = 0;
let keysPressed = {};

/**
 * Handles keyboard input for player movement.
 * Listens for ArrowLeft, ArrowRight, A, and D keys.
 * Debounces input to prevent rapid lane switching.
 * Prevents default page scroll behavior for arrow keys.
 */
function handleKeyDown(event) {
  // Check if event is a keyboard event with a key property
  if (!event || !event.key) {
    return;
  }

  const key = event.key.toLowerCase();
  let direction = null;

  // Determine direction based on key pressed
  if (key === 'arrowleft' || key === 'a') {
    direction = -1; // Move left
    event.preventDefault();
  } else if (key === 'arrowright' || key === 'd') {
    direction = 1; // Move right
    event.preventDefault();
  }

  // If no relevant key was pressed, return early
  if (direction === null) {
    return;
  }

  // Store key state
  keysPressed[key] = true;
}

function handleKeyUp(event) {
  if (!event || !event.key) {
    return;
  }

  const key = event.key.toLowerCase();
  keysPressed[key] = false;
}

/**
 * Update function called each frame to process input
 * Applies debouncing and updates player position
 */
function handleInputUpdate() {
  if (!window.player) {
    return;
  }

  const now = Date.now();
  const canMove = (now - lastInputTime) >= INPUT_DEBOUNCE_MS;

  // Check for left movement
  if ((keysPressed['arrowleft'] || keysPressed['a']) && canMove) {
    window.player.moveLeft();
    lastInputTime = now;
  }

  // Check for right movement
  if ((keysPressed['arrowright'] || keysPressed['d']) && canMove) {
    window.player.moveRight();
    lastInputTime = now;
  }
}

// Attach event listeners when DOM is ready
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}