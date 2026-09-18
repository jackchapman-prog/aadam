/**
 * Recipe-driven Three.js plush preview for all quick-pick animals.
 * Layout by posture family; sizes from animal.parts inches (+ otter stitch builders).
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

var BUILD_TAG = "engine43";

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
function partsByKey(animal, key) {
  return ((animal && animal.parts) || []).filter(function (p) {
    return p.key === key;
  });
}
function finishedDiameterIn(diameterIn, spi, maxStitchCap) {
  let sts = stitchesForDiameter(diameterIn, spi);
  if (maxStitchCap != null && sts > maxStitchCap) sts = snap6(maxStitchCap);
  return actualDiameterIn(sts, spi);
}
function inch(part, field, fallback) {
  if (!part) return fallback;
  if (part[field] != null) return part[field];
  if (part.diameterIn != null) return part.diameterIn;
  if (part.heightIn != null) return part.heightIn;
  if (part.lengthIn != null) return part.lengthIn;
  return fallback;
}

function speciesPalette(name) {
  const n = String(name || "").toLowerCase();
  if (n.indexOf("otter") >= 0) return { main: "#8b5a32", deep: "#5c3a1c", cream: "#f3e6d0", accent: "#c48a52" };
  if (n.indexOf("deer") >= 0) return { main: "#b07a45", deep: "#7a4e28", cream: "#f2e4cc", accent: "#d4a574" };
  if (n.indexOf("unicorn") >= 0) return { main: "#e8dff5", deep: "#c4b0e0", cream: "#fff6fb", accent: "#f0a0c8", hoof: "#5c4a6a", horn: "#e8c84a" };
  if (n.indexOf("hippo") >= 0) return { main: "#9aa3b0", deep: "#6d7582", cream: "#e8ecef", accent: "#b8c0cc" };
  if (n.indexOf("chinchilla") >= 0) return { main: "#c5b8a8", deep: "#8f8274", cream: "#f4efe8", accent: "#ddd2c4" };
  if (n.indexOf("fox") >= 0) return { main: "#d2691e", deep: "#8b4513", cream: "#fff5e6", accent: "#e8954a" };
  if (n.indexOf("cat") >= 0 || n.indexOf("kitten") >= 0) return { main: "#c4a484", deep: "#8b6914", cream: "#fff0e0", accent: "#e0c090" };
  if (n.indexOf("teddy") >= 0 || n.indexOf("bear") >= 0) return { main: "#c4a35a", deep: "#8a6b2f", cream: "#f5e6c8", accent: "#e0c070" };
  if (n.indexOf("elephant") >= 0) return { main: "#a8a8b0", deep: "#6e6e78", cream: "#ececf0", accent: "#c0c0c8" };
  if (n.indexOf("giraffe") >= 0) return { main: "#e0a84a", deep: "#a86a20", cream: "#fff0d0", accent: "#f0c060" };
  if (n.indexOf("owl") >= 0) return { main: "#8b6914", deep: "#5c4010", cream: "#f5e6c8", accent: "#c4a050" };
  if (n.indexOf("shark") >= 0) return { main: "#7a8a9a", deep: "#4a5868", cream: "#e8eef4", accent: "#9aaab0" };
  if (n.indexOf("dragon") >= 0) return { main: "#3d8b5a", deep: "#1e5a35", cream: "#e8f5ec", accent: "#5cbf7a" };
  if (n.indexOf("octopus") >= 0) return { main: "#c45a7a", deep: "#8a3050", cream: "#ffe8f0", accent: "#e080a0" };
  if (n.indexOf("turtle") >= 0) return { main: "#5a8a4a", deep: "#3a5a2a", cream: "#e8f0d8", accent: "#7aaa5a" };
  if (n.indexOf("bunny") >= 0 || n.indexOf("rabbit") >= 0) return { main: "#e8d8c8", deep: "#b0a090", cream: "#fff8f0", accent: "#f0e0d0" };
  return { main: "#8b5a32", deep: "#5c3a1c", cream: "#f3e6d0", accent: "#c48a52" };
}

function makeChenilleTexture(baseHex, stitchHex) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const a = 0.05 + Math.random() * 0.12;
    ctx.fillStyle =
      Math.random() > 0.45
        ? "rgba(255,255,255," + a + ")"
        : "rgba(0,0,0," + a * 0.5 + ")";
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 0.6 + Math.random() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function yarnMat(hex) {
  return new THREE.MeshStandardMaterial({
    map: makeChenilleTexture(hex, "rgba(0,0,0,0.18)"),
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0,
  });
}

function solidMat(hex, opts) {
  opts = opts || {};
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness: opts.roughness != null ? opts.roughness : 0.85,
    metalness: opts.metalness != null ? opts.metalness : 0,
  });
}

function addEllipsoid(parent, mat, rx, ry, rz, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), mat);
  mesh.scale.set(rx, ry, rz);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, mat, rTop, rBot, len, x, y, z, rotX, rotZ) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, len, 14, 1, false),
    mat
  );
  mesh.position.set(x, y, z);
  if (rotX) mesh.rotation.x = rotX;
  if (rotZ) mesh.rotation.z = rotZ;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addEyes(group, headR, headY, headZ, matBlack) {
  const eyeR = headR * 0.12;
  const eyeGeo = new THREE.SphereGeometry(1, 14, 12);
  [-1, 1].forEach(function (side) {
    const eye = new THREE.Mesh(eyeGeo, matBlack);
    eye.scale.setScalar(eyeR);
    eye.position.set(side * headR * 0.35, headY + headR * 0.1, headZ + headR * 0.82);
    group.add(eye);
  });
}

/**
 * PATH B - CONTINUOUS_NOSE_FIRST (matches shapes.buildOtterContinuousHeadPattern):
 * Tip MR -> cream R1-7 ending at 24 sts -> clean switch -> main expands/closes at back.
 * Eyes sit just above the cream snout at the switch line.
 */
function addContinuousNoseFirstHead(group, mats, opts) {
  const headD = opts.headD;
  const spi = opts.spi;
  const rpi = opts.rpi;
  const u = opts.u;
  const headY = opts.headY;
  const creamEndSts = 24; // pattern R6-R7
  const tipSts = 6;
  const creamDepthIn = Math.max(0.5, 7 / Math.max(1, rpi));
  const creamEndD = actualDiameterIn(creamEndSts, spi);
  const tipD = actualDiameterIn(tipSts, spi);
  const headR = u(headD / 2);
  const creamEndR = Math.min(u(creamEndD / 2), headR * 0.95);
  const tipR = Math.max(u(tipD / 2), headR * 0.12);
  const creamLen = u(creamDepthIn);

  // Color-switch plane: front of the main-color head mass
  const switchZ = headR * 0.05;

  // MAIN: head cavity BEHIND the switch (closes at the back) - not a full face sphere
  addEllipsoid(
    group,
    mats.main,
    headR,
    headR * 0.96,
    headR * 0.88,
    0,
    headY,
    switchZ - headR * 0.62
  );

  // CREAM snout: tip at front (+Z), widens to 24-st cross-section at switch
  // CylinderGeometry(radiusTop, radiusBottom): top=+Y -> after rot X pi/2 becomes +Z
  const creamMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(tipR, creamEndR, creamLen, 24, 1, false),
    mats.cream
  );
  creamMesh.rotation.x = Math.PI / 2;
  creamMesh.position.set(0, headY - headR * 0.04, switchZ + creamLen / 2);
  creamMesh.castShadow = true;
  creamMesh.receiveShadow = true;
  group.add(creamMesh);

  // Soft cream lower-jaw / cheek from R1-7 mask (still one cream piece)
  addEllipsoid(
    group,
    mats.cream,
    creamEndR * 0.9,
    creamEndR * 0.42,
    creamLen * 0.4,
    0,
    headY - creamEndR * 0.5,
    switchZ + creamLen * 0.35
  );

  // Safety eyes just ABOVE the cream snout at the switch
  const eyeR = headR * 0.12;
  const eyeY = headY + headR * 0.14;
  const eyeZ = switchZ + u(0.06);
  const eyeGeo = new THREE.SphereGeometry(1, 14, 12);
  [-1, 1].forEach(function (side) {
    const eye = new THREE.Mesh(eyeGeo, mats.black);
    eye.scale.setScalar(eyeR);
    eye.position.set(side * creamEndR * 0.55, eyeY, eyeZ);
    group.add(eye);
    const hi = new THREE.Mesh(
      new THREE.SphereGeometry(eyeR * 0.28, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    hi.position.set(side * creamEndR * 0.55 - eyeR * 0.2, eyeY + eyeR * 0.3, eyeZ + eyeR * 0.65);
    group.add(hi);
  });

  // Nose on cream tip
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.45 })
  );
  nose.scale.set(tipR * 1.1, tipR * 0.7, tipR * 0.9);
  nose.position.set(0, headY - tipR * 0.15, switchZ + creamLen + tipR * 0.35);
  group.add(nose);

  return { headR: headR, headY: headY, switchZ: switchZ, creamLen: creamLen };
}

function addSeparatePatchHead(group, mats, opts) {
  const headD = opts.headD;
  const spi = opts.spi;
  const u = opts.u;
  const headY = opts.headY;
  const muzzleP = opts.muzzleP;
  const headR = u(headD / 2);
  const headZ = u(0.08);

  // PATH A: clean single-color sphere + sew-on cream oval
  addEllipsoid(group, mats.main, headR, headR * 0.96, headR * 0.96, 0, headY, headZ);
  if (muzzleP) {
    const mz = Math.max(0.7, ((muzzleP.chLen || 5) / spi) * 1.35);
    addEllipsoid(
      group,
      mats.cream,
      u(mz * 0.35),
      u(mz * 0.25),
      u(mz * 0.4),
      0,
      headY - headR * 0.15,
      headZ + headR * 0.75
    );
  } else {
    addEllipsoid(
      group,
      mats.cream,
      headR * 0.35,
      headR * 0.22,
      headR * 0.32,
      0,
      headY - headR * 0.12,
      headZ + headR * 0.78
    );
  }
  addEyes(group, headR, headY, headZ, mats.black);
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.45 })
  );
  nose.scale.set(headR * 0.12, headR * 0.08, headR * 0.1);
  nose.position.set(0, headY - headR * 0.22, headZ + headR * 1.05);
  group.add(nose);
  return { headR: headR, headY: headY };
}

function layoutFamily(animal) {
  const plan = (animal && animal.plan) || "sitting";
  const f = (animal && animal.features) || {};
  const name = String((animal && animal.name) || "").toLowerCase();
  if (f.floppyWaterMammal || name.indexOf("otter") >= 0) return "otter";
  if (plan === "biped" || name.indexOf("deer") >= 0) return "deer";
  if (name.indexOf("unicorn") >= 0 || (f.horns && f.mane && plan === "sitting")) return "unicorn";
  if (f.trunk || name.indexOf("elephant") >= 0 || name.indexOf("mammoth") >= 0) return "elephant";
  if (plan === "quadruped") return "quad";
  if (plan === "bird") return "bird";
  if (plan === "fish") return "fish";
  if (plan === "cephalopod") return "octopus";
  if (plan === "shelled") return "turtle";
  return "sitting";
}

/** Otter: stitch-true arms/tail when shapes builders exist */
function buildOtterGroup(animal, gauge, faceStyle, mats) {
  const spi = gauge.spi;
  const rpi = gauge.rpi;
  const H = animal.designedHeightIn || 10;
  const U = 2.15 / H;
  function u(v) {
    return v * U;
  }
  const headP = partByKey(animal, "head");
  const bodyP = partByKey(animal, "body");
  const armP = partByKey(animal, "arm");
  const tailP = partByKey(animal, "tail");
  const legP = partByKey(animal, "leg");
  const earP = partByKey(animal, "ear");
  const muzzleP = partByKey(animal, "muzzle");
  const cap =
    (bodyP && bodyP.maxStitchCap) ||
    (animal.yarnProfile && animal.yarnProfile.maxStitchCap) ||
    null;

  let bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", 3.8), spi, cap);
  let bodyH = inch(bodyP, "heightIn", Math.max(bodyD * 0.9, H * 0.32));
  let headD = finishedDiameterIn(inch(headP, "diameterIn", H * 0.4), spi, cap);
  let armSts = 8;
  let armD = actualDiameterIn(8, spi);
  let armH = inch(armP, "heightIn", headD * 0.32);
  let tailBaseSts = 18;
  let tailBaseD = actualDiameterIn(18, spi);
  let tailTipD = actualDiameterIn(6, spi);
  let tailLen = inch(tailP, "heightIn", headD * 0.85);
  let stitchTrue = false;

  const shapes = window.AmigurumiShapes;
  if (shapes && shapes.buildOtterBodyPattern) {
    try {
      const bodyBuilt = shapes.buildOtterBodyPattern(
        "Body",
        inch(bodyP, "diameterIn", 3.8),
        bodyH,
        gauge,
        { maxStitchCap: cap }
      );
      const armBuilt = shapes.buildOtterNarrowArmPattern(
        "Arm",
        inch(armP, "heightIn", 1.3),
        gauge
      );
      const tailBuilt = shapes.buildOtterThickTailPattern(
        "Tail",
        inch(tailP, "heightIn", 3.4),
        gauge,
        { bodyMaxStitches: bodyBuilt.maxStitches }
      );
      bodyD = actualDiameterIn(bodyBuilt.maxStitches, spi);
      armSts = armBuilt.maxStitches;
      armD = actualDiameterIn(armSts, spi);
      armH = Math.max(0.5, armBuilt.lastRound / rpi);
      tailBaseSts = tailBuilt.maxStitches;
      tailBaseD = actualDiameterIn(tailBaseSts, spi);
      tailLen = Math.max(0.8, tailBuilt.lastRound / rpi);
      stitchTrue = true;
    } catch (e) {
      /* keep fallbacks */
    }
  }

  const group = new THREE.Group();
  const bodyRx = u(bodyD / 2);
  const bodyRy = u(bodyH / 2);
  const bodyRz = u((bodyD / 2) * 0.95);
  const bodyY = bodyRy;
  addEllipsoid(group, mats.main, bodyRx, bodyRy, bodyRz, 0, bodyY, 0);
  addEllipsoid(group, mats.cream, bodyRx * 0.72, bodyRy * 0.7, u(0.22), 0, bodyY - u(0.05), bodyRz * 0.85);

  const sew = new THREE.Vector3(0, bodyY - bodyRy * 0.72, -bodyRz * 0.98);
  const tipDir = new THREE.Vector3(0, 0.88, -0.47).normalize();
  const tLen = u(tailLen);
  const tipPos = sew.clone().add(tipDir.clone().multiplyScalar(tLen));
  const mid = new THREE.Vector3().addVectors(sew, tipPos).multiplyScalar(0.5);
  const tailMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(u(tailTipD / 2), u(tailBaseD / 2), tLen, 20),
    mats.deep
  );
  tailMesh.position.copy(mid);
  tailMesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    tipPos.clone().sub(sew).normalize()
  );
  group.add(tailMesh);

  const chLen = (legP && legP.chLen) || 7;
  const paddleLen = Math.max(1.1, (chLen / spi) * 1.45);
  const pLen = u(paddleLen / 2);
  const pWid = u((paddleLen * 0.62) / 2);
  const pTh = u(0.2);
  [-1, 1].forEach(function (side) {
    addEllipsoid(group, mats.main, pLen, pTh, pWid, side * bodyRx * 0.55, pTh, bodyRz * 0.55 + pLen * 0.5);
  });

  const aR = u(armD / 2);
  const aLen = u(armH);
  [-1, 1].forEach(function (side) {
    const m = addCylinder(
      group,
      mats.main,
      aR,
      aR * 0.92,
      aLen,
      side * bodyRx * 0.72,
      bodyY + bodyRy * 0.28,
      bodyRz * 0.5,
      0.35,
      side * 0.55
    );
    m.rotation.z = side > 0 ? -0.55 : 0.55;
  });

  const headR = u(headD / 2);
  const headY = bodyY + bodyRy + headR * 0.82;
  let faceNote = "SEPARATE_PATCH";

  if (faceStyle === "CONTINUOUS_NOSE_FIRST") {
    addContinuousNoseFirstHead(group, mats, {
      headD: headD,
      spi: spi,
      rpi: rpi,
      u: u,
      headY: headY,
    });
    faceNote = "CONTINUOUS tip->R7 cream->main";
  } else {
    addSeparatePatchHead(group, mats, {
      headD: headD,
      spi: spi,
      u: u,
      headY: headY,
      muzzleP: muzzleP,
    });
  }

  const earD = inch(earP, "diameterIn", headD * 0.22);
  const earR = u(earD / 2);
  addEllipsoid(group, mats.main, earR, earR * 0.75, earR * 0.7, -headR * 0.7, headY + headR * 0.65, -headR * 0.15);
  addEllipsoid(group, mats.main, earR, earR * 0.75, earR * 0.7, headR * 0.7, headY + headR * 0.65, -headR * 0.15);
  group.position.y = -u(bodyH * 0.35);
  return {
    group: group,
    label:
      "otter - " +
      faceNote +
      " - arms " +
      armSts +
      "sts - tail " +
      tailBaseSts +
      "sts" +
      (stitchTrue ? " - stitch-true" : ""),
  };
}

/**
 * Molly-style sitting unicorn - NOT a standing horse, NOT one giant ball.
 * Sitting body + hoof limbs + sculpted head + thin horn + spiral mane/tail locks.
 */
function buildUnicornGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.15 / H;
  function u(v) {
    return v * U;
  }
  const headP = partByKey(animal, "head");
  const bodyP = partByKey(animal, "body");
  const armP = partByKey(animal, "arm");
  const legP = partByKey(animal, "leg");
  const earP = partByKey(animal, "ear");
  const hornP = partByKey(animal, "horn");
  const maneP = partByKey(animal, "mane");
  const tailP = partByKey(animal, "tail");
  const cap =
    (bodyP && bodyP.maxStitchCap) ||
    (animal.yarnProfile && animal.yarnProfile.maxStitchCap) ||
    null;

  const headD = finishedDiameterIn(inch(headP, "diameterIn", H * 0.4), spi, cap);
  const bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", headD * 0.88), spi, cap);
  const bodyH = inch(bodyP, "heightIn", bodyD * 0.8);
  const legLen = inch(legP, "heightIn", headD * 0.5);
  const legDia = inch(legP, "diameterIn", headD * 0.55);
  const armLen = inch(armP, "heightIn", headD * 0.45);
  const armDia = inch(armP, "diameterIn", headD * 0.32);
  const hornH = inch(hornP, "heightIn", headD * 0.35);
  const hornD = inch(hornP, "diameterIn", headD * 0.14);
  const earD = inch(earP, "diameterIn", headD * 0.28);
  const maneLen = inch(maneP, "lengthIn", headD * 2.2);
  const tailLen = inch(tailP, "lengthIn", headD * 1.6);
  const maneCount = (maneP && maneP.count) || 6;
  const tailCount = (tailP && tailP.count) || 6;

  const hoofMat = mats.hoof || solidMat("#5c4a6a");
  const hornMat = mats.horn || solidMat("#e8c84a", { roughness: 0.45, metalness: 0.15 });
  const lockMats = [
    mats.accent,
    mats.deep,
    mats.cream,
    solidMat("#a8d4f0"),
    solidMat("#f5c6e0"),
    mats.main,
  ];

  const group = new THREE.Group();

  // Sitting body: wide hips, softer chest (clear torso, not a sphere)
  const hipR = u(bodyD / 2);
  const bodyRy = u(bodyH / 2);
  addEllipsoid(group, mats.main, hipR, bodyRy * 0.85, hipR * 0.92, 0, bodyRy * 0.95, 0);
  addEllipsoid(group, mats.main, hipR * 0.78, bodyRy * 0.55, hipR * 0.75, 0, bodyRy * 1.55, u(0.04));
  // Soft belly
  addEllipsoid(group, mats.cream, hipR * 0.55, bodyRy * 0.45, u(0.14), 0, bodyRy * 0.85, hipR * 0.72);

  // Hoof-tipped legs: attach at outer hips, hang FORWARD + DOWN (visible, not inside body).
  // Recipe diameterIn is the round foot width; the tube above the hoof is thinner.
  const footR = u(legDia / 2);
  const tubeR = footR * 0.48;
  const lH = u(Math.max(legLen, headD * 0.55));
  [-1, 1].forEach(function (side) {
    const legGroup = new THREE.Group();
    // Upper tube (main color)
    const shaftLen = lH * 0.72;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(tubeR * 0.85, tubeR, shaftLen, 12),
      mats.main
    );
    shaft.position.y = -shaftLen / 2;
    shaft.castShadow = true;
    legGroup.add(shaft);
    // Round hoof at the free end
    const hoof = new THREE.Mesh(
      new THREE.SphereGeometry(1, 14, 12),
      hoofMat
    );
    hoof.scale.set(footR * 0.95, footR * 0.55, footR * 1.05);
    hoof.position.y = -shaftLen - footR * 0.25;
    hoof.castShadow = true;
    legGroup.add(hoof);
    // Sew point: outer hip of the wide body section
    legGroup.position.set(
      side * (hipR * 0.92),
      bodyRy * 0.45,
      hipR * 0.2
    );
    // Dangle forward + slightly out (sitting Molly pose)
    legGroup.rotation.x = 0.85;
    legGroup.rotation.z = side * 0.28;
    group.add(legGroup);
  });

  // Hoof-tipped arms higher on chest, hanging out/forward (not buried)
  const aFootR = u(armDia / 2);
  const aTubeR = aFootR * 0.55;
  const aH = u(Math.max(armLen, headD * 0.4));
  [-1, 1].forEach(function (side) {
    const armGroup = new THREE.Group();
    const shaftLen = aH * 0.7;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(aTubeR * 0.85, aTubeR, shaftLen, 12),
      mats.main
    );
    shaft.position.y = -shaftLen / 2;
    armGroup.add(shaft);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), hoofMat);
    paw.scale.set(aFootR * 0.9, aFootR * 0.5, aFootR);
    paw.position.y = -shaftLen - aFootR * 0.2;
    armGroup.add(paw);
    armGroup.position.set(
      side * (hipR * 0.88),
      bodyRy * 1.45,
      hipR * 0.35
    );
    armGroup.rotation.x = 0.65;
    armGroup.rotation.z = side * 0.45;
    group.add(armGroup);
  });

  // Sculpted head (separate, sewn on - slightly tapered muzzle)
  const headR = u(headD / 2);
  const headY = bodyRy * 1.85 + headR * 0.9;
  const headZ = u(0.08);
  addEllipsoid(group, mats.main, headR * 0.95, headR, headR * 0.95, 0, headY, headZ);
  // Soft muzzle / face front
  addEllipsoid(
    group,
    mats.cream,
    headR * 0.55,
    headR * 0.4,
    headR * 0.45,
    0,
    headY - headR * 0.15,
    headZ + headR * 0.7
  );
  // Nostrils
  [-1, 1].forEach(function (side) {
    const n = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      solidMat("#c090a8")
    );
    n.scale.setScalar(headR * 0.06);
    n.position.set(side * headR * 0.18, headY - headR * 0.22, headZ + headR * 1.05);
    group.add(n);
  });

  // Pointed ears
  const eR = u(earD / 2);
  [-1, 1].forEach(function (side) {
    const ear = addEllipsoid(
      group,
      mats.main,
      eR * 0.45,
      eR * 1.1,
      eR * 0.35,
      side * headR * 0.65,
      headY + headR * 0.55,
      headZ - headR * 0.1
    );
    ear.rotation.z = side * -0.4;
    addEllipsoid(
      group,
      mats.accent,
      eR * 0.28,
      eR * 0.7,
      eR * 0.12,
      side * headR * 0.65,
      headY + headR * 0.55,
      headZ - headR * 0.02
    );
  });

  // Thin horn on forehead (gold)
  const hR = u(hornD / 2);
  const hH = u(hornH);
  const horn = new THREE.Mesh(
    new THREE.CylinderGeometry(hR * 0.15, hR, hH, 12),
    hornMat
  );
  horn.position.set(0, headY + headR * 0.55 + hH * 0.4, headZ + headR * 0.25);
  horn.rotation.x = -0.35;
  group.add(horn);
  // Soft spiral ridge on horn
  for (let i = 0; i < 4; i++) {
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(hR * (0.7 - i * 0.12), hR * 0.08, 6, 12),
      hornMat
    );
    ridge.position.set(0, headY + headR * 0.55 + hH * (0.25 + i * 0.18), headZ + headR * 0.25);
    ridge.rotation.x = Math.PI / 2 - 0.35;
    group.add(ridge);
  }

  // Spiral mane locks along head/neck (several colors)
  const mLen = u(Math.min(maneLen * 0.35, headD * 0.85));
  const mR = u(0.07);
  for (let i = 0; i < maneCount; i++) {
    const t = i / Math.max(1, maneCount - 1);
    const lock = new THREE.Mesh(
      new THREE.CylinderGeometry(mR * 0.5, mR, mLen, 8),
      lockMats[i % lockMats.length]
    );
    const ang = -0.6 + t * 1.2;
    lock.position.set(
      Math.sin(ang) * headR * 0.35,
      headY - headR * 0.1 - t * headR * 0.4,
      -headR * 0.55 - t * mLen * 0.15
    );
    lock.rotation.x = 0.9 + t * 0.25;
    lock.rotation.z = ang * 0.4;
    // slight spiral twist look
    lock.rotation.y = t * 1.5;
    group.add(lock);
  }

  // Bundled spiral tail locks at lower back
  const tLen = u(Math.min(tailLen * 0.4, headD * 0.7));
  const tR = u(0.065);
  for (let i = 0; i < Math.min(tailCount, 6); i++) {
    const lock = new THREE.Mesh(
      new THREE.CylinderGeometry(tR * 0.45, tR, tLen, 8),
      lockMats[(i + 2) % lockMats.length]
    );
    const spread = (i - 2.5) * 0.12;
    lock.position.set(spread * hipR, bodyRy * 0.55 - tLen * 0.15, -hipR * 0.95);
    lock.rotation.x = 1.05 + Math.abs(spread) * 0.2;
    lock.rotation.z = spread * 0.8;
    group.add(lock);
  }

  // Eyes
  const eyeR = headR * 0.11;
  [-1, 1].forEach(function (side) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), mats.black);
    eye.scale.setScalar(eyeR);
    eye.position.set(side * headR * 0.32, headY + headR * 0.08, headZ + headR * 0.78);
    group.add(eye);
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      solidMat("#d8c0e8")
    );
    lid.scale.set(eyeR * 1.15, eyeR * 0.4, eyeR * 0.5);
    lid.position.set(side * headR * 0.32, headY + headR * 0.18, headZ + headR * 0.72);
    group.add(lid);
  });

  group.position.y = -u(bodyH * 0.15);
  return {
    group: group,
    label:
      "Molly sitting - horn - " +
      maneCount +
      " mane locks - hoof limbs",
  };
}

function buildSittingGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.15 / H;
  function u(v) {
    return v * U;
  }
  const name = String(animal.name || "").toLowerCase();
  const headP = partByKey(animal, "head");
  const bodyP = partByKey(animal, "body");
  const armP = partByKey(animal, "arm");
  const legP = partByKey(animal, "leg") || partByKey(animal, "foot");
  const earP = partByKey(animal, "ear");
  const tailP = partByKey(animal, "tail");
  const snoutP = partByKey(animal, "snout") || partByKey(animal, "muzzle");
  const hornP = partByKey(animal, "horn");
  const cap = (bodyP && bodyP.maxStitchCap) || (animal.yarnProfile && animal.yarnProfile.maxStitchCap);

  const isChin = name.indexOf("chinchilla") >= 0;
  const isHippo =
    name.indexOf("hippo") >= 0 ||
    (headP && String(headP.shape || "").indexOf("hippo") >= 0);
  const isCat = name.indexOf("cat") >= 0 || name.indexOf("kitten") >= 0;
  const isTeddy = name.indexOf("teddy") >= 0 || name.indexOf("bear") >= 0;
  const isBunny = name.indexOf("bunny") >= 0 || name.indexOf("rabbit") >= 0;

  let bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", H * 0.38), spi, cap);
  let bodyH = inch(bodyP, "heightIn", bodyD * 0.95);
  let headD = finishedDiameterIn(
    inch(headP, "diameterIn", (bodyP && bodyP.headDiameterIn) || H * 0.4),
    spi,
    cap
  );
  if (isChin && !headP) headD = bodyD * 0.85;

  const group = new THREE.Group();
  const bodyRx = u(bodyD / 2);
  const bodyRy = u(bodyH / 2);
  const bodyY = bodyRy;
  addEllipsoid(group, mats.main, bodyRx * (isHippo ? 1.1 : 1), bodyRy, bodyRx * 0.95, 0, bodyY, 0);
  addEllipsoid(group, mats.cream, bodyRx * 0.65, bodyRy * 0.6, u(0.18), 0, bodyY, bodyRx * 0.8);

  const headR = u(headD / 2);
  const headY = isChin ? bodyY + bodyRy * 0.55 : bodyY + bodyRy + headR * 0.75;
  if (!isChin || headP) {
    addEllipsoid(group, mats.main, headR * (isHippo ? 1.05 : 1), headR * 0.95, headR * 0.95, 0, headY, u(0.05));
  }

  // Hippo: continuous cream muzzle from head.lengthIn (Harry chain-oval → head)
  if (isHippo) {
    const muzzleLen = inch(headP, "lengthIn", headD * 0.45);
    const mR = u(Math.min(muzzleLen, headD * 0.55) / 2);
    addEllipsoid(
      group,
      mats.cream,
      mR * 1.15,
      mR * 0.75,
      mR * 1.35,
      0,
      headY - headR * 0.25,
      headR * 0.55 + mR * 0.6
    );
  } else if (snoutP || isTeddy) {
    const sd = u(inch(snoutP, "diameterIn", headD * 0.35) / 2);
    addEllipsoid(group, mats.cream, sd, sd * 0.7, sd * 1.1, 0, headY - headR * 0.15, headR * 0.85);
  }

  const armD = u(inch(armP, "diameterIn", headD * 0.22) / 2);
  const armH = u(inch(armP, "heightIn", headD * 0.4));
  [-1, 1].forEach(function (side) {
    addCylinder(group, mats.main, armD, armD * 0.9, armH, side * bodyRx * 0.85, bodyY + bodyRy * 0.15, bodyRx * 0.35, 0.2, side * 0.4);
  });

  const legD = u(inch(legP, "diameterIn", headD * 0.28) / 2);
  const legH = u(inch(legP, "heightIn", headD * 0.45));
  [-1, 1].forEach(function (side) {
    addCylinder(group, mats.main, legD, legD * 1.15, legH, side * bodyRx * 0.45, legH * 0.35, bodyRx * 0.25, 0.15, 0);
  });

  if (earP) {
    const eD = u(inch(earP, "diameterIn", headD * 0.25) / 2);
    const eH = u(inch(earP, "heightIn", isBunny ? headD * 0.7 : headD * 0.28));
    if (isBunny) {
      [-1, 1].forEach(function (side) {
        addCylinder(group, mats.main, eD * 0.6, eD, eH, side * headR * 0.45, headY + headR * 0.5 + eH * 0.4, -headR * 0.1, 0.15, side * 0.1);
      });
    } else if (isCat) {
      // Rule C cone ears from recipe diameter
      [-1, 1].forEach(function (side) {
        addCylinder(
          group,
          mats.main,
          0.01,
          eD,
          eH * 1.2,
          side * headR * 0.55,
          headY + headR * 0.55 + eH * 0.35,
          -headR * 0.05,
          0.1,
          side * -0.25
        );
      });
    } else if (isChin) {
      [-1, 1].forEach(function (side) {
        addEllipsoid(group, mats.main, eD * 1.1, eD * 0.35, eD * 0.9, side * headR * 0.75, headY + headR * 0.35, 0);
      });
    } else {
      [-1, 1].forEach(function (side) {
        addEllipsoid(group, mats.main, eD, eD * 0.8, eD * 0.6, side * headR * 0.7, headY + headR * 0.6, 0);
      });
    }
  }

  if (tailP) {
    const bushy = (animal.features && animal.features.bushyTail) || inch(tailP, "diameterIn", 0) > headD * 0.35;
    if (bushy || (tailP.shape && String(tailP.shape).indexOf("sphere") >= 0) || isChin) {
      const td = u(inch(tailP, "diameterIn", headD * 0.28) / 2);
      addEllipsoid(group, mats.deep, td, td, td, 0, bodyY - bodyRy * 0.2, -bodyRx * 0.95);
    } else if (tailP.shape === "chain-tail" || isHippo) {
      const th = u(inch(tailP, "lengthIn", inch(tailP, "heightIn", 0.6)));
      addCylinder(group, mats.deep, u(0.06), u(0.08), th, 0, bodyY - bodyRy * 0.3, -bodyRx * 0.9, 0.6, 0);
    } else {
      const td = u(inch(tailP, "diameterIn", headD * 0.15) / 2);
      const th = u(inch(tailP, "heightIn", headD * 0.5));
      const sew = new THREE.Vector3(0, bodyY - bodyRy * 0.5, -bodyRx * 0.9);
      const tip = sew.clone().add(new THREE.Vector3(0, 0.7, -0.5).normalize().multiplyScalar(th));
      const mid = new THREE.Vector3().addVectors(sew, tip).multiplyScalar(0.5);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(td * 0.4, td, th, 12), mats.deep);
      mesh.position.copy(mid);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().sub(sew).normalize());
      group.add(mesh);
    }
  }

  if (hornP) {
    const hd = u(inch(hornP, "diameterIn", 0.35) / 2);
    const hh = u(inch(hornP, "heightIn", headD * 0.45));
    addCylinder(group, mats.accent, hd * 0.3, hd, hh, 0, headY + headR * 0.7 + hh * 0.4, headR * 0.1, -0.2, 0);
  }

  if (partByKey(animal, "mane")) {
    addEllipsoid(group, mats.accent, headR * 0.35, headR * 0.5, headR * 0.25, -headR * 0.2, headY + headR * 0.2, -headR * 0.7);
  }

  addEyes(group, headR, headY, u(0.05), mats.black);
  group.position.y = -u(bodyH * 0.3);
  const cue = isHippo ? "hippo muzzle" : isCat ? "cone ears" : isChin ? "one-piece" : isTeddy ? "snout" : isBunny ? "long ears" : "recipe";
  return { group: group, label: "sitting - " + cue + " inches" };
}

function buildDeerGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.05 / H;
  function u(v) {
    return v * U;
  }
  const headP = partByKey(animal, "head");
  const bodyP = partByKey(animal, "body");
  const armP = partByKey(animal, "arm");
  const legP = partByKey(animal, "leg");
  const muzzleP = partByKey(animal, "muzzle");
  const earP = partByKey(animal, "ear");
  const earInnerP = partByKey(animal, "ear-inner");
  const antlerP = partByKey(animal, "antler");
  const tineP = partByKey(animal, "tine");
  const tailP = partByKey(animal, "tail");
  const cap =
    (bodyP && bodyP.maxStitchCap) ||
    (animal.yarnProfile && animal.yarnProfile.maxStitchCap) ||
    null;

  // Recipe inches from buildChibiDeer (~10": head 4.2", pear ~3", legs ~3.5", antlers ~1.2")
  const headD = finishedDiameterIn(inch(headP, "diameterIn", H * 0.42), spi, cap);
  const bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", headD * 0.62), spi, cap);
  const bodyH = inch(bodyP, "heightIn", headD * 0.72);
  const limbDia = inch(armP, "diameterIn", headD * 0.14);
  const armLen = inch(armP, "heightIn", headD * 0.7);
  const legLen = inch(legP, "heightIn", headD * 0.85);
  const antlerH = inch(antlerP, "heightIn", headD * 0.32);
  const antlerD = inch(antlerP, "diameterIn", headD * 0.1);
  const tineH = inch(tineP, "heightIn", antlerH * 0.45);
  const tineD = inch(tineP, "diameterIn", headD * 0.07);
  const muzzleLen = inch(muzzleP, "lengthIn", headD * 0.18);
  const muzzleDia = inch(muzzleP, "diameterIn", headD * 0.38);
  const earD = inch(earP, "diameterIn", headD * 0.32);
  const earInnerD = inch(earInnerP, "diameterIn", headD * 0.22);

  const group = new THREE.Group();

  // Pear body: wider belly, narrower shoulders + short neck stump
  const bodyRy = u(bodyH / 2);
  const bellyR = u(bodyD / 2);
  const shoulderR = bellyR * 0.72;
  addEllipsoid(group, mats.main, bellyR * 0.95, bodyRy * 0.7, bellyR * 0.9, 0, bodyRy * 0.75, 0);
  addEllipsoid(group, mats.main, shoulderR, bodyRy * 0.45, shoulderR * 0.95, 0, bodyRy * 1.35, 0);
  // Cream belly patch
  addEllipsoid(group, mats.cream, bellyR * 0.55, bodyRy * 0.45, u(0.12), 0, bodyRy * 0.7, bellyR * 0.75);
  // Short neck stump (head sews on)
  const neckH = u(headD * 0.08);
  addCylinder(group, mats.main, shoulderR * 0.55, shoulderR * 0.65, neckH, 0, bodyRy * 1.75 + neckH * 0.4, 0, 0, 0);

  // Oversized head
  const headR = u(headD / 2);
  const headY = bodyRy * 1.75 + neckH + headR * 0.85;
  const headZ = u(0.06);
  addEllipsoid(group, mats.main, headR, headR * 0.98, headR * 0.98, 0, headY, headZ);
  // Cream lower-face color block (pattern: color-block lower face cream)
  addEllipsoid(
    group,
    mats.cream,
    headR * 0.82,
    headR * 0.42,
    headR * 0.7,
    0,
    headY - headR * 0.28,
    headZ + headR * 0.25
  );
  // Sew-on cream muzzle
  const mzR = u(muzzleDia / 2);
  const mzL = u(muzzleLen);
  addEllipsoid(
    group,
    mats.cream,
    mzR,
    mzR * 0.7,
    mzL * 0.85 + mzR * 0.5,
    0,
    headY - headR * 0.22,
    headZ + headR * 0.78
  );
  // Dark nose stitch
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(1, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.5 })
  );
  nose.scale.set(mzR * 0.55, mzR * 0.35, mzR * 0.4);
  nose.position.set(0, headY - headR * 0.28, headZ + headR * 0.95 + mzL * 0.3);
  group.add(nose);

  // Flat layered ears (outer main + cream inner) - leaf/flat, not stuffed balls
  const eOut = u(earD / 2);
  const eIn = u(earInnerD / 2);
  [-1, 1].forEach(function (side) {
    const outer = addEllipsoid(
      group,
      mats.main,
      eOut * 0.55,
      eOut * 1.05,
      eOut * 0.18,
      side * headR * 0.72,
      headY + headR * 0.45,
      headZ - headR * 0.05
    );
    outer.rotation.z = side * -0.35;
    outer.rotation.x = -0.2;
    const inner = addEllipsoid(
      group,
      mats.cream,
      eIn * 0.5,
      eIn * 0.95,
      eIn * 0.12,
      side * headR * 0.72,
      headY + headR * 0.45,
      headZ + u(0.02)
    );
    inner.rotation.z = side * -0.35;
    inner.rotation.x = -0.2;
  });

  // Branched cream antlers (beam + tine = Y) between the ears - pattern cream, not dark
  const beamH = u(antlerH);
  const beamR = u(antlerD / 2);
  const tH = u(tineH);
  const tR = u(tineD / 2);
  [-1, 1].forEach(function (side) {
    const antlerGroup = new THREE.Group();
    // Main beam
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(beamR * 0.45, beamR, beamH, 10),
      mats.cream
    );
    beam.position.y = beamH / 2;
    antlerGroup.add(beam);
    // Short tine forked mid-beam (Y / heart fork)
    const tine = new THREE.Mesh(
      new THREE.CylinderGeometry(tR * 0.4, tR, tH, 8),
      mats.cream
    );
    tine.position.set(side * tH * 0.35, beamH * 0.45, 0);
    tine.rotation.z = side * -0.85;
    antlerGroup.add(tine);
    // Place between ears on top of head
    antlerGroup.position.set(
      side * headR * 0.28,
      headY + headR * 0.78,
      headZ - headR * 0.15
    );
    antlerGroup.rotation.x = -0.2;
    antlerGroup.rotation.z = side * 0.18;
    group.add(antlerGroup);
  });

  // Eyes + tiny brow dots
  const eyeR = headR * 0.11;
  [-1, 1].forEach(function (side) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), mats.black);
    eye.scale.setScalar(eyeR);
    eye.position.set(side * headR * 0.32, headY + headR * 0.08, headZ + headR * 0.78);
    group.add(eye);
    const brow = new THREE.Mesh(
      new THREE.SphereGeometry(1, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.9 })
    );
    brow.scale.set(eyeR * 1.2, eyeR * 0.35, eyeR * 0.4);
    brow.position.set(side * headR * 0.34, headY + headR * 0.22, headZ + headR * 0.72);
    group.add(brow);
  });

  // Long thin dangling arms (soft tubes from shoulders)
  const aR = u(limbDia / 2);
  const aLen = u(armLen);
  [-1, 1].forEach(function (side) {
    const arm = addCylinder(
      group,
      mats.main,
      aR * 0.85,
      aR,
      aLen,
      side * shoulderR * 1.05,
      bodyRy * 1.45 - aLen * 0.25,
      u(0.05),
      0.15,
      side * 0.12
    );
    arm.rotation.z = side * 0.08;
  });

  // Longer thin dangling legs from bottom of pear
  const lR = u((limbDia * 1.05) / 2);
  const lLen = u(legLen);
  [-1, 1].forEach(function (side) {
    addCylinder(
      group,
      mats.main,
      lR * 0.9,
      lR,
      lLen,
      side * bellyR * 0.35,
      -lLen * 0.15,
      bellyR * 0.15,
      0.08,
      0
    );
  });

  // Tiny teardrop tail
  if (tailP) {
    const td = u(inch(tailP, "diameterIn", headD * 0.12) / 2);
    const th = u(inch(tailP, "heightIn", headD * 0.16));
    addEllipsoid(group, mats.main, td * 0.7, th * 0.55, td * 0.7, 0, bodyRy * 0.55, -bellyR * 0.95);
  }

  // Center the dangling stack in view (legs hang below)
  group.position.y = u(legLen * 0.15);
  return {
    group: group,
    label:
      "dangling deer - antlers Y - muzzle - ears - " +
      headD.toFixed(1) +
      " in head",
  };
}

function buildElephantGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.05 / H;
  function u(v) {
    return v * U;
  }
  const bodyP = partByKey(animal, "body");
  const headP = partByKey(animal, "head");
  const legP = partByKey(animal, "leg");
  const earP = partByKey(animal, "ear");
  const trunkP = partByKey(animal, "trunk");
  const tuskP = partByKey(animal, "tusk");
  const tailP = partByKey(animal, "tail");
  const cap = (bodyP && bodyP.maxStitchCap) || (animal.yarnProfile && animal.yarnProfile.maxStitchCap);

  const bodyLen = inch(bodyP, "lengthIn", H * 0.38);
  const bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", H * 0.32), spi, cap);
  const headD = finishedDiameterIn(inch(headP, "diameterIn", H * 0.42), spi, cap);
  const legD = finishedDiameterIn(inch(legP, "diameterIn", H * 0.14), spi, cap);
  const legH = inch(legP, "heightIn", H * 0.28);
  const earD = inch(earP, "diameterIn", headD * 0.9);
  const earThick = inch(earP, "heightIn", headD * 0.12);
  const trunkBaseD = inch(trunkP, "diameterIn", headD * 0.22);
  const trunkLen = inch(trunkP, "heightIn", headD * 0.95);

  const group = new THREE.Group();
  const bRx = u(bodyLen / 2);
  const bRy = u(bodyD / 2);
  const bellyY = u(legH) + bRy * 0.85;
  // Stocky horizontal oval from recipe length × diameter
  addEllipsoid(group, mats.main, bRx, bRy, bRy * 0.95, 0, bellyY, 0);
  addEllipsoid(group, mats.cream, bRx * 0.55, bRy * 0.55, u(0.12), 0, bellyY - bRy * 0.1, bRy * 0.85);

  // Four pillar legs (recipe diameter + height)
  const legR = u(legD / 2);
  const legLen = u(legH);
  const stance = [
    [0.55, 0.5],
    [0.55, -0.5],
    [-0.55, 0.5],
    [-0.55, -0.5],
  ];
  stance.forEach(function (xz) {
    addCylinder(group, mats.main, legR * 0.95, legR * 1.05, legLen, bRx * xz[0], legLen * 0.5, bRy * xz[1], 0, 0);
  });

  // Large head flush to chest (almost no neck)
  const headR = u(headD / 2);
  const headX = bRx * 0.85 + headR * 0.35;
  const headY = bellyY + bRy * 0.15;
  addEllipsoid(group, mats.main, headR * 1.05, headR, headR * 0.95, headX, headY, 0);

  // Huge flat oval ear flaps from recipe diameter
  const eW = u(earD / 2);
  const eT = u(Math.max(earThick, headD * 0.08) / 2);
  [-1, 1].forEach(function (side) {
    const ear = addEllipsoid(
      group,
      mats.main,
      eT,
      eW * 0.95,
      eW * 0.75,
      headX - headR * 0.15,
      headY - headR * 0.05,
      side * (headR * 0.55 + eW * 0.35)
    );
    ear.rotation.y = side * 0.35;
    ear.rotation.z = side * 0.2;
    // Soft inner ear
    const inner = addEllipsoid(
      group,
      mats.cream,
      eT * 0.5,
      eW * 0.65,
      eW * 0.5,
      headX - headR * 0.05,
      headY - headR * 0.05,
      side * (headR * 0.55 + eW * 0.25)
    );
    inner.rotation.y = side * 0.35;
  });

  // Curved trunk: 3 tapered segments hanging from face center (recipe length)
  const tBase = u(trunkBaseD / 2);
  const tLen = u(trunkLen);
  const trunkRoot = new THREE.Group();
  trunkRoot.position.set(headX + headR * 0.75, headY - headR * 0.25, 0);
  trunkRoot.rotation.z = 0.65;
  group.add(trunkRoot);
  const segLen = tLen / 3;
  let parent = trunkRoot;
  for (let i = 0; i < 3; i++) {
    const hinge = new THREE.Group();
    if (i > 0) hinge.rotation.z = 0.28;
    hinge.position.y = i === 0 ? 0 : -segLen;
    parent.add(hinge);
    const r0 = tBase * (1 - i * 0.22);
    const r1 = tBase * (1 - (i + 1) * 0.22);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.02, r1), r0, segLen, 12), mats.main);
    seg.position.y = -segLen * 0.5;
    seg.castShadow = true;
    hinge.add(seg);
    parent = hinge;
  }

  // Cream tusks beside trunk
  if (tuskP) {
    const td = u(inch(tuskP, "diameterIn", headD * 0.08) / 2);
    const th = u(inch(tuskP, "heightIn", headD * 0.28));
    [-1, 1].forEach(function (side) {
      const tusk = addCylinder(
        group,
        mats.cream,
        td * 0.35,
        td,
        th,
        headX + headR * 0.55,
        headY - headR * 0.35,
        side * headR * 0.28,
        0.9,
        side * -0.35
      );
      tusk.rotation.x = 0.4;
    });
  }

  // Rope tail
  if (tailP) {
    const td = u(inch(tailP, "diameterIn", headD * 0.06) / 2);
    const th = u(inch(tailP, "heightIn", headD * 0.35));
    addCylinder(group, mats.deep, td * 0.6, td, th, -bRx * 0.9, bellyY - bRy * 0.2, 0, 1.0, 0);
  }

  addEyes(group, headR, headY, 0, mats.black);
  group.children.forEach(function (ch) {
    if (ch.material === mats.black && ch.geometry && ch.geometry.type === "SphereGeometry") {
      ch.position.x = headX + headR * 0.55;
      ch.position.y = headY + headR * 0.05;
      ch.position.z = (ch.position.z >= 0 ? 1 : -1) * headR * 0.45;
    }
  });

  group.position.y = -u(0.1);
  group.rotation.y = 0.4;
  return {
    group: group,
    label:
      "elephant - trunk " +
      trunkLen.toFixed(1) +
      '" - ears " +
      earD.toFixed(1) +
      '" - pillars",
  };
}

function buildQuadGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.0 / H;
  function u(v) {
    return v * U;
  }
  const name = String(animal.name || "").toLowerCase();
  const f = animal.features || {};
  const bodyP = partByKey(animal, "body");
  const headP = partByKey(animal, "head");
  const legP = partByKey(animal, "leg");
  const earP = partByKey(animal, "ear");
  const tailP = partByKey(animal, "tail");
  const wingP = partByKey(animal, "wing");
  const hornP = partByKey(animal, "horn");
  const cap = bodyP && bodyP.maxStitchCap;

  const bodyLen = inch(bodyP, "lengthIn", inch(bodyP, "heightIn", H * 0.45));
  const bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", H * 0.28), spi, cap);
  const headD = finishedDiameterIn(inch(headP, "diameterIn", H * 0.28), spi, cap);
  const neckH = inch(bodyP, "heightIn", H * 0.15);
  const longNeck = !!f.longNeck || name.indexOf("giraffe") >= 0;
  const longSnout = !!f.longSnout || name.indexOf("fox") >= 0 || name.indexOf("wolf") >= 0;
  const isFox = name.indexOf("fox") >= 0;
  const isDragon = name.indexOf("dragon") >= 0;

  const group = new THREE.Group();
  const bRx = u(bodyLen / 2);
  const bRy = u(bodyD / 2);
  const bodyY = u(inch(legP, "heightIn", H * 0.28)) * 0.95 + bRy * 0.15;
  addEllipsoid(group, mats.main, bRx, bRy, bRy * 0.9, 0, bodyY, 0);

  // Neck: giraffe uses full recipe neck height upright; others short stump
  const neckLen = u(longNeck ? Math.max(neckH, H * 0.18) : neckH * 0.45);
  let headX = bRx * 0.85;
  let headY = bodyY + bRy * 0.35;
  if (neckLen > 0.05) {
    if (longNeck) {
      const neck = addCylinder(
        group,
        mats.main,
        bRy * 0.28,
        bRy * 0.38,
        neckLen,
        bRx * 0.55,
        bodyY + bRy * 0.5 + neckLen * 0.45,
        0,
        0,
        -0.35
      );
      headX = bRx * 0.55 + neckLen * 0.25;
      headY = bodyY + bRy * 0.5 + neckLen * 0.95;
    } else {
      addCylinder(group, mats.main, bRy * 0.4, bRy * 0.5, neckLen, bRx * 0.75, bodyY + bRy * 0.4, 0, 0, -0.9);
      headX = bRx * 0.95 + u(headD / 2) * 0.2;
      headY = bodyY + bRy * 0.35 + u(headD / 2) * 0.35;
    }
  }

  const headR = u(headD / 2);
  addEllipsoid(group, mats.main, headR * (longSnout ? 0.95 : 1.1), headR, headR * 0.95, headX, headY, 0);

  // Snout from head.lengthIn (fox = pointed cream muzzle)
  const snoutLen = inch(
    headP,
    "lengthIn",
    longSnout ? headD * 0.55 : headD * 0.25
  );
  const snoutR = u(snoutLen / 2);
  addEllipsoid(
    group,
    mats.cream,
    snoutR * (longSnout ? 1.2 : 0.9),
    headR * (longSnout ? 0.35 : 0.45),
    headR * (longSnout ? 0.35 : 0.45),
    headX + headR * 0.55 + snoutR * 0.5,
    headY - headR * 0.12,
    0
  );

  const legD = u(inch(legP, "diameterIn", bodyD * 0.22) / 2);
  const legH = u(inch(legP, "heightIn", H * 0.28));
  const stance = [
    [0.55, 0.55],
    [0.55, -0.55],
    [-0.55, 0.55],
    [-0.55, -0.55],
  ];
  stance.forEach(function (xz) {
    addCylinder(group, mats.main, legD, legD * 1.05, legH, bRx * xz[0], legH * 0.5, bRy * xz[1], 0, 0);
  });

  if (earP) {
    const eD = u(inch(earP, "diameterIn", headD * 0.3) / 2);
    if (isFox || longSnout) {
      [-1, 1].forEach(function (side) {
        addCylinder(
          group,
          mats.main,
          0.01,
          eD * 0.85,
          eD * 1.6,
          headX,
          headY + headR * 0.55,
          side * headR * 0.45,
          0.15,
          side * -0.2
        );
      });
    } else {
      [-1, 1].forEach(function (side) {
        addEllipsoid(group, mats.main, eD * 0.6, eD, eD * 0.4, headX, headY + headR * 0.7, side * headR * 0.5);
      });
    }
  }

  if (tailP) {
    const bushy = f.bushyTail || isFox;
    const td = u(inch(tailP, "diameterIn", bodyD * (bushy ? 0.45 : 0.25)) / 2);
    if (bushy) {
      addEllipsoid(group, mats.deep, td * 1.1, td * 1.4, td, -bRx * 0.95, bodyY, 0);
      if (isFox) {
        addEllipsoid(group, mats.cream, td * 0.55, td * 0.6, td * 0.55, -bRx * 1.15, bodyY - td * 0.2, 0);
      }
    } else {
      const th = u(inch(tailP, "heightIn", bodyD * 0.6));
      addCylinder(group, mats.deep, td * 0.4, td, th, -bRx * 0.9, bodyY - bRy * 0.2, 0, 1.1, 0);
    }
  }

  if (wingP || isDragon) {
    const wd = u(inch(wingP, "diameterIn", bodyD * 0.7) / 2);
    [-1, 1].forEach(function (side) {
      addEllipsoid(group, mats.accent, wd * 0.25, wd * 0.9, wd * 1.1, 0, bodyY + bRy * 0.4, side * (bRy + wd * 0.6));
    });
  }
  if (hornP) {
    const hd = u(inch(hornP, "diameterIn", 0.25) / 2);
    const hh = u(inch(hornP, "heightIn", headD * 0.35));
    const count = hornP.count === 1 ? [0] : [-1, 1];
    count.forEach(function (side) {
      addCylinder(group, mats.accent, 0.01, hd, hh, headX + headR * 0.1, headY + headR * 0.7, side * headR * 0.25, -0.2, 0);
    });
  }
  partsByKey(animal, "spike").forEach(function (sp, i) {
    const sd = u(inch(sp, "diameterIn", 0.2) / 2);
    const sh = u(inch(sp, "heightIn", 0.4));
    addCylinder(group, mats.deep, 0.01, sd, sh, -bRx * 0.3 + i * u(0.25), bodyY + bRy * 0.85, 0, 0, 0);
  });

  addEyes(group, headR, headY, 0, mats.black);
  group.children.forEach(function (ch) {
    if (ch.material === mats.black && ch.geometry && ch.geometry.type === "SphereGeometry") {
      ch.position.x = headX + headR * 0.55;
      ch.position.z = ch.position.z * 0.5 + (ch.position.z >= 0 ? headR * 0.35 : -headR * 0.35);
    }
  });

  group.position.y = -u(0.15);
  group.rotation.y = 0.35;
  const cue = longNeck ? "giraffe neck" : isFox ? "fox snout+tail" : isDragon ? "wings" : "recipe";
  return { group: group, label: "quad - " + cue + " inches" };
}

function buildBirdGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.15 / H;
  function u(v) {
    return v * U;
  }
  const bodyP = partByKey(animal, "body");
  const wingP = partByKey(animal, "wing");
  const legP = partByKey(animal, "leg");
  const cap = bodyP && bodyP.maxStitchCap;
  const bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", H * 0.45), spi, cap);
  const bodyLen = inch(bodyP, "lengthIn", bodyD * 1.1);
  const group = new THREE.Group();
  const r = u(bodyD / 2);
  addEllipsoid(group, mats.main, r * 0.95, u(bodyLen / 2), r, 0, u(bodyLen / 2), 0);
  addEllipsoid(group, mats.cream, r * 0.5, r * 0.4, r * 0.15, 0, u(bodyLen * 0.55), r * 0.75);
  if (wingP) {
    const wd = u(inch(wingP, "diameterIn", bodyD * 0.45) / 2);
    [-1, 1].forEach(function (side) {
      addEllipsoid(group, mats.deep, wd * 0.35, wd * 0.7, wd, side * r * 0.85, u(bodyLen * 0.5), 0);
    });
  }
  if (legP) {
    const ld = u(inch(legP, "diameterIn", 0.25) / 2);
    const lh = u(inch(legP, "heightIn", H * 0.2));
    [-1, 1].forEach(function (side) {
      addCylinder(group, mats.accent, ld, ld, lh, side * r * 0.25, lh * 0.4, r * 0.2, 0, 0);
    });
  }
  // beak
  addEllipsoid(group, mats.accent, u(0.12), u(0.08), u(0.18), 0, u(bodyLen * 0.75), r * 0.95);
  addEyes(group, r * 0.7, u(bodyLen * 0.75), 0, mats.black);
  group.position.y = -u(0.1);
  return { group: group, label: "bird - recipe inches" };
}

function buildFishGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.2 / H;
  function u(v) {
    return v * U;
  }
  const bodyP = partByKey(animal, "body");
  const cap = bodyP && bodyP.maxStitchCap;
  const bodyLen = inch(bodyP, "lengthIn", H);
  const bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", H * 0.28), spi, cap);
  const group = new THREE.Group();
  addEllipsoid(group, mats.main, u(bodyLen / 2), u(bodyD / 2), u(bodyD / 2) * 0.85, 0, u(bodyD / 2), 0);
  addEllipsoid(group, mats.cream, u(bodyLen / 2) * 0.7, u(bodyD / 2) * 0.5, u(0.12), 0, u(bodyD / 2) * 0.7, u(bodyD / 2) * 0.7);
  // tail + fins
  addEllipsoid(group, mats.deep, u(bodyD * 0.35), u(bodyD * 0.45), u(0.08), -u(bodyLen / 2) * 0.95, u(bodyD / 2), 0);
  addEllipsoid(group, mats.deep, u(0.08), u(bodyD * 0.35), u(bodyD * 0.25), 0, u(bodyD) * 1.05, 0);
  addEyes(group, u(bodyD * 0.35), u(bodyD / 2), u(bodyLen / 2) * 0.55, mats.black);
  group.rotation.y = Math.PI / 2;
  group.position.y = -u(0.1);
  return { group: group, label: "fish - recipe inches" };
}

function buildOctopusGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.15 / H;
  function u(v) {
    return v * U;
  }
  const headP = partByKey(animal, "head");
  const tent = partByKey(animal, "tentacle");
  const cap = headP && headP.maxStitchCap;
  const headD = finishedDiameterIn(inch(headP, "diameterIn", H * 0.45), spi, cap);
  const group = new THREE.Group();
  const headR = u(headD / 2);
  addEllipsoid(group, mats.main, headR, headR * 1.05, headR, 0, headR * 1.1, 0);
  const td = u(inch(tent, "diameterIn", headD * 0.12) / 2);
  const th = u(inch(tent, "heightIn", H * 0.45));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    addCylinder(
      group,
      mats.main,
      td * 0.6,
      td,
      th,
      Math.cos(a) * headR * 0.55,
      th * 0.35,
      Math.sin(a) * headR * 0.55,
      0.25,
      0
    );
  }
  addEyes(group, headR, headR * 1.15, 0, mats.black);
  group.position.y = -u(0.15);
  return { group: group, label: "octopus - recipe inches" };
}

function buildTurtleGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.15 / H;
  function u(v) {
    return v * U;
  }
  const shellP = partByKey(animal, "shell");
  const bellyP = partByKey(animal, "belly");
  const headP = partByKey(animal, "head");
  const legP = partByKey(animal, "leg");
  const cap = shellP && shellP.maxStitchCap;
  const shellD = finishedDiameterIn(inch(shellP, "diameterIn", H * 0.55), spi, cap);
  const group = new THREE.Group();
  const sR = u(shellD / 2);
  addEllipsoid(group, mats.main, sR, sR * 0.55, sR, 0, sR * 0.55, 0);
  if (bellyP) {
    addEllipsoid(group, mats.cream, sR * 0.85, sR * 0.25, sR * 0.85, 0, sR * 0.2, 0);
  }
  const headD = finishedDiameterIn(inch(headP, "diameterIn", shellD * 0.35), spi, cap);
  const headR = u(headD / 2);
  addEllipsoid(group, mats.accent, headR, headR, headR, 0, sR * 0.45, sR * 0.95);
  const ld = u(inch(legP, "diameterIn", shellD * 0.18) / 2);
  const lh = u(inch(legP, "heightIn", shellD * 0.25));
  [
    [0.55, 0.55],
    [0.55, -0.55],
    [-0.55, 0.55],
    [-0.55, -0.55],
  ].forEach(function (xz) {
    addCylinder(group, mats.accent, ld, ld, lh, sR * xz[0], lh * 0.35, sR * xz[1] * 0.7, 0, 0);
  });
  addEyes(group, headR, sR * 0.5, sR * 0.95, mats.black);
  group.position.y = -u(0.05);
  return { group: group, label: "turtle - recipe inches" };
}

function buildPlushGroup(animal, gauge, faceStyle) {
  const pal = speciesPalette(animal && animal.name);
  const mats = {
    main: yarnMat(pal.main),
    deep: yarnMat(pal.deep),
    cream: yarnMat(pal.cream),
    accent: yarnMat(pal.accent),
    hoof: pal.hoof ? solidMat(pal.hoof) : null,
    horn: pal.horn ? solidMat(pal.horn, { roughness: 0.45, metalness: 0.15 }) : null,
    black: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.35 }),
  };
  const family = layoutFamily(animal);
  if (family === "otter") return Object.assign(buildOtterGroup(animal, gauge, faceStyle, mats), { family: family });
  if (family === "deer") return Object.assign(buildDeerGroup(animal, gauge, mats), { family: family });
  if (family === "unicorn") return Object.assign(buildUnicornGroup(animal, gauge, mats), { family: family });
  if (family === "elephant") return Object.assign(buildElephantGroup(animal, gauge, mats), { family: family });
  if (family === "quad") return Object.assign(buildQuadGroup(animal, gauge, mats), { family: family });
  if (family === "bird") return Object.assign(buildBirdGroup(animal, gauge, mats), { family: family });
  if (family === "fish") return Object.assign(buildFishGroup(animal, gauge, mats), { family: family });
  if (family === "octopus") return Object.assign(buildOctopusGroup(animal, gauge, mats), { family: family });
  if (family === "turtle") return Object.assign(buildTurtleGroup(animal, gauge, mats), { family: family });
  return Object.assign(buildSittingGroup(animal, gauge, mats), { family: family });
}

function makeSoftShadow() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(40,50,70,0.28)");
  g.addColorStop(1, "rgba(40,50,70,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.5),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.05;
  return mesh;
}

function createPlush3DPreview(container, options) {
  options = options || {};
  const animal = options.animal || null;
  const gauge = options.gauge || { spi: 5, rpi: 5.5 };
  const faceStyle =
    options.facialConstructionStyle ||
    (options.patternRequest && options.patternRequest.facialConstructionStyle) ||
    "SEPARATE_PATCH";

  if (container._plush3d && container._plush3d.dispose) container._plush3d.dispose();
  if (container._otter3d && container._otter3d.dispose) container._otter3d.dispose();
  container.innerHTML = "";
  container.hidden = false;
  container.style.position = "relative";

  const name = (animal && animal.name) || options.animalSpecies || "Plush";
  const H = (animal && animal.designedHeightIn) || 10;
  const built = animal
    ? buildPlushGroup(animal, gauge, faceStyle)
    : { group: new THREE.Group(), label: "no recipe", family: "none" };

  const badge = document.createElement("div");
  badge.textContent =
    "3D " +
    BUILD_TAG +
    " - " +
    name +
    " - " +
    H.toFixed(1) +
    '" - ' +
    (built.label || built.family);
  badge.style.cssText =
    "position:absolute;left:10px;top:10px;z-index:2;font:600 11px/1.3 system-ui,sans-serif;" +
    "background:rgba(255,255,255,0.92);color:#3a2a1a;padding:6px 10px;border-radius:10px;" +
    "box-shadow:0 1px 4px rgba(0,0,0,0.12);pointer-events:none;max-width:94%;";
  container.appendChild(badge);

  const width = container.clientWidth || 420;
  const height = Math.min(440, Math.max(340, width));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd8e2ec);
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
  camera.position.set(0.5, 1.25, 3.7);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.borderRadius = "12px";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.cursor = "grab";

  scene.add(new THREE.HemisphereLight(0xf5fbff, 0x7a8a9a, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(2, 5, 4);
  scene.add(key);
  scene.add(makeSoftShadow());

  const root = new THREE.Group();
  const plush = built.group;
  root.add(plush);
  scene.add(root);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, 0);
  // Deer is taller (dangling legs) - frame more of the stack
  if (built.family === "deer") {
    controls.target.set(0, 0.35, 0);
    camera.position.set(0.55, 1.05, 4.1);
  }
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.minDistance = 1.6;
  controls.maxDistance = 8;
  controls.update();

  let frame = 0;
  let alive = true;
  let t0 = performance.now();
  function animate(now) {
    if (!alive) return;
    frame = requestAnimationFrame(animate);
    plush.position.y = Math.sin((now - t0) / 1000 * 1.3) * 0.025;
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
    dispose: function () {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      container.innerHTML = "";
      container._plush3d = null;
      container._otter3d = null;
    },
  };
  container._plush3d = api;
  container._otter3d = api;
  return api;
}

window.AmigurumiPlush3D = {
  createPlush3DPreview: createPlush3DPreview,
  BUILD_TAG: BUILD_TAG,
};
// Back-compat for older app.js wiring
window.AmigurumiOtter3D = {
  createOtter3DPreview: createPlush3DPreview,
  createPlush3DPreview: createPlush3DPreview,
  BUILD_TAG: BUILD_TAG,
};
