import { copyFile } from 'node:fs/promises';

import './build-cli.mjs';

await Promise.all(
  ['README.md', 'CHANGELOG.md', 'LICENSE'].map((name) =>
    copyFile(new URL(`../../../${name}`, import.meta.url), new URL(`../${name}`, import.meta.url)),
  ),
);
