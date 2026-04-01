// Particle effects for coin collection
// Creates a burst of gold-colored particles that fade out and are cleaned up

window.spawnCoinParticles = function(position) {
  // Ensure scene exists
  if (!window.scene) {
    console.warn('Scene not initialized yet');
    return;
  }

  const scene = window.scene;
  const particleCount = 12;
  const particleDuration = 0.5; // seconds
  const particleSize = 0.15;
  const spreadSpeed = 15; // units per second

  // Create a container for this burst
  const burstParticles = [];
  const startTime = Date.now();

  // Create individual particle meshes
  for (let i = 0; i < particleCount; i++) {
    // Randomly choose cube or sphere for visual variety
    let particle;
    if (Math.random() > 0.5) {
      particle = BABYLON.MeshBuilder.CreateBox(`coin_particle_${i}_${Date.now()}`, {
        size: particleSize
      }, scene);
    } else {
      particle = BABYLON.MeshBuilder.CreateSphere(`coin_particle_${i}_${Date.now()}`, {
        diameter: particleSize,
        segments: 8
      }, scene);
    }

    // Set position to coin location
    particle.position.copyFrom(position);

    // Create gold material
    const goldMaterial = new BABYLON.StandardMaterial(`gold_mat_${i}_${Date.now()}`, scene);
    goldMaterial.diffuse = new BABYLON.Color3(1, 0.84, 0); // Gold color
    goldMaterial.specularColor = new BABYLON.Color3(1, 0.95, 0.3);
    goldMaterial.specularPower = 64;
    goldMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.25, 0); // Subtle glow
    particle.material = goldMaterial;

    // Calculate random direction (outward burst)
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const vx = Math.sin(phi) * Math.cos(theta);
    const vy = Math.sin(phi) * Math.sin(theta);
    const vz = Math.cos(phi);

    // Store particle data
    burstParticles.push({
      mesh: particle,
      velocity: new BABYLON.Vector3(vx * spreadSpeed, vy * spreadSpeed, vz * spreadSpeed),
      startTime: startTime,
      duration: particleDuration,
      material: goldMaterial
    });
  }

  // Animation function for this burst
  const animateBurst = function() {
    const now = Date.now();
    let allFinished = true;

    for (let i = 0; i < burstParticles.length; i++) {
      const p = burstParticles[i];
      const elapsed = (now - p.startTime) / 1000; // Convert to seconds
      const progress = elapsed / p.duration;

      if (progress < 1) {
        allFinished = false;

        // Update position (constant velocity)
        const dt = 1 / 60; // Approximate delta time per frame
        p.mesh.position.addInPlace(
          BABYLON.Vector3.Scale(p.velocity, dt)
        );

        // Fade out alpha
        const alpha = 1 - progress;
        p.material.alpha = alpha;

        // Optional: slight scale down
        const scale = 1 - (progress * 0.3);
        p.mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
      }
    }

    // If all particles finished, clean up
    if (allFinished) {
      for (let i = 0; i < burstParticles.length; i++) {
        const p = burstParticles[i];
        p.mesh.dispose();
        p.material.dispose();
      }
      burstParticles.length = 0;
      scene.unregisterBeforeRender(animateBurst);
    }
  };

  // Register animation loop
  scene.registerBeforeRender(animateBurst);

  // Failsafe cleanup after 1 second (2x duration) to prevent memory leaks
  setTimeout(function() {
    if (burstParticles.length > 0) {
      for (let i = 0; i < burstParticles.length; i++) {
        const p = burstParticles[i];
        if (p.mesh && !p.mesh.isDisposed()) {
          p.mesh.dispose();
        }
        if (p.material && !p.material.isDisposed()) {
          p.material.dispose();
        }
      }
      burstParticles.length = 0;
      scene.unregisterBeforeRender(animateBurst);
    }
  }, 1000);
};
