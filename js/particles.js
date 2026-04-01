/**
 * Particle Effects System
 * Manages particle effects for coin collection and visual feedback
 */

(function() {
  // Store active particle systems
  const particleSystems = [];

  /**
   * Spawn coin collection particle effect
   * @param {BABYLON.Vector3} position - Position to spawn particles at
   */
  window.spawnCoinParticles = function(position) {
    if (!window.scene) {
      return;
    }

    // Create a particle system for coin collection
    const particleSystem = new BABYLON.ParticleSystem('coinParticles', 50, window.scene);

    // Create a temporary emitter mesh
    const emitter = BABYLON.MeshBuilder.CreateSphere('emitter', { diameter: 0.1 }, window.scene);
    emitter.position = position.clone();
    emitter.isVisible = false;

    particleSystem.emitter = emitter;
    particleSystem.particleTexture = new BABYLON.DynamicTexture('particleTexture', 64, window.scene);

    // Particle behavior
    particleSystem.addColorGradient(0, new BABYLON.Color4(1, 0.84, 0, 1));
    particleSystem.addColorGradient(1, new BABYLON.Color4(1, 0.84, 0, 0));

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1.0;

    particleSystem.emitRate = 100;

    particleSystem.createSphereEmitter(0.5);

    particleSystem.addVelocityGradient(0, 1);
    particleSystem.addVelocityGradient(1, 0);

    // Start particle system
    particleSystem.start();

    // Track particle system for cleanup
    particleSystems.push({
      system: particleSystem,
      emitter: emitter,
      startTime: Date.now()
    });

    // Auto-dispose after effect completes
    setTimeout(function() {
      particleSystem.dispose();
      emitter.dispose();
      const index = particleSystems.findIndex(p => p.system === particleSystem);
      if (index >= 0) {
        particleSystems.splice(index, 1);
      }
    }, 1500);
  };

  /**
   * Update particle systems each frame
   * @param {number} deltaTime - Time since last frame in seconds
   */
  window.updateParticles = function(deltaTime) {
    // Particle systems are managed by Babylon.js automatically
    // This function is called for consistency with other update functions
  };

})();
