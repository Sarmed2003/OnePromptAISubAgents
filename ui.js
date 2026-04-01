/**
 * UI Module
 * Handles UI updates and display
 */

function updateScoreDisplay() {
  const scoreDisplay = document.getElementById('scoreDisplay');
  if (scoreDisplay) {
    scoreDisplay.textContent = 'Score: ' + window.score;
  }
}