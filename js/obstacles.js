/**
 * Obstacles System
 * Manages obstacle spawning, movement, and collision detection
 */

(function() {
  // Initialize global obstacles array
  window.obstacles = [];

  const OBSTACLE_CONFIG = {
    WIDTH: 1.5,
    HEIGHT: 1.5,
    DEPTH: 1.5,
    SPEED: 0.25,
    SPAWN_Z: -100,
    LANES: [-3, 0, 3],
    REMOVE_THRESHOLD: 15,
    COLOR: 0xFF4444
  };

  /**
   * Create a single obstacle mesh
   */
  function createObstacle() {
    if (!window.scene) {
      console.error('Scene not initialized. Cannot create obstacle.');
      return null;
    }

    // Create obstacle box
    const obstacle = BABYLON.MeshBuilder.CreateBox('obstacle', {
      width: OBSTACLE_CONFIG.WIDTH,
      height: OBSTACLE_CONFIG.HEIGHT,
      depth: OBSTACLE_CONFIG.DEPTH
    }, window.scene);

    // Create red material
    const redMaterial = new BABYLON.StandardMaterial('obstacleMaterial', window.scene);
    redMaterial.diffuse = BABYLON.Color3.FromHexString('#FF4444');
    redMaterial.emissiveColor = new BABYLON.Color3(0.3, 0, 0);
    obstacle.material = redMaterial;

    // Set random lane position
    const randomLane = OBSTACLE_CONFIG.LANES[Math.floor(Math.random() * OBSTACLE_CONFIG.LANES.length)];
    obstacle.position.x = randomLane;
    obstacle.position.z = OBSTACLE_CONFIG.SPAWN_Z;
    obstacle.position.y = 1;

    // Add properties for game logic
    obstacle.velocity = OBSTACLE_CONFIG.SPEED;
    obstacle.mesh = obstacle; // Reference to self

    return obstacle;
  }

  /**
   * Spawn a new obstacle
   */
  window.spawnObstacle = function() {
    const newObstacle = createObstacle();
    if (newObstacle) {
      window.obstacles.push({
        mesh: newObstacle,
        velocity: OBSTACLE_CONFIG.SPEED
      });
    }
  };

  /**
   * Update obstacles each frame
   * @param {number} deltaTime - Time since last frame
   */
  window.updateObstacles = function(deltaTime) {
    if (!window.obstacles || !window.gameState) {
      return;
    }

    // Increase spawn rate with difficulty
    const spawnInterval = Math.max(
      20,
      60 - Math.floor(window.gameState.frameCount / 100)
    );

    // Spawn obstacles based on interval
    if (window.gameState.frameCount % spawnInterval === 0) {
      window.spawnObstacle();
    }

    // Update each obstacle
    for (let i = window.obstacles.length - 1; i >= 0; i--) {
      const obstacle = window.obstacles[i];

      if (!obstacle || !obstacle.mesh) {
        continue;
      }

      // Move obstacle toward camera
      const speedMultiplier = window.gameState.speed || 1.0;
      obstacle.mesh.position.z += obstacle.velocity * speedMultiplier;

      // Remove obstacle if it has passed the player
      if (obstacle.mesh.position.z > OBSTACLE_CONFIG.REMOVE_THRESHOLD) {
        obstacle.mesh.dispose();
        window.obstacles.splice(i, 1);
      }
    }
  };

  /**
   * Get all obstacles
   */
  window.getObstacles = function() {
    return window.obstacles;
  };

  /**
   * Clear all obstacles (useful for game reset)
   */
  window.clearObstacles = function() {
    if (window.obstacles) {
      for (let obstacle of window.obstacles) {
        if (obstacle.mesh) {
          obstacle.mesh.dispose();
        }
      }
      window.obstacles = [];
    }
  };
})();
