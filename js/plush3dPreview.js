/**
 * Recipe-driven Three.js plush preview for all quick-pick animals.
 * Layout by posture family; sizes from animal.parts inches (+ otter stitch builders).
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

var BUILD_TAG = "engine36";

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
  if (n.indexOf("unicorn") >= 0) return { main: "#f2eef8", deep: "#d8cce8", cream: "#fff8ff", accent: "#e8b4d4" };
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

function layoutFamily(animal) {
  const plan = (animal && animal.plan) || "sitting";
  const f = (animal && animal.features) || {};
  const name = String((animal && animal.name) || "").toLowerCase();
  if (f.floppyWaterMammal || name.indexOf("otter") >= 0) return "otter";
  if (plan === "biped" || name.indexOf("deer") >= 0) return "deer";
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
  addEllipsoid(group, mats.main, headR, headR * 0.96, headR * 0.96, 0, headY, u(0.08));
  if (faceStyle === "CONTINUOUS_NOSE_FIRST") {
    addEllipsoid(group, mats.cream, headR * 0.88, u(7 / rpi / 2), headR * 0.78, 0, headY - headR * 0.22, headR * 0.4);
  } else if (muzzleP) {
    const mz = Math.max(0.7, ((muzzleP.chLen || 5) / spi) * 1.35);
    addEllipsoid(group, mats.cream, u(mz * 0.35), u(mz * 0.25), u(mz * 0.4), 0, headY - headR * 0.15, headR * 0.85);
  }
  const earD = inch(earP, "diameterIn", headD * 0.22);
  const earR = u(earD / 2);
  addEllipsoid(group, mats.main, earR, earR * 0.75, earR * 0.7, -headR * 0.7, headY + headR * 0.65, 0);
  addEllipsoid(group, mats.main, earR, earR * 0.75, earR * 0.7, headR * 0.7, headY + headR * 0.65, 0);
  addEyes(group, headR, headY, u(0.08), mats.black);
  group.position.y = -u(bodyH * 0.35);
  return {
    group: group,
    label:
      "otter · arms " +
      armSts +
      "sts · tail " +
      tailBaseSts +
      "sts" +
      (stitchTrue ? " · stitch-true" : ""),
  };
}

function buildSittingGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.15 / H;
  function u(v) {
    return v * U;
  }
  const headP = partByKey(animal, "head");
  const bodyP = partByKey(animal, "body");
  const armP = partByKey(animal, "arm");
  const legP = partByKey(animal, "leg") || partByKey(animal, "foot");
  const earP = partByKey(animal, "ear");
  const tailP = partByKey(animal, "tail");
  const snoutP = partByKey(animal, "snout") || partByKey(animal, "muzzle");
  const hornP = partByKey(animal, "horn");
  const cap = (bodyP && bodyP.maxStitchCap) || (animal.yarnProfile && animal.yarnProfile.maxStitchCap);

  // Chinchilla: one-piece body+head
  const isChin = String(animal.name || "").toLowerCase().indexOf("chinchilla") >= 0;
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
  addEllipsoid(group, mats.main, bodyRx, bodyRy, bodyRx * 0.95, 0, bodyY, 0);
  addEllipsoid(group, mats.cream, bodyRx * 0.65, bodyRy * 0.6, u(0.18), 0, bodyY, bodyRx * 0.8);

  const headR = u(headD / 2);
  const headY = isChin ? bodyY + bodyRy * 0.55 : bodyY + bodyRy + headR * 0.75;
  if (!isChin || headP) {
    addEllipsoid(group, mats.main, headR, headR * 0.95, headR * 0.95, 0, headY, u(0.05));
  }
  if (snoutP) {
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
    const longEar = String(animal.name || "").toLowerCase().indexOf("bunny") >= 0;
    const eD = u(inch(earP, "diameterIn", headD * 0.25) / 2);
    const eH = u(inch(earP, "heightIn", longEar ? headD * 0.7 : headD * 0.28));
    if (longEar) {
      [-1, 1].forEach(function (side) {
        addCylinder(group, mats.main, eD * 0.6, eD, eH, side * headR * 0.45, headY + headR * 0.5 + eH * 0.4, -headR * 0.1, 0.15, side * 0.1);
      });
    } else {
      [-1, 1].forEach(function (side) {
        addEllipsoid(group, mats.main, eD, eD * 0.8, eD * 0.6, side * headR * 0.7, headY + headR * 0.6, 0);
      });
    }
  }

  if (tailP) {
    const bushy = (animal.features && animal.features.bushyTail) || inch(tailP, "diameterIn", 0) > headD * 0.35;
    if (bushy || (tailP.shape && String(tailP.shape).indexOf("sphere") >= 0)) {
      const td = u(inch(tailP, "diameterIn", headD * 0.28) / 2);
      addEllipsoid(group, mats.deep, td, td, td, 0, bodyY - bodyRy * 0.2, -bodyRx * 0.95);
    } else if (tailP.shape === "chain-tail") {
      const th = u(inch(tailP, "lengthIn", 0.6));
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

  // Spiral mane hint for unicorn
  if (partByKey(animal, "mane")) {
    addEllipsoid(group, mats.accent, headR * 0.35, headR * 0.5, headR * 0.25, -headR * 0.2, headY + headR * 0.2, -headR * 0.7);
  }

  addEyes(group, headR, headY, u(0.05), mats.black);
  group.position.y = -u(bodyH * 0.3);
  return { group: group, label: "sitting · recipe inches" };
}

function buildDeerGroup(animal, gauge, mats) {
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
  const muzzleP = partByKey(animal, "muzzle");
  const antlerP = partByKey(animal, "antler");
  const cap = bodyP && bodyP.maxStitchCap;

  const bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", H * 0.35), spi, cap);
  const bodyH = inch(bodyP, "heightIn", bodyD * 1.1);
  const headD = finishedDiameterIn(inch(headP, "diameterIn", H * 0.42), spi, cap);
  const group = new THREE.Group();
  const bodyRx = u(bodyD / 2);
  const bodyRy = u(bodyH / 2);
  addEllipsoid(group, mats.main, bodyRx * 0.9, bodyRy, bodyRx, 0, bodyRy, 0);
  const headR = u(headD / 2);
  const headY = bodyRy * 2 + headR * 0.55;
  addEllipsoid(group, mats.main, headR, headR, headR, 0, headY, 0);
  if (muzzleP) {
    const md = u(inch(muzzleP, "diameterIn", headD * 0.35) / 2);
    addEllipsoid(group, mats.cream, md, md * 0.7, md * 1.2, 0, headY - headR * 0.2, headR * 0.75);
  }
  const limbD = u(inch(armP, "diameterIn", headD * 0.12) / 2);
  const armH = u(inch(armP, "heightIn", headD * 0.7));
  const legH = u(inch(legP, "heightIn", headD * 0.85));
  [-1, 1].forEach(function (side) {
    addCylinder(group, mats.main, limbD, limbD, armH, side * bodyRx * 0.7, bodyRy * 1.1, 0, 0.1, side * 0.15);
    addCylinder(group, mats.main, limbD, limbD * 1.1, legH, side * bodyRx * 0.4, legH * 0.4, 0, 0, 0);
  });
  if (antlerP) {
    const ah = u(inch(antlerP, "heightIn", headD * 0.4));
    const ad = u(inch(antlerP, "diameterIn", 0.25) / 2);
    [-1, 1].forEach(function (side) {
      addCylinder(group, mats.deep, ad * 0.5, ad, ah, side * headR * 0.35, headY + headR * 0.6 + ah * 0.35, -headR * 0.1, -0.15, side * 0.2);
    });
  }
  addEyes(group, headR, headY, 0, mats.black);
  group.position.y = -u(0.2);
  return { group: group, label: "dangling deer · recipe inches" };
}

function buildQuadGroup(animal, gauge, mats) {
  const H = animal.designedHeightIn || 10;
  const spi = gauge.spi;
  const U = 2.0 / H;
  function u(v) {
    return v * U;
  }
  const bodyP = partByKey(animal, "body");
  const headP = partByKey(animal, "head");
  const legP = partByKey(animal, "leg");
  const earP = partByKey(animal, "ear");
  const tailP = partByKey(animal, "tail");
  const trunkP = partByKey(animal, "trunk");
  const wingP = partByKey(animal, "wing");
  const cap = bodyP && bodyP.maxStitchCap;

  const bodyLen = inch(bodyP, "lengthIn", inch(bodyP, "heightIn", H * 0.45));
  const bodyD = finishedDiameterIn(inch(bodyP, "diameterIn", H * 0.28), spi, cap);
  const headD = finishedDiameterIn(inch(headP, "diameterIn", H * 0.28), spi, cap);
  const neckH = inch(bodyP, "heightIn", H * 0.15);
  const longNeck = animal.features && animal.features.longNeck;

  const group = new THREE.Group();
  const bRx = u(bodyLen / 2);
  const bRy = u(bodyD / 2);
  addEllipsoid(group, mats.main, bRx, bRy, bRy * 0.9, 0, bRy * 1.6, 0);

  const neckLen = u(longNeck ? neckH : neckH * 0.4);
  if (neckLen > 0.05) {
    addCylinder(group, mats.main, bRy * 0.45, bRy * 0.55, neckLen, bRx * 0.7, bRy * 1.6 + neckLen * 0.4, 0, 0, -1.0);
  }

  const headR = u(headD / 2);
  const headX = bRx * 0.95 + (longNeck ? neckLen * 0.6 : headR * 0.3);
  const headY = bRy * 1.6 + (longNeck ? neckLen * 0.85 : headR * 0.4);
  addEllipsoid(group, mats.main, headR * 1.1, headR, headR, headX, headY, 0);

  const snoutLen = inch(headP, "lengthIn", animal.features && animal.features.longSnout ? headD * 0.5 : headD * 0.25);
  addEllipsoid(group, mats.cream, u(snoutLen / 2), headR * 0.45, headR * 0.45, headX + headR * 0.7, headY - headR * 0.1, 0);

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
    [-1, 1].forEach(function (side) {
      addEllipsoid(group, mats.main, eD * 0.6, eD, eD * 0.4, headX, headY + headR * 0.7, side * headR * 0.5);
    });
  }
  if (tailP) {
    const bushy = animal.features && animal.features.bushyTail;
    const td = u(inch(tailP, "diameterIn", bodyD * 0.35) / 2);
    if (bushy) {
      addEllipsoid(group, mats.deep, td, td * 1.2, td, -bRx * 0.95, bRy * 1.5, 0);
    } else {
      const th = u(inch(tailP, "heightIn", bodyD * 0.6));
      addCylinder(group, mats.deep, td * 0.4, td, th, -bRx * 0.9, bRy * 1.4, 0, 1.1, 0);
    }
  }
  if (trunkP) {
    const td = u(inch(trunkP, "diameterIn", headD * 0.25) / 2);
    const th = u(inch(trunkP, "heightIn", headD * 0.8));
    addCylinder(group, mats.main, td * 0.7, td, th, headX + headR * 0.9, headY - th * 0.3, 0, 0.5, 0);
  }
  if (wingP) {
    const wd = u(inch(wingP, "diameterIn", bodyD * 0.6) / 2);
    [-1, 1].forEach(function (side) {
      addEllipsoid(group, mats.accent, wd * 0.3, wd * 0.8, wd, 0, bRy * 2.0, side * bRy * 1.1);
    });
  }
  partsByKey(animal, "spike").forEach(function (sp, i) {
    const sd = u(inch(sp, "diameterIn", 0.2) / 2);
    const sh = u(inch(sp, "heightIn", 0.4));
    addCylinder(group, mats.deep, 0.01, sd, sh, -bRx * 0.3 + i * u(0.25), bRy * 2.2, 0, 0, 0);
  });

  addEyes(group, headR, headY, 0, mats.black);
  // shift eyes onto face +X
  group.children.forEach(function (ch) {
    if (ch.material === mats.black && ch.geometry && ch.geometry.type === "SphereGeometry") {
      ch.position.x = headX + headR * 0.55;
      ch.position.z = ch.position.z * 0.5 + (ch.position.z >= 0 ? headR * 0.35 : -headR * 0.35);
    }
  });

  group.position.y = -u(0.15);
  group.rotation.y = 0.35;
  return { group: group, label: "quadruped · recipe inches" };
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
  return { group: group, label: "bird · recipe inches" };
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
  return { group: group, label: "fish · recipe inches" };
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
  return { group: group, label: "octopus · recipe inches" };
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
  return { group: group, label: "turtle · recipe inches" };
}

function buildPlushGroup(animal, gauge, faceStyle) {
  const pal = speciesPalette(animal && animal.name);
  const mats = {
    main: yarnMat(pal.main),
    deep: yarnMat(pal.deep),
    cream: yarnMat(pal.cream),
    accent: yarnMat(pal.accent),
    black: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.35 }),
  };
  const family = layoutFamily(animal);
  if (family === "otter") return Object.assign(buildOtterGroup(animal, gauge, faceStyle, mats), { family: family });
  if (family === "deer") return Object.assign(buildDeerGroup(animal, gauge, mats), { family: family });
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
    " · " +
    name +
    " · " +
    H.toFixed(1) +
    '" · ' +
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
