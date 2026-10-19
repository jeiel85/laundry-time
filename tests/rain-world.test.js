import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createRainWorld } from '../src/rain-world.js';

function snapshot(root) {
  const values = [];
  root.traverse(object => {
    values.push([...object.position, ...object.quaternion, ...object.scale, object.material?.opacity ?? 1]);
  });
  return values;
}

test('rain and the plant pause exactly without accumulating inactive time', () => {
  const rain = createRainWorld(), uninterrupted = createRainWorld();
  rain.update(0.37, true);
  uninterrupted.update(0.37, true);
  const paused = snapshot(rain.root);
  rain.update(900, false);
  rain.update(Number.NaN, true);
  rain.update(Infinity, true);
  rain.update(-1, true);
  assert.deepEqual(snapshot(rain.root), paused);
  rain.update(0.21, true);
  uninterrupted.update(0.21, true);
  assert.deepEqual(snapshot(rain.root), snapshot(uninterrupted.root));
  assert.notDeepEqual(snapshot(rain.root), paused);
});

test('raindrops travel down the glass, remain in its opening, and fade at the seals', () => {
  const rain = createRainWorld();
  const drops = rain.root.children.filter(object => object.name.startsWith('rain-drop-'));
  assert.equal(drops.length, 37);
  const oldY = drops.map(drop => drop.position.y);
  rain.update(0.01, true);
  drops.forEach((drop, i) => assert.ok(drop.position.y < oldY[i], 'rain runs downward'));
  const extent = new THREE.Box3();
  let sawFadedDrop = false;
  for (let frame = 0; frame < 250; frame++) {
    rain.update(0.29, true);
    for (const drop of drops) {
      const { left, right, bottom, top, glassZ } = drop.userData.windowBounds;
      assert.equal(drop.position.z, glassZ, 'drops stay attached to the pane');
      extent.setFromObject(drop);
      assert.ok(extent.min.x > left && extent.max.x < right);
      assert.ok(extent.min.y > bottom - 0.05 && extent.max.y < top + 0.12, 'whole drops remain behind the window trim');
      assert.ok(drop.position.y >= bottom && drop.position.y <= top);
      if (drop.position.y > top - 0.025 || drop.position.y < bottom + 0.025) {
        assert.ok(drop.children[0].material.opacity < 0.14, 'wrapped drops fade at the seal');
        sawFadedDrop = true;
      }
    }
  }
  assert.ok(sawFadedDrop);
  const glass = rain.root.getObjectByName('rain-window-glass');
  assert.equal(glass.material.depthWrite, false);
  assert.ok(glass.material.opacity < 0.1, 'the landscape remains visible through the pane');
});
