(function() {
  'use strict';

  // Initialize score counter
  window.score = 0;

  /**
   * Updates the score display and increments the score counter
   * @param {number} points - Points to add to the score
   */
  window.updateScore = function(points) {
    if (typeof points !== 'number' || points < 0) {
      console.error('updateScore: points must be a non-negative number');
      return;
    }

    window.score += points;

    const scoreElement = document.getElementById('score');
    if (!scoreElement) {
      console.error('updateScore: #score element not found in DOM');
      return;
    }

    scoreElement.textContent = window.score;
  };

  /**
   * Displays the game-over screen with final score and restart button
   * @param {number} finalScore - The final score to display
   */
  window.showGameOver = function(finalScore) {
    if (typeof finalScore !== 'number' || finalScore < 0) {
      console.error('showGameOver: finalScore must be a non-negative number');
      return;
    }

    const gameOverScreen = document.getElementById('gameOverScreen');
    if (!gameOverScreen) {
      console.error('showGameOver: #gameOverScreen element not found in DOM');
      return;
    }

    // Update final score display
    const finalScoreElement = document.getElementById('finalScore');
    if (finalScoreElement) {
      finalScoreElement.textContent = finalScore;
    }

    // Show the game-over screen
    gameOverScreen.style.display = 'flex';
  };

  /**
   * Hides the game-over screen
   */
  window.hideGameOver = function() {
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (!gameOverScreen) {
      console.error('hideGameOver: #gameOverScreen element not found in DOM');
      return;
    }

    gameOverScreen.style.display = 'none';
  };

  /**
   * Resets the score counter to 0
   */
  window.resetScore = function() {
    window.score = 0;
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = window.score;
    }
  };

  /**
   * Initialize UI on DOM ready
   */
  function initializeUI() {
    // Ensure score element exists and is initialized
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = window.score;
    }

    // Ensure game-over screen exists and is hidden initially
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
      gameOverScreen.style.display = 'none';
    }

    // Set up restart button click handler
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
      restartButton.addEventListener('click', function() {
        if (typeof window.restartGame === 'function') {
          window.restartGame();
        } else {
          console.error('initializeUI: window.restartGame is not defined');
        }
      });
    }
  }

  // Initialize UI when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUI);
  } else {
    initializeUI();
  }
})();