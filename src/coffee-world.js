import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// A small, working pour-over station: the stand supports the ceramic cone and
// every drop falls through the open server neck to the coffee below.
export function createCoffeeWorld() {
  const root = new THREE.Group();
  root.name = 'coffee-counter';
  const palette = {
    walnut: 0x875c42, wood: 0xb58b63, grain: 0x9b7352, brass: 0xc9aa71,
    ceramic: 0xf3e7ce, paper: 0xfff5df, sage: 0x87a99b, coffee: 0x4c2b1b,
    linen: 0xe9dcc1, seam: 0xc6b99d, bean: 0x71432a,
  };
  const materials = new Map();
  function material(color, options = {}) {
    const key = `${color}:${JSON.stringify(options)}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...options }));
    return materials.get(key);
  }
  function mesh(geometry, color, position = [0, 0, 0], parent = root, options = {}) {
    const object = new THREE.Mesh(geometry, material(color, options));
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(width, height, depth, color, position, parent = root, radius = 0.04) {
    return mesh(new RoundedBoxGeometry(width, height, depth, 3, Math.min(radius, width / 3, height / 3, depth / 3)), color, position, parent);
  }
  function lathe(profile, color, position, parent = root, options = {}) {
    return mesh(new THREE.LatheGeometry(profile.map(([radius, height]) => new THREE.Vector2(radius, height)), 64), color, position, parent, options);
  }
  function tube(points, radius, color, parent = root, options = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    return mesh(new THREE.TubeGeometry(curve, 36, radius, 10, false), color, [0, 0, 0], parent, options);
  }
  function ring(radius, thickness, color, position, parent = root, options = {}) {
    const object = mesh(new THREE.TorusGeometry(radius, thickness, 10, 64), color, position, parent, options);
    object.rotation.x = Math.PI / 2;
    return object;
  }

  // Rounded serving tray, inset grain, and small feet give the whole vignette a
  // deliberate edge instead of ending abruptly on the shared scene floor.
  box(5.15, 0.2, 3.08, palette.walnut, [0, 0.19, 0]);
  box(5.02, 0.075, 2.96, palette.wood, [0, 0.302, 0]);
  for (const x of [-2.1, 2.1]) for (const z of [-1.1, 1.1]) box(0.35, 0.13, 0.3, palette.walnut, [x, 0.065, z]);
  for (let i = 0; i < 8; i++) {
    const z = -1.24 + i * 0.35;
    tube([[-2.35, 0.343, z], [-1.05, 0.344, z + 0.024], [0.6, 0.344, z - 0.015], [2.35, 0.343, z + 0.012]], 0.004, palette.grain);
  }
  // Cut-out-looking brass handles sit on short solid wood uprights.
  for (const x of [-2.37, 2.37]) {
    for (const z of [-0.48, 0.48]) box(0.12, 0.19, 0.14, palette.walnut, [x, 0.41, z]);
    tube([[x, 0.45, -0.48], [x, 0.59, -0.35], [x, 0.59, 0.35], [x, 0.45, 0.48]], 0.034, palette.brass);
  }

  const brew = new THREE.Group();
  brew.position.set(-0.72, 0.49, -0.3);
  root.add(brew);
  box(2.23, 0.15, 1.4, palette.walnut, [-0.27, -0.075, -0.05], brew);
  box(2.13, 0.035, 1.3, palette.wood, [-0.27, 0.014, -0.05], brew);
  const postX = -1.13, postZ = -0.4;
  mesh(new THREE.CylinderGeometry(0.065, 0.075, 2.2, 24), palette.brass, [postX, 1.13, postZ], brew, { roughness: 0.35, metalness: 0.45 });
  mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.06, 24), palette.brass, [postX, 0.06, postZ], brew);
  mesh(new THREE.SphereGeometry(0.085, 20, 12), palette.brass, [postX, 2.24, postZ], brew);
  // The arm meets the back of the support ring, clear of the cone's open top.
  tube([[postX, 2.1, postZ], [-0.7, 2.1, postZ], [0, 2.1, -0.31]], 0.045, palette.brass, brew, { metalness: 0.45, roughness: 0.35 });
  ring(0.295, 0.042, palette.brass, [0, 2.1, 0], brew, { metalness: 0.45, roughness: 0.35 });
  // A tightening knob and collar show how the arm is attached to the post.
  mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.16, 24), palette.walnut, [postX, 2.1, postZ], brew);
  const knob = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.095, 16), palette.brass, [postX, 2.1, postZ + 0.13], brew);
  knob.rotation.x = Math.PI / 2;

  const glass = { transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, roughness: 0.16, metalness: 0.05 };
  const server = lathe([
    [0.29, 0.015], [0.39, 0.025], [0.47, 0.11], [0.49, 0.23],
    [0.48, 0.53], [0.43, 0.75], [0.33, 0.99], [0.275, 1.15],
    [0.275, 1.31], [0.295, 1.35], [0.275, 1.365],
    [0.25, 1.32], [0.25, 1.15], [0.31, 0.98], [0.405, 0.74],
    [0.455, 0.52], [0.465, 0.23], [0.445, 0.13], [0.37, 0.065], [0.29, 0.06],
  ], 0xcde1d7, [0, 0.035, 0], brew, glass);
  server.name = 'coffee-server-glass';
  server.renderOrder = 3;
  server.castShadow = false;
  const serverRim = ring(0.276, 0.017, 0xe4f1e9, [0, 1.39, 0], brew, { ...glass, opacity: 0.53 });
  serverRim.name = 'coffee-server-opening';
  serverRim.renderOrder = 4;
  serverRim.castShadow = false;
  const handle = tube([[0.29, 1.19, 0], [0.57, 1.22, 0], [0.75, 1.01, 0], [0.7, 0.75, 0], [0.45, 0.61, 0]], 0.045, 0xd9e6dc, brew, { ...glass, opacity: 0.55 });
  handle.renderOrder = 4;
  handle.castShadow = false;
  // A small outward curl forms a lip without covering the neck opening.
  tube([[-0.235, 1.37, 0.09], [-0.325, 1.395, 0.08], [-0.35, 1.365, 0.065]], 0.021, 0xe4f1e9, brew, { ...glass, opacity: 0.52 });
  lathe([[0, 0.072], [0.35, 0.072], [0.43, 0.13], [0.455, 0.23], [0.447, 0.51], [0, 0.51]], palette.coffee, [0, 0.035, 0], brew, { roughness: 0.28 });
  const coffeeSurface = mesh(new THREE.CircleGeometry(0.445, 64), 0x744528, [0, 0.548, 0], brew, { roughness: 0.2 });
  coffeeSurface.rotation.x = -Math.PI / 2;
  coffeeSurface.name = 'server-coffee-surface';
  // Pale measurement marks on the front of the glass are tiny applied dashes.
  for (let i = 0; i < 3; i++) box(0.1 + (i === 1 ? 0.035 : 0), 0.014, 0.008, 0xd4c4a4, [-0.12, 0.26 + i * 0.16, 0.478 - i * 0.012], brew, 0.003);

  const coneBottom = 1.66;
  const cone = lathe([
    [0.046, 0], [0.079, 0], [0.095, 0.1], [0.235, 0.4],
    [0.465, 0.97], [0.505, 1.035], [0.508, 1.065], [0.478, 1.08],
    [0.455, 1.035], [0.21, 0.405], [0.063, 0.1], [0.046, 0.08], [0.046, 0],
  ], palette.ceramic, [0, coneBottom, 0], brew, { roughness: 0.4 });
  cone.name = 'hollow-ceramic-dripper';
  // Real radial fluting catches the light; the upper edge remains thin and open.
  const vertices = cone.geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i), y = vertices.getY(i);
    const radius = Math.hypot(x, z);
    if (radius < 0.08) continue;
    const amplitude = 0.011 * Math.min(1, y / 0.3);
    const fluted = radius + Math.cos(Math.atan2(x, z) * 20) * amplitude;
    vertices.setXYZ(i, x * fluted / radius, y, z * fluted / radius);
  }
  cone.geometry.computeVertexNormals();
  lathe([[0.065, 0.13], [0.22, 0.43], [0.452, 1.075], [0.466, 1.13], [0.448, 1.13], [0.43, 1.073], [0.2, 0.435], [0.05, 0.14]], palette.paper, [0, coneBottom, 0], brew, { roughness: 0.95 });
  const grounds = mesh(new THREE.CircleGeometry(0.343, 48), 0x583b28, [0, coneBottom + 0.82, 0], brew, { roughness: 1 });
  grounds.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 26; i++) {
    const angle = i * 2.39996, radius = Math.sqrt((i + 0.5) / 26) * 0.31;
    const grain = mesh(new THREE.SphereGeometry(0.012 + (i % 3) * 0.002, 6, 4), i % 2 ? 0x7c5739 : 0x3f291d, [Math.cos(angle) * radius, coneBottom + 0.822, Math.sin(angle) * radius], brew);
    grain.scale.y = 0.45;
  }

  // The folded napkin slightly overhangs its lower layer; its stitched edges
  // remain quiet enough for the cup's silhouette to be the second focal point.
  const linen = new THREE.Group();
  linen.position.set(1.18, 0.358, 0.44);
  linen.rotation.y = -0.14;
  root.add(linen);
  box(1.74, 0.035, 1.57, palette.linen, [0, 0, 0], linen, 0.015);
  box(1.65, 0.022, 1.49, 0xf0e4cb, [0.025, 0.028, -0.025], linen, 0.012);
  for (const z of [-0.715, 0.67]) tube([[-0.73, 0.044, z], [0, 0.044, z], [0.77, 0.044, z]], 0.005, palette.seam, linen);
  for (let i = 0; i < 7; i++) box(0.035, 0.008, 0.025, palette.seam, [-0.65 + i * 0.21, 0.044, 0.695], linen, 0.002);
  const cup = new THREE.Group();
  cup.position.set(1.14, 0.425, 0.6);
  root.add(cup);
  lathe([[0, 0], [0.5, 0], [0.73, 0.035], [0.78, 0.075], [0.775, 0.1], [0.7, 0.11], [0.52, 0.055], [0, 0.045]], palette.ceramic, [0, 0, 0], cup, { roughness: 0.4 });
  ring(0.46, 0.012, 0xd6c4a0, [0, 0.059, 0], cup);
  lathe([[0, 0.065], [0.32, 0.065], [0.37, 0.1], [0.445, 0.22], [0.5, 0.65], [0.51, 0.75], [0.485, 0.78], [0.452, 0.75], [0.443, 0.64], [0.39, 0.24], [0.32, 0.16], [0, 0.16]], palette.sage, [0, 0, 0], cup, { roughness: 0.36 });
  ring(0.48, 0.018, palette.ceramic, [0, 0.765, 0], cup, { roughness: 0.3 });
  tube([[0.474, 0.65, 0], [0.73, 0.68, 0], [0.865, 0.48, 0], [0.78, 0.28, 0], [0.44, 0.25, 0]], 0.065, palette.sage, cup, { roughness: 0.36 });
  const cupCoffee = mesh(new THREE.CircleGeometry(0.438, 64), 0x64402a, [0, 0.677, 0], cup, { roughness: 0.22 });
  cupCoffee.rotation.x = -Math.PI / 2;
  // Three tiny cream-colored highlights make a quiet, abstract crema crescent.
  for (let i = 0; i < 3; i++) {
    const crema = mesh(new THREE.SphereGeometry(0.035 - i * 0.006, 16, 8), 0xcfa773, [-0.2 + i * 0.07, 0.681, -0.12 - i * 0.03], cup, { roughness: 0.7 });
    crema.scale.set(1, 0.07, 0.6);
  }

  // A low spoon rests beside the cup, and a few scored beans balance the back.
  const spoon = new THREE.Group();
  spoon.position.set(1.5, 0.405, -0.91);
  spoon.rotation.y = -0.3;
  root.add(spoon);
  const bowl = mesh(new THREE.SphereGeometry(0.13, 24, 12), palette.brass, [0, 0, -0.29], spoon, { metalness: 0.55, roughness: 0.34 });
  bowl.scale.set(0.72, 0.14, 1.2);
  box(0.055, 0.027, 0.65, palette.brass, [0, 0, 0.16], spoon, 0.014);
  for (let i = 0; i < 5; i++) {
    const bean = new THREE.Group();
    bean.position.set(0.42 + (i % 3) * 0.17, 0.39, -0.93 - Math.floor(i / 3) * 0.18);
    bean.rotation.y = i * 0.83;
    root.add(bean);
    const body = mesh(new THREE.SphereGeometry(0.08, 16, 10), palette.bean, [0, 0, 0], bean, { roughness: 0.9 });
    body.scale.set(0.78, 0.48, 1.2);
    tube([[0.008, 0.038, -0.063], [-0.009, 0.041, 0], [0.006, 0.038, 0.063]], 0.006, 0x3f2519, bean);
  }

  const drops = [];
  for (let i = 0; i < 2; i++) {
    const drop = mesh(new THREE.SphereGeometry(0.026, 12, 8), 0x6c3f23, [0, coneBottom, 0], brew, { roughness: 0.25 });
    drop.name = `coffee-drop-${i}`;
    drop.scale.y = 1.55;
    drops.push(drop);
  }
  const rippleMaterial = new THREE.MeshStandardMaterial({ color: 0xa06b3c, roughness: 0.4, transparent: true, opacity: 0.2, depthWrite: false });
  const ripple = new THREE.Mesh(new THREE.TorusGeometry(1, 0.018, 6, 40), rippleMaterial);
  ripple.rotation.x = Math.PI / 2;
  ripple.position.set(0, 0.552, 0);
  brew.add(ripple);

  const steam = [];
  const steamMaterial = new THREE.MeshBasicMaterial({ color: 0xfff6e6, transparent: true, opacity: 0.23, depthWrite: false, side: THREE.DoubleSide });
  const segments = 28;
  for (let strand = 0; strand < 3; strand++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segments + 1) * 2 * 3), 3));
    const indices = [];
    for (let i = 0; i < segments; i++) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    geometry.setIndex(indices);
    const ribbon = new THREE.Mesh(geometry, steamMaterial);
    ribbon.name = `cup-steam-${strand}`;
    ribbon.renderOrder = 5;
    cup.add(ribbon);
    steam.push(ribbon);
  }
  let elapsed = 0;
  function animate() {
    drops.forEach((drop, i) => {
      const phase = (elapsed / 1.55 + i * 0.5) % 1;
      drop.position.y = coneBottom - 0.035 - phase * phase * (coneBottom - 0.59);
      drop.scale.y = 1.25 + phase * 0.65;
    });
    const ripplePhase = (elapsed / 0.775) % 1;
    ripple.scale.setScalar(0.018 + ripplePhase * 0.22);
    rippleMaterial.opacity = (1 - ripplePhase) * 0.2;
    steam.forEach((ribbon, strand) => {
      const position = ribbon.geometry.attributes.position;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (strand - 1) * 0.145 + Math.sin(t * 7 - elapsed * 0.7 + strand * 1.9) * (0.025 + t * 0.05);
        const z = 0.01 + Math.cos(t * 5 + elapsed * 0.38 + strand * 1.5) * 0.035;
        const width = Math.sin(Math.PI * t) * 0.022;
        position.setXYZ(i * 2, x - width, 0.71 + t * (0.71 + strand * 0.075), z);
        position.setXYZ(i * 2 + 1, x + width, 0.71 + t * (0.71 + strand * 0.075), z);
      }
      position.needsUpdate = true;
      ribbon.geometry.computeBoundingSphere();
    });
  }
  animate();
  return {
    root,
    update(delta, active) {
      if (!active) return;
      if (!Number.isFinite(delta) || delta <= 0) return;
      elapsed += delta;
      animate();
    },
  };
}
