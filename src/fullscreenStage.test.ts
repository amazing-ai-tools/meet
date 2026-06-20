import assert from 'node:assert/strict';
import test from 'node:test';

import { getFullscreenStageToggleLabel, toggleFullscreenStageFocus } from './fullscreenStage.ts';

test('toggleFullscreenStageFocus switches between self and friends', () => {
  assert.equal(toggleFullscreenStageFocus('self'), 'friends');
  assert.equal(toggleFullscreenStageFocus('friends'), 'self');
});

test('getFullscreenStageToggleLabel names the next fullscreen focus', () => {
  assert.equal(getFullscreenStageToggleLabel('self'), 'Ver amigos');
  assert.equal(getFullscreenStageToggleLabel('friends'), 'Ver eu');
});
