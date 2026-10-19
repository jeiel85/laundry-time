import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function roundedRect(width, height, radius, cx = 0, cy = 0) {
  const x = cx - width / 2, y = cy - height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

// A quiet window seat: weather stays behind the timber frame, while the rain
// follows the actual glass instead of falling through the room.
export function createRainWorld() {
  const root = new THREE.Group();
  root.name = 'rainy-window-nook';
  const palette = {
    oak: 0xb88d66, edge: 0x936b4e, grain: 0xa27956, trim: 0xd9e1cf,
    trimShade: 0xaabbb1, linen: 0xe9dabe, seam: 0xcaba9b, cushion: 0x829c88,
    sky: 0xa5b9c0, cloud: 0xc0cdd0, hill: 0x94aaa7, roof: 0x71858c,
    wall: 0xb7bfc0, clay: 0xc58c6c, soil: 0x625444, leaf: 0x678c64,
    leafLight: 0x87a876, brass: 0xbba377, book: 0x647d83, paper: 0xf3ead6,
  };
  const materials = new Map();
  function material(color, options = {}) {
    const key = `${color}:${JSON.stringify(options)}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...options }));
    return materials.get(key);
  }
  function mesh(geometry, color, position = [0, 0, 0], parent = root, options = {}) {
    const object = new THREE.Mesh(geometry, material(color, options));
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(width, height, depth, color, position, parent = root, radius = 0.035) {
    return mesh(new RoundedBoxGeometry(width, height, depth, 3, Math.min(radius, width / 3, height / 3, depth / 3)), color, position, parent);
  }
  function sphere(radius, color, position, scale = [1, 1, 1], parent = root) {
    const object = mesh(new THREE.SphereGeometry(radius, 20, 12), color, position, parent);
    object.scale.set(...scale);
    return object;
  }
  function tube(points, radius, color, parent = root) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    return mesh(new THREE.TubeGeometry(curve, 20, radius, 6, false), color, [0, 0, 0], parent);
  }

  box(5.35, 0.19, 2.5, palette.edge, [0, 0.115, 0]);
  box(5.22, 0.075, 2.38, palette.oak, [0, 0.247, 0]);
  for (let i = 0; i < 9; i++) box(0.009, 0.009, 2.25, palette.grain, [-2.25 + i * 0.56, 0.29, 0]);
  box(5.05, 0.42, 1.9, palette.trim, [0, 0.51, 0.16]);
  box(4.8, 0.17, 1.7, palette.linen, [0, 0.8, 0.18], root, 0.07);
  for (const x of [-2.04, -1.02, 0, 1.02, 2.04]) box(0.018, 0.21, 0.02, palette.trimShade, [x, 0.49, 1.119]);
  box(4.92, 0.07, 0.1, palette.edge, [0, 0.3, 1.12]);
  // The rounded exterior, inner reveal and sill read as a single little object.
  const frame = roundedRect(5.05, 3.08, 0.25, 0, 2.25);
  frame.holes.push(roundedRect(4.47, 2.58, 0.15, 0, 2.25));
  mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.25, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 }), palette.oak, [0, 0, -1.04]);
  const reveal = roundedRect(4.61, 2.72, 0.19, 0, 2.25);
  reveal.holes.push(roundedRect(4.42, 2.53, 0.13, 0, 2.25));
  mesh(new THREE.ExtrudeGeometry(reveal, { depth: 0.05, bevelEnabled: false }), palette.trim, [0, 0, -0.77]);
  box(5.26, 0.14, 0.76, palette.oak, [0, 0.955, -0.61]);
  box(5.04, 0.045, 0.08, palette.edge, [0, 0.866, -0.23]);
  box(5.13, 0.09, 0.37, palette.edge, [0, 3.815, -0.89]);

  // A shallow, clipped roofscape cannot poke out around the cutaway's sides.
  const landscape = new THREE.Group();
  landscape.name = 'rain-window-outdoors';
  root.add(landscape);
  const clipping = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 2.225),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 2.225),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.98),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 3.52),
  ];
  function outside(object) {
    object.traverse(child => {
      if (!child.isMesh) return;
      const clone = child.material.clone();
      clone.clippingPlanes = clipping;
      child.material = clone;
      child.castShadow = child.receiveShadow = false;
    });
    return object;
  }
  const sky = mesh(new THREE.ShapeGeometry(roundedRect(4.47, 2.58, 0.15, 0, 2.25)), palette.sky, [0, 0, -1.02], landscape);
  outside(sky);
  for (const [x, y, scale] of [[-1.43, 3.08, 1.12], [0.08, 3.31, 0.9], [1.44, 3.12, 1.05]]) {
    const cloud = new THREE.Group();
    cloud.position.set(x, y, -0.997);
    landscape.add(cloud);
    for (let i = 0; i < 3; i++) sphere(0.19, palette.cloud, [(i - 1) * 0.19, i === 1 ? 0.055 : 0, 0], [1.4 * scale, 0.5, 0.035], cloud);
    outside(cloud);
  }
  for (let i = 0; i < 4; i++) outside(sphere(1, palette.hill, [-2.1 + i * 1.4, 1.26 + (i % 2) * 0.1, -0.975], [1.38, 0.78, 0.012], landscape));
  for (let i = 0; i < 5; i++) {
    const x = -2.12 + i * 1.05, y = 1.13 + (i % 3) * 0.09;
    outside(box(0.88, 0.69, 0.04, i % 2 ? 0xa2b2b4 : palette.wall, [x, y, -0.945], landscape, 0.015));
    const roof = new THREE.Shape();
    roof.moveTo(x - 0.51, y + 0.31);
    roof.lineTo(x, y + 0.72);
    roof.lineTo(x + 0.51, y + 0.31);
    roof.closePath();
    outside(mesh(new THREE.ExtrudeGeometry(roof, { depth: 0.025, bevelEnabled: false }), palette.roof, [0, 0, -0.929], landscape));
    outside(box(0.1, 0.19, 0.04, palette.roof, [x + 0.23, y + 0.62, -0.94], landscape));
    for (const dx of [-0.2, 0.2]) outside(box(0.12, 0.18, 0.012, i === 2 ? 0xd5c49f : 0x879ca3, [x + dx, y + 0.03, -0.916], landscape, 0.008));
  }
  const glassZ = -0.705;
  const glass = mesh(new THREE.ShapeGeometry(roundedRect(4.42, 2.53, 0.13, 0, 2.25)), 0xe2edf0, [0, 0, glassZ - 0.018], root, { transparent: true, opacity: 0.065, depthWrite: false, roughness: 0.13, side: THREE.DoubleSide });
  glass.name = 'rain-window-glass';
  glass.castShadow = glass.receiveShadow = false;
  glass.renderOrder = 2;
  box(0.08, 2.58, 0.12, palette.trim, [0, 2.25, -0.66]);
  box(4.43, 0.075, 0.12, palette.trim, [0, 2.54, -0.66]);
  // A small paired latch belongs to the window, below the crossbar.
  for (const x of [-0.11, 0.11]) {
    box(0.036, 0.19, 0.035, palette.brass, [x, 2.19, -0.578]);
    sphere(0.032, palette.brass, [x, 2.27, -0.56], [1, 1, 0.6]);
  }

  const rain = [];
  const bounds = { left: -2.08, right: 2.08, bottom: 1.085, top: 3.405, glassZ };
  for (let i = 0; i < 37; i++) {
    const drop = new THREE.Group();
    drop.name = `rain-drop-${i}`;
    drop.userData.windowBounds = bounds;
    const size = 0.018 + (i % 4) * 0.004;
    const body = mesh(new THREE.SphereGeometry(size, 10, 8), 0x6d929e, [0, 0, 0], drop, { transparent: true, opacity: 0.6, depthWrite: false, roughness: 0.18 });
    body.scale.set(0.73, 1.5, 0.24);
    // Each drop owns its opacity; fading at the seal makes wrapping invisible.
    body.material = body.material.clone();
    body.castShadow = body.receiveShadow = false;
    body.renderOrder = 3;
    const glint = mesh(new THREE.SphereGeometry(size, 8, 6), 0xf2fbfa, [-size * 0.25, size * 0.15, size * 0.24], drop, { transparent: true, opacity: 0.7, depthWrite: false, roughness: 0.1 });
    glint.scale.set(0.22, 0.87, 0.15);
    glint.material = glint.material.clone();
    glint.castShadow = glint.receiveShadow = false;
    glint.renderOrder = 4;
    const tailLength = 0.045 + (i % 5) * 0.016;
    const tail = box(0.007, tailLength, 0.003, 0xd9edf0, [0.002, tailLength * 0.45, 0], drop, 0.002);
    tail.material = new THREE.MeshStandardMaterial({ color: 0x849faa, transparent: true, opacity: 0.36, depthWrite: false, roughness: 0.1 });
    tail.castShadow = tail.receiveShadow = false;
    tail.renderOrder = 3;
    root.add(drop);
    rain.push({ drop, body, glint, tail, x: -2.01 + ((i * 19) % 37) / 36 * 4.02, phase: ((i * 17) % 37) / 37, speed: 0.055 + (i % 7) * 0.011 });
  }

  // An unglazed terracotta pot and a few broad leaves make the inside feel warm.
  const plant = new THREE.Group();
  plant.name = 'rain-window-plant';
  plant.position.set(-1.56, 1.03, -0.43);
  root.add(plant);
  const profile = [[0.19, 0], [0.225, 0.025], [0.29, 0.4], [0.313, 0.405], [0.313, 0.455], [0.275, 0.455], [0.265, 0.395], [0.245, 0.375]];
  mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 36), palette.clay, [0, 0, 0], plant);
  const soil = mesh(new THREE.CircleGeometry(0.263, 32), palette.soil, [0, 0.386, 0], plant);
  soil.rotation.x = -Math.PI / 2;
  const leaves = new THREE.Group();
  leaves.name = 'rain-window-leaves';
  leaves.position.y = 0.39;
  plant.add(leaves);
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.4, length = 0.38 + (i % 3) * 0.11;
    const x = Math.sin(angle) * 0.28, z = Math.cos(angle) * 0.17;
    tube([[0, 0, 0], [x * 0.55, length * 0.68, z * 0.55], [x, length, z]], 0.013, palette.leaf, leaves);
    const leaf = sphere(0.12, i % 2 ? palette.leaf : palette.leafLight, [x * 1.22, length + 0.07, z * 1.2], [0.77, 1.7, 0.32], leaves);
    leaf.rotation.z = -Math.sin(angle) * 0.72;
    leaf.rotation.y = angle;
  }
  const book = new THREE.Group();
  book.position.set(1.5, 0.919, 0.42);
  book.rotation.y = -0.21;
  root.add(book);
  box(0.94, 0.055, 0.68, palette.book, [0, 0, 0], book, 0.025);
  box(0.86, 0.12, 0.6, palette.paper, [0.02, 0.085, -0.01], book, 0.01);
  box(0.94, 0.045, 0.68, palette.book, [0, 0.165, 0], book, 0.022);
  box(0.06, 0.18, 0.66, palette.book, [-0.44, 0.075, 0], book, 0.012);
  box(0.055, 0.008, 0.41, palette.clay, [0.25, 0.192, 0.15], book, 0.002);
  for (const y of [0.065, 0.1, 0.128]) box(0.79, 0.005, 0.007, 0xd8ceb8, [0.025, y, 0.294], book, 0.001);
  const cushion = box(1.62, 0.3, 0.92, palette.cushion, [0.2, 0.985, 0.4], root, 0.13);
  cushion.rotation.y = 0.05;
  tube([[-0.53, 1.01, 0.79], [0.18, 1.025, 0.85], [0.9, 1.01, 0.78]], 0.012, 0xb2bea7);
  sphere(0.028, 0xb2bea7, [0.2, 1.14, 0.4], [1, 0.3, 1]);

  // Cloning translucent drops and clipped scenery leaves helper materials behind.
  const used = new Set();
  root.traverse(object => { if (object.isMesh) used.add(object.material); });
  materials.forEach(value => { if (!used.has(value)) value.dispose(); });
  let elapsed = 0;
  function pose() {
    for (const item of rain) {
      const progress = (item.phase + elapsed * item.speed) % 1;
      const fade = Math.min(1, progress / 0.055, (1 - progress) / 0.055);
      item.drop.position.set(item.x + Math.sin(progress * Math.PI) * 0.012, bounds.top - progress * (bounds.top - bounds.bottom), glassZ);
      item.body.material.opacity = 0.6 * Math.max(0, fade);
      item.glint.material.opacity = 0.7 * Math.max(0, fade);
      item.tail.material.opacity = 0.36 * Math.max(0, fade);
    }
    leaves.rotation.z = Math.sin(elapsed * 0.7) * 0.018;
  }
  pose();
  return {
    root,
    update(delta, active) {
      if (!active || !Number.isFinite(delta) || delta <= 0) return;
      elapsed += delta;
      pose();
    },
  };
}
