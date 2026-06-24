import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getChatToggleControlLabelKey,
  getMeetingFocusAfterChatClick,
  getUnreadChatCount,
  type MeetingFocus,
} from './meetingFocus.ts';

test('chat icon toggles the primary meeting focus', () => {
  const focus: MeetingFocus = 'video';

  assert.equal(getMeetingFocusAfterChatClick(focus), 'chat');
  assert.equal(getMeetingFocusAfterChatClick('chat'), 'video');
});

test('chat toggle keeps a stable control label in every focus mode', () => {
  assert.equal(getChatToggleControlLabelKey('video'), 'controls.chatVideoToggle');
  assert.equal(getChatToggleControlLabelKey('chat'), 'controls.chatVideoToggle');
});

test('unread chat count only grows while video is focused', () => {
  assert.equal(getUnreadChatCount('video', 8, 5), 3);
  assert.equal(getUnreadChatCount('video', 5, 8), 0);
  assert.equal(getUnreadChatCount('chat', 8, 5), 0);
});
