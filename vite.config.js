import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

function pwaServiceWorkerPlugin() {
  let outDir = 'dist';
  let assets = [];

  return {
    name: 'laundry-time-pwa-sw',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    generateBundle(_, bundle) {
      assets = Object.keys(bundle)
        .filter(file => !file.endsWith('.map'))
        .sort()
        .map(file => `./${file}`);
    },
    closeBundle() {
      const swPath = resolve(outDir, 'sw.js');
      const swSource = readFileSync(swPath, 'utf8');
      const version = createHash('sha256')
        .update(assets.join('|'))
        .digest('hex')
        .slice(0, 10);
      const assetList = assets.map(asset => `  ${JSON.stringify(asset)},`).join('\n');
      const updated = swSource
        .replace('__SW_VERSION__', version)
        .replace('  /* __PRECACHE_ASSETS__ */', assetList);
      writeFileSync(swPath, updated, 'utf8');
    },
  };
}

export default defineConfig({
  plugins: [pwaServiceWorkerPlugin()],
});
