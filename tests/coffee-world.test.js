import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createCoffeeWorld } from '../src/coffee-world.js';

function motionSnapshot(root) {
  const objects = [];
  root.traverse(object => {
    objects.push([...object.position, ...object.quaternion, ...object.scale]);
    if (object.name.startsWith('cup-steam-')) objects.push([...object.geometry.attributes.position.array]);
  });
  return objects;
}

test('coffee pauses exactly and resumes without accumulating inactive time', () => {
  const coffee = createCoffeeWorld();
  const uninterrupted = createCoffeeWorld();
  coffee.update(0.37, true);
  uninterrupted.update(0.37, true);
  const paused = motionSnapshot(coffee.root);
  coffee.update(900, false);
  coffee.update(Number.NaN, true);
  coffee.update(Infinity, true);
  coffee.update(-1, true);
  assert.deepEqual(motionSnapshot(coffee.root), paused);
  coffee.update(0.21, true);
  uninterrupted.update(0.21, true);
  assert.deepEqual(motionSnapshot(coffee.root), motionSnapshot(uninterrupted.root));
  assert.notDeepEqual(motionSnapshot(coffee.root), paused);
});

test('every falling drop remains aligned with the server opening and ends at the stable coffee level', () => {
  const coffee = createCoffeeWorld();
  const opening = coffee.root.getObjectByName('coffee-server-opening');
  const surface = coffee.root.getObjectByName('server-coffee-surface');
  const cone = coffee.root.getObjectByName('hollow-ceramic-dripper');
  const openingPosition = opening.getWorldPosition(new THREE.Vector3());
  const surfacePosition = surface.getWorldPosition(new THREE.Vector3());
  const conePosition = cone.getWorldPosition(new THREE.Vector3());
  const initialSurface = surface.matrixWorld.clone();
  let sampledAboveOpening = false, sampledBelowOpening = false;
  for (let frame = 0; frame < 500; frame++) {
    coffee.update(0.037, true);
    for (const name of ['coffee-drop-0', 'coffee-drop-1']) {
      const drop = coffee.root.getObjectByName(name);
      const position = drop.getWorldPosition(new THREE.Vector3());
      const offset = Math.hypot(position.x - openingPosition.x, position.z - openingPosition.z);
      assert.ok(offset + drop.geometry.parameters.radius < opening.geometry.parameters.radius - opening.geometry.parameters.tube);
      assert.ok(position.y <= conePosition.y, 'drops start below the dripper outlet');
      assert.ok(position.y >= surfacePosition.y, 'drops stop at the coffee surface');
      sampledAboveOpening ||= position.y > openingPosition.y;
      sampledBelowOpening ||= position.y < openingPosition.y;
    }
  }
  assert.ok(sampledAboveOpening && sampledBelowOpening, 'the drop path passes through the open server neck');
  surface.updateWorldMatrix(true, false);
  assert.ok(surface.matrixWorld.equals(initialSurface), 'ambient brewing keeps a stable coffee volume');
});
