import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createSolarWorld } from '../src/solar-world.js';

const names = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const vector = object => object.getWorldPosition(new THREE.Vector3());
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('eight planets retain their ordered tracks through a complete display session', () => {
  const world = createSolarWorld();
  const orbits = names.map(name => world.root.getObjectByName(`orbit-${name}`));
  assert.ok(orbits.every(Boolean));
  const radii = orbits.map(orbit => Math.hypot(orbit.position.x, orbit.position.z));
  assert.deepEqual([...radii].sort((a, b) => a - b), radii);
  for (let minute = 0; minute < 25; minute++) {
    world.update(60, true);
    orbits.forEach((orbit, i) => near(Math.hypot(orbit.position.x, orbit.position.z), radii[i]));
  }
});

test('pausing freezes all orbital and surface motion and resumes from the same positions', () => {
  const world = createSolarWorld();
  const earth = world.root.getObjectByName('orbit-earth');
  const moon = world.root.getObjectByName('moon');
  const earthPosition = vector(earth);
  const moonPosition = vector(moon);
  const orientation = world.root.getObjectByName('planet-earth').quaternion.clone();
  world.update(25, false);
  assert.ok(vector(earth).equals(earthPosition));
  assert.ok(vector(moon).equals(moonPosition));
  assert.ok(world.root.getObjectByName('planet-earth').quaternion.equals(orientation));
  world.update(1, true);
  assert.ok(vector(earth).distanceTo(earthPosition) > 0);
  assert.ok(vector(moon).distanceTo(moonPosition) > 0);
});

test('the moon circles Earth independently and Saturn rings keep their axial plane', () => {
  const world = createSolarWorld();
  const earth = world.root.getObjectByName('orbit-earth');
  const moon = world.root.getObjectByName('moon');
  const relativeMoon = vector(moon).sub(vector(earth));
  const moonDistance = relativeMoon.length();
  const rings = world.root.getObjectByName('saturn-rings');
  const ringOrientation = rings.getWorldQuaternion(new THREE.Quaternion());
  const saturnBody = world.root.getObjectByName('planet-saturn');
  const saturnOrientation = saturnBody.getWorldQuaternion(new THREE.Quaternion());
  world.update(6, true);
  const movedMoon = vector(moon).sub(vector(earth));
  near(movedMoon.length(), moonDistance);
  assert.ok(movedMoon.distanceTo(relativeMoon) > 0.01);
  assert.ok(rings.getWorldQuaternion(new THREE.Quaternion()).angleTo(ringOrientation) < 1e-8);
  assert.ok(saturnBody.getWorldQuaternion(new THREE.Quaternion()).angleTo(saturnOrientation) > 0.01);
});

test('neighboring orbital envelopes stay clear, including Saturn rings and the lunar orbit', () => {
  const { root } = createSolarWorld();
  const bodies = names.map(name => {
    const orbit = root.getObjectByName(`orbit-${name}`);
    const body = root.getObjectByName(`planet-${name}`);
    const radius = body.children.find(child => child.geometry?.type === 'SphereGeometry').geometry.parameters.radius;
    return { name, radius: Math.hypot(orbit.position.x, orbit.position.z), envelope: radius };
  });
  const moon = root.getObjectByName('moon');
  bodies[2].envelope = moon.position.length() + moon.geometry.parameters.radius;
  bodies[5].envelope = Math.max(...root.getObjectByName('saturn-rings').children.map(ring => ring.geometry.parameters.outerRadius));
  for (let i = 1; i < bodies.length; i++) {
    const inner = bodies[i - 1], outer = bodies[i];
    assert.ok(outer.radius - inner.radius > inner.envelope + outer.envelope,
      `${inner.name} and ${outer.name} must stay separate at every orbital phase`);
  }
});
