/**
 * Obstacle class represents a single obstacle on the canvas
 */
class Obstacle {
  /**
   * Creates an obstacle in the specified lane at the top of the canvas
   * @param {number} lane - The lane number (0, 1, or 2)
   * @param {number} speed - The speed in pixels per frame
   */
  constructor(lane, speed) {
    this.lane = lane;
    this.speed = speed;
    this.width = 60;
    this.height = 50;
    
    // Calculate x position based on lane (assuming 3 lanes, canvas width ~180)
    // Lane 0: x=10, Lane 1: x=60, Lane 2: x=110
    this.x = 10 + lane * 50;
    this.y = -50; // Start above the canvas
  }

  /**
   * Updates the obstacle position by moving it down
   */
  update() {
    this.y += this.speed;
  }

  /**
   * Checks if the obstacle has left the canvas
   * @returns {boolean} True if obstacle is off-screen
   */
  isOffScreen() {
    return this.y > 650;
  }

  /**
   * Renders the obstacle as a red rectangle
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   */
  render(ctx) {
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

/**
 * ObstacleManager class manages the creation and lifecycle of obstacles
 */
class ObstacleManager {
  /**
   * Creates an obstacle manager
   */
  constructor() {
    this.obstacles = [];
    this.spawnRate = 60; // Spawn one obstacle every 60 frames (~1 per second at 60 FPS)
    this.frameCounter = 0;
    this.gameTime = 0; // Time in milliseconds since game start
  }

  /**
   * Spawns a new obstacle in the specified lane
   * @param {number} lane - The lane number (0, 1, or 2)
   */
  spawn(lane) {
    // Calculate speed: base 3 + (gameTime / 5000) for gradual difficulty increase
    const speed = 3 + (this.gameTime / 5000);
    const obstacle = new Obstacle(lane, speed);
    this.obstacles.push(obstacle);
  }

  /**
   * Updates all obstacles and removes off-screen ones
   * Handles spawning of new obstacles based on spawn rate
   * @param {number} deltaTime - Time elapsed since last frame in milliseconds
   */
  update(deltaTime) {
    // Update game time for speed calculation
    this.gameTime += deltaTime;
    
    // Increment frame counter for spawn rate
    this.frameCounter++;
    
    // Spawn a new obstacle if spawn rate is reached
    if (this.frameCounter >= this.spawnRate) {
      this.frameCounter = 0;
      // Spawn in a random lane (0, 1, or 2)
      const randomLane = Math.floor(Math.random() * 3);
      this.spawn(randomLane);
    }
    
    // Update all obstacles
    for (let i = 0; i < this.obstacles.length; i++) {
      this.obstacles[i].update();
    }
    
    // Remove off-screen obstacles
    this.obstacles = this.obstacles.filter(obstacle => !obstacle.isOffScreen());
  }

  /**
   * Gets the array of current obstacles
   * @returns {Obstacle[]} Array of active obstacles
   */
  getObstacles() {
    return this.obstacles;
  }

  /**
   * Renders all obstacles
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
   */
  render(ctx) {
    for (let obstacle of this.obstacles) {
      obstacle.render(ctx);
    }
  }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Obstacle, ObstacleManager };
}
