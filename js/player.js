(function() {
  var LANE_POSITIONS = [-3, 0, 3];
  var LANE_SWITCH_SPEED = 14;

  var root = null;
  var legFL = null, legFR = null, legBL = null, legBR = null;
  var armL = null, armR = null;
  var runTime = 0;

  window.player = {
    mesh: null,
    currentLane: 1,
    targetLane: 1,
    lanePositions: LANE_POSITIONS,
    isMoving: false
  };

  window.initPlayer = function() {
    if (!window.scene || !window.worldPivot) return false;
    var scene = window.scene;
    var wp = window.worldPivot;

    root = new BABYLON.TransformNode('playerRoot', scene);
    root.position.set(LANE_POSITIONS[1], 0, 0);
    root.parent = wp;

    var bodyColor = new BABYLON.Color3(0.91, 0.46, 0.35);
    var bodyMat = new BABYLON.StandardMaterial('clawdBody', scene);
    bodyMat.diffuseColor = bodyColor;
    bodyMat.specularColor = new BABYLON.Color3(0.15, 0.08, 0.06);

    var darkMat = new BABYLON.StandardMaterial('clawdDark', scene);
    darkMat.diffuseColor = new BABYLON.Color3(0.78, 0.38, 0.28);
    darkMat.specularColor = new BABYLON.Color3(0.1, 0.06, 0.04);

    var body = BABYLON.MeshBuilder.CreateBox('body', { width: 1.4, height: 1.2, depth: 0.9 }, scene);
    body.position.y = 1.4;
    body.parent = root;
    body.material = bodyMat;

    var belly = BABYLON.MeshBuilder.CreateBox('belly', { width: 1.0, height: 0.5, depth: 0.1 }, scene);
    belly.position.set(0, 1.2, -0.45);
    belly.parent = root;
    belly.material = darkMat;

    var head = BABYLON.MeshBuilder.CreateBox('head', { width: 1.2, height: 0.9, depth: 0.85 }, scene);
    head.position.y = 2.55;
    head.parent = root;
    head.material = bodyMat;

    var earMat = new BABYLON.StandardMaterial('earMat', scene);
    earMat.diffuseColor = new BABYLON.Color3(0.85, 0.40, 0.30);

    var earL = BABYLON.MeshBuilder.CreateBox('earL', { width: 0.25, height: 0.35, depth: 0.25 }, scene);
    earL.position.set(-0.38, 3.17, 0);
    earL.parent = root;
    earL.material = earMat;

    var earR = BABYLON.MeshBuilder.CreateBox('earR', { width: 0.25, height: 0.35, depth: 0.25 }, scene);
    earR.position.set(0.38, 3.17, 0);
    earR.parent = root;
    earR.material = earMat;

    var whiteMat = new BABYLON.StandardMaterial('eyeW', scene);
    whiteMat.diffuseColor = BABYLON.Color3.White();
    whiteMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    var blackMat = new BABYLON.StandardMaterial('eyeB', scene);
    blackMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    var eyeWL = BABYLON.MeshBuilder.CreateBox('ewl', { width: 0.24, height: 0.24, depth: 0.06 }, scene);
    eyeWL.position.set(-0.25, 2.65, -0.43);
    eyeWL.parent = root;
    eyeWL.material = whiteMat;

    var eyeWR = BABYLON.MeshBuilder.CreateBox('ewr', { width: 0.24, height: 0.24, depth: 0.06 }, scene);
    eyeWR.position.set(0.25, 2.65, -0.43);
    eyeWR.parent = root;
    eyeWR.material = whiteMat;

    var pupilL = BABYLON.MeshBuilder.CreateBox('pl', { width: 0.13, height: 0.13, depth: 0.07 }, scene);
    pupilL.position.set(-0.25, 2.65, -0.465);
    pupilL.parent = root;
    pupilL.material = blackMat;

    var pupilR = BABYLON.MeshBuilder.CreateBox('pr', { width: 0.13, height: 0.13, depth: 0.07 }, scene);
    pupilR.position.set(0.25, 2.65, -0.465);
    pupilR.parent = root;
    pupilR.material = blackMat;

    var legMat = new BABYLON.StandardMaterial('legMat', scene);
    legMat.diffuseColor = new BABYLON.Color3(0.82, 0.38, 0.28);

    legFL = BABYLON.MeshBuilder.CreateBox('lfl', { width: 0.3, height: 0.55, depth: 0.3 }, scene);
    legFL.position.set(-0.4, 0.28, -0.22);
    legFL.parent = root;
    legFL.material = legMat;

    legFR = BABYLON.MeshBuilder.CreateBox('lfr', { width: 0.3, height: 0.55, depth: 0.3 }, scene);
    legFR.position.set(0.4, 0.28, -0.22);
    legFR.parent = root;
    legFR.material = legMat;

    legBL = BABYLON.MeshBuilder.CreateBox('lbl', { width: 0.3, height: 0.55, depth: 0.3 }, scene);
    legBL.position.set(-0.4, 0.28, 0.22);
    legBL.parent = root;
    legBL.material = legMat;

    legBR = BABYLON.MeshBuilder.CreateBox('lbr', { width: 0.3, height: 0.55, depth: 0.3 }, scene);
    legBR.position.set(0.4, 0.28, 0.22);
    legBR.parent = root;
    legBR.material = legMat;

    var armMat = new BABYLON.StandardMaterial('armMat', scene);
    armMat.diffuseColor = bodyColor;

    armL = BABYLON.MeshBuilder.CreateBox('aL', { width: 0.28, height: 0.7, depth: 0.28 }, scene);
    armL.position.set(-0.85, 1.35, 0);
    armL.parent = root;
    armL.material = armMat;

    armR = BABYLON.MeshBuilder.CreateBox('aR', { width: 0.28, height: 0.7, depth: 0.28 }, scene);
    armR.position.set(0.85, 1.35, 0);
    armR.parent = root;
    armR.material = armMat;

    var collider = BABYLON.MeshBuilder.CreateBox('pCol', { width: 1.0, height: 2.8, depth: 0.7 }, scene);
    collider.position.y = 1.5;
    collider.parent = root;
    collider.isVisible = false;
    collider.isPickable = false;

    window.player.mesh = collider;
    window.player.root = root;

    return true;
  };

  window.changePlayerLane = function(direction) {
    var newLane = Math.max(0, Math.min(2, window.player.currentLane + direction));
    if (newLane !== window.player.currentLane) {
      window.player.targetLane = newLane;
      window.player.isMoving = true;
    }
  };

  window.updatePlayer = function(dt) {
    if (!root) return;

    if (window.player.isMoving) {
      var cx = root.position.x;
      var tx = LANE_POSITIONS[window.player.targetLane];
      var diff = tx - cx;
      var move = LANE_SWITCH_SPEED * dt;
      if (Math.abs(diff) <= move) {
        root.position.x = tx;
        window.player.currentLane = window.player.targetLane;
        window.player.isMoving = false;
      } else {
        root.position.x += Math.sign(diff) * move;
      }
    }

    runTime += dt * 10;
    root.position.y = Math.abs(Math.sin(runTime)) * 0.1;

    if (legFL && legFR && legBL && legBR) {
      var swing = Math.sin(runTime) * 0.5;
      legFL.rotation.x = swing;
      legFR.rotation.x = -swing;
      legBL.rotation.x = -swing;
      legBR.rotation.x = swing;
    }
    if (armL && armR) {
      var aSwing = Math.sin(runTime) * 0.35;
      armL.rotation.x = -aSwing;
      armR.rotation.x = aSwing;
    }
  };

  window.resetPlayer = function() {
    if (root) root.position.set(LANE_POSITIONS[1], 0, 0);
    window.player.currentLane = 1;
    window.player.targetLane = 1;
    window.player.isMoving = false;
    runTime = 0;
  };

  window.initPlayer();
})();


