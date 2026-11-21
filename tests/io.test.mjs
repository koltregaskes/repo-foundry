import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { readJson } from '../src/lib/io.mjs';

for (const code of ['EACCES', 'EIO']) {
  test(`readJson propagates ${code} even with fallback`, async (t) => {
    const error = Object.assign(new Error('synthetic read failure'), { code });
    t.mock.method(fs, 'readFile', async () => { throw error; });
    await assert.rejects(readJson('synthetic.json', { items: [] }), (actual) => actual === error);
  });
}
test('readJson rejects corrupt JSON instead of returning empty fallback', async (t) => {
  t.mock.method(fs, 'readFile', async () => '{ broken');
  await assert.rejects(readJson('synthetic.json', { items: [] }), SyntaxError);
});
test('readJson retains missing-file fallback and BOM support', async (t) => {
  t.mock.method(fs, 'readFile', async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); });
  const fallback = { items: [] };
  assert.equal(await readJson('synthetic.json', fallback), fallback);
  await assert.rejects(readJson('synthetic.json'), { code: 'ENOENT' });
  t.mock.restoreAll();
  t.mock.method(fs, 'readFile', async () => '\uFEFF{"items":[1]}');
  assert.deepEqual(await readJson('synthetic.json'), { items: [1] });
});
