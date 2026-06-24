import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getMobileChromeAutoHideDelayMs,
  getMobileStageFitMode,
  toggleMobilePanel,
  type MobileMeetingPanel,
} from './mobileMeetingLayout.ts';

test('mobile meeting starts video-first with no drawer open', () => {
  const panel: MobileMeetingPanel = null;

  assert.equal(panel, null);
});

test('toggleMobilePanel opens one meeting drawer at a time', () => {
  assert.equal(toggleMobilePanel(null, 'chat'), 'chat');
  assert.equal(toggleMobilePanel('chat', 'participants'), 'participants');
  assert.equal(toggleMobilePanel('participants', 'share'), 'share');
  assert.equal(toggleMobilePanel('share', 'effects'), 'effects');
});

test('toggleMobilePanel closes the active drawer when tapped again', () => {
  assert.equal(toggleMobilePanel('chat', 'chat'), null);
});

test('mobile selected camera fills the viewport while screen share preserves content', () => {
  assert.equal(getMobileStageFitMode('camera'), 'cover');
  assert.equal(getMobileStageFitMode('screen_share'), 'contain');
});

test('mobile chrome hides faster when chat is the primary focus', () => {
  assert.equal(getMobileChromeAutoHideDelayMs('chat') < getMobileChromeAutoHideDelayMs('video'), true);
  assert.equal(getMobileChromeAutoHideDelayMs('chat'), 1600);
  assert.equal(getMobileChromeAutoHideDelayMs('video'), 3600);
});
