import assert from 'node:assert/strict';
import test from 'node:test';

import { createMeetingUrl } from './meetingLinks.ts';

test('createMeetingUrl builds a public room URL from the configured app domain', () => {
  assert.equal(createMeetingUrl('abc123xyz', 'meet.app.amazing-ai.tools'), 'https://meet.app.amazing-ai.tools/r/abc123xyz');
});

test('createMeetingUrl normalizes domains that already include https', () => {
  assert.equal(createMeetingUrl('room456', 'https://meet.app.amazing-ai.tools'), 'https://meet.app.amazing-ai.tools/r/room456');
});
