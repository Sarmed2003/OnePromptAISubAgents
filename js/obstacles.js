// Obstacles module: spawning, movement, and pooling of box obstacles

// Initialize obstacles array and configuration
window.obstacles = [];

const OBSTACLE_CONFIG = {
  COLOR: new BABYLON.Color3(0.5, 0, 0), // Dark red
  SIZE_MIN: 0.8,
  SIZE_MAX: 1.2,
  LANES: [-3, 0, 3],
  SPAWN_Z: -100,
  REMOVAL_Z: 15,
  SPEED: 0.5, // Units per frame
  SPAWN_INTERVAL_MIN: 500, // milliseconds
  SPAWN_INTERVAL_MAX: 1500,
};

let lastSpawnTime = 0;
let nextSpawnInterval = getRandomSpawnInterval();
let obstaclePool = []; // Object pool for reused meshes
let scene = null;
let material = null;

/**
 * Get a random spawn interval in milliseconds
 */
function getRandomSpawnInterval() {
  return OBSTACLE_CONFIG.SPAWN_INTERVAL_MIN +
    Math.random() * (OBSTACLE_CONFIG.SPAWN_INTERVAL_MAX - OBSTACLE_CONFIG.SPAWN_INTERVAL_MIN);
}

/**
 * Create or retrieve an obstacle mesh from the pool
 */
function createObstacle() {
  if (!scene) {
    console.error('Scene not initialized. Call initializeObstacles() first.');
    return null;
  }

  // Ensure material exists
  if (!material) {
    material = new BABYLON.StandardMaterial('obstacleMaterial', scene);
    material.diffuse = OBSTACLE_CONFIG.COLOR;
    material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  }

  let mesh;

  // Try to reuse a mesh from the pool
  if (obstaclePool.length > 0) {
    mesh = obstaclePool.pop();
    mesh.isVisible = true;
  } else {
    // Create a new mesh if pool is empty
    const randomSize = OBSTACLE_CONFIG.SIZE_MIN +
      Math.random() * (OBSTACLE_CONFIG.SIZE_MAX - OBSTACLE_CONFIG.SIZE_MIN);
    mesh = BABYLON.MeshBuilder.CreateBox('obstacle', { size: randomSize }, scene);
    mesh.material = material;
  }

  // Set random lane position
  const randomLane = OBSTACLE_CONFIG.LANES[Math.floor(Math.random() * OBSTACLE_CONFIG.LANES.length)];
  mesh.position.x = randomLane;
  mesh.position.z = OBSTACLE_CONFIG.SPAWN_Z;
  mesh.position.y = 0.5; // Ground level (half of default size)

  // Store metadata for tracking
  mesh.isObstacle = true;
  mesh.spawned = true;

  return mesh;
}

/**
 * Initialize the obstacles system with a reference to the scene
 */
window.initializeObstacles = function(babylonScene) {
  scene = babylonScene;
  window.obstacles = [];
  obstaclePool = [];
  lastSpawnTime = Date.now();
  nextSpawnInterval = getRandomSpawnInterval();
};

/**
 * Spawn a new obstacle and add it to the obstacles array
 */
window.spawnObstacle = function() {
  const obstacle = createObstacle();
  if (obstacle) {
    window.obstacles.push(obstacle);
  }
};

/**
 * Update obstacles: handle spawning and movement
 * Call this once per frame from the game loop
 */
window.updateObstacles = function(deltaTime) {
  if (!scene) return;

  const currentTime = Date.now();

  // Spawn new obstacles based on interval
  if (currentTime - lastSpawnTime >= nextSpawnInterval) {
    window.spawnObstacle();
    lastSpawnTime = currentTime;
    nextSpawnInterval = getRandomSpawnInterval();
  }

  // Move obstacles toward camera and remove those that have passed
  for (let i = window.obstacles.length - 1; i >= 0; i--) {
    const obstacle = window.obstacles[i];

    // Move obstacle toward camera (positive z direction)
    obstacle.position.z += OBSTACLE_CONFIG.SPEED;

    // Remove obstacle if it has passed the player
    if (obstacle.position.z > OBSTACLE_CONFIG.REMOVAL_Z) {
      obstacle.isVisible = false;
      obstaclePool.push(obstacle);
      window.obstacles.splice(i, 1);
    }
  }
};

/**
 * Set the spawn rate (speed multiplier for difficulty scaling)
 * @param {number} multiplier - Multiplier for spawn speed (1.0 = normal, 2.0 = twice as fast)
 */
window.setObstacleSpawnRate = function(multiplier) {
  if (multiplier > 0) {
    OBSTACLE_CONFIG.SPAWN_INTERVAL_MIN = 500 / multiplier;
    OBSTACLE_CONFIG.SPAWN_INTERVAL_MAX = 1500 / multiplier;
  }
};

/**
 * Set the movement speed of obstacles
 * @param {number} speed - Speed in units per frame
 */
window.setObstacleSpeed = function(speed) {
  if (speed > 0) {
    OBSTACLE_CONFIG.SPEED = speed;
  }
};

/**
 * Clear all obstacles and reset the system
 */
window.clearObstacles = function() {
  for (let obstacle of window.obstacles) {
    obstacle.isVisible = false;
    obstaclePool.push(obstacle);
  }
  window.obstacles = [];
  lastSpawnTime = Date.now();
  nextSpawnInterval = getRandomSpawnInterval();
};

/**
 * Get the current spawn interval (for debugging/testing)
 */
window.getObstacleSpawnInterval = function() {
  return {
    min: OBSTACLE_CONFIG.SPAWN_INTERVAL_MIN,
    max: OBSTACLE_CONFIG.SPAWN_INTERVAL_MAX,
  };
};
