/**
 * Recipe-driven Three.js floppy-otter plush preview.
 * Scales from animal.parts inches + gauge (SPI/RPI), including stitch caps.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

var BUILD_TAG = "engine35";

function snap6(n) {
  return Math.max(6, Math.round(n / 6) * 6);
}

function stitchesForDiameter(diameterIn, spi) {
  return snap6(Math.PI * diameterIn * spi);
}

function actualDiameterIn(stitches, spi) {
  return stitches / (Math.PI * Math.max(0.5, spi));
}

function partByKey(animal, key) {
  const parts = (animal && animal.parts) || [];
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i].key === key) return parts[i];
  }
  return null;
}

/**
 * Convert recipe diameter → finished plush diameter after max-stitch cap
 * (same idea as shapes.js otter head/body builders).
 */
function finishedDiameterIn(diameterIn, spi, maxStitchCap, opts) {
  opts = opts || {};
  let sts = stitchesForDiameter(diameterIn, spi);
  if (opts.minSts != null) sts = Math.max(opts.minSts, sts);
  if (maxStitchCap != null && sts > maxStitchCap) sts = snap6(maxStitchCap);
  if (opts.snapAfterCap) sts = snap6(sts);
  return actualDiameterIn(sts, spi);
}

function makeChenilleTexture(baseHex, stitchHex) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.6 + Math.random() * 2;
    const a = 0.05 + Math.random() * 0.12;
    ctx.fillStyle =
      Math.random() > 0.45
        ? "rgba(255,255,255," + a + ")"
        : stitchHex.replace(/[\d.]+\)$/, a.toFixed(2) + ")");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = stitchHex;
  ctx.lineWidth = 0.9;
  ctx.globalAlpha = 0.35;
  for (let y = 0; y < size; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function yarnMat(hex, stitchHex) {
  return new THREE.MeshStandardMaterial({
    map: makeChenilleTexture(hex, stitchHex || "rgba(0,0,0,0.18)"),
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0,
  });
}

function addEllipsoid(parent, mat, rx, ry, rz, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 28), mat);
  mesh.scale.set(rx, ry, rz);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Prefer live stitch builders (same as pattern text) for arm/tail/body sizes.
 * Diameter = stitches / (π × SPI); length ≈ rounds / RPI.
 */
function stitchBuiltMetrics(animal, gauge) {
  const shapes = typeof window !== "undefined" ? window.AmigurumiShapes : null;
  if (!shapes) return null;

  const spi = gauge.spi;
  const rpi = gauge.rpi;
  const headP = partByKey(animal, "head");
  const bodyP = partByKey(animal, "body");
  const armP = partByKey(animal, "arm");
  const tailP = partByKey(animal, "tail");
  const cap =
    (bodyP && bodyP.maxStitchCap) ||
    (animal && animal.yarnProfile && animal.yarnProfile.maxStitchCap) ||
    null;

  const bodyDiameterIn = (bodyP && bodyP.diameterIn) || 3.8;
  const bodyHeightIn =
    (bodyP && bodyP.heightIn) || Math.max(bodyDiameterIn * 0.9, 3.2);
  const armHeightIn = (armP && armP.heightIn) || 1.3;
  const tailLengthIn = (tailP && tailP.heightIn) || 3.4;

  let bodyBuilt = null;
  let armBuilt = null;
  let tailBuilt = null;
  try {
    if (shapes.buildOtterBodyPattern) {
      bodyBuilt = shapes.buildOtterBodyPattern(
        "Body",
        bodyDiameterIn,
        bodyHeightIn,
        gauge,
        {
          maxStitchCap: cap,
          preferCh2Start: bodyP && bodyP.preferCh2Start,
          minBellyEven: bodyP && bodyP.minBellyEven,
        }
      );
    }
    if (shapes.buildOtterNarrowArmPattern) {
      armBuilt = shapes.buildOtterNarrowArmPattern("Arm", armHeightIn, gauge);
    }
    if (shapes.buildOtterThickTailPattern) {
      tailBuilt = shapes.buildOtterThickTailPattern(
        "Tail",
        tailLengthIn,
        gauge,
        {
          bodyMaxStitches: bodyBuilt && bodyBuilt.maxStitches,
          bodyDiameterIn: bodyDiameterIn,
        }
      );
    }
  } catch (err) {
    return null;
  }

  if (!bodyBuilt || !armBuilt || !tailBuilt) return null;

  return {
    bodySts: bodyBuilt.maxStitches,
    bodyD: actualDiameterIn(bodyBuilt.maxStitches, spi),
    bodyH: bodyHeightIn,
    armSts: armBuilt.maxStitches,
    armD: actualDiameterIn(armBuilt.maxStitches, spi),
    // Tube length from total rounds worked (includes MR/inc + even + fold prep)
    armH: Math.max(0.5, (armBuilt.lastRound || 1) / rpi),
    tailBaseSts: tailBuilt.maxStitches,
    tailBaseD: actualDiameterIn(tailBuilt.maxStitches, spi),
    tailTipD: actualDiameterIn(6, spi),
    tailLen: Math.max(0.8, (tailBuilt.lastRound || 1) / rpi),
    fromStitchBuilders: true,
  };
}

/**
 * Build inch metrics from the same recipe the pattern text uses.
 */
function recipeMetrics(animal, gauge, faceStyle) {
  const spi = (gauge && gauge.spi) || 5;
  const rpi = (gauge && gauge.rpi) || 5.5;
  const H = (animal && animal.designedHeightIn) || 10;
  const headP = partByKey(animal, "head");
  const bodyP = partByKey(animal, "body");
  const armP = partByKey(animal, "arm");
  const legP = partByKey(animal, "leg");
  const tailP = partByKey(animal, "tail");
  const earP = partByKey(animal, "ear");
  const muzzleP = partByKey(animal, "muzzle");
  const cap =
    (headP && headP.maxStitchCap) ||
    (bodyP && bodyP.maxStitchCap) ||
    (animal && animal.yarnProfile && animal.yarnProfile.maxStitchCap) ||
    null;

  const headD = finishedDiameterIn(
    (headP && headP.diameterIn) || H * 0.4,
    spi,
    cap
  );

  // Prefer exact stitch-builder sizes for body / arms / tail
  const built = stitchBuiltMetrics(animal, { spi: spi, rpi: rpi });

  let bodyD;
  let bodyH;
  let armD;
  let armH;
  let armSts;
  let tailBaseD;
  let tailTipD;
  let tailLen;
  let tailBaseSts;
  let bodySts;

  if (built) {
    bodyD = built.bodyD;
    bodyH = built.bodyH;
    bodySts = built.bodySts;
    armD = built.armD;
    armH = built.armH;
    armSts = built.armSts;
    tailBaseD = built.tailBaseD;
    tailTipD = built.tailTipD;
    tailLen = built.tailLen;
    tailBaseSts = built.tailBaseSts;
  } else {
    bodyD = finishedDiameterIn(
      (bodyP && bodyP.diameterIn) || headD * 0.95,
      spi,
      cap,
      { minSts: 30, snapAfterCap: true }
    );
    bodyH =
      (bodyP && bodyP.heightIn) || Math.max(bodyD * 0.9, H * 0.32);
    bodySts = stitchesForDiameter(bodyD, spi);
    armSts = Math.max(8, Math.min(10, stitchesForDiameter(0.7, spi)));
    if (armSts % 2 === 1) armSts += 1;
    if (armSts > 10) armSts = 10;
    if (armSts < 8) armSts = 8;
    armD = actualDiameterIn(armSts, spi);
    const armTargetH = (armP && armP.heightIn) || headD * 0.32;
    const armEven = Math.max(5, Math.round(armTargetH * rpi));
    armH = (2 + armEven) / rpi;
    tailBaseSts = Math.max(12, Math.round(bodySts * 0.5));
    if (tailBaseSts % 2 === 1) tailBaseSts += 1;
    tailBaseD = actualDiameterIn(tailBaseSts, spi);
    tailTipD = actualDiameterIn(6, spi);
    const tailTarget = (tailP && tailP.heightIn) || headD * 0.85;
    tailLen = Math.max(8, Math.round(tailTarget * rpi)) / rpi;
  }

  // Paddle: foundation chain length ≈ ch / SPI; oval widens a bit
  const chLen = (legP && legP.chLen) || 7;
  const paddleLen = Math.max(1.1, (chLen / spi) * 1.45);
  const paddleWid = paddleLen * 0.62;
  const paddleThick = Math.max(
    0.28,
    Math.min(0.55, ((legP && legP.maxRounds) || 7) / rpi * 0.45)
  );

  const earD = (earP && earP.diameterIn) || headD * 0.22;

  const muzCh = (muzzleP && muzzleP.chLen) || 5;
  const muzzleLen = Math.max(0.7, (muzCh / spi) * 1.35);
  const muzzleWid = muzzleLen * 0.75;
  const muzzleDepth = Math.max(0.35, 3.5 / rpi);
  const creamMaskH = 7 / rpi;

  return {
    H: H,
    spi: spi,
    rpi: rpi,
    faceStyle: faceStyle,
    headD: headD,
    bodyD: bodyD,
    bodyH: bodyH,
    bodySts: bodySts,
    armD: armD,
    armH: armH,
    armSts: armSts,
    paddleLen: paddleLen,
    paddleWid: paddleWid,
    paddleThick: paddleThick,
    tailLen: tailLen,
    tailBaseD: tailBaseD,
    tailTipD: tailTipD,
    tailBaseSts: tailBaseSts,
    earD: earD,
    muzzleLen: muzzleLen,
    muzzleWid: muzzleWid,
    muzzleDepth: muzzleDepth,
    creamMaskH: creamMaskH,
    fromRecipe: !!(animal && animal.parts && animal.parts.length),
    fromStitchBuilders: !!(built && built.fromStitchBuilders),
  };
}

function buildOtterGroup(m) {
  const group = new THREE.Group();
  // 1 inch → scene units (fit ~10" otter in the viewport)
  const U = 2.15 / m.H;
  function u(inches) {
    return inches * U;
  }

  const main = yarnMat("#8b5a32", "rgba(45,22,8,0.22)");
  const deep = yarnMat("#5c3a1c", "rgba(30,14,6,0.28)");
  const cream = yarnMat("#f3e6d0", "rgba(100,75,45,0.14)");

  // Body: plump egg — diameter × height from recipe
  const bodyRx = u(m.bodyD / 2);
  const bodyRy = u(m.bodyH / 2);
  const bodyRz = u(m.bodyD / 2 * 0.95);
  const bodyY = bodyRy;
  addEllipsoid(group, main, bodyRx, bodyRy, bodyRz, 0, bodyY, 0);
  // Cream tummy — front panel sized to ~70% body face
  addEllipsoid(
    group,
    cream,
    bodyRx * 0.72,
    bodyRy * 0.7,
    u(0.22),
    0,
    bodyY - u(0.05),
    bodyRz * 0.85
  );

  // Tail backrest (assembly: sew thick BASE low on the rump; tip leans UP behind)
  const tailBaseR = u(m.tailBaseD / 2);
  const tipR = u(Math.max(m.tailTipD, m.tailBaseD * 0.22) / 2);
  const tLen = u(m.tailLen);
  // Sew point = lower rear / rump (near the hips, not the upper back)
  const sew = new THREE.Vector3(0, bodyY - bodyRy * 0.72, -bodyRz * 0.98);
  // Tip aims up + slightly back (backrest), never down or out of the shoulders
  const tipDir = new THREE.Vector3(0, 0.88, -0.47).normalize();
  const tipPos = sew.clone().add(tipDir.clone().multiplyScalar(tLen));
  const mid = new THREE.Vector3().addVectors(sew, tipPos).multiplyScalar(0.5);
  // radiusTop=tip (thin), radiusBottom=base (thick) — cylinder +Y goes sew→tip
  const tailMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(tipR, tailBaseR, tLen, 22, 1, false),
    deep
  );
  tailMesh.position.copy(mid);
  tailMesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    tipPos.clone().sub(sew).normalize()
  );
  tailMesh.castShadow = true;
  tailMesh.receiveShadow = true;
  group.add(tailMesh);

  // Paddle feet — oval sole size from chain/SPI
  const pLen = u(m.paddleLen / 2);
  const pWid = u(m.paddleWid / 2);
  const pTh = u(m.paddleThick / 2);
  const footY = u(m.paddleThick * 0.35);
  const footZ = bodyRz * 0.55 + pLen * 0.6;
  const footX = bodyRx * 0.55;
  const footL = addEllipsoid(group, main, pLen, pTh, pWid, -footX, footY, footZ);
  const footR = addEllipsoid(group, main, pLen, pTh, pWid, footX, footY, footZ);
  footL.rotation.y = 0.22;
  footR.rotation.y = -0.22;
  addEllipsoid(group, cream, pLen * 0.55, pTh * 0.45, pWid * 0.55, -footX, footY + pTh, footZ + pLen * 0.15);
  addEllipsoid(group, cream, pLen * 0.55, pTh * 0.45, pWid * 0.55, footX, footY + pTh, footZ + pLen * 0.15);

  // Narrow arms: true tubes (cylinder) — diameter from 8–10 sts, length from rounds/RPI
  const aR = u(m.armD / 2);
  const aLen = u(m.armH);
  function addArm(side) {
    const geo = new THREE.CylinderGeometry(aR, aR * 0.92, aLen, 14, 1, false);
    const mesh = new THREE.Mesh(geo, main);
    const armY = bodyY + bodyRy * 0.28;
    const armZ = bodyRz * 0.5;
    const armX = bodyRx * 0.72 * side;
    mesh.position.set(armX, armY, armZ);
    // Angle inward toward chest (narrow, short tubes)
    mesh.rotation.z = side > 0 ? -0.55 : 0.55;
    mesh.rotation.x = 0.35;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  addArm(-1);
  addArm(1);

  // Head — finished diameter after stitch cap
  const headR = u(m.headD / 2);
  const headY = bodyY + bodyRy + headR * 0.82;
  const headZ = u(0.08);
  addEllipsoid(group, main, headR, headR * 0.96, headR * 0.96, 0, headY, headZ);

  if (m.faceStyle === "CONTINUOUS_NOSE_FIRST") {
    // Cream mask height ≈ 7 rounds / RPI
    const maskH = u(m.creamMaskH / 2);
    const snout = addEllipsoid(
      group,
      cream,
      headR * 0.88,
      maskH,
      headR * 0.78,
      0,
      headY - headR * 0.22,
      headZ + headR * 0.35
    );
    snout.scale.y = Math.max(0.45, (m.creamMaskH / m.headD) * 1.1);
  } else {
    const mzX = u(m.muzzleWid / 2);
    const mzY = u(m.muzzleDepth / 2);
    const mzZ = u(m.muzzleLen / 2);
    addEllipsoid(
      group,
      cream,
      mzX,
      mzY,
      mzZ,
      0,
      headY - headR * 0.15,
      headZ + headR * 0.75
    );
  }

  // Eyes / nose scale with head
  const eyeR = headR * 0.13;
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.15,
    metalness: 0.4,
  });
  const eyeGeo = new THREE.SphereGeometry(1, 20, 16);
  const eyeY =
    m.faceStyle === "CONTINUOUS_NOSE_FIRST"
      ? headY + headR * 0.08
      : headY + headR * 0.18;
  const eyeZ =
    m.faceStyle === "CONTINUOUS_NOSE_FIRST"
      ? headZ + headR * 0.85
      : headZ + headR * 0.82;
  [-1, 1].forEach(function (side) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.scale.setScalar(eyeR);
    eye.position.set(side * headR * 0.35, eyeY, eyeZ);
    group.add(eye);
    const hi = new THREE.Mesh(
      new THREE.SphereGeometry(eyeR * 0.28, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    hi.position.set(side * headR * 0.35 - eyeR * 0.25, eyeY + eyeR * 0.35, eyeZ + eyeR * 0.7);
    group.add(hi);
  });

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(1, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 })
  );
  nose.scale.set(eyeR * 0.85, eyeR * 0.55, eyeR * 0.75);
  nose.position.set(
    0,
    m.faceStyle === "CONTINUOUS_NOSE_FIRST"
      ? headY - headR * 0.28
      : headY - headR * 0.22,
    m.faceStyle === "CONTINUOUS_NOSE_FIRST"
      ? headZ + headR * 1.05
      : headZ + headR * 1.12
  );
  group.add(nose);

  // Ears from recipe diameter
  const earR = u(m.earD / 2);
  addEllipsoid(group, main, earR, earR * 0.75, earR * 0.7, -headR * 0.7, headY + headR * 0.65, headZ - headR * 0.1);
  addEllipsoid(group, main, earR, earR * 0.75, earR * 0.7, headR * 0.7, headY + headR * 0.65, headZ - headR * 0.1);

  group.rotation.x = 0.06;
  // Center the stack in view
  group.position.y = -u(m.bodyH * 0.35);
  return group;
}

function makeSoftShadow() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    6,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "rgba(40,50,70,0.3)");
  g.addColorStop(0.55, "rgba(40,50,70,0.1)");
  g.addColorStop(1, "rgba(40,50,70,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.5),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.05;
  return mesh;
}

function fmtIn(n) {
  return (Math.round(n * 10) / 10).toFixed(1) + '"';
}

function createOtter3DPreview(container, options) {
  options = options || {};
  const animal = options.animal || null;
  const gauge = options.gauge || { spi: 5, rpi: 5.5 };
  const faceStyle =
    options.facialConstructionStyle ||
    (options.patternRequest && options.patternRequest.facialConstructionStyle) ||
    "SEPARATE_PATCH";

  const metrics = recipeMetrics(animal, gauge, faceStyle);

  if (container._otter3d && container._otter3d.dispose) {
    container._otter3d.dispose();
  }
  container.innerHTML = "";
  container.hidden = false;
  container.style.position = "relative";

  const badge = document.createElement("div");
  badge.textContent = metrics.fromRecipe
    ? "3D " +
      BUILD_TAG +
      " · " +
      fmtIn(metrics.H) +
      " · arms " +
      (metrics.armSts || "?") +
      "sts/" +
      fmtIn(metrics.armD) +
      " · tail base " +
      (metrics.tailBaseSts || "?") +
      "sts/" +
      fmtIn(metrics.tailBaseD) +
      (metrics.fromStitchBuilders ? " · stitch-true" : "")
    : "3D " + BUILD_TAG + " · fallback sizes (generate pattern first)";
  badge.style.cssText =
    "position:absolute;left:10px;top:10px;z-index:2;font:600 11px/1.3 system-ui,sans-serif;" +
    "background:rgba(255,255,255,0.9);color:#3a2a1a;padding:6px 10px;border-radius:10px;" +
    "box-shadow:0 1px 4px rgba(0,0,0,0.12);pointer-events:none;max-width:92%;";
  container.appendChild(badge);

  const width = container.clientWidth || 420;
  const height = Math.min(440, Math.max(340, width));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd8e2ec);

  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
  camera.position.set(0.4, 1.2, 3.7);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.borderRadius = "12px";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.cursor = "grab";

  scene.add(new THREE.HemisphereLight(0xf5fbff, 0x7a8a9a, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(2, 5, 4);
  key.castShadow = true;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe2c4, 0.4);
  fill.position.set(-3, 2, 1);
  scene.add(fill);

  scene.add(makeSoftShadow());

  const otterRoot = new THREE.Group();
  const otter = buildOtterGroup(metrics);
  otterRoot.add(otter);
  scene.add(otterRoot);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.8;
  controls.maxDistance = 8;
  controls.maxPolarAngle = Math.PI * 0.55;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.update();

  let frame = 0;
  let alive = true;
  let t0 = performance.now();
  function animate(now) {
    if (!alive) return;
    frame = requestAnimationFrame(animate);
    const t = (now - t0) / 1000;
    otter.position.y = Math.sin(t * 1.3) * 0.025;
    controls.update();
    renderer.render(scene, camera);
  }
  animate(t0);

  function onResize() {
    const w = container.clientWidth || 420;
    const h = Math.min(440, Math.max(340, w));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  const api = {
    metrics: metrics,
    dispose: function () {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      container.innerHTML = "";
      container._otter3d = null;
    },
  };
  container._otter3d = api;
  return api;
}

window.AmigurumiOtter3D = {
  createOtter3DPreview: createOtter3DPreview,
  recipeMetrics: recipeMetrics,
  BUILD_TAG: BUILD_TAG,
};
