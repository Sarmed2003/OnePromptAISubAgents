(function() {
  var scoreEl = null;
  var speedEl = null;
  var modalEl = null;
  var finalScoreEl = null;
  var restartButtonEl = null;

  function cacheDom() {
    scoreEl = document.getElementById('scoreDisplay');
    speedEl = document.getElementById('speedDisplay');
    modalEl = document.getElementById('gameOverModal');
    finalScoreEl = document.getElementById('finalScore');
    restartButtonEl = document.getElementById('restartButton');
  }

  function attachEventListeners() {
    if (restartButtonEl) {
      restartButtonEl.addEventListener('click', function() {
        if (window.restartGame) {
          window.restartGame();
        }
      });
    }
  }

  window.updateUI = function() {
    if (!scoreEl) cacheDom();
    if (!window.gameState) return;

    if (scoreEl) scoreEl.textContent = String(Math.floor(window.gameState.score));
    if (speedEl) speedEl.textContent = String((window.gameState.speed || 0).toFixed(0));
  };

  window.showGameOverModal = function(score) {
    if (!modalEl) cacheDom();
    if (modalEl) {
      if (finalScoreEl) finalScoreEl.textContent = String(Math.floor(score));
      modalEl.classList.add('show');
    }
  };

  window.hideGameOverModal = function() {
    if (!modalEl) cacheDom();
    if (modalEl) {
      modalEl.classList.remove('show');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      cacheDom();
      attachEventListeners();
    });
  } else {
    cacheDom();
    attachEventListeners();
  }
})();