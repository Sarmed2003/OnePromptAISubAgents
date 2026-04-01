// Input handler for player movement
// Manages keyboard input with debouncing to prevent spam

const INPUT_DEBOUNCE_MS = 100;
let lastInputTime = 0;

/**
 * Handles keyboard input for player movement.
 * Listens for ArrowLeft, ArrowRight, A, and D keys.
 * Debounces input to prevent rapid lane switching.
 * Prevents default page scroll behavior for arrow keys.
 */
function handleInput(event) {
  // Check if event is a keyboard event with a key property
  if (!event || !event.key) {
    return;
  }

  const key = event.key.toLowerCase();
  let direction = null;

  // Determine direction based on key pressed
  if (key === 'arrowleft' || key === 'a') {
    direction = -1; // Move left
  } else if (key === 'arrowright' || key === 'd') {
    direction = 1; // Move right
  }

  // If no relevant key was pressed, return early
  if (direction === null) {
    return;
  }

  // Prevent default page scroll behavior for arrow keys
  if (key === 'arrowleft' || key === 'arrowright') {
    event.preventDefault();
  }

  // Check debounce timer
  const currentTime = Date.now();
  if (currentTime - lastInputTime < INPUT_DEBOUNCE_MS) {
    return; // Input debounced, ignore this input
  }

  // Update last input time
  lastInputTime = currentTime;

  // Call player's switchLane method if it exists
  if (window.player && typeof window.player.switchLane === 'function') {
    window.player.switchLane(direction);
  }
}

// Export the handleInput function to the window object
window.handleInput = handleInput;

// Set up event listeners for keyboard input
document.addEventListener('keydown', handleInput);
