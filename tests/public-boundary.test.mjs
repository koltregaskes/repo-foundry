import assert from 'node:assert/strict';
import test from 'node:test';
import { findPublicBoundaryFindings } from '../src/lib/public-boundary.mjs';

for (const localPath of [String.raw`D:\t3-worktrees\repo\file`, 'C:/Users/example/private', String.raw`F:\_WORKSPACES\project\file`, String.raw`\\server\share\private`, 'file:///C:/work/private']) {
  for (const content of [localPath, JSON.stringify({ path: localPath })]) {
    test(`reject local path ${JSON.stringify(content)}`, () => {
      assert.ok(findPublicBoundaryFindings([{ relativePath: 'fixture.json', content }]).length > 0);
    });
  }
}
test('ordinary public URLs and drive-like prose remain allowed', () => {
  assert.deepEqual(findPublicBoundaryFindings([{relativePath: 'safe.txt', content: 'https://example.org/a/b C: a language; ratio 3:1'}]), []);
});
