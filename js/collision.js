(function() {
  var GRACE_FRAMES = 150;

  var PLAYER_HALF_W = 0.45;
  var PLAYER_HALF_D = 0.3;
  var OBS_HALF_W = 0.8;
  var OBS_HALF_D = 0.8;
  var COIN_HALF_W = 0.4;
  var COIN_HALF_D = 0.4;

  function getWorldX(mesh) {
    if (mesh.parent) {
      return mesh.parent.position.x + mesh.position.x;
    }
    return mesh.position.x;
  }

  function getWorldZ(mesh) {
    if (mesh.parent) {
      return mesh.parent.position.z + mesh.position.z;
    }
    return mesh.position.z;
  }

  function aabbOverlap(px, pz, phw, phd, ox, oz, ohw, ohd) {
    return Math.abs(px - ox) < (phw + ohw) && Math.abs(pz - oz) < (phd + ohd);
  }

  window.checkCollisions = function() {
    if (!window.gameState || window.gameState.isGameOver) return;
    if (!window.player || !window.player.mesh) return;
    if (window.gameState.frameCount < GRACE_FRAMES) return;

    var playerMesh = window.player.mesh;
    var px = getWorldX(playerMesh);
    var pz = getWorldZ(playerMesh);

    if (window.obstacles && window.obstacles.length > 0) {
      for (var i = 0; i < window.obstacles.length; i++) {
        var obs = window.obstacles[i];
        var obsMesh = obs ? (obs.mesh || obs) : null;
        if (!obsMesh || !obsMesh.position) continue;

        if (aabbOverlap(px, pz, PLAYER_HALF_W, PLAYER_HALF_D, obsMesh.position.x, obsMesh.position.z, OBS_HALF_W, OBS_HALF_D)) {
          triggerGameOver();
          return;
        }
      }
    }

    if (window.coins && window.coins.length > 0) {
      for (var j = window.coins.length - 1; j >= 0; j--) {
        var coin = window.coins[j];
        var coinMesh = coin ? (coin.mesh || coin) : null;
        if (!coinMesh || !coinMesh.position) continue;

        if (aabbOverlap(px, pz, PLAYER_HALF_W, PLAYER_HALF_D, coinMesh.position.x, coinMesh.position.z, COIN_HALF_W, COIN_HALF_D)) {
          var value = coin.value || 10;
          window.gameState.score += value;

          if (window.spawnCoinParticles && coinMesh.position) {
            window.spawnCoinParticles(coinMesh.position.clone());
          }

          coinMesh.dispose();
          window.coins.splice(j, 1);
        }
      }
    }
  };

  function triggerGameOver() {
    window.gameState.isGameOver = true;
    if (window.onGameOver) {
      window.onGameOver();
    }
  }
})();
