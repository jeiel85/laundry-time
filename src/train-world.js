import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const palette = {
  wall: 0xeee4cf, enamel: 0x9eb9ac, wood: 0xa27756, woodDark: 0x75543e,
  brass: 0xc7aa78, seat: 0x456f64, cushion: 0x5c8476, seam: 0x8fa797,
  paper: 0xfff6e3, sky: 0xbad5d6, farHill: 0x9db9b2, hill: 0x7c9f8a,
};

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

export function createTrainWorld() {
  const root = new THREE.Group();
  root.name = 'train-compartment';
  const materials = new Map();
  function material(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: [palette.seat, palette.cushion].includes(color) ? 0.96 : 0.65 }));
    return materials.get(color);
  }
  function mesh(geometry, color, position, parent = root) {
    const object = new THREE.Mesh(geometry, material(color));
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, color, position, parent) {
    return mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.22), color, position, parent);
  }
  function sphere(r, color, position, scale = [1, 1, 1], parent) {
    const object = mesh(new THREE.SphereGeometry(r, 24, 16), color, position, parent);
    object.scale.set(...scale);
    return object;
  }
  function tube(points, radius, color, parent = root) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), color, [0, 0, 0], parent);
  }
  const { wall, enamel, wood, woodDark, brass, seat, cushion, seam, paper } = palette;

  // A cutaway travelling compartment with two facing upholstered benches.
  box(5.6, 0.18, 3.1, woodDark, [0, 0.12, -0.05]);
  box(5.48, 0.12, 2.98, wood, [0, 0.25, -0.05]);
  for (let i = 0; i < 12; i++) box(0.018, 0.012, 2.85, 0x8a654c, [-2.5 + i * 0.45, 0.315, -0.05]);
  const wallShape = roundedRect(5.4, 3.85, 0.24, 0, 2.17);
  wallShape.holes.push(roundedRect(4.3, 1.88, 0.28, 0, 2.78));
  const wallGeometry = new THREE.ExtrudeGeometry(wallShape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2, steps: 1 });
  mesh(wallGeometry, wall, [0, 0, -1.32]);
  box(5.28, 1.35, 0.09, enamel, [0, 1, -1.12]);
  for (const x of [-2.25, -1.5, -0.75, 0, 0.75, 1.5, 2.25]) box(0.025, 0.99, 0.025, 0x8ca99a, [x, 0.96, -1.057]);
  box(5.3, 0.1, 0.14, wood, [0, 0.4, -1.02]);
  const frame = roundedRect(4.54, 2.12, 0.39, 0, 2.78);
  frame.holes.push(roundedRect(4.3, 1.88, 0.28, 0, 2.78));
  mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.09, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 }), wood, [0, 0, -1.1]);
  box(4.58, 0.13, 0.48, wood, [0, 1.78, -0.98]);
  box(0.055, 1.83, 0.075, brass, [0, 2.78, -1]);
  box(5.15, 0.1, 0.14, wood, [0, 4.04, -1.12]);

  // Depth layers pass at different speeds; the rounded wall masks the corners.
  const landscape = new THREE.Group();
  root.add(landscape);
  const clipping = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 2.6),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 2.6),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.5),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 3.8),
  ];
  box(5.8, 2.5, 0.06, palette.sky, [0, 2.7, -2.1], landscape);
  sphere(0.22, 0xffe3aa, [1.43, 3.36, -2], [1, 1, 0.2], landscape);
  const moving = [];
  for (let i = 0; i < 5; i++) {
    const cloud = new THREE.Group();
    cloud.position.set(i * 1.7 - 3.4, 3.12 + (i % 2) * 0.22, -1.97);
    landscape.add(cloud);
    for (let j = 0; j < 3; j++) sphere(0.13, 0xeef1df, [j * 0.14, j === 1 ? 0.04 : 0, 0], [1.4, 0.75, 0.3], cloud);
    moving.push({ object: cloud, start: i * 1.7, width: 8.5, speed: 0.035 });
  }
  for (let i = 0; i < 6; i++) {
    const hill = sphere(1, i % 2 ? palette.hill : palette.farHill, [i - 2.5, 1.82 + (i % 2) * 0.08, -1.85 + (i % 2) * 0.06], [1.7, 0.67 + (i % 3) * 0.12, 0.15], landscape);
    moving.push({ object: hill, start: i * 1.3, width: 7.8, speed: 0.07 });
  }
  box(5.7, 0.16, 0.07, 0xb5b98b, [0, 1.91, -1.62], landscape);
  for (let i = 0; i < 10; i++) {
    const tree = new THREE.Group();
    tree.position.set(i * 0.76 - 3.8, 1.87, -1.49);
    landscape.add(tree);
    box(0.04, 0.22, 0.04, woodDark, [0, 0.1, 0], tree);
    for (let j = 0; j < 2; j++) mesh(new THREE.ConeGeometry(0.15 - j * 0.035, 0.38, 10), i % 2 ? 0x527e68 : 0x68947b, [0, 0.28 + j * 0.15, 0], tree);
    moving.push({ object: tree, start: i * 0.76, width: 7.6, speed: 0.42 });
  }
  const landscapeMaterials = new Map();
  landscape.traverse(object => {
    if (!object.isMesh) return;
    if (!landscapeMaterials.has(object.material)) {
      const clipped = object.material.clone();
      clipped.clippingPlanes = clipping;
      landscapeMaterials.set(object.material, clipped);
    }
    object.material = landscapeMaterials.get(object.material);
    object.castShadow = object.receiveShadow = false;
  });
  const usedMaterials = new Set();
  root.traverse(object => { if (object.isMesh) usedMaterials.add(object.material); });
  materials.forEach(m => { if (!usedMaterials.has(m)) { m.dispose(); materials.delete(m.color.getHex()); } });

  for (const side of [-1, 1]) {
    const bench = new THREE.Group();
    bench.position.set(side * 1.92, 0, 0.18);
    root.add(bench);
    box(1.06, 0.19, 2.07, woodDark, [0, 0.79, 0], bench);
    box(0.2, 1.62, 2.07, wood, [side * 0.48, 1.55, 0], bench);
    box(0.22, 1.32, 1.91, seat, [side * 0.33, 1.57, 0], bench);
    for (const z of [-0.48, 0.48]) {
      box(0.86, 0.24, 0.94, cushion, [-side * 0.04, 0.99, z], bench);
      box(0.025, 0.025, 0.83, seam, [-side * 0.46, 1.035, z], bench);
      sphere(0.035, seam, [side * 0.205, 1.62, z], [0.3, 1, 1], bench);
    }
    for (const z of [-1, 1]) {
      box(0.11, 0.83, 0.12, woodDark, [-side * 0.32, 0.74, z], bench);
      box(1.05, 0.13, 0.19, wood, [0, 1.23, z], bench);
    }
    for (const z of [-0.76, 0.76]) box(0.13, 0.44, 0.14, woodDark, [side * 0.28, 0.53, z], bench);
    box(0.08, 0.23, 0.67, paper, [side * 0.195, 2.05, 0], bench);
  }

  // Supported table, finished book, hollow porcelain cup and saucer.
  box(1.87, 0.12, 1.82, wood, [0, 1.25, -0.13]);
  box(1.78, 0.035, 1.72, paper, [0, 1.325, -0.13]);
  tube([[0, 1.18, 0.34], [0, 0.69, -0.1], [0, 0.67, -1.03]], 0.045, brass);
  const book = new THREE.Group();
  book.position.set(-0.36, 1.38, 0.05);
  book.rotation.y = -0.17;
  root.add(book);
  box(0.64, 0.025, 0.79, 0xca8a70, [0, 0, 0], book);
  box(0.6, 0.07, 0.74, paper, [0, 0.045, 0], book);
  box(0.64, 0.025, 0.79, 0xca8a70, [0, 0.09, 0], book);
  box(0.027, 0.025, 0.8, brass, [-0.18, 0.106, 0], book);
  const cup = new THREE.Group();
  cup.position.set(0.42, 1.36, -0.4);
  root.add(cup);
  mesh(new THREE.CylinderGeometry(0.235, 0.21, 0.032, 32), paper, [0, 0, 0], cup);
  const cupProfile = [[0.075, 0.03], [0.11, 0.04], [0.135, 0.26], [0.12, 0.275], [0.103, 0.24], [0.087, 0.065]];
  mesh(new THREE.LatheGeometry(cupProfile.map(([x, y]) => new THREE.Vector2(x, y)), 32), paper, [0, 0, 0], cup);
  mesh(new THREE.CircleGeometry(0.108, 32), 0x694c36, [0, 0.233, 0], cup).rotation.x = -Math.PI / 2;
  tube([[0.12, 0.23, 0], [0.23, 0.22, 0], [0.24, 0.12, 0], [0.105, 0.1, 0]], 0.023, paper, cup);

  // Mounted reading lamps suit a seated carriage; standing straps don't.
  for (const x of [-2.47, 2.47]) {
    box(0.13, 0.26, 0.06, brass, [x, 2.73, -1]);
    tube([[x, 2.72, -0.98], [x, 2.72, -0.8], [x, 2.93, -0.75]], 0.025, brass);
    mesh(new THREE.ConeGeometry(0.12, 0.19, 24, 1, true), paper, [x, 2.96, -0.75]);
  }
  let travel = 0;
  function positionLandscape() {
    moving.forEach(({ object, start, width, speed }) => { object.position.x = ((start + travel * speed) % width) - width / 2; });
  }
  positionLandscape();
  return {
    root,
    update(delta, active) {
      if (!active) return;
      travel += delta;
      positionLandscape();
    },
  };
}
