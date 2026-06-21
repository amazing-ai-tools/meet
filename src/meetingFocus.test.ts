import test from 'node:test';
import assert from 'node:assert/strict';

import { getMeetingFocusAfterChatClick, type MeetingFocus } from './meetingFocus.ts';

test('chat icon toggles the primary meeting focus', () => {
  const focus: MeetingFocus = 'video';

  assert.equal(getMeetingFocusAfterChatClick(focus), 'chat');
  assert.equal(getMeetingFocusAfterChatClick('chat'), 'video');
});
