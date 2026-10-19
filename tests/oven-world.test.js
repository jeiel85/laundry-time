import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createOvenWorld } from '../src/oven-world.js';

function snapshot(root) {
  const state = [];
  root.traverse(object => {
    state.push([...object.position, ...object.quaternion, ...object.scale]);
    if (object.material) state.push([...object.material.color, object.material.emissiveIntensity]);
  });
  return state;
}

test('oven pauses every transform and material, then resumes without paused-time drift', () => {
  const oven = createOvenWorld(), uninterrupted = createOvenWorld();
  oven.update(0.37, true, 0.4);
  uninterrupted.update(0.37, true, 0.4);
  const paused = snapshot(oven.root);
  oven.update(900, false, 1);
  for (const delta of [NaN, Infinity, -1, 0]) oven.update(delta, true, 1);
  assert.deepEqual(snapshot(oven.root), paused);
  oven.update(0.21, true, 0.6);
  uninterrupted.update(0.21, true, 0.6);
  assert.deepEqual(snapshot(oven.root), snapshot(uninterrupted.root));
  assert.notDeepEqual(snapshot(oven.root), paused);
});

test('baking progress grows and bronzes the bread, clamps its endpoints, and leaves the shell color alone', () => {
  const oven = createOvenWorld();
  const bun = oven.root.getObjectByName('oven-bun-0');
  const shell = oven.root.getObjectByName('oven-control-panel');
  const shellColor = shell.material.color.clone();
  oven.update(0.1, true, 0);
  const rawScale = bun.scale.clone(), rawColor = bun.children[0].material.color.clone();
  oven.update(0.1, true, -100);
  assert.ok(bun.scale.equals(rawScale));
  assert.ok(bun.children[0].material.color.equals(rawColor));
  oven.update(0.1, true, 1);
  const bakedScale = bun.scale.clone(), bakedColor = bun.children[0].material.color.clone();
  assert.ok(bakedScale.y > rawScale.y);
  assert.ok(bakedColor.r < rawColor.r && bakedColor.g < rawColor.g, 'crust darkens as the session advances');
  oven.update(0.1, true, 100);
  assert.ok(bun.scale.equals(bakedScale));
  assert.ok(bun.children[0].material.color.equals(bakedColor));
  assert.ok(shell.material.color.equals(shellColor), 'enamel never shares the animated bread material');
});

test('all three rolls stay above their tray and within its footprint throughout the bake', () => {
  const oven = createOvenWorld();
  const tray = oven.root.getObjectByName('oven-baking-tray');
  const trayBox = new THREE.Box3().setFromObject(tray);
  for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
    oven.update(0.1, true, progress);
    for (let i = 0; i < 3; i++) {
      const bun = oven.root.getObjectByName(`oven-bun-${i}`);
      const bounds = new THREE.Box3().setFromObject(bun);
      assert.ok(bounds.min.y >= trayBox.max.y, 'roll rests above the tray surface');
      assert.ok(bounds.max.y < 2.6, 'rising dough clears the upper heating element');
      assert.ok(bounds.min.x >= trayBox.min.x && bounds.max.x <= trayBox.max.x);
      assert.ok(bounds.min.z >= trayBox.min.z && bounds.max.z <= trayBox.max.z);
      assert.ok(bounds.max.z < oven.root.getObjectByName('oven-door-glass').position.z, 'bread stays behind the door');
    }
  }
});

test('ambient baking wraps smoothly and remains finite over repeated cycles', () => {
  const oven = createOvenWorld();
  const bun = oven.root.getObjectByName('oven-bun-0');
  oven.update(79.999, true, null);
  const before = bun.scale.clone();
  oven.update(0.002, true, null);
  assert.ok(before.distanceTo(bun.scale) < 0.00001, 'the ambient bake has no visible wrap jump');
  for (let i = 0; i < 200; i++) oven.update(1, true);
  oven.root.traverse(object => {
    assert.ok([...object.position, ...object.quaternion, ...object.scale].every(Number.isFinite));
    if (object.isMesh) assert.ok([...object.geometry.attributes.position.array].every(Number.isFinite));
  });
});

test('paused restore and reset synchronize bread without advancing the heater or ambient time', () => {
  const source = createOvenWorld(), restored = createOvenWorld();
  source.update(1, true, 0.8);
  const baked = source.root.getObjectByName('oven-bun-0');
  const bun = restored.root.getObjectByName('oven-bun-0');
  const heater = restored.root.getObjectByName('oven-heating-element');
  const initialHeat = heater.material.emissiveIntensity;
  restored.setProgress(0.8);
  assert.ok(bun.scale.equals(baked.scale));
  assert.ok(bun.children[0].material.color.equals(baked.children[0].material.color));
  assert.equal(heater.material.emissiveIntensity, initialHeat);
  restored.setProgress(0);
  const fresh = createOvenWorld().root.getObjectByName('oven-bun-0');
  assert.ok(bun.scale.equals(fresh.scale));
  assert.ok(bun.children[0].material.color.equals(fresh.children[0].material.color));
  const reset = snapshot(restored.root);
  restored.update(900, false, 0);
  restored.setProgress(null);
  assert.deepEqual(snapshot(restored.root), reset);
});
