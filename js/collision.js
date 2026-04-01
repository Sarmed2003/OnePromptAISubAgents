/**
 * Collision Detection System
 * Handles collisions between player and obstacles/coins
 * Manages score updates, particle effects, and game over state
 */

(function() {
  // Track which coins have been collected this frame to prevent double-counting
  const collidedCoins = new Set();
  // Track which obstacles have triggered game over to prevent multiple triggers
  const collidedObstacles = new Set();

  /**
   * Check collisions between player and obstacles/coins
   * Called once per frame by the game loop
   */
  window.checkCollisions = function() {
    // Validate required globals exist
    if (!window.gameState) {
      console.warn('gameState not initialized');
      return;
    }

    if (!window.player || !window.player.mesh) {
      console.warn('Player mesh not initialized');
      return;
    }

    // If game is already over, don't process new collisions
    if (window.gameState.isGameOver) {
      return;
    }

    const playerMesh = window.player.mesh;

    // Clear collision tracking for this frame
    collidedCoins.clear();
    collidedObstacles.clear();

    // Check obstacle collisions
    if (window.obstacles && Array.isArray(window.obstacles)) {
      checkObstacleCollisions(playerMesh);
    }

    // Check coin collisions (only if game is not over)
    if (!window.gameState.isGameOver && window.coins && Array.isArray(window.coins)) {
      checkCoinCollisions(playerMesh);
    }
  };

  /**
   * Check collisions between player and obstacles
   * @param {BABYLON.Mesh} playerMesh - The player mesh
   */
  function checkObstacleCollisions(playerMesh) {
    for (let i = 0; i < window.obstacles.length; i++) {
      const obstacle = window.obstacles[i];

      // Validate obstacle has a mesh
      if (!obstacle || !obstacle.mesh) {
        continue;
      }

      // Check if meshes intersect
      if (playerMesh.intersectsMesh(obstacle.mesh, false)) {
        // Prevent multiple game over triggers from the same obstacle
        if (!collidedObstacles.has(i)) {
          collidedObstacles.add(i);
          triggerGameOver();
          // Exit early since game is now over
          return;
        }
      }
    }
  }

  /**
   * Check collisions between player and coins
   * @param {BABYLON.Mesh} playerMesh - The player mesh
   */
  function checkCoinCollisions(playerMesh) {
    // Iterate backwards to safely remove coins during iteration
    for (let i = window.coins.length - 1; i >= 0; i--) {
      const coin = window.coins[i];

      // Validate coin has a mesh
      if (!coin || !coin.mesh) {
        continue;
      }

      // Check if meshes intersect
      if (playerMesh.intersectsMesh(coin.mesh, false)) {
        // Prevent double-counting of the same coin
        if (!collidedCoins.has(i)) {
          collidedCoins.add(i);
          collectCoin(coin, i);
        }
      }
    }
  }

  /**
   * Handle coin collection
   * @param {Object} coin - The coin object with mesh and value
   * @param {number} index - Index of coin in window.coins array
   */
  function collectCoin(coin, index) {
    // Get coin value (default to 1 if not specified)
    const coinValue = coin.value || 1;

    // Update score
    window.gameState.score += coinValue;

    // Spawn particle effect at coin position
    if (coin.mesh && coin.mesh.position && window.spawnCoinParticles) {
      window.spawnCoinParticles(coin.mesh.position);
    }

    // Dispose of the coin mesh to free resources
    if (coin.mesh) {
      coin.mesh.dispose();
    }

    // Remove coin from array
    window.coins.splice(index, 1);
  }

  /**
   * Trigger game over state
   */
  function triggerGameOver() {
    // Set game over flag
    window.gameState.isGameOver = true;

    // Call game over callback if it exists
    if (window.onGameOver && typeof window.onGameOver === 'function') {
      window.onGameOver();
    }
  }

})();
