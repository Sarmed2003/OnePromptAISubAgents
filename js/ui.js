(function() {
  var scoreEl = null;
  var speedEl = null;
  var modalEl = null;
  var finalScoreEl = null;

  function cacheDom() {
    scoreEl = document.getElementById('scoreDisplay');
    speedEl = document.getElementById('speedDisplay');
    modalEl = document.getElementById('gameOverModal');
    finalScoreEl = document.getElementById('finalScore');
  }

  window.updateUI = function() {
    if (!scoreEl) cacheDom();
    if (!window.gameState) return;

    if (scoreEl) scoreEl.textContent = Math.floor(window.gameState.score);
    if (speedEl) speedEl.textContent = (window.gameState.speed || 0).toFixed(0);
  };

  window.showGameOverModal = function(score) {
    if (!modalEl) cacheDom();
    if (modalEl) {
      if (finalScoreEl) finalScoreEl.textContent = Math.floor(score);
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
    document.addEventListener('DOMContentLoaded', cacheDom);
  } else {
    cacheDom();
  }
})();
