/**
 * Ground System
 * Creates and manages the game ground/terrain
 */

(function() {
  /**
   * Initialize ground mesh
   */
  window.initGround = function() {
    if (!window.scene) {
      console.error('Scene not initialized');
      return false;
    }

    // Create ground plane
    const ground = BABYLON.MeshBuilder.CreateGround('ground', {
      width: 20,
      height: 200
    }, window.scene);

    ground.position.y = 0;
    ground.position.z = 0;

    // Create ground material
    const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', window.scene);
    groundMaterial.diffuse = new BABYLON.Color3(0.1, 0.15, 0.25);
    groundMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    ground.material = groundMaterial;

    // Create lane markers (visual guides)
    createLaneMarkers();

    return true;
  };

  /**
   * Create visual lane markers on the ground
   */
  function createLaneMarkers() {
    const lanes = [-3, 0, 3];
    const laneMarkerMaterial = new BABYLON.StandardMaterial('laneMarkerMaterial', window.scene);
    laneMarkerMaterial.diffuse = new BABYLON.Color3(0.2, 0.3, 0.5);
    laneMarkerMaterial.alpha = 0.5;

    lanes.forEach(laneX => {
      const marker = BABYLON.MeshBuilder.CreateTube('laneMarker', {
        path: [
          new BABYLON.Vector3(laneX, 0.01, -100),
          new BABYLON.Vector3(laneX, 0.01, 100)
        ],
        radius: 0.1
      }, window.scene);
      marker.material = laneMarkerMaterial;
    });
  }

  // Initialize ground when scene is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(window.initGround, 150);
    });
  } else {
    setTimeout(window.initGround, 150);
  }
})();
