/**
 * Simple Three.js floppy-otter plush preview.
 * Built from Pattern Request (face path, silhouette) — not AI.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function makeChenilleTexture(baseHex, stitchHex) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = stitchHex;
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y + (y % 12 === 0 ? 1 : 0));
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  for (let x = 0; x < size; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function yarnMat(hex, stitchHex, opts) {
  opts = opts || {};
  const map = makeChenilleTexture(hex, stitchHex || "rgba(0,0,0,0.18)");
  return new THREE.MeshStandardMaterial({
    map: map,
    color: 0xffffff,
    roughness: opts.roughness != null ? opts.roughness : 0.92,
    metalness: 0,
  });
}

function addEllipsoid(parent, mat, sx, sy, sz, x, y, z) {
  const geo = new THREE.SphereGeometry(1, 28, 20);
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
  const main = yarnMat("#6b4423", "rgba(30,15,5,0.22)");
  const deep = yarnMat("#4a2f18", "rgba(20,10,4,0.25)");
  const cream = yarnMat("#f0e2cc", "rgba(90,70,40,0.15)");

  // Body (egg)
  addEllipsoid(group, main, 0.55, 0.48, 0.5, 0, 0.35, 0);
  // Thick tail backrest
  const tail = addEllipsoid(group, deep, 0.22, 0.45, 0.2, 0.42, 0.4, -0.15);
  tail.rotation.z = -0.45;
  // Paddle feet (flat, forward)
  addEllipsoid(group, main, 0.28, 0.07, 0.18, -0.28, 0.05, 0.32);
  addEllipsoid(group, main, 0.28, 0.07, 0.18, 0.28, 0.05, 0.32);
  addEllipsoid(group, cream, 0.14, 0.035, 0.09, -0.28, 0.08, 0.38);
  addEllipsoid(group, cream, 0.14, 0.035, 0.09, 0.28, 0.08, 0.38);
  // Narrow arms on upper chest, inward
  const armL = addEllipsoid(group, main, 0.1, 0.16, 0.1, -0.22, 0.55, 0.28);
  const armR = addEllipsoid(group, main, 0.1, 0.16, 0.1, 0.22, 0.55, 0.28);
  armL.rotation.z = 0.35;
  armR.rotation.z = -0.35;

  // Head
  const headY = 0.95;
  addEllipsoid(group, main, 0.42, 0.4, 0.4, 0, headY, 0.05);

  if (faceStyle === "CONTINUOUS_NOSE_FIRST") {
    // Cream lower face / snout (round-switch)
    const snout = addEllipsoid(group, cream, 0.34, 0.2, 0.32, 0, headY - 0.08, 0.22);
    snout.scale.y = 0.55;
    // Eyes on color switch line
  } else {
    // Separate cream muzzle patch
    addEllipsoid(group, cream, 0.18, 0.12, 0.16, 0, headY - 0.05, 0.36);
  }

  // Safety eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.25,
    metalness: 0.4,
  });
  const eyeGeo = new THREE.SphereGeometry(0.055, 16, 12);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeY =
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? headY + 0.02 : headY + 0.06;
  const eyeZ =
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? 0.38 : 0.34;
  eyeL.position.set(-0.14, eyeY, eyeZ);
  eyeR.position.set(0.14, eyeY, eyeZ);
  group.add(eyeL, eyeR);

  // Highlight dots
  const hiMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hiGeo = new THREE.SphereGeometry(0.015, 8, 8);
  [-0.14, 0.14].forEach(function (x) {
    const hi = new THREE.Mesh(hiGeo, hiMat);
    hi.position.set(x - 0.015, eyeY + 0.02, eyeZ + 0.04);
    group.add(hi);
  });

  // Nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 })
  );
  nose.scale.set(1.1, 0.7, 0.9);
  nose.position.set(
    0,
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? headY - 0.12 : headY - 0.08,
    faceStyle === "CONTINUOUS_NOSE_FIRST" ? 0.48 : 0.5
  );
  group.add(nose);

  // Tiny ear bumps
  addEllipsoid(group, main, 0.08, 0.06, 0.06, -0.28, headY + 0.28, -0.05);
  addEllipsoid(group, main, 0.08, 0.06, 0.06, 0.28, headY + 0.28, -0.05);

  group.position.y = -0.35;
  return group;
}

function createOtter3DPreview(container, options) {
  options = options || {};
  const faceStyle = options.facialConstructionStyle || "SEPARATE_PATCH";

  // Clean previous
  if (container._otter3d && container._otter3d.dispose) {
    container._otter3d.dispose();
  }
  container.innerHTML = "";
  container.hidden = false;

  const width = container.clientWidth || 420;
  const height = Math.min(420, Math.max(320, width));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xece7df);

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(2.2, 1.6, 3.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.borderRadius = "12px";
  renderer.domElement.style.display = "block";

  const hemi = new THREE.HemisphereLight(0xfff6ea, 0x6b5a4a, 0.85);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe0c0, 0.35);
  fill.position.set(-3, 2, -2);
  scene.add(fill);

  const otterRoot = new THREE.Group();
  otterRoot.add(buildOtterGroup(faceStyle));
  scene.add(otterRoot);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, 0);
  controls.enableDamping = true;
  controls.minDistance = 1.8;
  controls.maxDistance = 6;
  controls.update();

  let frame = 0;
  let alive = true;
  function animate() {
    if (!alive) return;
    frame = requestAnimationFrame(animate);
    otterRoot.rotation.y += 0.004;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

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
