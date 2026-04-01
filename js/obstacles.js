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
   * @param {number} speed - Speed in pixels per frame
   */
  update(speed) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].y += speed;
      
      // Remove obstacles that have moved off-screen
      if (this.obstacles[i].y > 650) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  /**
   * Draws all obstacles on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  draw(ctx) {
    for (const obstacle of this.obstacles) {
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  }

  /**
   * Gets all obstacles
   * @returns {Array} Array of obstacle objects
   */
  getObstacles() {
    return this.obstacles;
  }

  /**
   * Removes an obstacle at the specified index
   * @param {number} index - Index of obstacle to remove
   */
  removeObstacle(index) {
    if (index >= 0 && index < this.obstacles.length) {
      this.obstacles.splice(index, 1);
    }
  }
}
