import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const colors = {
  ivory: 0xf4edda, wood: 0xb68a5c, grain: 0x98714e, sand: 0xdac798,
  jade: 0x498b70, fern: 0x78a77c, leaf: 0xa4bb76, glass: 0xb7e4dc,
  pebble: 0x9eaa98, orange: 0xed9a54, coral: 0xd77c51, teal: 0x569b9d,
  cream: 0xf2d897, eye: 0x344a42,
};

export function createAquariumWorld() {
  const root = new THREE.Group();
  root.name = 'aquarium';
  const materials = new Map();
  function material(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.68 }));
    return materials.get(color);
  }
  function mesh(geometry, mat, position, parent = root) {
    const object = new THREE.Mesh(geometry, typeof mat === 'number' ? material(mat) : mat);
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, color, position, parent) {
    return mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.22), color, position, parent);
  }
  const sphereGeometry = new THREE.SphereGeometry(1, 20, 14);
  function sphere(color, position, scale, parent) {
    const object = mesh(sphereGeometry, color, position, parent);
    object.scale.set(...scale);
    return object;
  }
  function tube(points, radius, color, parent = root) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 20, radius, 7, false), color, [0, 0, 0], parent);
  }

  // A little glass garden sits in a rounded, furniture-like plinth.
  for (const x of [-1.92, 1.92]) {
    for (const z of [-0.88, 0.88]) box(0.36, 0.22, 0.36, colors.wood, [x, 0.15, z]);
  }
  box(5.3, 0.39, 2.76, colors.ivory, [0, 0.42, 0]);
  box(5.12, 0.1, 2.58, colors.wood, [0, 0.66, 0]);
  box(4.76, 0.19, 2.18, colors.sand, [0, 0.8, 0]);
  box(4.94, 0.07, 2.36, colors.grain, [0, 0.71, 0]);
  // Small brass inset and two screws make the stand feel assembled.
  box(0.74, 0.16, 0.025, 0xc9ad78, [0, 0.43, 1.39]);
  for (const x of [-0.28, 0.28]) sphere(colors.grain, [x, 0.43, 1.409], [0.018, 0.018, 0.008]);

  const pane = new THREE.MeshStandardMaterial({ color: colors.glass, transparent: true, opacity: 0.045, roughness: 0.13, metalness: 0.08, depthWrite: false, side: THREE.DoubleSide });
  const rim = new THREE.MeshStandardMaterial({ color: 0xafd6cf, transparent: true, opacity: 0.5, roughness: 0.2, depthWrite: false });
  const water = new THREE.MeshStandardMaterial({ color: 0xaed9cf, transparent: true, opacity: 0.1, roughness: 0.3, depthWrite: false, side: THREE.DoubleSide });
  for (const z of [-1.13, 1.13]) {
    const glass = mesh(new THREE.PlaneGeometry(4.84, 2.75), pane, [0, 2.085, z]);
    glass.castShadow = glass.receiveShadow = false;
    glass.renderOrder = z > 0 ? 5 : 1;
    for (const y of [0.72, 3.46]) box(4.9, 0.035, 0.035, rim, [0, y, z]);
  }
  for (const x of [-2.42, 2.42]) {
    const glass = mesh(new THREE.PlaneGeometry(2.26, 2.75), pane, [x, 2.085, 0]);
    glass.rotation.y = Math.PI / 2;
    glass.castShadow = glass.receiveShadow = false;
    glass.renderOrder = 4;
    for (const z of [-1.13, 1.13]) box(0.035, 2.75, 0.035, rim, [x, 2.085, z]);
    for (const y of [0.72, 3.46]) box(0.035, 0.035, 2.26, rim, [x, y, 0]);
  }
  const surface = mesh(new THREE.PlaneGeometry(4.8, 2.22), water, [0, 3.19, 0]);
  surface.rotation.x = -Math.PI / 2;
  surface.castShadow = surface.receiveShadow = false;
  surface.renderOrder = 3;
  for (const z of [-1.13, 1.13]) box(4.8, 0.018, 0.018, rim, [0, 3.19, z]);
  // Highlights are short and offset from corners, leaving the center perfectly clear.
  for (const [x, y, length] of [[-2.37, 2.94, 0.55], [2.37, 1.35, 0.32]]) {
    const highlight = box(0.025, length, 0.014, 0xe2f4e8, [x, y, 1.15]);
    highlight.castShadow = false;
  }

  const plants = [];
  function plant(x, z, height, color, phase) {
    const group = new THREE.Group();
    group.position.set(x, 0.86, z);
    root.add(group);
    const bend = Math.sin(phase) * 0.16;
    tube([[0, 0, 0], [bend * 0.3, height * 0.45, 0], [bend, height, 0]], 0.021, colors.jade, group);
    for (let i = 0; i < 7; i++) {
      const side = i % 2 ? 1 : -1;
      const leaf = sphere(color, [bend * (i / 7) + side * 0.105, 0.19 + i * height * 0.105, 0], [0.1, height * 0.14, 0.036], group);
      leaf.rotation.z = side * -0.65;
      leaf.rotation.y = Math.sin(i) * 0.55;
    }
    plants.push({ object: group, phase });
  }
  for (const [x, z, height, color, phase] of [
    [-2.01, -0.63, 1.9, colors.jade, 0.4], [-1.65, -0.82, 1.55, colors.fern, 1.2],
    [-1.95, -0.17, 1.17, colors.leaf, 2.5], [1.93, -0.68, 1.67, colors.jade, 3.1],
    [1.59, -0.86, 1.22, colors.fern, 4.4], [2.07, -0.15, 0.9, colors.leaf, 5.5],
  ]) plant(x, z, height, color, phase);

  // Rounded river stones anchor the planting and a small ceramic hideout.
  for (let i = 0; i < 21; i++) {
    const angle = i * 2.39996;
    const x = Math.sin(angle) * (0.78 + (i % 4) * 0.43);
    const z = Math.cos(angle) * (0.28 + (i % 3) * 0.24);
    sphere(i % 3 === 0 ? 0xe9ddbc : i % 3 === 1 ? colors.pebble : 0xbcb497, [x, 0.92, z], [0.09 + (i % 3) * 0.025, 0.065, 0.08 + (i % 2) * 0.04]);
  }
  const arch = mesh(new THREE.TorusGeometry(0.29, 0.13, 10, 28, Math.PI), 0xb39f82, [-0.45, 0.98, -0.44]);
  arch.scale.z = 2;
  for (const x of [-0.74, -0.16]) sphere(0xb39f82, [x, 0.94, -0.44], [0.15, 0.15, 0.28]);

  const fish = [];
  function createFish(name, color, finColor, size, phase, height, speed) {
    const group = new THREE.Group();
    group.name = `fish-${name}`;
    group.scale.setScalar(size);
    root.add(group);
    sphere(color, [0, 0, 0], [0.37, 0.21, 0.13], group);
    sphere(color, [0.28, 0.015, 0], [0.14, 0.15, 0.11], group);
    const tail = new THREE.Group();
    tail.position.x = -0.36;
    group.add(tail);
    for (const side of [-1, 1]) {
      const lobe = sphere(finColor, [-0.13, side * 0.095, 0], [0.19, 0.095, 0.035], tail);
      lobe.rotation.z = -side * 0.55;
    }
    const dorsal = sphere(finColor, [-0.04, 0.19, 0], [0.19, 0.105, 0.028], group);
    dorsal.rotation.z = 0.25;
    for (const side of [-1, 1]) {
      sphere(colors.ivory, [0.24, 0.065, side * 0.104], [0.065, 0.07, 0.026], group);
      sphere(colors.eye, [0.26, 0.067, side * 0.126], [0.029, 0.039, 0.012], group);
      sphere(0xffffff, [0.269, 0.083, side * 0.137], [0.009, 0.011, 0.004], group);
      const fin = sphere(finColor, [0.015, -0.08, side * 0.14], [0.12, 0.055, 0.032], group);
      fin.rotation.y = side * 0.45;
      // Gill seams are short, curved strokes along both flanks.
      tube([[0.13, 0.06, side * 0.121], [0.1, 0, side * 0.141], [0.13, -0.06, side * 0.122]], 0.01, finColor, group);
    }
    sphere(finColor, [0.41, -0.017, 0], [0.024, 0.023, 0.033], group);
    if (name === 'teal') {
      for (const x of [-0.18, -0.04]) {
        for (const side of [-1, 1]) sphere(0xa8d2b6, [x, 0.03, side * 0.124], [0.033, 0.14, 0.012], group);
      }
    }
    fish.push({ object: group, tail, phase, height, speed });
  }
  createFish('gold', colors.orange, colors.coral, 1.03, 0.6, 2.57, 0.18);
  createFish('teal', colors.teal, 0x397f81, 0.88, 3.3, 1.94, 0.15);
  createFish('lemon', colors.cream, 0xd3ac63, 0.72, 5.2, 1.39, 0.2);

  const bubbles = [];
  sphere(colors.pebble, [1.28, 0.96, 0.36], [0.22, 0.08, 0.17]);
  tube([[1.28, 0.92, 0.36], [1.65, 0.91, 0.55], [2.2, 0.91, 0.8], [2.32, 1.35, 0.8]], 0.016, 0x7b9a8b);
  const bubbleMaterial = new THREE.MeshStandardMaterial({ color: 0xe8fbef, roughness: 0.16, transparent: true, opacity: 0.46, depthWrite: false });
  for (let i = 0; i < 10; i++) {
    const bubble = sphere(bubbleMaterial, [1.28, 1.03 + i * 0.215, 0.36], [0.028 + (i % 3) * 0.009, 0.033 + (i % 3) * 0.009, 0.028 + (i % 3) * 0.009]);
    bubble.name = `bubble-${i}`;
    bubble.castShadow = bubble.receiveShadow = false;
    bubbles.push(bubble);
  }
  let time = 0;
  function animate() {
    for (const item of fish) {
      const angle = item.phase + time * item.speed;
      item.object.position.set(Math.sin(angle) * 1.53, item.height + Math.sin(angle * 1.7) * 0.055, Math.cos(angle) * 0.43);
      item.object.rotation.y = Math.atan2(0.43 * Math.sin(angle), 1.53 * Math.cos(angle));
      item.tail.rotation.y = Math.sin(time * 3.2 + item.phase) * 0.22;
    }
    plants.forEach(item => { item.object.rotation.z = Math.sin(time * 0.8 + item.phase) * 0.025; });
    bubbles.forEach((bubble, i) => {
      const rise = (i * 0.215 + time * 0.21) % 2.13;
      bubble.position.set(1.28 + Math.sin(rise * 5 + i) * 0.045, 1.04 + rise, 0.36 + Math.sin(rise * 3 + i) * 0.025);
    });
  }
  animate();
  return {
    root,
    update(delta, active) {
      if (!active) return;
      time += delta;
      animate();
    },
  };
}
