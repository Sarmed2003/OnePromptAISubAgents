/**
 * UI System
 * Handles HUD updates, game over modal, and score display
 */

(function() {
  // Cache DOM elements
  const scoreDisplay = document.getElementById('scoreDisplay');
  const speedDisplay = document.getElementById('speedDisplay');
  const gameOverModal = document.getElementById('gameOverModal');
  const finalScoreDisplay = document.getElementById('finalScore');

  /**
   * Update the HUD display with current score and speed
   */
  window.updateUI = function() {
    if (!window.gameState) {
      return;
    }

    // Update score display
    if (scoreDisplay) {
      scoreDisplay.textContent = 'Score: ' + Math.floor(window.gameState.score);
    }

    // Update speed display
    if (speedDisplay) {
      speedDisplay.textContent = 'Speed: ' + window.gameState.speed.toFixed(1);
    }
  };

  /**
   * Show the game over modal with final score
   * @param {number} finalScore - The final score to display
   */
  window.showGameOverModal = function(finalScore) {
    if (gameOverModal) {
      if (finalScoreDisplay) {
        finalScoreDisplay.textContent = Math.floor(finalScore);
      }
      gameOverModal.classList.add('show');
    }
  };

  /**
   * Hide the game over modal
   */
  window.hideGameOverModal = function() {
    if (gameOverModal) {
      gameOverModal.classList.remove('show');
    }
  };

})();
