(function() {
  window.spawnCoinParticles = function(position) {
    if (!window.scene) return;

    var ps = new BABYLON.ParticleSystem('coinFx', 30, window.scene);

    var emitter = BABYLON.MeshBuilder.CreateSphere('coinEmitter', { diameter: 0.1 }, window.scene);
    emitter.position = position;
    emitter.isVisible = false;
    ps.emitter = emitter;

    ps.createSphereEmitter(0.3);
    ps.addColorGradient(0, new BABYLON.Color4(1, 0.9, 0.2, 1));
    ps.addColorGradient(0.5, new BABYLON.Color4(1, 0.7, 0, 0.8));
    ps.addColorGradient(1, new BABYLON.Color4(1, 0.5, 0, 0));

    ps.minSize = 0.08;
    ps.maxSize = 0.2;
    ps.minLifeTime = 0.3;
    ps.maxLifeTime = 0.8;
    ps.emitRate = 80;
    ps.gravity = new BABYLON.Vector3(0, 3, 0);
    ps.minEmitPower = 2;
    ps.maxEmitPower = 4;

    ps.targetStopDuration = 0.15;
    ps.disposeOnStop = true;
    ps.start();

    setTimeout(function() {
      emitter.dispose();
    }, 1200);
  };

  window.updateParticles = function() {};
})();
