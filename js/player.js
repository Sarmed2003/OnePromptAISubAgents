// Player module: creates and manages the purple Claude mascot

(function() {
  // Configuration constants
  const LANE_WIDTH = 3;
  const LANE_POSITIONS = {
    0: -3,  // left lane
    1: 0,   // center lane
    2: 3    // right lane
  };
  const PLAYER_Y = 1.5;
  const PLAYER_Z = 5;
  const ANIMATION_DURATION = 0.3; // seconds
  const PURPLE_COLOR = BABYLON.Color3.FromHexString('#6a5acd');
  const WHITE_COLOR = BABYLON.Color3.FromHexString('#ffffff');

  // Get scene from global scope (set by main.js)
  const scene = window.scene;
  if (!scene) {
    console.error('Player.js: window.scene not found. Ensure main.js initializes scene first.');
    return;
  }

  // Create player mesh (capsule using box with scaling)
  function createPlayerMesh() {
    // Create main body as a capsule-like shape using a box
    const body = BABYLON.MeshBuilder.CreateBox('playerBody', {
      width: 0.8,
      height: 1.5,
      depth: 0.8
    }, scene);

    // Apply purple material to body
    const purpleMaterial = new BABYLON.StandardMaterial('purpleMaterial', scene);
    purpleMaterial.diffuse = PURPLE_COLOR;
    purpleMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    body.material = purpleMaterial;

    // Position body at ground level and camera-relative z
    body.position.y = PLAYER_Y;
    body.position.z = PLAYER_Z;
    body.position.x = LANE_POSITIONS[1]; // Start in center lane

    // Create left eye
    const leftEye = BABYLON.MeshBuilder.CreateSphere('leftEye', {
      diameter: 0.3,
      segments: 16
    }, scene);

    const whiteMaterial = new BABYLON.StandardMaterial('whiteMaterial', scene);
    whiteMaterial.diffuse = WHITE_COLOR;
    whiteMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    leftEye.material = whiteMaterial;

    // Position left eye on front face
    leftEye.parent = body;
    leftEye.position.x = -0.25;
    leftEye.position.y = 0.3;
    leftEye.position.z = 0.45;

    // Create right eye
    const rightEye = BABYLON.MeshBuilder.CreateSphere('rightEye', {
      diameter: 0.3,
      segments: 16
    }, scene);
    rightEye.material = whiteMaterial;

    // Position right eye on front face
    rightEye.parent = body;
    rightEye.position.x = 0.25;
    rightEye.position.y = 0.3;
    rightEye.position.z = 0.45;

    return body;
  }

  // Create animation for lane switching
  function createLaneAnimation(fromX, toX, duration) {
    const animation = new BABYLON.Animation(
      'laneSwitch',
      'position.x',
      60, // frames per second
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
      { frame: 0, value: fromX },
      { frame: duration * 60, value: toX }
    ];

    animation.setKeys(keys);

    // Use ease-in-out for smooth animation
    const easingFunction = new BABYLON.CubicEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    animation.setEasingFunction(easingFunction);

    return animation;
  }

  // Create player object
  const playerMesh = createPlayerMesh();

  // Player state object
  window.player = {
    mesh: playerMesh,
    currentLane: 1,      // 0=left, 1=center, 2=right
    targetLane: 1,
    isAnimating: false,

    /**
     * Switch to adjacent lane
     * @param {string} direction - 'left' or 'right'
     */
    switchLane: function(direction) {
      // Prevent switching while already animating
      if (this.isAnimating) {
        return;
      }

      let newLane = this.targetLane;

      if (direction === 'left' && this.targetLane > 0) {
        newLane = this.targetLane - 1;
      } else if (direction === 'right' && this.targetLane < 2) {
        newLane = this.targetLane + 1;
      } else {
        // Invalid move (boundary or invalid direction)
        return;
      }

      // Update target lane
      this.targetLane = newLane;
      this.isAnimating = true;

      // Get current and target positions
      const currentX = this.mesh.position.x;
      const targetX = LANE_POSITIONS[newLane];

      // Create and run animation
      const animation = createLaneAnimation(currentX, targetX, ANIMATION_DURATION);
      this.mesh.animations = [animation];

      // Run animation
      const animatable = scene.beginAnimation(this.mesh, 0, ANIMATION_DURATION * 60, false);

      // When animation completes, update current lane and reset animating flag
      animatable.onAnimationEnd = () => {
        this.currentLane = newLane;
        this.isAnimating = false;
      };
    }
  };

  // Log initialization
  console.log('Player initialized:', window.player);
})();
