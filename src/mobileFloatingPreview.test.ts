import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampFloatingPreviewPosition,
  getDefaultFloatingPreviewPosition,
  type FloatingPreviewBounds,
} from './mobileFloatingPreview.ts';

const bounds: FloatingPreviewBounds = {
  viewportWidth: 390,
  viewportHeight: 844,
  previewWidth: 132,
  previewHeight: 92,
  margin: 12,
  topOffset: 62,
};

test('mobile floating preview starts in the top right corner', () => {
  assert.deepEqual(getDefaultFloatingPreviewPosition(bounds), {
    x: 246,
    y: 74,
  });
});

test('mobile floating preview stays inside the viewport while dragged', () => {
  assert.deepEqual(clampFloatingPreviewPosition({ x: -80, y: 0 }, bounds), {
    x: 12,
    y: 74,
  });
  assert.deepEqual(clampFloatingPreviewPosition({ x: 999, y: 999 }, bounds), {
    x: 246,
    y: 740,
  });
});
