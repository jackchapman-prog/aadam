/**
 * Simple Three.js floppy-otter plush preview.
 * Built from Pattern Request (face path, silhouette) — not AI.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function makeChenilleTexture(baseHex, stitchHex) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Soft yarn flecks (chenille look) instead of a hard grid
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.6 + Math.random() * 1.8;
    const a = 0.04 + Math.random() * 0.12;
    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(255,255,255," + a + ")"
        : stitchHex.replace(/[\d.]+\)$/, a.toFixed(2) + ")");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle horizontal "row" cues
  ctx.strokeStyle = stitchHex;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.35;
  for (let y = 0; y < size; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() * 1.5 - 0.75));
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

function yarnMat(hex, stitchHex, opts) {
  opts = opts || {};
  const map = makeChenilleTexture(hex, stitchHex || "rgba(0,0,0,0.18)");
  return new THREE.MeshStandardMaterial({
    map: map,
    color: 0xffffff,
    roughness: opts.roughness != null ? opts.roughness : 0.95,
    metalness: 0,
  });
}

function addEllipsoid(parent, mat, sx, sy, sz, x, y, z) {
  const geo = new THREE.SphereGeometry(1, 32, 24);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.set(sx, sy, sz);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildOtterGroup(faceStyle) {
  const group = new THREE.Group();
  const main = yarnMat("#7a5230", "rgba(40,20,8,0.22)");
  const deep = yarnMat("#4e3218", "rgba(25,12,5,0.28)");
  const cream = yarnMat("#f3e6d0", "rgba(100,75,45,0.14)");

  // Pear body — wide hips, softer chest (floppy seated)
  addEllipsoid(group, main, 0.58, 0.52, 0.52, 0, 0.32, 0.02);
  // Cream tummy
  addEllipsoid(group, cream, 0.38, 0.36, 0.18, 0, 0.3, 0.38);

  // Thick tapered tail as backrest (tip → base)
  const tailBase = addEllipsoid(group, deep, 0.28, 0.22, 0.26, 0.02, 0.38, -0.42);
  tailBase.rotation.x = 0.35;
  const tailMid = addEllipsoid(group, deep, 0.2, 0.18, 0.28, 0.02, 0.55, -0.68);
  tailMid.rotation.x = 0.55;
  const tailTip = addEllipsoid(group, deep, 0.12, 0.1, 0.18, 0.02, 0.72, -0.9);
  tailTip.rotation.x = 0.65;

  // Wide paddle feet forward / slightly out
  const footL = addEllipsoid(group, main, 0.32, 0.06, 0.2, -0.32, 0.04, 0.38);
  const footR = addEllipsoid(group, main, 0.32, 0.06, 0.2, 0.32, 0.04, 0.38);
  footL.rotation.y = 0.2;
  footR.rotation.y = -0.2;
  addEllipsoid(group, cream, 0.18, 0.03, 0.11, -0.32, 0.08, 0.46);
  addEllipsoid(group, cream, 0.18, 0.03, 0.11, 0.32, 0.08, 0.46);

  // Soft short arms on upper chest, resting inward
  const armL = addEllipsoid(group, main, 0.11, 0.18, 0.11, -0.34, 0.48, 0.3);
  const armR = addEllipsoid(group, main, 0.11, 0.18, 0.11, 0.34, 0.48, 0.3);
  armL.rotation.z = 0.55;
  armR.rotation.z = -0.55;
  armL.rotation.x = 0.25;
  armR.rotation.x = 0.25;

  // Large chibi head (~40% of height)
  const headY = 0.98;
  addEllipsoid(group, main, 0.46, 0.44, 0.44, 0, headY, 0.08);

  if (faceStyle === "CONTINUOUS_NOSE_FIRST") {
    // Cream lower face / snout (round-switch mask)
    const snout = addEllipsoid(group, cream, 0.38, 0.22, 0.34, 0, headY - 0.1, 0.2);
    snout.scale.y = 0.58;
  } else {
    // Separate cream muzzle patch
    addEllipsoid(group, cream, 0.2, 0.13, 0.17, 0, headY - 0.06, 0.4);
  }

  // Glossy safety eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.18,
    metalness: 0.35,
  });
  const eyeGeo = new THREE.SphereGeometry(0.06, 20, 16);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeY =
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? headY + 0.04 : headY + 0.08;
  const eyeZ =
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? 0.42 : 0.4;
  eyeL.position.set(-0.15, eyeY, eyeZ);
  eyeR.position.set(0.15, eyeY, eyeZ);
  group.add(eyeL, eyeR);

  const hiMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hiGeo = new THREE.SphereGeometry(0.018, 10, 10);
  [-0.15, 0.15].forEach(function (x) {
    const hi = new THREE.Mesh(hiGeo, hiMat);
    hi.position.set(x - 0.018, eyeY + 0.022, eyeZ + 0.045);
    group.add(hi);
  });

  // Soft black nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.45 })
  );
  nose.scale.set(1.15, 0.72, 0.95);
  nose.position.set(
    0,
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? headY - 0.14 : headY - 0.1,
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? 0.5 : 0.54
  );
  group.add(nose);

  // Tiny ear bumps
  addEllipsoid(group, main, 0.09, 0.07, 0.07, -0.3, headY + 0.3, -0.02);
  addEllipsoid(group, main, 0.09, 0.07, 0.07, 0.3, headY + 0.3, -0.02);

  // Soft floppy lean
  group.rotation.x = 0.08;
  group.position.y = -0.28;
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
    8,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "rgba(60,40,25,0.28)");
  g.addColorStop(0.55, "rgba(60,40,25,0.1)");
  g.addColorStop(1, "rgba(60,40,25,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.02;
  return mesh;
}

function createOtter3DPreview(container, options) {
  options = options || {};
  const faceStyle = options.facialConstructionStyle || "SEPARATE_PATCH";

  if (container._otter3d && container._otter3d.dispose) {
    container._otter3d.dispose();
  }
  container.innerHTML = "";
  container.hidden = false;

  const width = container.clientWidth || 420;
  const height = Math.min(420, Math.max(320, width));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e2d8);
  scene.fog = new THREE.Fog(0xe8e2d8, 6, 14);

  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
  camera.position.set(2.0, 1.45, 3.4);

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

  const hemi = new THREE.HemisphereLight(0xfff8ef, 0x8a7360, 0.95);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 0.95);
  key.position.set(2.5, 5.5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd9b8, 0.4);
  fill.position.set(-3.5, 2.2, -1.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xfff0e0, 0.25);
  rim.position.set(0, 2, -4);
  scene.add(rim);

  scene.add(makeSoftShadow());

  const otterRoot = new THREE.Group();
  const otter = buildOtterGroup(faceStyle);
  otterRoot.add(otter);
  scene.add(otterRoot);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.6;
  controls.maxDistance = 6;
  controls.maxPolarAngle = Math.PI * 0.58;
  controls.update();

  let frame = 0;
  let alive = true;
  let t0 = performance.now();
  function animate(now) {
    if (!alive) return;
    frame = requestAnimationFrame(animate);
    const t = (now - t0) / 1000;
    // Slow turn + soft bob (plush on a shelf vibe)
    otterRoot.rotation.y = t * 0.22;
    otter.position.y = Math.sin(t * 1.2) * 0.025;
    controls.update();
    renderer.render(scene, camera);
  }
  animate(t0);

  function onResize() {
    const w = container.clientWidth || 420;
    const h = Math.min(420, Math.max(320, w));
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
      container._otter3d = null;
    },
  };
  container._otter3d = api;
  return api;
}

window.AmigurumiOtter3D = {
  createOtter3DPreview: createOtter3DPreview,
};
