(function() {
  window.obstacles = [];
  var LANE_POSITIONS = [-3, 0, 3];
  var SPAWN_Z = 90;
  var REMOVE_Z = -15;
  var GRACE_FRAMES = 140;
  var obsMat = null;

  function getMat() {
    if (obsMat) return obsMat;
    if (!window.scene) return null;
    obsMat = new BABYLON.StandardMaterial('obsMat', window.scene);
    obsMat.diffuseColor = new BABYLON.Color3(0.48, 0.30, 0.22);
    obsMat.specularColor = new BABYLON.Color3(0.12, 0.08, 0.06);
    obsMat.emissiveColor = new BABYLON.Color3(0.06, 0.02, 0.01);
    return obsMat;
  }

  function createObs(lane) {
    if (!window.scene || !window.worldPivot) return null;
    var types = [
      { w: 1.6, h: 2.2, d: 1.6 },
      { w: 2.0, h: 1.4, d: 1.2 },
      { w: 1.2, h: 3.0, d: 1.2 }
    ];
    var t = types[Math.floor(Math.random() * types.length)];
    var mesh = BABYLON.MeshBuilder.CreateBox('obs_' + Date.now(), { width: t.w, height: t.h, depth: t.d }, window.scene);
    mesh.position.set(LANE_POSITIONS[lane], t.h / 2, SPAWN_Z);
    mesh.material = getMat();
    mesh.parent = window.worldPivot;
    return { mesh: mesh, hw: t.w / 2, hd: t.d / 2 };
  }

  window.spawnObstacle = function() {
    var lane = Math.floor(Math.random() * 3);
    var obs = createObs(lane);
    if (obs) window.obstacles.push(obs);
  };

  window.updateObstacles = function(dt) {
    if (!window.obstacles || !window.gameState) return;
    if (window.gameState.frameCount < GRACE_FRAMES) return;
    var speed = window.gameState.speed || 15;
    var fc = window.gameState.frameCount;
    var interval = Math.max(22, 65 - Math.floor(fc / 250));
    if ((fc - GRACE_FRAMES) % interval === 0) {
      window.spawnObstacle();
      if (speed > 25 && Math.random() < 0.35) window.spawnObstacle();
    }
    for (var i = window.obstacles.length - 1; i >= 0; i--) {
      var o = window.obstacles[i];
      if (!o || !o.mesh) { window.obstacles.splice(i, 1); continue; }
      o.mesh.position.z -= speed * dt;
      if (o.mesh.position.z < REMOVE_Z) {
        o.mesh.dispose();
        window.obstacles.splice(i, 1);
      }
    }
  };

  window.clearObstacles = function() {
    for (var i = 0; i < window.obstacles.length; i++) {
      if (window.obstacles[i] && window.obstacles[i].mesh) window.obstacles[i].mesh.dispose();
    }
    window.obstacles = [];
  };
})();
