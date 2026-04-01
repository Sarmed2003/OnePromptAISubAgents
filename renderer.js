/**
 * Renderer Module
 * Handles all canvas drawing operations
 */

function render(ctx, player, obstacles, coins, score) {
  if (!ctx || !player) {
    return;
  }

  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 800, 600);

  // Draw lane dividers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  
  // Vertical lines dividing lanes
  ctx.beginPath();
  ctx.moveTo(800 / 3, 0);
  ctx.lineTo(800 / 3, 600);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo((800 / 3) * 2, 0);
  ctx.lineTo((800 / 3) * 2, 600);
  ctx.stroke();
  
  ctx.setLineDash([]);

  // Draw all obstacles
  if (obstacles && obstacles.length > 0) {
    for (let obstacle of obstacles) {
      obstacle.draw(ctx);
    }
  }

  // Draw all coins
  if (coins && coins.length > 0) {
    for (let coin of coins) {
      coin.draw(ctx);
    }
  }

  // Draw player
  player.draw(ctx);
}