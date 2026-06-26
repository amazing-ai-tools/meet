import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('legacy background effects chunk keeps old cached bundles from loading HTML fallback', () => {
  const source = readFileSync('public/assets/dist-CuuqwSX0.js', 'utf8');

  assert.match(source, /BackgroundProcessor/);
  assert.match(source, /supportsBackgroundProcessors/);
  assert.match(source, /@livekit\/track-processors@0\.7\.2/);
});
