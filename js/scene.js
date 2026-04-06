(function() {
  function initScene() {
    if (!window.BABYLON) return false;

    var canvas = document.getElementById('renderCanvas');
    if (!canvas) return false;
    window.canvas = canvas;

    window.engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    window.scene = new BABYLON.Scene(window.engine);

    window.scene.clearColor = new BABYLON.Color4(0.12, 0.22, 0.20, 1);
    window.scene.ambientColor = new BABYLON.Color3(0.15, 0.18, 0.14);

    window.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    window.scene.fogDensity = 0.006;
    window.scene.fogColor = new BABYLON.Color3(0.10, 0.20, 0.17);

    window.worldPivot = new BABYLON.TransformNode('worldPivot', window.scene);
    window.worldAngle = 0;
    window.targetWorldAngle = 0;
    window.turnSpeed = 2.5;

    var camera = new BABYLON.FreeCamera('cam', new BABYLON.Vector3(0, 7, -14), window.scene);
    camera.fov = 0.85;
    camera.minZ = 0.5;
    camera.maxZ = 200;
    window.camera = camera;
    window.scene.activeCamera = camera;

    var hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), window.scene);
    hemi.intensity = 0.45;
    hemi.diffuse = new BABYLON.Color3(0.85, 0.90, 0.80);
    hemi.groundColor = new BABYLON.Color3(0.12, 0.15, 0.10);

    var sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1.2, 0.8), window.scene);
    sun.intensity = 0.85;
    sun.diffuse = new BABYLON.Color3(1.0, 0.90, 0.70);

    var fill = new BABYLON.PointLight('fill', new BABYLON.Vector3(5, 8, -10), window.scene);
    fill.intensity = 0.25;
    fill.diffuse = new BABYLON.Color3(0.5, 0.7, 0.6);
    fill.range = 50;

    return true;
  }

  window.updateCamera = function(dt) {
    if (!window.camera) return;

    var angleDiff = window.targetWorldAngle - window.worldAngle;
    if (Math.abs(angleDiff) > 0.001) {
      window.worldAngle += angleDiff * Math.min(1, window.turnSpeed * dt);
      if (window.worldPivot) {
        window.worldPivot.rotation.y = window.worldAngle;
      }
    } else {
      window.worldAngle = window.targetWorldAngle;
    }

    var camDist = 14;
    var camH = 7;
    var lookAhead = 12;

    var sa = Math.sin(window.worldAngle);
    var ca = Math.cos(window.worldAngle);

    window.camera.position.x = -camDist * sa;
    window.camera.position.z = -camDist * ca;
    window.camera.position.y = camH;

    window.camera.setTarget(new BABYLON.Vector3(lookAhead * sa, 1.5, lookAhead * ca));
  };

  window.triggerTurn = function(direction) {
    window.targetWorldAngle += direction * (Math.PI / 2);
  };

  initScene();
})();
