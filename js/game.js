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
    window.gameState = {
      score: 0,
      speed: BASE_SPEED,
      isGameOver: false,
      isPaused: false,
      frameCount: 0,
      elapsedTime: 0,
      turnCount: 0
    };
    nextTurnTime = TURN_INTERVAL;
    if (window.clearCoins) window.clearCoins();
    if (window.clearObstacles) window.clearObstacles();
    if (window.resetPlayer) window.resetPlayer();
    if (window.clearParticles) window.clearParticles();
    if (window.hideGameOverModal) window.hideGameOverModal();
    loopRunning = true;
    gameLoop();
  };

  window.onGameOver = function() {
    loopRunning = false;
    if (window.showGameOverModal) {
      window.showGameOverModal(window.gameState.score);
    }
  };

  window.restartGame = function() {
    window.initGame();
  };

  function gameLoop() {
    if (!window.scene) return;
    if (loopRunning) {
      var dt = window.scene.getEngine().getDeltaTime() / 1000;
      if (dt > 0.1) dt = 0.016;

      if (!window.gameState.isGameOver) {
        window.gameState.frameCount += 1;
        window.gameState.elapsedTime += dt;
        window.gameState.speed = Math.min(BASE_SPEED + window.gameState.elapsedTime * SPEED_ACCEL, MAX_SPEED);
        window.gameState.score += Math.floor(SCORE_PER_SECOND * dt);

        if (window.gameState.elapsedTime >= nextTurnTime) {
          window.gameState.turnCount += 1;
          nextTurnTime += TURN_INTERVAL;
        }
      }

      if (window.updatePlayer) window.updatePlayer(dt);
      if (window.updateObstacles) window.updateObstacles(dt);
      if (window.updateCoins) window.updateCoins(dt);
      if (window.updateParticles) window.updateParticles(dt);
      if (window.checkCollisions) window.checkCollisions();
      if (window.updateUI) window.updateUI();

      window.scene.render();
    }
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('load', function() {
    if (window.initScene) {
      window.initScene();
      window.initGame();
    }
  });
})();