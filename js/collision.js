/**
 * Checks if player collides with any obstacle using AABB collision detection.
 * @param {Object} playerBox - Player bounding box with {x, y, width, height}
 * @param {Array} obstacles - Array of obstacle objects with {x, y, width, height}
 * @returns {number} Index of first colliding obstacle or -1 if no collision
 */
function checkPlayerObstacle(playerBox, obstacles) {
  if (!playerBox || !obstacles || obstacles.length === 0) {
    return -1;
  }

  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    if (aabbCollision(playerBox, obstacle)) {
      return i;
    }
  }

  return -1;
}

/**
 * Checks if player collides with any coin using circle-to-box collision detection.
 * @param {Object} playerBox - Player bounding box with {x, y, width, height}
 * @param {Array} coins - Array of coin objects with {x, y, radius}
 * @returns {number} Index of first colliding coin or -1 if no collision
 */
function checkPlayerCoin(playerBox, coins) {
  if (!playerBox || !coins || coins.length === 0) {
    return -1;
  }

  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    if (circleBoxCollision(coin, playerBox)) {
      return i;
    }
  }

  return -1;
}

/**
 * Checks if two axis-aligned bounding boxes overlap (AABB collision).
 * @param {Object} box1 - First box with {x, y, width, height}
 * @param {Object} box2 - Second box with {x, y, width, height}
 * @returns {boolean} True if boxes overlap
 */
function aabbCollision(box1, box2) {
  if (!box1 || !box2) {
    return false;
  }

  const box1Right = box1.x + box1.width;
  const box1Bottom = box1.y + box1.height;
  const box2Right = box2.x + box2.width;
  const box2Bottom = box2.y + box2.height;

  return (
    box1.x < box2Right &&
    box1Right > box2.x &&
    box1.y < box2Bottom &&
    box1Bottom > box2.y
  );
}

/**
 * Checks if a circle overlaps with an axis-aligned bounding box.
 * Uses closest point on rectangle to circle center algorithm.
 * @param {Object} circle - Circle with {x, y, radius}
 * @param {Object} rect - Rectangle with {x, y, width, height}
 * @returns {boolean} True if circle and rectangle overlap
 */
function circleBoxCollision(circle, rect) {
  if (!circle || !rect) {
    return false;
  }

  const rectRight = rect.x + rect.width;
  const rectBottom = rect.y + rect.height;

  // Find the closest point on the rectangle to the circle's center
  const closestX = Math.max(rect.x, Math.min(circle.x, rectRight));
  const closestY = Math.max(rect.y, Math.min(circle.y, rectBottom));

  // Calculate distance between circle center and closest point
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // Collision if distance is less than or equal to radius
  return distanceSquared <= circle.radius * circle.radius;
}
