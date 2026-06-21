import assert from 'node:assert/strict';
import test from 'node:test';

import { toggleMobilePanel, type MobileMeetingPanel } from './mobileMeetingLayout.ts';

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
