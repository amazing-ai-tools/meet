import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMeetingFocusAfterChatClick,
  getUnreadChatCount,
  type MeetingFocus,
} from './meetingFocus.ts';

test('chat icon toggles the primary meeting focus', () => {
  const focus: MeetingFocus = 'video';

  assert.equal(getMeetingFocusAfterChatClick(focus), 'chat');
  assert.equal(getMeetingFocusAfterChatClick('chat'), 'video');
});

test('unread chat count only grows while video is focused', () => {
  assert.equal(getUnreadChatCount('video', 8, 5), 3);
  assert.equal(getUnreadChatCount('video', 5, 8), 0);
  assert.equal(getUnreadChatCount('chat', 8, 5), 0);
});
