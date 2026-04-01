/**
 * Obstacles class manages obstacle spawning, updating, and rendering
 */
class Obstacles {
  /**
   * Creates an Obstacles manager
   */
  constructor() {
    this.obstacles = [];
  }

  /**
   * Spawns a new obstacle in the specified lane at the top of the screen
   * @param {number} lane - The lane number (0, 1, or 2)
   * @param {number} canvasWidth - The width of the canvas
   * @param {number} canvasHeight - The height of the canvas
   */
  spawn(lane, canvasWidth, canvasHeight) {
    // Calculate obstacle width: canvasWidth/3 - 10px padding
    const obstacleWidth = canvasWidth / 3 - 10;
    const obstacleHeight = 40;
    
    // Calculate x position based on lane
    // Distribute lanes evenly across canvas width
    const laneWidth = canvasWidth / 3;
    const x = lane * laneWidth + 5; // 5px padding from left of lane
    const y = 0; // Start at top of screen
    
    const obstacle = {
      x: x,
      y: y,
      width: obstacleWidth,
      height: obstacleHeight,
      lane: lane
    };
    
    this.obstacles.push(obstacle);
  }

  /**
   * Updates all obstacles by moving them down by the specified speed
   * Removes obstacles that have moved off-screen
   * @param {number} speed - The speed in pixels per frame to move obstacles down
   * @param {number} canvasHeight - The height of the canvas (optional, for cleanup)
   */
  update(speed, canvasHeight) {
    // Move all obstacles down
    for (let i = 0; i < this.obstacles.length; i++) {
      this.obstacles[i].y += speed;
    }
    
    // Remove obstacles that have moved off-screen
    if (canvasHeight !== undefined) {
      this.obstacles = this.obstacles.filter(obstacle => obstacle.y < canvasHeight);
    }
  }

  /**
   * Draws all obstacles on the canvas as red rectangles
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   */
  draw(ctx) {
    ctx.fillStyle = 'red';
    for (let obstacle of this.obstacles) {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  }

  /**
   * Returns the array of current obstacles
   * @returns {Array} Array of obstacle objects
   */
  getObstacles() {
    return this.obstacles;
  }

  /**
   * Removes an obstacle at the specified index
   * @param {number} index - The index of the obstacle to remove
   */
  removeObstacle(index) {
    if (index >= 0 && index < this.obstacles.length) {
      this.obstacles.splice(index, 1);
    }
  }
}

// Export class for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Obstacles;
}
