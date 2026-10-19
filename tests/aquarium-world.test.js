import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createAquariumWorld } from '../src/aquarium-world.js';

function transforms(root) {
  const values = [];
  root.traverse(object => values.push(...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()));
  return values;
}

test('fish stay fully inside the glass and below the water surface during long sessions', () => {
  const world = createAquariumWorld();
  const fish = ['gold', 'teal', 'lemon'].map(name => world.root.getObjectByName(`fish-${name}`));
  assert.ok(fish.every(Boolean));
  const bounds = new THREE.Box3();
  for (let second = 0; second < 180; second++) {
    world.update(1, true);
    for (const object of fish) {
      bounds.setFromObject(object);
      assert.ok(bounds.min.x > -2.4 && bounds.max.x < 2.4, `${object.name} crosses a side pane`);
      assert.ok(bounds.min.y > 0.9 && bounds.max.y < 3.19, `${object.name} crosses sand or water surface`);
      assert.ok(bounds.min.z > -1.1 && bounds.max.z < 1.1, `${object.name} crosses a front/back pane`);
    }
  }
});

test('pausing freezes fish, plants and bubbles, and paused time does not affect resuming', () => {
  const world = createAquariumWorld();
  const control = createAquariumWorld();
  world.update(4, true);
  control.update(4, true);
  const before = transforms(world.root);
  world.update(900, false);
  assert.deepEqual(transforms(world.root), before);
  world.update(0.5, true);
  control.update(0.5, true);
  assert.deepEqual(transforms(world.root), transforms(control.root));
  assert.notDeepEqual(transforms(world.root), before);
});
