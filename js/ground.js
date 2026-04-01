// Ground module: creates infinite scrolling 3-lane road
// Depends on: window.scene, window.engine (created by game.js)

(function() {
  'use strict';

  // Validate dependencies
  if (!window.BABYLON) {
    console.error('Ground: BABYLON not found. Ensure Babylon.js is loaded.');
    return;
  }

  if (!window.scene) {
    console.error('Ground: window.scene not found. Ensure game.js initializes scene first.');
    return;
  }

  const scene = window.scene;
  const BABYLON = window.BABYLON;

  // Road constants
  const ROAD_WIDTH = 9;        // 3 lanes × 3 units each
  const ROAD_LENGTH = 200;     // Length of each road segment
  const ROAD_RESET_Z = -200;   // Position to reset road to
  const ROAD_EXIT_Z = 15;      // Z position where road exits screen and should reset
  const LANE_WIDTH = 3;        // Width of each lane
  const EDGE_WALL_X = 5;       // X position of edge walls (±5)
  const WALL_HEIGHT = 5;       // Height of invisible collision walls
  const WALL_DEPTH = 250;      // Depth of invisible collision walls

  // Lane positions (center of each lane)
  const LANE_POSITIONS = [-3, 0, 3];

  // Create road material (dark asphalt)
  const roadMaterial = new BABYLON.StandardMaterial('roadMaterial', scene);
  roadMaterial.diffuse = new BABYLON.Color3(0.1, 0.1, 0.1);  // Dark gray asphalt
  roadMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  roadMaterial.roughness = 0.8;  // Matte finish

  // Create lane marker material (white)
  const laneMaterial = new BABYLON.StandardMaterial('laneMaterial', scene);
  laneMaterial.diffuse = new BABYLON.Color3(1, 1, 1);  // White
  laneMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);  // Slight glow

  // Create main road mesh
  const roadMesh = BABYLON.MeshBuilder.CreateBox('road', {
    width: ROAD_WIDTH,
    height: 0.2,  // Thin plane
    depth: ROAD_LENGTH
  }, scene);
  roadMesh.material = roadMaterial;
  roadMesh.position.z = ROAD_RESET_Z;
  roadMesh.position.y = -0.1;  // Slightly below ground to avoid z-fighting
  roadMesh.receiveShadows = true;

  // Create lane markers (white dashed lines)
  const laneMarkersParent = new BABYLON.TransformNode('laneMarkers', scene);
  laneMarkersParent.parent = roadMesh;

  // Create dashed lines for lane divisions
  // Lane 1-2 divider (at x = -1.5)
  createLaneMarker(-1.5, laneMarkersParent, laneMaterial);
  // Lane 2-3 divider (at x = 1.5)
  createLaneMarker(1.5, laneMarkersParent, laneMaterial);

  function createLaneMarker(xPos, parent, material) {
    // Create dashed line using multiple small boxes
    const dashLength = 5;      // Length of each dash
    const dashGap = 5;         // Gap between dashes
    const dashHeight = 0.1;    // Height of marker
    const dashWidth = 0.15;    // Width of line
    const totalDashes = Math.ceil(ROAD_LENGTH / (dashLength + dashGap));

    for (let i = 0; i < totalDashes; i++) {
      const dashZ = -ROAD_LENGTH / 2 + i * (dashLength + dashGap) + dashLength / 2;
      const dash = BABYLON.MeshBuilder.CreateBox(`laneDash_${xPos}_${i}`, {
        width: dashWidth,
        height: dashHeight,
        depth: dashLength
      }, scene);
      dash.material = material;
      dash.position.x = xPos;
      dash.position.y = 0.05;  // Slightly above road
      dash.position.z = dashZ;
      dash.parent = parent;
    }
  }

  // Create invisible edge walls for collision detection
  const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', {
    width: 0.5,
    height: WALL_HEIGHT,
    depth: WALL_DEPTH
  }, scene);
  leftWall.position.x = -EDGE_WALL_X;
  leftWall.position.y = WALL_HEIGHT / 2;
  leftWall.position.z = 0;
  leftWall.isVisible = false;  // Invisible collision wall
  leftWall.checkCollisions = true;

  const rightWall = BABYLON.MeshBuilder.CreateBox('rightWall', {
    width: 0.5,
    height: WALL_HEIGHT,
    depth: WALL_DEPTH
  }, scene);
  rightWall.position.x = EDGE_WALL_X;
  rightWall.position.y = WALL_HEIGHT / 2;
  rightWall.position.z = 0;
  rightWall.isVisible = false;  // Invisible collision wall
  rightWall.checkCollisions = true;

  // Update function to handle road scrolling
  function updateScroll(scrollSpeed) {
    roadMesh.position.z += scrollSpeed;

    // Reset road when it passes the camera
    if (roadMesh.position.z > ROAD_EXIT_Z) {
      roadMesh.position.z = ROAD_RESET_Z;
    }
  }

  // Expose ground object to window
  window.ground = {
    mesh: roadMesh,
    lanePositions: LANE_POSITIONS,
    scrollSpeed: 0,
    updateScroll: updateScroll,
    leftWall: leftWall,
    rightWall: rightWall,
    roadLength: ROAD_LENGTH,
    roadWidth: ROAD_WIDTH
  };

  console.log('Ground initialized: road created with 3 lanes, lane markers, and edge walls.');
})();
