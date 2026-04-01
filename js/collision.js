class CollisionDetector {
  /**
   * Checks if player collides with any obstacle using AABB collision detection.
   * @param {Object} player - Player object with {x, y, width, height}
   * @param {Array} obstacles - Array of obstacle objects with {x, y, width, height}
   * @returns {Object|null} First colliding obstacle or null if no collision
   */
  checkPlayerObstacleCollision(player, obstacles) {
    if (!player || !obstacles || obstacles.length === 0) {
      return null;
    }

    for (const obstacle of obstacles) {
      if (this.aabbOverlap(player, obstacle)) {
        return obstacle;
      }
    }

    return null;
  }

  /**
   * Checks if player collides with any coins using circle-rectangle collision detection.
   * @param {Object} player - Player object with {x, y, width, height}
   * @param {Array} coins - Array of coin objects with {x, y, radius}
   * @returns {Array} Array of indices of colliding coins
   */
  checkPlayerCoinCollision(player, coins) {
    if (!player || !coins || coins.length === 0) {
      return [];
    }

    const collidingIndices = [];
    const playerBounds = this.getPlayerBounds(player);

    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      if (this.circleRectangleOverlap(coin, playerBounds)) {
        collidingIndices.push(i);
      }
    }

    return collidingIndices;
  }

  /**
   * Gets the bounding box for the player.
   * Player position (x, y) refers to center of circle.
   * Bounds are x-20 to x+20, y-20 to y+20.
   * @param {Object} player - Player object with {x, y}
   * @returns {Object} Bounding box with {x, y, width, height}
   */
  getPlayerBounds(player) {
    if (!player) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const margin = 20;
    return {
      x: player.x - margin,
      y: player.y - margin,
      width: margin * 2,
      height: margin * 2
    };
  }

  /**
   * Checks if two axis-aligned bounding boxes overlap.
   * @param {Object} box1 - First box with {x, y, width, height}
   * @param {Object} box2 - Second box with {x, y, width, height}
   * @returns {boolean} True if boxes overlap
   */
  aabbOverlap(box1, box2) {
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
  circleRectangleOverlap(circle, rect) {
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
}

export default CollisionDetector;
