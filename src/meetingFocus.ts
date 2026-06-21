export type MeetingFocus = 'video' | 'chat';

export function getMeetingFocusAfterChatClick(current: MeetingFocus): MeetingFocus {
  return current === 'chat' ? 'video' : 'chat';
}

export function getUnreadChatCount(
  currentFocus: MeetingFocus,
  totalMessages: number,
  lastSeenMessages: number,
): number {
  if (currentFocus === 'chat') {
    return 0;
  }

  return Math.max(0, totalMessages - lastSeenMessages);
}
