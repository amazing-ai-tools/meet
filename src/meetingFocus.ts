export type MeetingFocus = 'video' | 'chat';

export function getMeetingFocusAfterChatClick(current: MeetingFocus): MeetingFocus {
  return current === 'chat' ? 'video' : 'chat';
}
