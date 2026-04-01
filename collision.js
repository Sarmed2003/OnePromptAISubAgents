/**
 * Collision Detection Module
 * Handles AABB collision detection for player-obstacle and player-coin interactions
 */

/**
 * Checks if player collides with any obstacle using AABB collision detection
 * @param {Object} player - Player object with x, y, width, height properties
 * @param {Array} obstacles - Array of obstacle objects with x, y, width, height properties
 * @returns {boolean} True if player overlaps any obstacle, false otherwise
 */
function checkPlayerObstacleCollision(player, obstacles) {
  if (!player || !obstacles || obstacles.length === 0) {
    return false;
  }

  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    if (isAABBOverlapping(player, obstacle)) {
      return true;
    }
  }

  return false;
}

/**
 * Removes obstacles that have moved offscreen (below canvas)
 * @param {Array} obstacles - Array of obstacle objects with y and height properties
 * @returns {Array} Filtered array with offscreen obstacles removed
 */
function removeCollided(obstacles) {
  if (!obstacles || obstacles.length === 0) {
    return obstacles;
  }

  // Assuming canvas height is 600 (standard for this game)
  // Remove obstacles that have completely passed the bottom of the screen
  const CANVAS_HEIGHT = 600;
  return obstacles.filter(obstacle => obstacle.y < CANVAS_HEIGHT);
}

/**
 * Checks which coins the player has collected
 * Uses a more generous hitbox for coins (easier to collect than obstacles to hit)
 * @param {Object} player - Player object with x, y, width, height properties
 * @param {Array} coins - Array of coin objects with x, y, width, height properties
 * @returns {Array} Array of collected coin indices
 */
function checkPlayerCoinCollision(player, coins) {
  if (!player || !coins || coins.length === 0) {
    return [];
  }

  const collectedIndices = [];

  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    // Coins have a smaller, centered hitbox that's more forgiving
    // Create an expanded hitbox around the coin for easier collection
    const coinHitbox = {
      x: coin.x + (coin.width * 0.1),
      y: coin.y + (coin.height * 0.1),
      width: coin.width * 0.8,
      height: coin.height * 0.8
    };

    if (isAABBOverlapping(player, coinHitbox)) {
      collectedIndices.push(i);
    }
  }

  return collectedIndices;
}

/**
 * Removes collected coins from the array and returns the count
 * @param {Array} coins - Array of coin objects
 * @param {Array} collectedIndices - Array of indices of collected coins
 * @returns {Object} Object with updated coins array and count of removed coins
 */
function removeCoinCollected(coins, collectedIndices) {
  if (!coins || !collectedIndices || collectedIndices.length === 0) {
    return {
      coins: coins || [],
      count: 0
    };
  }

  // Sort indices in descending order to remove from end first
  const sortedIndices = [...collectedIndices].sort((a, b) => b - a);
  const count = sortedIndices.length;

  // Remove duplicates and filter out of bounds indices
  const uniqueIndices = [...new Set(sortedIndices)].filter(
    index => index >= 0 && index < coins.length
  );

  // Remove coins in reverse order to maintain correct indices
  let updatedCoins = [...coins];
  for (const index of uniqueIndices) {
    updatedCoins.splice(index, 1);
  }

  return {
    coins: updatedCoins,
    count: uniqueIndices.length
  };
}

/**
 * Helper function: Checks if two AABB rectangles overlap
 * Uses standard AABB collision formula
 * @param {Object} rect1 - Rectangle with x, y, width, height
 * @param {Object} rect2 - Rectangle with x, y, width, height
 * @returns {boolean} True if rectangles overlap, false otherwise
 */
function isAABBOverlapping(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}