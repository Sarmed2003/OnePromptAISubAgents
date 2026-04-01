// Scrolling background offset for animation effect
let backgroundScrollOffset = 0;
const BACKGROUND_SCROLL_SPEED = 2;
const BACKGROUND_PATTERN_HEIGHT = 40;

/**
 * Renders the complete game scene to the canvas
 * @param {Object} player - Player object with x, y, radius properties
 * @param {Array} obstacles - Array of obstacle objects with x, y, width, height
 * @param {Array} coins - Array of coin objects with x, y, radius
 * @param {number} score - Current game score
 */
function render(player, obstacles, coins, score) {
  // Ensure canvas context exists
  if (!window.ctx) {
    console.error('Canvas context not available');
    return;
  }

  const ctx = window.ctx;
  const canvas = ctx.canvas;

  // Clear canvas
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw scrolling background pattern
  drawBackground(ctx, canvas);

  // Draw all obstacles
  drawObstacles(ctx, obstacles);

  // Draw all coins
  drawCoins(ctx, coins);

  // Draw player
  drawPlayer(ctx, player);

  // Draw score text
  drawScore(ctx, score);
}

/**
 * Draws the animated background with scrolling pattern
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
function drawBackground(ctx, canvas) {
  // Update scroll offset for animation
  backgroundScrollOffset = (backgroundScrollOffset + BACKGROUND_SCROLL_SPEED) % BACKGROUND_PATTERN_HEIGHT;

  // Draw horizontal stripes for visual interest and scrolling effect
  ctx.fillStyle = '#2a2a2a';
  for (let y = -backgroundScrollOffset; y < canvas.height; y += BACKGROUND_PATTERN_HEIGHT) {
    ctx.fillRect(0, y, canvas.width, BACKGROUND_PATTERN_HEIGHT / 2);
  }

  // Draw subtle grid pattern
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 0.5;
  const gridSize = 50;

  // Vertical grid lines
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Horizontal grid lines
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

/**
 * Draws all obstacles as red rectangles
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} obstacles - Array of obstacle objects
 */
function drawObstacles(ctx, obstacles) {
  ctx.fillStyle = '#cc3333';
  ctx.strokeStyle = '#990000';
  ctx.lineWidth = 2;

  for (const obstacle of obstacles) {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }
}

/**
 * Draws all coins as yellow circles
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} coins - Array of coin objects
 */
function drawCoins(ctx, coins) {
  ctx.fillStyle = '#ffdd33';
  ctx.strokeStyle = '#ccaa00';
  ctx.lineWidth = 2;

  for (const coin of coins) {
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw coin shine/highlight
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath();
    ctx.arc(coin.x - coin.radius * 0.3, coin.y - coin.radius * 0.3, coin.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Reset fill style for next coin
    ctx.fillStyle = '#ffdd33';
  }
}

/**
 * Draws the player as a purple circle with eyes
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Object} player - Player object with x, y, radius
 */
function drawPlayer(ctx, player) {
  // Draw player body (purple circle)
  ctx.fillStyle = '#9933ff';
  ctx.strokeStyle = '#6600cc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw left eye
  const eyeOffsetX = -player.radius * 0.3;
  const eyeOffsetY = -player.radius * 0.25;
  const eyeRadius = player.radius * 0.25;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(player.x + eyeOffsetX, player.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw right eye
  ctx.beginPath();
  ctx.arc(player.x - eyeOffsetX, player.y + eyeOffsetY, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw left pupil
  ctx.fillStyle = '#000000';
  const pupilRadius = eyeRadius * 0.6;
  ctx.beginPath();
  ctx.arc(player.x + eyeOffsetX, player.y + eyeOffsetY, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw right pupil
  ctx.beginPath();
  ctx.arc(player.x - eyeOffsetX, player.y + eyeOffsetY, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws the score text in the top-left corner
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} score - Current game score
 */
function drawScore(ctx, score) {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(`Score: ${score}`, 15, 15);
  ctx.shadowColor = 'transparent';
}

// Export render function to window
window.render = render;
