// UI Module: HUD and Game-Over Screen Management
// Handles DOM updates for score, speed, level display and game-over modal

(function() {
  'use strict';

  // Cache DOM elements to avoid repeated querySelector calls
  let hudElement = null;
  let scoreDisplay = null;
  let speedDisplay = null;
  let levelDisplay = null;
  let gameOverModal = null;
  let finalScoreDisplay = null;
  let restartButton = null;

  // Initialize DOM element references
  function initializeElements() {
    hudElement = document.getElementById('hud');
    scoreDisplay = document.getElementById('scoreDisplay');
    speedDisplay = document.getElementById('speedDisplay');
    levelDisplay = document.getElementById('levelDisplay');
    gameOverModal = document.getElementById('gameOverModal');
    finalScoreDisplay = document.getElementById('finalScoreDisplay');
    restartButton = document.getElementById('restartButton');

    // Validate that all required elements exist
    if (!hudElement) {
      console.error('HUD element (#hud) not found in DOM');
    }
    if (!gameOverModal) {
      console.error('Game Over modal (#gameOverModal) not found in DOM');
    }
    if (!restartButton) {
      console.error('Restart button (#restartButton) not found in DOM');
    }

    // Attach restart button listener
    if (restartButton) {
      restartButton.addEventListener('click', handleRestartClick);
    }
  }

  // Handle restart button click
  function handleRestartClick() {
    if (window.restartGame && typeof window.restartGame === 'function') {
      window.restartGame();
    } else {
      console.warn('window.restartGame is not defined');
    }
  }

  // Update HUD with current game state
  // Optimized to only update DOM when values change
  window.updateHUD = function(score, speed, level) {
    // Initialize elements on first call if not already done
    if (!hudElement) {
      initializeElements();
    }

    // Update score display
    if (scoreDisplay) {
      const scoreText = 'Score: ' + Math.floor(score);
      if (scoreDisplay.textContent !== scoreText) {
        scoreDisplay.textContent = scoreText;
      }
    }

    // Update speed display
    if (speedDisplay) {
      const speedText = 'Speed: ' + speed.toFixed(1) + 'x';
      if (speedDisplay.textContent !== speedText) {
        speedDisplay.textContent = speedText;
      }
    }

    // Update level/wave display if element exists
    if (levelDisplay && level !== undefined && level !== null) {
      const levelText = 'Level: ' + Math.floor(level);
      if (levelDisplay.textContent !== levelText) {
        levelDisplay.textContent = levelText;
      }
    }
  };

  // Show game over modal with final score
  window.showGameOver = function(finalScore) {
    // Initialize elements if needed
    if (!gameOverModal) {
      initializeElements();
    }

    // Update final score display
    if (finalScoreDisplay) {
      finalScoreDisplay.textContent = 'Final Score: ' + Math.floor(finalScore);
    }

    // Show modal
    if (gameOverModal) {
      gameOverModal.classList.remove('hidden');
      gameOverModal.style.display = 'flex';
    }

    // Hide HUD
    if (hudElement) {
      hudElement.classList.add('hidden');
      hudElement.style.display = 'none';
    }

    // Disable input by setting a flag that game logic should check
    window.gameInputDisabled = true;
  };

  // Hide game over modal and show HUD
  window.hideGameOver = function() {
    // Initialize elements if needed
    if (!gameOverModal) {
      initializeElements();
    }

    // Hide modal
    if (gameOverModal) {
      gameOverModal.classList.add('hidden');
      gameOverModal.style.display = 'none';
    }

    // Show HUD
    if (hudElement) {
      hudElement.classList.remove('hidden');
      hudElement.style.display = 'block';
    }

    // Re-enable input
    window.gameInputDisabled = false;
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeElements);
  } else {
    initializeElements();
  }
})();

// Inject styles for HUD and Game-Over modal
(function() {
  'use strict';

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    /* HUD Styles */
    #hud {
      position: fixed;
      top: 20px;
      left: 20px;
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #00ff00;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-shadow: 0 0 10px rgba(0, 255, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.4);
      letter-spacing: 1px;
      transition: opacity 0.3s ease;
    }

    #hud.hidden {
      display: none !important;
    }

    #scoreDisplay,
    #speedDisplay,
    #levelDisplay {
      background: rgba(0, 20, 0, 0.6);
      padding: 8px 16px;
      border-radius: 4px;
      border: 1px solid rgba(0, 255, 0, 0.3);
      box-shadow: 0 0 8px rgba(0, 255, 0, 0.3), inset 0 0 8px rgba(0, 255, 0, 0.1);
      min-width: 180px;
    }

    /* Game Over Modal Styles */
    #gameOverModal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.3s ease;
    }

    #gameOverModal.hidden {
      display: none !important;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    #gameOverModal > div {
      background: linear-gradient(135deg, rgba(20, 0, 40, 0.95), rgba(0, 20, 40, 0.95));
      border: 2px solid rgba(255, 0, 255, 0.5);
      border-radius: 12px;
      padding: 40px 60px;
      text-align: center;
      box-shadow: 0 0 40px rgba(255, 0, 255, 0.4), 0 0 80px rgba(0, 255, 255, 0.2);
      max-width: 500px;
      animation: slideUp 0.4s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    #gameOverModal h2 {
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      font-size: 48px;
      font-weight: 700;
      color: #ff00ff;
      margin: 0 0 30px 0;
      text-shadow: 0 0 20px rgba(255, 0, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.4);
      letter-spacing: 2px;
    }

    #finalScoreDisplay {
      font-family: 'Courier New', monospace;
      font-size: 32px;
      font-weight: 600;
      color: #00ffff;
      margin: 20px 0 40px 0;
      text-shadow: 0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.4);
      letter-spacing: 1px;
    }

    #restartButton {
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: #000;
      background: linear-gradient(135deg, #00ff00, #00dd00);
      border: 2px solid #00ff00;
      border-radius: 6px;
      padding: 14px 40px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    }

    #restartButton:hover {
      background: linear-gradient(135deg, #00ff00, #00ff00);
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.8), 0 0 40px rgba(0, 255, 0, 0.4);
      transform: scale(1.05);
    }

    #restartButton:active {
      transform: scale(0.98);
      box-shadow: 0 0 10px rgba(0, 255, 0, 0.6);
    }

    /* Ensure text remains readable across all browsers */
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `;

  // Inject styles into document head
  if (document.head) {
    document.head.appendChild(styleSheet);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      document.head.appendChild(styleSheet);
    });
  }
})();
