import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(path.join(tmpdir(), 'starlight-quiz-package-'));
// npm supplies its JS entry point when invoked through `npm run` (also on Windows).
const npm = process.env.npm_execpath;
assert.ok(npm && /npm-cli\.js$/.test(npm), 'Run this test with npm run test:package');
const env = { ...process.env, XDG_DATA_HOME: path.join(temp, 'history') };
function run(args, { cwd = temp, input = '', timeout = 120_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      process.execPath,
      [npm, ...args],
      { cwd, env, timeout, maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) reject(new Error(`${args.join(' ')}\n${stdout}\n${stderr}`, { cause: error }));
        else resolve(stdout);
      },
    );
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}
const cli = (args, input = '') => run(['exec', '--no', '--', 'starlight-quiz', ...args], { input, timeout: 30_000 });
const server = createServer((_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end('<sl-quiz id="capital"><div class="sl-quiz-source"><p>The capital is [[Paris]].</p></div></sl-quiz>');
});
try {
  // An optional package spec allows the same assertions to reproduce a released bug.
  let spec = process.argv[2];
  if (!spec) {
    await run(['pack', '--pack-destination', temp], { cwd: path.join(root, 'packages/starlight-quiz') });
    const tarballs = (await readdir(temp)).filter((name) => name.endsWith('.tgz'));
    assert.equal(tarballs.length, 1);
    spec = path.join(temp, tarballs[0]);
  }
  await writeFile(path.join(temp, 'package.json'), JSON.stringify({ private: true }));
  await run(['install', '--ignore-scripts', '--legacy-peer-deps', '--no-audit', '--no-fund', spec]);
  assert.match(await cli(['--help']), /Usage:/);
  const manifest = {
    version: 1,
    quizzes: [
      {
        id: 'q',
        type: 'single',
        page: '/',
        question: 'Pick B',
        answers: [
          { text: 'A', correct: false },
          { text: 'B', correct: true },
        ],
      },
    ],
  };
  const source = path.join(temp, 'quiz-manifest.json');
  await writeFile(source, JSON.stringify(manifest));
  assert.match(await cli(['run', source], '2\n'), /Score: 1\/1 \(100%\)/);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  assert.match(
    await cli(['run', `http://127.0.0.1:${server.address().port}/quiz/`], 'Paris\n'),
    /Score: 1\/1 \(100%\)/,
  );
  const history = JSON.parse(await cli(['history', '--json']));
  assert.equal(history.length, 2);
  assert.ok(history.every((entry) => entry.correct === 1));
  for (const version of ['1.2', '2.1']) {
    const out = path.join(temp, `qti-${version}`);
    await cli(['export-qti', source, '--out', out, '--version', version]);
    assert.match(await readFile(path.join(out, 'imsmanifest.xml'), 'utf8'), /<manifest/);
    assert.ok((await readdir(out)).length > 1);
  }
  await cli(['history', '--clear']);
  assert.deepEqual(JSON.parse(await cli(['history', '--json'])), []);
  console.log('Installed package smoke tests passed.');
} finally {
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  await rm(temp, { recursive: true, force: true });
}
