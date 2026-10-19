import * as THREE from 'three';

// A little enamel planetarium. Distances and sizes are composed for legibility,
// while planet order, separate lunar motion and axial rings stay recognizable.
export function createSolarWorld() {
  const root = new THREE.Group();
  root.name = 'miniature-solar-system';
  root.scale.setScalar(0.75);
  const palette = {
    rim: 0x617389, tray: 0x2e455e, inset: 0x24384e, track: 0x687b8c,
    brass: 0xccb78e, sun: 0xffbd55, sunShadow: 0xe3993e, face: 0x72503a,
    mercury: 0xaca398, venus: 0xe8bd85, earth: 0x6caebc, land: 0xa9bd86,
    mars: 0xce8268, jupiter: 0xddb98b, saturn: 0xe4c994,
    uranus: 0x8fc5c7, neptune: 0x6f91c1, moon: 0xdbd7c9,
  };
  const materials = new Map();
  function material(color, extra = {}) {
    const key = `${color}:${JSON.stringify(extra)}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
      color, roughness: 0.66, metalness: 0, ...extra,
    }));
    return materials.get(key);
  }
  function mesh(geometry, color, parent = root, position = [0, 0, 0], extra) {
    const object = new THREE.Mesh(geometry, material(color, extra));
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function sphere(radius, color, parent, position, extra) {
    return mesh(new THREE.SphereGeometry(radius, 36, 24), color, parent, position, extra);
  }
  function disk(inner, outer, color, parent, y = 0, extra) {
    const object = mesh(new THREE.RingGeometry(inner, outer, 160), color, parent, [0, y, 0], extra);
    object.rotation.x = -Math.PI / 2;
    object.castShadow = false;
    return object;
  }
  function band(radius, latitude, width, color, parent) {
    return mesh(new THREE.SphereGeometry(radius * 1.003, 40, 6, 0, Math.PI * 2,
      Math.PI / 2 - latitude - width / 2, width), color, parent);
  }
  function surfacePatch(radius, points, color, parent) {
    const contour = points.map(([longitude, latitude]) => new THREE.Vector2(longitude, latitude));
    const triangles = THREE.ShapeUtils.triangulateShape(contour, []);
    const vertices = [], normals = [];
    function vertex([longitude, latitude]) {
      const lon = THREE.MathUtils.degToRad(longitude);
      const lat = THREE.MathUtils.degToRad(latitude);
      const normal = [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
      vertices.push(...normal.map(value => value * radius));
      normals.push(...normal);
    }
    for (const triangle of triangles) {
      const [a, b, c] = triangle.map(index => points[index]);
      // Subdivide before projecting; a single flat continent sinks into a sphere.
      const steps = Math.max(1, Math.ceil(Math.max(
        Math.hypot(a[0] - b[0], a[1] - b[1]), Math.hypot(a[0] - c[0], a[1] - c[1]),
        Math.hypot(b[0] - c[0], b[1] - c[1]),
      ) / 7));
      const point = (i, j) => [
        a[0] + (b[0] - a[0]) * i / steps + (c[0] - a[0]) * j / steps,
        a[1] + (b[1] - a[1]) * i / steps + (c[1] - a[1]) * j / steps,
      ];
      for (let i = 0; i < steps; i++) for (let j = 0; j < steps - i; j++) {
        [point(i, j), point(i + 1, j), point(i, j + 1)].forEach(vertex);
        if (i + j < steps - 1) [point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)].forEach(vertex);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    return mesh(geometry, color, parent, [0, 0, 0], { side: THREE.DoubleSide });
  }
  // The rounded plinth, inset tracks and compass ticks read as one crafted object.
  mesh(new THREE.CylinderGeometry(4.28, 4.2, 0.18, 128), palette.rim, root, [0, 0.17, 0]);
  mesh(new THREE.CylinderGeometry(4.2, 4.28, 0.07, 128), palette.tray, root, [0, 0.295, 0]);
  mesh(new THREE.CylinderGeometry(4.13, 4.13, 0.014, 128), palette.inset, root, [0, 0.337, 0]);
  disk(4.17, 4.195, palette.brass, root, 0.337);
  for (let i = 0; i < 48; i++) {
    const angle = i / 48 * Math.PI * 2;
    const tick = mesh(new THREE.BoxGeometry(i % 4 === 0 ? 0.014 : 0.009, 0.006, i % 4 === 0 ? 0.07 : 0.035),
      palette.brass, root, [Math.sin(angle) * 4.08, 0.35, Math.cos(angle) * 4.08]);
    tick.rotation.y = angle;
    tick.castShadow = false;
  }

  const deckY = 0.352;
  const sunRadius = 0.51;
  const sun = new THREE.Group();
  sun.name = 'sun';
  sun.position.y = deckY + sunRadius;
  // Face normals point toward the display camera instead of down the front edge.
  sun.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0.8, 6.3, 11.5).normalize());
  root.add(sun);
  sphere(sunRadius, palette.sun, sun, [0, 0, 0], { emissive: palette.sunShadow, emissiveIntensity: 0.14, roughness: 0.48 });
  const surfaceZ = (x, y, offset = 0) => Math.sqrt(sunRadius ** 2 - x ** 2 - y ** 2) + offset;
  for (const x of [-0.16, 0.16]) {
    const eye = sphere(0.032, palette.face, sun, [x, 0.07, surfaceZ(x, 0.07, 0.006)]);
    eye.scale.set(0.76, 1, 0.4);
    eye.rotation.y = Math.asin(x / sunRadius);
    const cheek = sphere(0.058, 0xe89e67, sun, [x * 1.6, -0.055, surfaceZ(x * 1.6, -0.055, 0.003)]);
    cheek.scale.set(1, 0.48, 0.16);
    cheek.rotation.y = Math.asin(x * 1.6 / sunRadius);
  }
  const smilePoints = Array.from({ length: 13 }, (_, i) => {
    const x = (i / 12 - 0.5) * 0.15;
    const y = -0.067 - Math.sin(i / 12 * Math.PI) * 0.043;
    return new THREE.Vector3(x, y, surfaceZ(x, y, 0.009));
  });
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePoints), 24, 0.013, 8, false), palette.face, sun);
  // Short rounded corona marks stay behind the face, on the sun's silhouette.
  for (let i = 0; i < 10; i++) {
    if (i === 5) continue; // Leave the contact point with the tray clear.
    const angle = i / 10 * Math.PI * 2;
    const ray = sphere(0.036, palette.sunShadow, sun, [Math.sin(angle) * 0.568, Math.cos(angle) * 0.568, -0.045]);
    ray.scale.set(0.58, 1.7, 0.6);
    ray.rotation.z = -angle;
    ray.castShadow = false;
  }

  const specs = [
    { name: 'mercury', radius: 0.79, size: 0.075, phase: 2.55, speed: 0.13 },
    { name: 'venus', radius: 1.09, size: 0.108, phase: 3.55, speed: 0.096 },
    { name: 'earth', radius: 1.43, size: 0.138, phase: 1.1, speed: 0.076 },
    { name: 'mars', radius: 1.79, size: 0.102, phase: 3.35, speed: 0.061 },
    { name: 'jupiter', radius: 2.37, size: 0.285, phase: 5.68, speed: 0.039 },
    { name: 'saturn', radius: 3.07, size: 0.225, phase: 2.4, speed: 0.028 },
    { name: 'uranus', radius: 3.62, size: 0.159, phase: 0.36, speed: 0.021 },
    { name: 'neptune', radius: 3.96, size: 0.153, phase: 4.3, speed: 0.016 },
  ];
  const planets = specs.map(spec => {
    const track = disk(spec.radius - 0.012, spec.radius + 0.012, palette.track, root, deckY - 0.003);
    track.name = `track-${spec.name}`;
    const orbit = new THREE.Group();
    orbit.name = `orbit-${spec.name}`;
    root.add(orbit);
    const axis = new THREE.Group();
    axis.rotation.z = spec.name === 'uranus' ? 1.52 : spec.name === 'saturn' ? 0.46 : spec.name === 'earth' ? -0.41 : 0.06;
    orbit.add(axis);
    const body = new THREE.Group();
    body.name = `planet-${spec.name}`;
    axis.add(body);
    sphere(spec.size, palette[spec.name], body);
    const position = () => orbit.position.set(
      Math.cos(spec.phase) * spec.radius, deckY + spec.size, Math.sin(spec.phase) * spec.radius,
    );
    position();
    return Object.assign(spec, { orbit, axis, body, position });
  });
  const planet = name => planets.find(item => item.name === name);

  const earth = planet('earth');
  // Geographic silhouettes follow the sphere, with no protruding green lumps.
  const landRadius = earth.size * 1.012;
  const continents = [
    [[-168, 69], [-132, 70], [-108, 78], [-55, 53], [-66, 44], [-82, 25], [-98, 15], [-116, 31], [-127, 51], [-155, 58]],
    [[-81, 10], [-64, 10], [-49, -1], [-35, -8], [-42, -25], [-54, -39], [-69, -55], [-74, -28], [-79, -6]],
    [[-17, 35], [3, 37], [14, 32], [32, 31], [42, 12], [51, 12], [40, -12], [29, -34], [17, -35], [10, -18], [-2, 4], [-15, 14]],
    [[-11, 36], [-10, 57], [5, 62], [25, 71], [48, 67], [82, 75], [135, 57], [151, 48], [131, 31], [110, 18], [101, 1], [82, 8], [76, 29], [53, 26], [40, 42], [25, 36]],
    [[113, -11], [133, -12], [153, -26], [146, -39], [127, -35], [114, -24]],
    [[-53, 59], [-24, 75], [-43, 83], [-62, 76]],
  ];
  continents.forEach(points => surfacePatch(landRadius, points, palette.land, earth.body));
  band(landRadius, 1.43, 0.2, 0xece9d5, earth.body);
  band(landRadius, -1.46, 0.13, 0xece9d5, earth.body);
  earth.body.rotation.y = -0.2;
  const moonOrbit = new THREE.Group();
  moonOrbit.name = 'moon-orbit';
  moonOrbit.rotation.z = 0.2;
  earth.orbit.add(moonOrbit);
  const moon = sphere(0.031, palette.moon, moonOrbit, [0.196, 0, 0]);
  moon.name = 'moon';
  let moonPhase = 1.65;
  moonOrbit.rotation.y = moonPhase;

  const mercury = planet('mercury');
  for (const [x, y, radius] of [[-0.025, 0.023, 0.015], [0.03, -0.014, 0.01], [-0.015, -0.032, 0.011]]) {
    const crater = sphere(radius, 0x8e8a82, mercury.body, [x, y, Math.sqrt(mercury.size ** 2 - x ** 2 - y ** 2)]);
    crater.scale.z = 0.15;
  }
  band(planet('venus').size, 0.35, 0.15, 0xf1d3a2, planet('venus').body);
  band(planet('venus').size, -0.25, 0.23, 0xd6ab79, planet('venus').body);
  surfacePatch(planet('mars').size * 1.018, [[-54, -10], [-33, 4], [-4, -8], [13, -28], [-20, -36]], 0xb87660, planet('mars').body);
  band(planet('mars').size * 1.005, 1.39, 0.2, 0xe8ccb0, planet('mars').body);

  const jupiter = planet('jupiter');
  for (const [latitude, width, color] of [[0.72, 0.14, 0xc99b77], [0.38, 0.17, 0xf0d5ac], [0.12, 0.16, 0xb98b6d], [-0.16, 0.22, 0xf0d6ae], [-0.43, 0.13, 0xbe8f6f], [-0.75, 0.14, 0xeacd9f]]) {
    band(jupiter.size, latitude, width, color, jupiter.body);
  }
  const spot = Array.from({ length: 24 }, (_, i) => {
    const angle = i / 24 * Math.PI * 2;
    return [20 + Math.cos(angle) * 16, -22 + Math.sin(angle) * 7];
  });
  surfacePatch(jupiter.size * 1.012, spot, 0xb57b60, jupiter.body);

  const saturn = planet('saturn');
  band(saturn.size, 0.2, 0.2, 0xc7ae80, saturn.body);
  band(saturn.size, -0.32, 0.12, 0xf0dab0, saturn.body);
  const rings = new THREE.Group();
  rings.name = 'saturn-rings';
  saturn.axis.add(rings);
  // A broad, flat equatorial disk with the Cassini gap, fixed to the tilted axis.
  disk(0.278, 0.316, 0xbdac8a, rings, 0, { side: THREE.DoubleSide });
  disk(0.322, 0.35, 0xe8d7b0, rings, 0, { side: THREE.DoubleSide });
  disk(0.354, 0.372, 0xbcae91, rings, 0, { side: THREE.DoubleSide });
  rings.children.forEach(ring => { ring.castShadow = true; });
  band(planet('uranus').size, 0.15, 0.11, 0xa7d4d1, planet('uranus').body);
  band(planet('neptune').size, -0.25, 0.17, 0x6082b5, planet('neptune').body);

  // A restrained asteroid belt fills the genuine gap between Mars and Jupiter.
  for (let i = 0; i < 34; i++) {
    const angle = i * 2.399963;
    const radius = 2.0 + Math.sin(i * 5.3) * 0.04;
    const asteroid = mesh(new THREE.IcosahedronGeometry(i % 5 === 0 ? 0.015 : 0.009),
      0xa4abac, root, [Math.cos(angle) * radius, deckY + 0.01, Math.sin(angle) * radius]);
    asteroid.castShadow = false;
  }

  return {
    root,
    update(delta, active) {
      if (!active || !Number.isFinite(delta) || delta <= 0) return;
      planets.forEach(item => {
        item.phase = (item.phase - delta * item.speed) % (Math.PI * 2);
        item.position();
        item.body.rotation.y += delta * (item.name === 'venus' || item.name === 'uranus' ? -0.08 : 0.11);
      });
      moonPhase = (moonPhase - delta * 0.27) % (Math.PI * 2);
      moonOrbit.rotation.y = moonPhase;
    },
  };
}
