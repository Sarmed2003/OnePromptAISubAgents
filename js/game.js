(function() {
  window.gameState = {
    score: 0,
    speed: 15,
    isGameOver: false,
    isPaused: false,
    frameCount: 0,
    elapsedTime: 0,
    turnCount: 0
  };

  var BASE_SPEED = 16;
  var MAX_SPEED = 50;
  var SPEED_ACCEL = 0.12;
  var SCORE_PER_SECOND = 5;
  var TURN_INTERVAL = 18;
  var nextTurnTime = TURN_INTERVAL;
  var loopRunning = false;

  window.initGame = function() {
    if (!window.scene || !window.engine) return false;
    if (!window.player || !window.player.mesh) return false;

    window.gameState.score = 0;
    window.gameState.speed = BASE_SPEED;
    window.gameState.isGameOver = false;
    window.gameState.isPaused = false;
    window.gameState.frameCount = 0;
    window.gameState.elapsedTime = 0;
    window.gameState.turnCount = 0;
    nextTurnTime = TURN_INTERVAL;

    window.worldAngle = 0;
    window.targetWorldAngle = 0;
    if (window.worldPivot) window.worldPivot.rotation.y = 0;

    if (window.clearObstacles) window.clearObstacles();
    if (window.clearCoins) window.clearCoins();
    if (window.resetPlayer) window.resetPlayer();
    if (window.hideGameOverModal) window.hideGameOverModal();
    if (window.setupInput) window.setupInput();

    if (!loopRunning) {
      startRenderLoop();
      loopRunning = true;
    }
    return true;
  };

  function startRenderLoop() {
    window.engine.runRenderLoop(function() {
      var dt = Math.min(window.engine.getDeltaTime() / 1000, 0.05);

      if (!window.gameState.isPaused && !window.gameState.isGameOver) {
        window.gameState.frameCount++;
        window.gameState.elapsedTime += dt;

        window.gameState.speed = Math.min(
          BASE_SPEED + window.gameState.elapsedTime * SPEED_ACCEL,
          MAX_SPEED
        );
        window.gameState.score += SCORE_PER_SECOND * dt;

        if (window.gameState.elapsedTime >= nextTurnTime) {
          var dir = Math.random() < 0.5 ? -1 : 1;
          if (window.triggerTurn) window.triggerTurn(dir);
          window.gameState.turnCount++;
          window.gameState.score += 25;
          nextTurnTime = window.gameState.elapsedTime + TURN_INTERVAL + Math.random() * 8;
        }

        if (window.updatePlayer) window.updatePlayer(dt);
        if (window.scrollGround) window.scrollGround(window.gameState.speed, dt);
        if (window.updateObstacles) window.updateObstacles(dt);
        if (window.updateCoins) window.updateCoins(dt);
        if (window.updateParticles) window.updateParticles(dt);
        if (window.checkCollisions) window.checkCollisions();
        if (window.updateUI) window.updateUI();
      }

      if (window.updateCamera) window.updateCamera(dt);
      window.scene.render();
    });

    window.addEventListener('resize', function() {
      if (window.engine) window.engine.resize();
    });
  }

  window.onGameOver = function() {
    window.gameState.isGameOver = true;
    if (window.showGameOverModal) window.showGameOverModal(window.gameState.score);
  };

  window.restartGame = function() {
    window.initGame();
  };

  setTimeout(function() {
    if (window.scene && window.engine && window.player && window.player.mesh) {
      window.initGame();
    } else {
      setTimeout(function() { window.initGame(); }, 400);
    }
  }, 250);
})();
