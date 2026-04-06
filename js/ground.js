(function() {
  var groundTex = null;
  var pillarPool = [];
  var archPool = [];
  var PILLAR_SPACING = 18;
  var ARCH_SPACING = 45;

  function createStoneTexture(scene, bR, bG, bB, mR, mG, mB) {
    var s = 512;
    var dt = new BABYLON.DynamicTexture('sTex_' + Math.random().toString(36).slice(2), s, scene, false);
    var c = dt.getContext();
    c.fillStyle = 'rgb(' + bR + ',' + bG + ',' + bB + ')';
    c.fillRect(0, 0, s, s);
    var bH = 64, bW = 128, g = 5;
    for (var r = 0; r < s / bH; r++) {
      var y = r * bH;
      var off = (r % 2 === 0) ? 0 : bW / 2;
      c.fillStyle = 'rgb(' + mR + ',' + mG + ',' + mB + ')';
      c.fillRect(0, y, s, g);
      for (var x = off; x < s + bW; x += bW) c.fillRect(x - g / 2, y, g, bH);
      for (var bx = off; bx < s; bx += bW) {
        var vr = bR - 15 + Math.floor(Math.random() * 30);
        var vg = bG - 15 + Math.floor(Math.random() * 30);
        var vb = bB - 15 + Math.floor(Math.random() * 30);
        c.fillStyle = 'rgba(' + vr + ',' + vg + ',' + vb + ',0.4)';
        c.fillRect(bx + g, y + g, bW - g * 2, bH - g * 2);
      }
    }
    dt.update();
    return dt;
  }

  function createPillar(scene, parent, x, z) {
    var pillarMat = parent._pillarMat;
    if (!pillarMat) {
      pillarMat = new BABYLON.StandardMaterial('pillarMat', scene);
      pillarMat.diffuseColor = new BABYLON.Color3(0.45, 0.40, 0.32);
      pillarMat.specularColor = new BABYLON.Color3(0.1, 0.08, 0.06);
      parent._pillarMat = pillarMat;
    }

    var base = BABYLON.MeshBuilder.CreateBox('pBase', { width: 1.4, height: 0.5, depth: 1.4 }, scene);
    base.position.set(x, 0.25, z);
    base.material = pillarMat;
    base.parent = parent;

    var col = BABYLON.MeshBuilder.CreateCylinder('pCol', { height: 5, diameter: 0.8, tessellation: 8 }, scene);
    col.position.set(x, 3, z);
    col.material = pillarMat;
    col.parent = parent;

    var capH = Math.random() > 0.4 ? 0.6 : 0;
    if (capH > 0) {
      var cap = BABYLON.MeshBuilder.CreateBox('pCap', { width: 1.6, height: capH, depth: 1.6 }, scene);
      cap.position.set(x, 5.5 + capH / 2, z);
      cap.material = pillarMat;
      cap.parent = parent;
      return [base, col, cap];
    }
    return [base, col];
  }

  function createArch(scene, parent, z) {
    var archMat = parent._archMat;
    if (!archMat) {
      archMat = new BABYLON.StandardMaterial('archMat', scene);
      archMat.diffuseColor = new BABYLON.Color3(0.40, 0.36, 0.28);
      archMat.specularColor = new BABYLON.Color3(0.08, 0.06, 0.05);
      parent._archMat = archMat;
    }

    var meshes = [];

    var lPillar = BABYLON.MeshBuilder.CreateCylinder('aL', { height: 6, diameter: 1.0, tessellation: 8 }, scene);
    lPillar.position.set(-5.5, 3, z);
    lPillar.material = archMat;
    lPillar.parent = parent;
    meshes.push(lPillar);

    var rPillar = BABYLON.MeshBuilder.CreateCylinder('aR', { height: 6, diameter: 1.0, tessellation: 8 }, scene);
    rPillar.position.set(5.5, 3, z);
    rPillar.material = archMat;
    rPillar.parent = parent;
    meshes.push(rPillar);

    if (Math.random() > 0.3) {
      var beam = BABYLON.MeshBuilder.CreateBox('aBeam', { width: 12, height: 0.8, depth: 1.0 }, scene);
      beam.position.set(0, 6.4, z);
      beam.material = archMat;
      beam.parent = parent;
      meshes.push(beam);

      if (Math.random() > 0.5) {
        var topPiece = BABYLON.MeshBuilder.CreateBox('aTop', { width: 6, height: 0.5, depth: 1.0 }, scene);
        topPiece.position.set(0, 7.1, z);
        topPiece.material = archMat;
        topPiece.parent = parent;
        meshes.push(topPiece);
      }
    }

    return meshes;
  }

  window.initGround = function() {
    if (!window.scene || !window.worldPivot) return false;
    var scene = window.scene;
    var wp = window.worldPivot;

    groundTex = createStoneTexture(scene, 150, 135, 110, 85, 70, 55);
    groundTex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    groundTex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    groundTex.uScale = 3;
    groundTex.vScale = 30;

    var deckMat = new BABYLON.StandardMaterial('deckMat', scene);
    deckMat.diffuseTexture = groundTex;
    deckMat.specularColor = new BABYLON.Color3(0.12, 0.10, 0.08);

    var deck = BABYLON.MeshBuilder.CreateBox('deck', { width: 10, height: 0.6, depth: 250 }, scene);
    deck.position.set(0, -0.3, 35);
    deck.material = deckMat;
    deck.parent = wp;

    var edgeMat = new BABYLON.StandardMaterial('edgeMat', scene);
    edgeMat.diffuseColor = new BABYLON.Color3(0.38, 0.34, 0.26);
    edgeMat.specularColor = new BABYLON.Color3(0.08, 0.06, 0.04);

    var edgeL = BABYLON.MeshBuilder.CreateBox('edgeL', { width: 0.5, height: 1.0, depth: 250 }, scene);
    edgeL.position.set(-5.25, 0.2, 35);
    edgeL.material = edgeMat;
    edgeL.parent = wp;

    var edgeR = BABYLON.MeshBuilder.CreateBox('edgeR', { width: 0.5, height: 1.0, depth: 250 }, scene);
    edgeR.position.set(5.25, 0.2, 35);
    edgeR.material = edgeMat;
    edgeR.parent = wp;

    var railMat = new BABYLON.StandardMaterial('railMat', scene);
    railMat.diffuseColor = new BABYLON.Color3(0.42, 0.38, 0.30);
    railMat.specularColor = new BABYLON.Color3(0.1, 0.08, 0.06);
    railMat.alpha = 0.9;

    for (var rz = -80; rz <= 150; rz += 4) {
      var postL = BABYLON.MeshBuilder.CreateBox('rp', { width: 0.2, height: 1.5, depth: 0.2 }, scene);
      postL.position.set(-5.1, 1.2, rz);
      postL.material = railMat;
      postL.parent = wp;

      var postR = BABYLON.MeshBuilder.CreateBox('rp', { width: 0.2, height: 1.5, depth: 0.2 }, scene);
      postR.position.set(5.1, 1.2, rz);
      postR.material = railMat;
      postR.parent = wp;
    }

    var railBarL = BABYLON.MeshBuilder.CreateBox('rbL', { width: 0.12, height: 0.12, depth: 250 }, scene);
    railBarL.position.set(-5.1, 1.95, 35);
    railBarL.material = railMat;
    railBarL.parent = wp;

    var railBarR = BABYLON.MeshBuilder.CreateBox('rbR', { width: 0.12, height: 0.12, depth: 250 }, scene);
    railBarR.position.set(5.1, 1.95, 35);
    railBarR.material = railMat;
    railBarR.parent = wp;

    for (var pz = -60; pz <= 140; pz += PILLAR_SPACING) {
      createPillar(scene, wp, -6.5, pz);
      createPillar(scene, wp, 6.5, pz);
    }

    for (var az = -20; az <= 120; az += ARCH_SPACING) {
      createArch(scene, wp, az);
    }

    var laneMarkerMat = new BABYLON.StandardMaterial('lmMat', scene);
    laneMarkerMat.diffuseColor = new BABYLON.Color3(0.50, 0.45, 0.36);
    laneMarkerMat.alpha = 0.35;

    [-1.5, 1.5].forEach(function(lx) {
      var m = BABYLON.MeshBuilder.CreateBox('lm', { width: 0.06, height: 0.02, depth: 250 }, scene);
      m.position.set(lx, 0.01, 35);
      m.material = laneMarkerMat;
      m.parent = wp;
    });

    window.groundTexture = groundTex;
    return true;
  };

  window.scrollGround = function(speed, dt) {
    if (groundTex) groundTex.vOffset -= speed * dt * 0.08;
  };

  window.initGround();
})();
