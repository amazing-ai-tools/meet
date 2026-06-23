import assert from 'node:assert/strict';
import test from 'node:test';

import { toggleDesktopPanel, type DesktopMeetingPanel } from './desktopMeetingLayout.ts';

test('desktop meeting starts with no side panel open', () => {
  const panel: DesktopMeetingPanel = null;

  assert.equal(panel, null);
});

test('toggleDesktopPanel opens one side panel at a time', () => {
  assert.equal(toggleDesktopPanel(null, 'participants'), 'participants');
  assert.equal(toggleDesktopPanel('participants', 'share'), 'share');
  assert.equal(toggleDesktopPanel('share', 'effects'), 'effects');
  assert.equal(toggleDesktopPanel('effects', 'host'), 'host');
  assert.equal(toggleDesktopPanel('host', 'devices'), 'devices');
});

test('toggleDesktopPanel closes the active panel when clicked again', () => {
  assert.equal(toggleDesktopPanel('participants', 'participants'), null);
});
