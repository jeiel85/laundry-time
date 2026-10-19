import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const colors = { cream: 0xffefd7, coral: 0xef806a, red: 0xef5942, green: 0x77905b, dark: 0x563a31, towel: 0xf3b2a0 };

export function createLaundryScene(container, readState, onPoke) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.setClearColor(0x000000, 0);
  container.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();
  const materials = [];
  function material(color, roughness = 0.42, metalness = 0) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.push(m);
    return m;
  }
  const cream = material(colors.cream, 0.3);
  const coral = material(colors.coral, 0.28);
  const dark = material(colors.dark, 0.27);
  const tomatoRed = material(colors.red, 0.3);
  const leafGreen = material(colors.green, 0.65);
  const white = material(0xfff7e7, 0.9);
  const pink = material(colors.towel, 0.95);
  const cheek = material(0xfa967d, 0.75);
  const metal = material(0xb8a28c, 0.34, 0.6);
  const drumMetal = material(0x6e7168, 0.6, 0.35);
  const machine = new THREE.Group();
  machine.position.set(-0.45, 0, 0);
  machine.rotation.y = 0.08;
  scene.add(machine);
  function mesh(geometry, mat, parent, position = [0, 0, 0]) {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(...position);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(w, h, d, radius, mat, parent, position) {
    return mesh(new RoundedBoxGeometry(w, h, d, 4, radius), mat, parent, position);
  }
  const sphereGeometry = new THREE.SphereGeometry(1, 24, 16);
  function sphere(size, mat, parent, position, scale = [1, 1, 1]) {
    const s = mesh(sphereGeometry, mat, parent, position);
    s.scale.set(size * scale[0], size * scale[1], size * scale[2]);
    return s;
  }
  function tube(points, radius, mat, parent) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, 16, radius, 8, false), mat, parent);
  }
  function ring(radius, thickness, mat, parent, position, arc = Math.PI * 2) {
    return mesh(new THREE.TorusGeometry(radius, thickness, 16, 80, arc), mat, parent, position);
  }
  function face(parent, size, z, happy = true) {
    sphere(size * 0.11, dark, parent, [-size * 0.34, 0.015, z], [0.8, 1.05, 0.55]);
    sphere(size * 0.11, dark, parent, [size * 0.34, 0.015, z], [0.8, 1.05, 0.55]);
    sphere(size * 0.12, cheek, parent, [-size * 0.53, -size * 0.17, z - 0.01], [1.2, 0.6, 0.12]);
    sphere(size * 0.12, cheek, parent, [size * 0.53, -size * 0.17, z - 0.01], [1.2, 0.6, 0.12]);
    if (happy) tube([[-size * 0.13, -size * 0.13, z + 0.01], [0, -size * 0.23, z + 0.02], [size * 0.13, -size * 0.13, z + 0.01]], size * 0.033, dark, parent);
  }
  // Rounded toy-like housing, inset top, smiling detergent drawer, and feet.
  box(2.7, 3.15, 1.9, 0.22, cream, machine, [0, 1.83, 0]);
  box(2.32, 0.035, 1.53, 0.13, material(0xf3dfc5, 0.5), machine, [0, 3.414, -0.01]);
  box(2.25, 0.024, 1.46, 0.1, cream, machine, [0, 3.44, -0.01]);
  for (const x of [-0.98, 0.98]) for (const z of [-0.64, 0.64]) box(0.36, 0.25, 0.42, 0.1, coral, machine, [x, 0.23, z]);
  box(2.51, 0.68, 0.09, 0.12, material(0xfff3df, 0.35), machine, [0, 2.91, 0.965]);
  const drawer = new THREE.Group();
  drawer.position.set(-0.86, 2.97, 1.04);
  machine.add(drawer);
  box(0.66, 0.4, 0.075, 0.09, cream, drawer, [0, 0, 0]);
  face(drawer, 0.58, 0.055);
  box(0.4, 0.055, 0.035, 0.025, material(0xd8bda1), machine, [-0.86, 2.64, 1.03]);
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 192;
  const screenContext = screenCanvas.getContext('2d');
  if (!screenContext) throw new Error('세탁기 화면을 그릴 수 없어요.');
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture });
  materials.push(screenMaterial);
  box(1.13, 0.43, 0.06, 0.07, dark, machine, [0.1, 2.96, 1.035]);
  mesh(new THREE.PlaneGeometry(1.02, 0.34), screenMaterial, machine, [0.1, 2.96, 1.072]);
  const knob = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.11, 40), coral, machine, [0.96, 3, 1.07]);
  knob.rotation.x = Math.PI / 2;
  box(0.033, 0.13, 0.027, 0.015, white, machine, [0.96, 3.08, 1.138]);
  for (const x of [0.82, 1.08]) box(0.18, 0.105, 0.06, 0.045, x === 0.82 ? cream : coral, machine, [x, 2.64, 1.035]);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.12 + i * 0.19);
    const tick = box(0.023, 0.07, 0.018, 0.009, coral, machine, [0.96 + Math.cos(a) * 0.31, 3 + Math.sin(a) * 0.31, 1.035]);
    tick.rotation.z = a - Math.PI / 2;
  }
  // Side moulding and air vents make the model read in three dimensions.
  for (const z of [-0.51, 0, 0.51]) box(0.026, 1.64, 0.095, 0.035, material(0xe3c9ae), machine, [-1.354, 1.75, z]);
  for (let i = 0; i < 4; i++) box(0.23, 0.028, 0.025, 0.01, material(0xd8c1a8), machine, [-0.83 + i * 0.27, 0.59, 0.959]);
  const doorY = 1.59;
  mesh(new THREE.CircleGeometry(0.97, 80), drumMetal, machine, [0.1, doorY, 0.968]);
  ring(0.91, 0.05, metal, machine, [0.1, doorY, 1.025]);
  const laundry = new THREE.Group();
  laundry.position.set(0.1, doorY, 1.07);
  machine.add(laundry);
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * Math.PI * 2;
    sphere(0.018, dark, laundry, [Math.cos(a) * 0.81, Math.sin(a) * 0.81, 0]);
  }
  const tomatoes = [];
  function tomato(x, y, radius, angle) {
    const group = new THREE.Group();
    group.position.set(x, y, 0.18);
    group.rotation.z = angle;
    laundry.add(group);
    sphere(radius, tomatoRed, group, [0, 0, 0], [1, 0.93, 0.7]);
    const expression = new THREE.Group();
    expression.position.y = -0.015;
    group.add(expression);
    face(expression, radius, radius * 0.66);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      const leaf = sphere(radius * 0.29, leafGreen, group, [Math.sin(a) * radius * 0.25, radius * 0.78 + Math.cos(a) * radius * 0.14, radius * 0.23], [0.44, 1, 0.3]);
      leaf.rotation.z = -a;
    }
    tube([[0, radius * 0.75, 0], [0.02, radius * 1.02, 0.02]], 0.028, leafGreen, group);
    tomatoes.push({ group, x, y, angle });
  }
  // Curved ribbons are actual geometry, rather than imported cloth textures.
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const cloth = new THREE.Group();
    cloth.rotation.z = a;
    laundry.add(cloth);
    tube([[-0.6, -0.28, 0.06], [-0.33, -0.52, 0.1], [0.03, -0.4, 0.08], [0.3, -0.54, 0.1], [0.59, -0.33, 0.05]], 0.12, i % 2 ? pink : white, cloth);
  }
  tomato(-0.34, -0.26, 0.31, -0.18);
  tomato(0.31, -0.26, 0.3, 0.2);
  tomato(0.09, 0.34, 0.32, -0.1);
  ring(1.02, 0.14, cream, machine, [0.1, doorY, 1.08]);
  ring(0.976, 0.14, coral, machine, [0.1, doorY, 1.18]);
  ring(0.819, 0.032, metal, machine, [0.1, doorY, 1.205]);
  box(0.27, 0.58, 0.24, 0.11, coral, machine, [1.08, doorY + 0.04, 1.22]);
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffe9d3, transparent: true, opacity: 0.09, roughness: 0.1, metalness: 0.05, depthWrite: false });
  materials.push(glassMaterial);
  mesh(new THREE.CircleGeometry(0.8, 64), glassMaterial, machine, [0.1, doorY, 1.405]);
  const glintMaterial = new THREE.MeshBasicMaterial({ color: 0xfff9eb, transparent: true, opacity: 0.68, depthWrite: false });
  materials.push(glintMaterial);
  const glint = ring(0.705, 0.028, glintMaterial, machine, [0.1, doorY, 1.415], 0.57);
  glint.rotation.z = Math.PI * 0.62;
  const smallGlint = ring(0.716, 0.013, glintMaterial, machine, [0.1, doorY, 1.415], 0.24);
  smallGlint.rotation.z = -0.81;

  // Little folded towels to one side, and an open slatted laundry basket.
  const props = new THREE.Group();
  scene.add(props);
  const towels = new THREE.Group();
  towels.position.set(-2.3, 0.22, 0.7);
  towels.rotation.y = -0.25;
  props.add(towels);
  for (let i = 0; i < 3; i++) {
    const towel = box(0.95, 0.18, 0.7, 0.085, i === 1 ? pink : white, towels, [i === 2 ? 0.04 : 0, i * 0.17, 0]);
    towel.rotation.y = i === 2 ? 0.07 : 0;
    tube([[-0.38, i * 0.17 + 0.02, 0.354], [0, i * 0.17 + 0.02, 0.36], [0.38, i * 0.17 + 0.02, 0.354]], 0.008, i === 1 ? coral : material(0xe9d9c1), towels);
  }
  const basket = new THREE.Group();
  basket.position.set(1.68, 0, 0.6);
  basket.rotation.y = -0.14;
  props.add(basket);
  box(1.13, 0.13, 0.86, 0.07, cream, basket, [0, 0.17, 0]);
  for (let i = 0; i < 6; i++) for (const z of [-0.41, 0.41]) box(0.075, 0.6, 0.075, 0.025, cream, basket, [-0.49 + i * 0.196, 0.45, z]);
  for (let i = 0; i < 4; i++) for (const x of [-0.53, 0.53]) box(0.075, 0.6, 0.075, 0.025, cream, basket, [x, 0.45, -0.32 + i * 0.21]);
  for (const y of [0.4, 0.74]) {
    for (const z of [-0.41, 0.41]) box(1.2, 0.085, 0.095, 0.04, cream, basket, [0, y, z]);
    for (const x of [-0.55, 0.55]) box(0.095, 0.085, 0.89, 0.04, cream, basket, [x, y, 0]);
  }
  const towelA = box(0.75, 0.24, 0.61, 0.12, pink, basket, [0.06, 0.66, 0]);
  towelA.rotation.z = 0.17;
  const drape = box(0.58, 0.67, 0.15, 0.07, white, basket, [-0.13, 0.58, 0.46]);
  drape.rotation.x = -0.15;
  const badge = sphere(0.08, tomatoRed, basket, [-0.13, 0.59, 0.56], [1, 0.9, 0.12]);
  sphere(0.035, leafGreen, basket, [-0.13, 0.66, 0.56], [1.1, 0.7, 0.2]);
  tube([[-0.3, 0.8, -0.45], [-0.2, 0.96, -0.45], [0.2, 0.96, -0.45], [0.3, 0.8, -0.45]], 0.045, coral, basket);

  const floor = mesh(new THREE.CircleGeometry(3.25, 96), material(0xf4e3ce, 1), scene, [0, 0.055, 0]);
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  const shadowPlane = mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x936e54, opacity: 0.14 }), scene, [0, 0.05, 0]);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.castShadow = false;
  scene.add(new THREE.HemisphereLight(0xfff5e3, 0xbe9981, 1.4));
  const sun = new THREE.DirectionalLight(0xffead1, 2.4);
  sun.position.set(-3, 7, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -4;
  sun.shadow.normalBias = 0.03;
  sun.shadow.bias = -0.0001;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffd9c9, 0.8);
  fill.position.set(4, 3, -2);
  scene.add(fill);
  let pointer = { x: 0, y: 0 };
  let targetPointer = { x: 0, y: 0 };
  let pokeAt = -100;
  // Tumble washing typically runs at 30–45 RPM (NXP AN3234, section 4).
  // 40 RPM = one revolution every 1.5 seconds, in every timer mode.
  const washSpeed = 40 * Math.PI * 2 / 60;
  let speed = 0;
  let rotation = 0;
  let time = 0;
  let last = performance.now();
  let lastScreen = '';
  let disposed = false;
  let frame = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.set(-5.5, 4.4, 9.7);
    camera.lookAt(-0.1, 1.7, 0);
    const mobilePortrait = window.matchMedia('(max-width: 620px) and (orientation: portrait)').matches;
    camera.zoom = mobilePortrait ? 1.25 : width < 450 ? 1.05 : 1.15;
    floor.scale.setScalar(mobilePortrait ? 0.84 : 1);
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  function move(event) {
    const rect = container.getBoundingClientRect();
    targetPointer = { x: (event.clientX - rect.left) / rect.width - 0.5, y: (event.clientY - rect.top) / rect.height - 0.5 };
  }
  function leave() { targetPointer = { x: 0, y: 0 }; }
  function poke() { if (!readState().motion || reducedMotion.matches) return; pokeAt = time; onPoke(); }
  container.addEventListener('pointermove', move);
  container.addEventListener('pointerleave', leave);
  container.addEventListener('click', poke);
  function renderScreen(value, active, zen) {
    const key = value + active + zen;
    if (lastScreen === key) return;
    lastScreen = key;
    const ctx = screenContext;
    ctx.fillStyle = '#4b342b';
    ctx.fillRect(0, 0, 512, 192);
    ctx.fillStyle = active ? '#b1c78c' : '#e9957b';
    ctx.beginPath(); ctx.arc(58, 96, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe5c5';
    ctx.font = '600 102px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(zen ? 'SLOW' : value, 292, 104);
    screenTexture.needsUpdate = true;
  }
  function animate(now) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const delta = Math.min((now - last) / 1000, 0.25);
    last = now;
    time += delta;
    const state = readState();
    const motion = state.motion && !reducedMotion.matches;
    const active = state.running || state.mode === 'zen';
    speed = THREE.MathUtils.damp(speed, active && motion ? washSpeed : 0, 2, delta);
    const runningIntensity = speed / washSpeed;
    rotation += speed * delta;
    laundry.rotation.z = -rotation;
    tomatoes.forEach(({ group, angle }, i) => {
      group.rotation.z = rotation * 0.72 + angle + (motion ? Math.sin(time * 2 + i) * runningIntensity * 0.08 : 0);
    });
    const bump = motion ? Math.max(0, 1 - (time - pokeAt) / 1.6) : 0;
    const wobble = motion ? (runningIntensity * 0.008 + bump * 0.045) : 0;
    machine.rotation.z = Math.sin(time * 17) * wobble + Math.sin(time * 10.5) * wobble * 0.3;
    machine.position.y = Math.abs(Math.sin(time * 17)) * wobble * 0.22;
    pointer.x = THREE.MathUtils.damp(pointer.x, motion ? targetPointer.x : 0, 3, delta);
    pointer.y = THREE.MathUtils.damp(pointer.y, motion ? targetPointer.y : 0, 3, delta);
    machine.rotation.y = 0.08 + pointer.x * 0.15;
    camera.position.y = 4.4 + pointer.y * 0.14;
    camera.lookAt(-0.1, 1.7, 0);
    renderScreen(state.display, active, state.mode === 'zen');
    renderer.render(scene, camera);
  }
  function visibility() {
    if (document.hidden) cancelAnimationFrame(frame);
    else { last = performance.now(); frame = requestAnimationFrame(animate); }
  }
  document.addEventListener('visibilitychange', visibility);
  resize();
  frame = requestAnimationFrame(animate);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    container.dispatchEvent(new CustomEvent('scene-error', { detail: '3D 화면 연결이 끊어졌어요. 페이지를 새로고침해 주세요.' }));
  });
  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      container.removeEventListener('pointermove', move);
      container.removeEventListener('pointerleave', leave);
      container.removeEventListener('click', poke);
      const geometries = new Set();
      scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      shadowPlane.material.dispose();
      screenTexture.dispose();
      environment.dispose();
      renderer.dispose();
    }
  };
}
