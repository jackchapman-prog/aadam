/**
 * Simple Three.js floppy-otter plush preview.
 * Built from Pattern Request (face path, silhouette) — not AI.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

var BUILD_TAG = "engine29";

function makeChenilleTexture(baseHex, stitchHex) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.7 + Math.random() * 2.2;
    const a = 0.05 + Math.random() * 0.14;
    ctx.fillStyle =
      Math.random() > 0.45
        ? "rgba(255,255,255," + a + ")"
        : stitchHex.replace(/[\d.]+\)$/, a.toFixed(2) + ")");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = stitchHex;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  for (let y = 0; y < size; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.4, 2.4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function yarnMat(hex, stitchHex, opts) {
  opts = opts || {};
  const map = makeChenilleTexture(hex, stitchHex || "rgba(0,0,0,0.18)");
  return new THREE.MeshStandardMaterial({
    map: map,
    color: 0xffffff,
    roughness: opts.roughness != null ? opts.roughness : 0.96,
    metalness: 0,
  });
}

function addEllipsoid(parent, mat, sx, sy, sz, x, y, z) {
  const geo = new THREE.SphereGeometry(1, 36, 28);
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
  // Warmer caramel + bright cream so the new look is obvious
  const main = yarnMat("#c48a52", "rgba(70,35,12,0.2)");
  const deep = yarnMat("#8a5528", "rgba(40,20,8,0.28)");
  const cream = yarnMat("#fff4e0", "rgba(120,90,50,0.12)");

  // Chubby pear body
  addEllipsoid(group, main, 0.62, 0.55, 0.55, 0, 0.28, 0);
  // BIG cream tummy (front) — hard to miss
  addEllipsoid(group, cream, 0.46, 0.42, 0.22, 0, 0.26, 0.42);

  // Thick tail backrest going UP behind the body
  const t0 = addEllipsoid(group, deep, 0.32, 0.26, 0.3, 0, 0.35, -0.48);
  t0.rotation.x = 0.4;
  const t1 = addEllipsoid(group, deep, 0.22, 0.2, 0.34, 0, 0.62, -0.78);
  t1.rotation.x = 0.7;
  const t2 = addEllipsoid(group, deep, 0.12, 0.11, 0.22, 0, 0.88, -1.02);
  t2.rotation.x = 0.85;

  // Wide paddle feet
  const footL = addEllipsoid(group, main, 0.36, 0.07, 0.22, -0.36, 0.02, 0.42);
  const footR = addEllipsoid(group, main, 0.36, 0.07, 0.22, 0.36, 0.02, 0.42);
  footL.rotation.y = 0.25;
  footR.rotation.y = -0.25;
  addEllipsoid(group, cream, 0.22, 0.035, 0.13, -0.36, 0.07, 0.52);
  addEllipsoid(group, cream, 0.22, 0.035, 0.13, 0.36, 0.07, 0.52);

  // Soft arms hugging chest
  const armL = addEllipsoid(group, main, 0.12, 0.2, 0.12, -0.4, 0.46, 0.32);
  const armR = addEllipsoid(group, main, 0.12, 0.2, 0.12, 0.4, 0.46, 0.32);
  armL.rotation.set(0.3, 0, 0.7);
  armR.rotation.set(0.3, 0, -0.7);

  // Big chibi head
  const headY = 1.05;
  addEllipsoid(group, main, 0.5, 0.48, 0.48, 0, headY, 0.1);

  if (faceStyle === "CONTINUOUS_NOSE_FIRST") {
    const snout = addEllipsoid(group, cream, 0.42, 0.24, 0.36, 0, headY - 0.12, 0.22);
    snout.scale.y = 0.6;
  } else {
    addEllipsoid(group, cream, 0.24, 0.15, 0.2, 0, headY - 0.08, 0.44);
  }

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.15,
    metalness: 0.4,
  });
  const eyeGeo = new THREE.SphereGeometry(0.065, 20, 16);
  const eyeY =
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? headY + 0.05 : headY + 0.1;
  const eyeZ =
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? 0.46 : 0.44;
  [-0.16, 0.16].forEach(function (x) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, eyeY, eyeZ);
    group.add(eye);
    const hi = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    hi.position.set(x - 0.02, eyeY + 0.025, eyeZ + 0.05);
    group.add(hi);
  });

  // Nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 })
  );
  nose.scale.set(1.2, 0.7, 1);
  nose.position.set(
    0,
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? headY - 0.16 : headY - 0.12,
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? 0.54 : 0.58
  );
  group.add(nose);

  // Simple smile stitch
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x2a1810 })
  );
  smile.rotation.x = Math.PI;
  smile.position.set(
    0,
    nose.position.y - 0.06,
    nose.position.z - 0.02
  );
  group.add(smile);

  // Whisker dots
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0x3a2818 });
  [-0.12, -0.18, 0.12, 0.18].forEach(function (x, i) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), whiskerMat);
    w.position.set(x, nose.position.y - 0.02, nose.position.z - 0.08);
    if (i < 2) w.position.y -= 0.03 * (i % 2);
    else w.position.y -= 0.03 * ((i - 2) % 2);
    group.add(w);
  });

  // Ear bumps
  addEllipsoid(group, main, 0.1, 0.08, 0.08, -0.34, headY + 0.32, 0);
  addEllipsoid(group, main, 0.1, 0.08, 0.08, 0.34, headY + 0.32, 0);

  group.rotation.x = 0.06;
  group.position.y = -0.35;
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
  g.addColorStop(0, "rgba(40,50,70,0.32)");
  g.addColorStop(0.5, "rgba(40,50,70,0.12)");
  g.addColorStop(1, "rgba(40,50,70,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 1.4),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.04;
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
  container.style.position = "relative";

  // On-screen proof the new file loaded (helps with cache confusion)
  const badge = document.createElement("div");
  badge.textContent = "3D build " + BUILD_TAG + " · cream tummy";
  badge.style.cssText =
    "position:absolute;left:10px;top:10px;z-index:2;font:600 12px/1.2 system-ui,sans-serif;" +
    "background:rgba(255,255,255,0.88);color:#3a2a1a;padding:6px 10px;border-radius:999px;" +
    "box-shadow:0 1px 4px rgba(0,0,0,0.12);pointer-events:none;";
  container.appendChild(badge);

  const width = container.clientWidth || 420;
  const height = Math.min(440, Math.max(340, width));

  const scene = new THREE.Scene();
  // Soft blue-gray backdrop — obvious vs old beige
  scene.background = new THREE.Color(0xd6e4ef);

  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
  // Front-ish view so cream tummy + smile are visible
  camera.position.set(0.35, 1.15, 3.6);

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
  const fill = new THREE.DirectionalLight(0xffe2c4, 0.45);
  fill.position.set(-3, 2, 1);
  scene.add(fill);

  scene.add(makeSoftShadow());

  const otterRoot = new THREE.Group();
  const otter = buildOtterGroup(faceStyle);
  otterRoot.add(otter);
  scene.add(otterRoot);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.5, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.8;
  controls.maxDistance = 7;
  controls.maxPolarAngle = Math.PI * 0.55;
  // Keep facing mostly forward so tummy stays readable; user can still orbit
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.update();

  let frame = 0;
  let alive = true;
  let t0 = performance.now();
  function animate(now) {
    if (!alive) return;
    frame = requestAnimationFrame(animate);
    const t = (now - t0) / 1000;
    otter.position.y = Math.sin(t * 1.4) * 0.03;
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
      container._otter3d = null;
    },
  };
  container._otter3d = api;
  return api;
}

window.AmigurumiOtter3D = {
  createOtter3DPreview: createOtter3DPreview,
  BUILD_TAG: BUILD_TAG,
};
