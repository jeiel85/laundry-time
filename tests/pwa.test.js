import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInstallController, isStandaloneDisplay, registerServiceWorker } from '../src/pwa.js';

test('web app manifest defines standalone display and valid local icons', () => {
  const publicDir = resolve(process.cwd(), 'public');
  const manifest = JSON.parse(readFileSync(resolve(publicDir, 'manifest.webmanifest'), 'utf8'));

  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.theme_color, '#fbf5ed');
  assert.equal(manifest.background_color, '#fbf5ed');
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.type === 'image/png'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.type === 'image/png' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.type === 'image/png' && icon.purpose === 'maskable'));

  for (const icon of manifest.icons) {
    const iconPath = resolve(publicDir, icon.src);
    assert.ok(existsSync(iconPath), `Missing icon file: ${icon.src}`);
    if (icon.type === 'image/png') {
      const buf = readFileSync(iconPath);
      assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      const [expectedW, expectedH] = icon.sizes.split('x').map(Number);
      assert.equal(buf.readUInt32BE(16), expectedW);
      assert.equal(buf.readUInt32BE(20), expectedH);
    }
  }
});

test('registerServiceWorker normalizes base path and registers sw.js', async () => {
  const calls = [];
  const nav = {
    serviceWorker: {
      async register(url, options) {
        calls.push({ url, options });
        return { scope: options.scope };
      },
    },
  };

  await registerServiceWorker({ nav, baseUrl: '/laundry-time/' });
  await registerServiceWorker({ nav, baseUrl: '/' });

  assert.deepEqual(calls, [
    { url: '/laundry-time/sw.js', options: { scope: '/laundry-time/' } },
    { url: '/sw.js', options: { scope: '/' } },
  ]);
});

test('createInstallController captures beforeinstallprompt and triggers native prompt', async () => {
  const listeners = new Map();
  const win = {
    matchMedia: () => ({ matches: false }),
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
  };
  const states = [];
  let installedCount = 0;

  const controller = createInstallController({
    win,
    nav: {},
    onStateChange(state) {
      states.push(state);
    },
    onInstalled() {
      installedCount += 1;
    },
  });

  assert.deepEqual(controller.state, { canInstall: false, installed: false });

  let prevented = false;
  let prompted = false;
  listeners.get('beforeinstallprompt')({
    preventDefault() {
      prevented = true;
    },
    async prompt() {
      prompted = true;
    },
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  });

  assert.equal(prevented, true);
  assert.deepEqual(controller.state, { canInstall: true, installed: false });

  const accepted = await controller.promptInstall();
  assert.equal(accepted, true);
  assert.equal(prompted, true);
  assert.deepEqual(controller.state, { canInstall: false, installed: true });

  listeners.get('appinstalled')();
  assert.equal(installedCount, 1);
  assert.equal(isStandaloneDisplay({ matchMedia: () => ({ matches: true }) }, {}), true);

  controller.dispose();
  assert.equal(listeners.size, 0);
});
