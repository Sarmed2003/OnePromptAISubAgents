(function() {
  window.coins = [];
  var LANE_POSITIONS = [-3, 0, 3];
  var SPAWN_Z = 95;
  var REMOVE_Z = -12;
  var COIN_VALUE = 10;
  var goldMat = null;

  function getMat() {
    if (goldMat) return goldMat;
    if (!window.scene) return null;
    goldMat = new BABYLON.StandardMaterial('gMat', window.scene);
    goldMat.diffuseColor = new BABYLON.Color3(1, 0.84, 0);
    goldMat.specularColor = new BABYLON.Color3(1, 1, 0.7);
    goldMat.specularPower = 64;
    goldMat.emissiveColor = new BABYLON.Color3(0.3, 0.22, 0);
    return goldMat;
  }

  function createCoin(lane, zOff) {
    if (!window.scene || !window.worldPivot) return null;
    var mesh = BABYLON.MeshBuilder.CreateBox('cn_' + Date.now() + '_' + Math.random(), {
      width: 0.55, height: 0.7, depth: 0.12
    }, window.scene);
    mesh.rotation.z = Math.PI / 4;
    mesh.position.set(LANE_POSITIONS[lane], 1.5, SPAWN_Z + (zOff || 0));
    mesh.material = getMat();
    mesh.parent = window.worldPivot;
    return { mesh: mesh, value: COIN_VALUE };
  }

  var nextSpawn = 60;

  window.updateCoins = function(dt) {
    if (!window.coins || !window.gameState) return;
    var speed = window.gameState.speed || 15;
    var fc = window.gameState.frameCount;
    if (fc >= nextSpawn) {
      var lane = Math.floor(Math.random() * 3);
      var count = 3 + Math.floor(Math.random() * 5);
      for (var g = 0; g < count; g++) {
        var c = createCoin(lane, g * 2.2);
        if (c) window.coins.push(c);
      }
      nextSpawn = fc + 40 + Math.floor(Math.random() * 35);
    }
    for (var i = window.coins.length - 1; i >= 0; i--) {
      var cn = window.coins[i];
      if (!cn || !cn.mesh) { window.coins.splice(i, 1); continue; }
      cn.mesh.position.z -= speed * dt;
      cn.mesh.rotation.y += 4.0 * dt;
      if (cn.mesh.position.z < REMOVE_Z) {
        cn.mesh.dispose();
        window.coins.splice(i, 1);
      }
    }
  };

  window.clearCoins = function() {
    for (var i = 0; i < window.coins.length; i++) {
      if (window.coins[i] && window.coins[i].mesh) window.coins[i].mesh.dispose();
    }
    window.coins = [];
    nextSpawn = 60;
  };
})();
