(function() {
  var bound = false;
  var touchStartX = 0;

  window.setupInput = function() {
    if (bound) return;
    bound = true;

    document.addEventListener('keydown', function(e) {
      if (window.gameState && window.gameState.isGameOver) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (window.restartGame) window.restartGame();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (window.changePlayerLane) window.changePlayerLane(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (window.changePlayerLane) window.changePlayerLane(1);
          break;
      }
    });

    document.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var threshold = window.innerWidth * 0.1;

      if (window.gameState && window.gameState.isGameOver) {
        if (window.restartGame) window.restartGame();
        return;
      }

      if (dx < -threshold && window.changePlayerLane) {
        window.changePlayerLane(-1);
      } else if (dx > threshold && window.changePlayerLane) {
        window.changePlayerLane(1);
      }
    }, { passive: true });
  };
})();
