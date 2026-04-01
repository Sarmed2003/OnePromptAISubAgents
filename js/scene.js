/**
 * Scene Setup
 * Initializes Babylon.js scene, camera, and lighting
 */

(function() {
  // Initialize Babylon.js scene
  function initScene() {
    if (!window.BABYLON) {
      console.error('Babylon.js not loaded');
      return false;
    }

    const canvas = document.getElementById('renderCanvas');
    if (!canvas) {
      console.error('Canvas element not found');
      return false;
    }

    // Create engine
    window.engine = new BABYLON.Engine(canvas, true);
    if (!window.engine) {
      console.error('Failed to create Babylon.js engine');
      return false;
    }

    // Create scene
    window.scene = new BABYLON.Scene(window.engine);
    if (!window.scene) {
      console.error('Failed to create scene');
      return false;
    }

    // Set scene background
    window.scene.clearColor = new BABYLON.Color3(0.04, 0.06, 0.15);
    window.scene.collisionsEnabled = true;

    // Create camera
    const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 2, -10));
    camera.attachControl(canvas, true);
    camera.inertia = 0.7;
    camera.angularSensibility = 1000;
    camera.keysUp = [];
    camera.keysDown = [];
    camera.keysLeft = [];
    camera.keysRight = [];
    window.camera = camera;

    // Create lighting
    const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, 0), window.scene);
    ambientLight.intensity = 0.7;

    const directionalLight = new BABYLON.PointLight('directionalLight', new BABYLON.Vector3(5, 10, 5), window.scene);
    directionalLight.intensity = 0.8;
    directionalLight.range = 100;

    // Enable physics if needed
    window.scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    return true;
  }

  // Initialize scene when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScene);
  } else {
    initScene();
  }
})();
