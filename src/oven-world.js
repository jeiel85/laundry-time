import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// A countertop oven with a real, open cavity: the bread sits on a tray, the
// tray sits on rails, and the thin door pane leaves the bake easy to watch.
export function createOvenWorld() {
  const root = new THREE.Group();
  root.name = 'little-bakery';
  const colors = {
    wood: 0xb88c63, edge: 0x92684a, grain: 0xa77b55, enamel: 0xefe1c5,
    coral: 0xc67f62, trim: 0x9d573e, inside: 0x4d3e33, steel: 0x958d7d,
    brass: 0xc6a16a, dark: 0x5c4938, linen: 0x9cac96, seam: 0x7d917b,
  };
  const materials = new Map();
  function material(color, options = {}) {
    const key = `${color}:${JSON.stringify(options)}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...options }));
    return materials.get(key);
  }
  function mesh(geometry, color, position, parent = root, options = {}) {
    const object = new THREE.Mesh(geometry, material(color, options));
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, color, position, parent = root, radius = 0.045, options = {}) {
    return mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 3, h / 3, d / 3)), color, position, parent, options);
  }
  function tube(points, radius, color, parent = root, options = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    return mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), color, [0, 0, 0], parent, options);
  }
  function cylinder(radius, height, color, position, parent = root, options = {}) {
    return mesh(new THREE.CylinderGeometry(radius, radius, height, 32), color, position, parent, options);
  }

  box(5.35, 0.2, 3.16, colors.edge, [0, 0.19, 0]);
  box(5.22, 0.07, 3.03, colors.wood, [0, 0.325, 0]);
  for (const x of [-2.18, 2.18]) for (const z of [-1.15, 1.15]) box(0.36, 0.13, 0.3, colors.edge, [x, 0.065, z]);
  for (let i = 0; i < 8; i++) {
    const z = -1.29 + i * 0.36;
    tube([[-2.43, 0.364, z], [-1, 0.364, z + 0.017], [0.8, 0.364, z - 0.02], [2.43, 0.364, z + 0.012]], 0.004, colors.grain);
  }

  // Four feet support the shell; separate panels preserve the deep interior.
  for (const x of [-2.02, 1.04]) for (const z of [-0.83, 0.76]) box(0.25, 0.19, 0.26, colors.dark, [x, 0.455, z]);
  box(3.8, 0.2, 2.12, colors.coral, [-0.48, 0.65, -0.1], root, 0.09);
  box(3.8, 0.2, 2.12, colors.enamel, [-0.48, 2.9, -0.1], root, 0.09);
  box(0.2, 2.14, 2.12, colors.enamel, [-2.28, 1.775, -0.1], root, 0.08);
  box(0.7, 2.14, 2.12, colors.enamel, [1.07, 1.775, -0.1], root, 0.08);
  box(3.42, 2.1, 0.13, colors.enamel, [-0.48, 1.76, -1.09]);
  const cavity = box(2.82, 1.94, 0.055, colors.inside, [-0.76, 1.77, -0.995]);
  cavity.name = 'oven-cavity-back';
  box(0.05, 1.93, 1.93, colors.inside, [-2.16, 1.77, -0.01]);
  box(0.05, 1.93, 1.93, colors.inside, [0.64, 1.77, -0.01]);
  box(2.83, 0.045, 1.9, colors.inside, [-0.76, 2.73, -0.02]);
  box(2.83, 0.055, 1.9, colors.inside, [-0.76, 0.815, -0.02]);
  // The inset back catches a little warm light from the upper heating strip.
  const warmBack = box(2.49, 1.55, 0.017, 0x755039, [-0.76, 1.75, -0.956], root, 0.08, { emissive: 0x9e4b16, emissiveIntensity: 0.19 });
  for (const x of [-1.82, -1.12, -0.42, 0.28]) {
    box(0.18, 0.018, 0.013, 0x48382c, [x, 2.32, -0.94]);
  }
  const heating = tube([[-1.95, 2.61, -0.62], [-1.95, 2.61, 0.55], [-1.65, 2.61, 0.67], [0.12, 2.61, 0.67], [0.43, 2.61, 0.55], [0.43, 2.61, -0.62]], 0.021, 0xc88037, root, { emissive: 0xf79c35, emissiveIntensity: 0.9 });
  heating.name = 'oven-heating-element';
  // A tiny recessed lamp has a housing, rather than floating light geometry.
  box(0.13, 0.23, 0.17, colors.brass, [0.555, 2.35, -0.57]);
  box(0.025, 0.15, 0.12, 0xffe0a2, [0.477, 2.35, -0.57], root, 0.015, { emissive: 0xffc273, emissiveIntensity: 1.1 });

  for (const x of [-2.065, 0.545]) {
    box(0.09, 0.07, 1.57, colors.steel, [x, 1.105, 0.04]);
  }
  for (const z of [-0.69, 0.03, 0.75]) tube([[-2.04, 1.145, z], [0.52, 1.145, z]], 0.018, colors.steel, root, { metalness: 0.5, roughness: 0.38 });
  for (let i = 0; i < 9; i++) {
    const x = -1.97 + i * 0.305;
    tube([[x, 1.145, -0.72], [x, 1.145, 0.77]], 0.013, colors.steel, root, { metalness: 0.5, roughness: 0.38 });
  }
  const tray = box(2.52, 0.045, 1.38, 0x88735a, [-0.76, 1.198, 0.035], root, 0.025, { metalness: 0.35, roughness: 0.53 });
  tray.name = 'oven-baking-tray';
  for (const z of [-0.67, 0.74]) box(2.55, 0.065, 0.035, colors.steel, [-0.76, 1.23, z]);
  for (const x of [-2.035, 0.515]) box(0.035, 0.065, 1.4, colors.steel, [x, 1.23, 0.035]);
  box(2.41, 0.007, 1.25, 0xd6be95, [-0.76, 1.225, 0.035], root, 0.018);

  const crust = new THREE.MeshStandardMaterial({ color: 0xe4c38e, roughness: 0.92, vertexColors: true });
  const cut = new THREE.MeshStandardMaterial({ color: 0xf3dcb1, roughness: 1 });
  const rawColor = new THREE.Color(0xe4c38e), bakedColor = new THREE.Color(0xbf7638);
  const rawCut = new THREE.Color(0xf3dcb1), bakedCut = new THREE.Color(0xe8bd81);
  const rolls = [];
  function bunTop(x, z) {
    return 0.275 + 0.275 * Math.sqrt(Math.max(0, 1 - (x / 0.4) ** 2 - (z / 0.36) ** 2));
  }
  for (let roll = 0; roll < 3; roll++) {
    const bun = new THREE.Group();
    bun.name = `oven-bun-${roll}`;
    bun.position.set(-1.55 + roll * 0.79, 1.232, roll === 1 ? 0.16 : -0.02);
    bun.rotation.y = (roll - 1) * 0.09;
    root.add(bun);
    const geometry = new THREE.SphereGeometry(1, 56, 36);
    const positions = geometry.attributes.position;
    const vertexColors = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) * 0.4, z = positions.getZ(i) * 0.36;
      const sy = positions.getY(i);
      let y = (sy + 1) * 0.275;
      if (sy > 0.15) {
        for (const score of [-0.13, 0, 0.13]) {
          const distance = z - x * 0.35 - score;
          y -= 0.023 * Math.exp(-((distance / 0.025) ** 2)) * Math.max(0, 1 - (x / 0.3) ** 8);
        }
      }
      positions.setXYZ(i, x, y, z);
      const shade = new THREE.Color().setRGB(1, 0.92 + Math.max(0, -sy) * 0.08, 0.79 + Math.max(0, -sy) * 0.21);
      vertexColors.push(shade.r, shade.g, shade.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
    geometry.computeVertexNormals();
    const loaf = new THREE.Mesh(geometry, crust);
    loaf.castShadow = loaf.receiveShadow = true;
    bun.add(loaf);
    // Pale exposed crumb follows the three shallow cuts in the domed crust.
    for (const score of [-0.13, 0, 0.13]) {
      const points = [];
      for (let step = 0; step < 11; step++) {
        const x = -0.215 + step * 0.043, z = x * 0.35 + score;
        points.push(new THREE.Vector3(x, bunTop(x, z) - 0.017, z));
      }
      const slash = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 24, 0.011, 6, false), cut);
      slash.castShadow = false;
      bun.add(slash);
    }
    for (let i = 0; i < 8; i++) {
      const angle = i * 2.39996 + roll * 0.6;
      const radius = 0.12 + (i % 3) * 0.047;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
      const y = bunTop(x, z) + 0.006;
      const seed = mesh(new THREE.SphereGeometry(1, 8, 6), 0xf5ddb0, [x, y, z], bun);
      seed.scale.set(0.012, 0.006, 0.026);
      seed.rotation.y = angle + 0.3;
    }
    rolls.push(bun);
  }

  // The door has its own gasket, four narrow rails, hinges and an attached bar.
  for (const x of [-2.17, 0.66]) box(0.11, 1.96, 0.12, colors.dark, [x, 1.77, 0.98]);
  for (const y of [0.81, 2.73]) box(2.9, 0.105, 0.12, colors.dark, [-0.76, y, 0.98]);
  for (const x of [-2.13, 0.61]) box(0.19, 1.91, 0.14, colors.coral, [x, 1.77, 1.045]);
  for (const y of [0.885, 2.65]) box(2.9, 0.17, 0.14, colors.coral, [-0.76, y, 1.045]);
  const pane = mesh(new THREE.PlaneGeometry(2.54, 1.54), 0xdda96c, [-0.76, 1.755, 1.059], root, { transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide, roughness: 0.2 });
  pane.name = 'oven-door-glass';
  pane.renderOrder = 3;
  pane.castShadow = pane.receiveShadow = false;
  // A single quiet reflection sits at the side, clear of the bread silhouettes.
  const reflection = box(0.022, 1.2, 0.005, 0xffedc9, [-1.985, 1.82, 1.067], root, 0.002, { transparent: true, opacity: 0.28, depthWrite: false });
  reflection.rotation.z = -0.08;
  reflection.castShadow = false;
  for (const x of [-1.84, 0.32]) box(0.11, 0.13, 0.26, colors.brass, [x, 2.58, 1.18]);
  box(2.38, 0.12, 0.13, colors.dark, [-0.76, 2.58, 1.34], root, 0.05);
  for (const x of [-1.93, 0.41]) box(0.21, 0.07, 0.16, colors.brass, [x, 0.85, 1.09]);

  const control = box(0.56, 1.91, 0.06, colors.enamel, [1.075, 1.77, 1.002]);
  control.name = 'oven-control-panel';
  for (const y of [2.34, 1.65]) {
    for (let tick = 0; tick < 7; tick++) {
      const angle = (-0.8 + tick * 0.27) * Math.PI;
      const mark = box(0.018, 0.055, 0.014, colors.brass, [1.075 + Math.sin(angle) * 0.225, y + Math.cos(angle) * 0.225, 1.043], root, 0.003);
      mark.rotation.z = -angle;
    }
    cylinder(0.184, 0.065, colors.brass, [1.075, y, 1.074]).rotation.x = Math.PI / 2;
    cylinder(0.155, 0.155, colors.coral, [1.075, y, 1.16]).rotation.x = Math.PI / 2;
    const pointer = box(0.022, 0.086, 0.015, colors.enamel, [1.108, y + 0.06, 1.246], root, 0.006);
    pointer.rotation.z = -0.4;
  }
  cylinder(0.045, 0.025, colors.dark, [1.075, 1.11, 1.055]).rotation.x = Math.PI / 2;
  const indicator = cylinder(0.027, 0.029, 0xe4ab5e, [1.075, 1.11, 1.07], root, { emissive: 0xef9b38, emissiveIntensity: 0.85 });
  indicator.rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i++) box(0.34, 0.024, 0.022, 0xbfae91, [1.075, 0.91 + i * 0.055, 1.041], root, 0.006);
  for (let i = 0; i < 7; i++) box(0.041, 0.012, 0.34, colors.dark, [-1.7 + i * 0.28, 3.006, -0.67], root, 0.009);

  // A quilted oven mitt and a little flour jar finish the working counter.
  const mitt = new THREE.Group();
  mitt.position.set(1.96, 0.425, 0.48);
  mitt.rotation.y = -0.18;
  root.add(mitt);
  box(0.64, 0.1, 1.04, colors.linen, [0, 0, 0], mitt, 0.045);
  const thumb = mesh(new THREE.SphereGeometry(0.2, 20, 12), colors.linen, [-0.3, 0.02, -0.12], mitt);
  thumb.scale.set(0.8, 0.27, 1.3);
  for (let i = 0; i < 4; i++) {
    const z = -0.35 + i * 0.22;
    tube([[-0.25, 0.055, z], [0.25, 0.055, z + 0.1]], 0.006, colors.seam, mitt);
  }
  box(0.66, 0.02, 0.13, colors.seam, [0, 0.062, 0.4], mitt, 0.008);
  const loop = mesh(new THREE.TorusGeometry(0.065, 0.013, 8, 20), colors.seam, [0.19, 0, 0.57], mitt);
  loop.rotation.x = Math.PI / 2;
  cylinder(0.29, 0.65, 0xe9d9b9, [1.99, 0.69, -0.76], root, { roughness: 0.9 });
  cylinder(0.305, 0.055, colors.edge, [1.99, 1.042, -0.76]);
  cylinder(0.282, 0.04, colors.wood, [1.99, 1.083, -0.76]);
  box(0.22, 0.18, 0.017, 0xf3e8cf, [1.99, 0.73, -0.466], root, 0.018);
  // A small wheat imprint communicates the jar without tiny illegible text.
  tube([[1.99, 0.68, -0.451], [1.99, 0.79, -0.451]], 0.005, colors.brass);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) tube([[1.99, 0.7 + i * 0.026, -0.451], [1.99 + side * 0.04, 0.725 + i * 0.026, -0.451]], 0.005, colors.brass);

  let elapsed = 0;
  function setProgress(progress) {
    if (!Number.isFinite(progress)) return;
    const bake = THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(progress, 0, 1), 0, 1);
    crust.color.copy(rawColor).lerp(bakedColor, bake);
    cut.color.copy(rawCut).lerp(bakedCut, bake);
    rolls.forEach(bun => { bun.scale.set(0.9 + bake * 0.1, 0.86 + bake * 0.16, 0.9 + bake * 0.1); });
  }
  function animate(progress) {
    setProgress(progress);
    warmBack.material.emissiveIntensity = 0.19 + Math.sin(elapsed * 0.7) * 0.015;
    heating.material.emissiveIntensity = 0.9 + Math.sin(elapsed * 0.7) * 0.055;
  }
  animate(0);
  return {
    root,
    setProgress,
    update(delta, active, progress) {
      if (!active || !Number.isFinite(delta) || delta <= 0) return;
      elapsed += delta;
      // A cosine completes an 80-second ambient cycle without a wrap jump.
      const bake = Number.isFinite(progress) ? THREE.MathUtils.clamp(progress, 0, 1) : (1 - Math.cos(elapsed * Math.PI / 40)) / 2;
      animate(bake);
    },
  };
}
