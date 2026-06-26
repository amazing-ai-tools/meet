import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getStageThumbnailMetadataClass,
  shouldHideStageThumbnailMetadataByDefault,
} from './stageThumbnailMetadata.ts';

test('fullscreen and mobile thumbnails hide camera metadata until interaction', () => {
  assert.equal(shouldHideStageThumbnailMetadataByDefault('fullscreen-strip'), true);
  assert.equal(shouldHideStageThumbnailMetadataByDefault('fullscreen-local-preview'), true);
  assert.equal(shouldHideStageThumbnailMetadataByDefault('mobile-strip'), true);
  assert.equal(getStageThumbnailMetadataClass('fullscreen-strip'), 'is-metadata-on-interaction');
});
