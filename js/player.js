/**
 * Player System
 * Manages player movement, position, and lane changes
 */

(function() {
  // Player object
  window.player = {
    mesh: null,
    position: { x: 0, y: 1, z: 0 },
    currentLane: 1, // 0=left, 1=center, 2=right
    targetLane: 1,
    lanePositions: [-3, 0, 3],
    speed: 0.1,
    isMoving: false
  };

  /**
   * Initialize player mesh
   */
  window.initPlayer = function() {
    if (!window.scene) {
      console.error('Scene not initialized');
      return false;
    }

    // Create player mesh (simple box for now)
    window.player.mesh = BABYLON.MeshBuilder.CreateBox('player', { size: 0.8 }, window.scene);
    window.player.mesh.position.y = 1;
    window.player.mesh.position.x = window.player.lanePositions[window.player.currentLane];

    // Create player material
    const playerMaterial = new BABYLON.StandardMaterial('playerMaterial', window.scene);
    playerMaterial.diffuse = new BABYLON.Color3(0, 0.8, 1);
    playerMaterial.emissiveColor = new BABYLON.Color3(0, 0.3, 0.5);
    window.player.mesh.material = playerMaterial;

    return true;
  };

  /**
   * Change player lane
   * @param {number} direction - -1 for left, 0 for stay, 1 for right
   */
  window.changePlayerLane = function(direction) {
    const newLane = Math.max(0, Math.min(2, window.player.currentLane + direction));
    if (newLane !== window.player.currentLane) {
      window.player.targetLane = newLane;
      window.player.isMoving = true;
    }
  };

  /**
   * Update player position and movement
   * @param {number} deltaTime - Time since last frame
   */
  window.updatePlayer = function(deltaTime) {
    if (!window.player.mesh || !window.gameState) {
      return;
    }

    // Smooth lane transition
    if (window.player.isMoving) {
      const currentX = window.player.mesh.position.x;
      const targetX = window.player.lanePositions[window.player.targetLane];
      const direction = Math.sign(targetX - currentX);
      const moveAmount = window.player.speed * deltaTime;

      if (Math.abs(targetX - currentX) > moveAmount) {
        window.player.mesh.position.x += direction * moveAmount;
      } else {
        window.player.mesh.position.x = targetX;
        window.player.currentLane = window.player.targetLane;
        window.player.isMoving = false;
      }
    }

    // Update game state player lane for reference
    window.gameState.playerLane = window.player.currentLane;
  };

  // Initialize player when scene is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(window.initPlayer, 200);
    });
  } else {
    setTimeout(window.initPlayer, 200);
  }
})();
