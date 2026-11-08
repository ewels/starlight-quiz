import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  entryPoints: ['bin/starlight-quiz.ts'],
  outfile: 'dist/starlight-quiz.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22.12',
  packages: 'external',
});
