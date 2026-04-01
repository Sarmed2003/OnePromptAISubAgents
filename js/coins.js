// Coin system for the game
// Manages coin spawning, movement, rotation, and collection

// Initialize global coins array
window.coins = [];

// Coin configuration
const COIN_CONFIG = {
  RADIUS: 0.4,
  HEIGHT: 0.15,
  SPEED: 0.25,
  ROTATION_SPEED: 5,
  POINT_VALUE: 10,
  SPAWN_INTERVAL_MIN: 2000,
  SPAWN_INTERVAL_MAX: 3000,
  SPAWN_Z: -100,
  LANES: [-3, 0, 3],
  REMOVE_THRESHOLD: 15,
  COLOR: 0xFFD700
};

// Create a single coin mesh
function createCoin() {
  if (!window.scene) {
    console.error('Scene not initialized. Cannot create coin.');
    return null;
  }

  // Create a thin cylinder (disc-like) for the coin
  const coin = BABYLON.MeshBuilder.CreateCylinder('coin', {
    diameter: COIN_CONFIG.RADIUS * 2,
    height: COIN_CONFIG.HEIGHT,
    tessellation: 32
  }, window.scene);

  // Create gold material
  const goldMaterial = new BABYLON.StandardMaterial('goldMaterial', window.scene);
  goldMaterial.diffuse = BABYLON.Color3.FromHexString('#FFD700');
  goldMaterial.specularColor = new BABYLON.Color3(1, 1, 0.8);
  goldMaterial.specularPower = 64;
  goldMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.15, 0);
  coin.material = goldMaterial;

  // Set random lane position
  const randomLane = COIN_CONFIG.LANES[Math.floor(Math.random() * COIN_CONFIG.LANES.length)];
  coin.position.x = randomLane;
  coin.position.z = COIN_CONFIG.SPAWN_Z;
  coin.position.y = 1;

  // Add properties for game logic
  coin.velocity = COIN_CONFIG.SPEED;
  coin.rotationSpeed = COIN_CONFIG.ROTATION_SPEED;
  coin.pointValue = COIN_CONFIG.POINT_VALUE;
  coin.collected = false;

  return coin;
}

// Spawn a new coin and add to coins array
window.spawnCoin = function() {
  const newCoin = createCoin();
  if (newCoin) {
    window.coins.push(newCoin);
  }
};

// Initialize coin spawning with randomized intervals
let nextSpawnTime = Date.now() + getRandomSpawnInterval();

function getRandomSpawnInterval() {
  return COIN_CONFIG.SPAWN_INTERVAL_MIN +
    Math.random() * (COIN_CONFIG.SPAWN_INTERVAL_MAX - COIN_CONFIG.SPAWN_INTERVAL_MIN);
}

// Update function to be called each frame
window.updateCoins = function(deltaTime) {
  if (!window.coins) {
    return;
  }

  const currentTime = Date.now();

  // Check if it's time to spawn a new coin
  if (currentTime >= nextSpawnTime) {
    window.spawnCoin();
    nextSpawnTime = currentTime + getRandomSpawnInterval();
  }

  // Update each coin
  for (let i = window.coins.length - 1; i >= 0; i--) {
    const coin = window.coins[i];

    // Move coin toward camera (increase z)
    coin.position.z += coin.velocity;

    // Rotate around Y axis
    coin.rotation.y += coin.rotationSpeed * deltaTime;

    // Remove coin if it has passed the player
    if (coin.position.z > COIN_CONFIG.REMOVE_THRESHOLD) {
      coin.dispose();
      window.coins.splice(i, 1);
    }
  }
};

// Collect a coin (remove it and return point value)
window.collectCoin = function(coinIndex) {
  if (coinIndex >= 0 && coinIndex < window.coins.length) {
    const coin = window.coins[coinIndex];
    const points = coin.pointValue;
    coin.dispose();
    window.coins.splice(coinIndex, 1);
    return points;
  }
  return 0;
};

// Get all coins for collision detection
window.getCoins = function() {
  return window.coins;
};

// Get coin point value
window.getCoinPointValue = function() {
  return COIN_CONFIG.POINT_VALUE;
};

// Clean up all coins (useful for game reset)
window.clearCoins = function() {
  if (window.coins) {
    for (let coin of window.coins) {
      coin.dispose();
    }
    window.coins = [];
  }
};
