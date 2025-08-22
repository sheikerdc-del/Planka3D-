import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer, scene, camera, controls, mesh;

export function initViewer(container) {
  if (!container) return;
  const w = container.clientWidth || 800;
  const h = container.clientHeight || 480;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
  camera.position.set(180, 140, 220);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const amb = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(120, 160, 100);
  scene.add(dir);

  const grid = new THREE.GridHelper(600, 24, 0x5980ff, 0x2d3a75);
  grid.position.y = -0.1; scene.add(grid);

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8fb3ff, metalness: 0.2, roughness: 0.7 });
  mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  window.addEventListener("resize", () => {
    const W = container.clientWidth, H = container.clientHeight;
    renderer.setSize(W, H);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  });

  animate();
}

export function updateProfile3D(points2D) {
  if (!scene) return;
  if (!points2D?.length) return;
  if (mesh) { scene.remove(mesh); mesh.geometry.dispose?.(); mesh.material.dispose?.(); }

  const shape = new THREE.Shape();
  const start = points2D[0];
  shape.moveTo(start.x, start.y);
  for (let i = 1; i < points2D.length; i++) shape.lineTo(points2D[i].x, points2D[i].y);

  const extrudeSettings = { depth: 800, bevelEnabled: false, steps: 1 };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.translate(0, 0, -extrudeSettings.depth / 2);
  geo.rotateX(Math.PI);

  const mat = new THREE.MeshStandardMaterial({ color: 0x87d4c4, metalness: 0.15, roughness: 0.7 });
  mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
}

function animate() {
  requestAnimationFrame(animate);
  controls?.update();
  renderer?.render(scene, camera);
}
