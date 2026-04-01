// Initialize Babylon.js engine and scene
// This module sets up the core rendering engine, scene, camera, and lighting
// All objects are stored on window namespace for global access

(function() {
  'use strict';

  // Get canvas element - assumes it exists in HTML with id 'renderCanvas'
  const canvas = document.getElementById('renderCanvas');
  if (!canvas) {
    console.error('Canvas element with id "renderCanvas" not found');
    return;
  }

  // Create Babylon.js engine with antialias enabled
  window.engine = new BABYLON.Engine(canvas, true);

  // Create scene
  window.scene = new BABYLON.Scene(window.engine);

  // Set dark background color (#0a0e27)
  window.scene.clearColor = new BABYLON.Color3(0.039, 0.055, 0.153);

  // Enable physics with gravity for future physics-based interactions
  const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
  window.scene.collisionsEnabled = true;
  window.scene.gravity = gravityVector;

  // Create FollowCamera positioned to view player from above and behind
  // Player will be at (0, 0, 5), camera at (0, 8, -15)
  const camera = new BABYLON.FollowCamera(
    'followCamera',
    new BABYLON.Vector3(0, 8, -15),
    window.scene
  );

  // Configure follow camera to track player position
  camera.attachControl(canvas, true);
  camera.inertia = 0.7;
  camera.angularSensibility = 1000;
  camera.speed = 0;
  camera.radius = 15;
  camera.heightOffset = 8;
  camera.rotationOffset = 0;

  // Store camera on window for potential access by other modules
  window.camera = camera;

  // Create hemispheric light for ambient illumination
  // Direction: up (0, 1, 0), intensity: 0.7
  const ambientLight = new BABYLON.HemisphericLight(
    'ambientLight',
    new BABYLON.Vector3(0, 1, 0),
    window.scene
  );
  ambientLight.intensity = 0.7;

  // Create directional light for shadows and dramatic lighting
  // Direction: forward-down for natural lighting effect
  const directionalLight = new BABYLON.PointLight(
    'directionalLight',
    new BABYLON.Vector3(5, 10, 5),
    window.scene
  );
  directionalLight.intensity = 0.5;
  directionalLight.range = 100;

  // Enable shadow generation for realistic shadow casting
  const shadowGenerator = new BABYLON.ShadowGenerator(2048, directionalLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32;

  // Store shadow generator on window for meshes to register with it
  window.shadowGenerator = shadowGenerator;

  // Set scene to render shadows
  window.scene.shadowsEnabled = true;

  // Start the render loop
  window.engine.runRenderLoop(function() {
    window.scene.render();
  });

  // Handle window resize to maintain aspect ratio
  window.addEventListener('resize', function() {
    window.engine.resize();
  });

  // Store render loop reference for potential control
  window.renderLoopActive = true;

  console.log('Babylon.js scene initialized successfully');
  console.log('Engine:', window.engine);
  console.log('Scene:', window.scene);
  console.log('Camera:', window.camera);
  console.log('Shadow Generator:', window.shadowGenerator);
})();
