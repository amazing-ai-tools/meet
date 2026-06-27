import type { ChatMessage } from './types';
import type { MeetingFocus } from './meetingFocus';

export function mergeRoomChatMessages(
  currentMessages: ChatMessage[],
  incomingMessages: ChatMessage[],
  limit = 200,
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();

  for (const message of currentMessages) {
    byId.set(message.id, message);
  }

  for (const message of incomingMessages) {
    byId.set(message.id, message);
  }

  return [...byId.values()]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-limit);
}

export function shouldShowChatToast(
  message: ChatMessage,
  localIdentityId: string,
  meetingFocus: MeetingFocus,
): boolean {
  return meetingFocus !== 'chat' && message.senderIdentityId !== localIdentityId;
}

export function getChatToastSummary(
  message: ChatMessage,
  labels: { image: string; file: string },
  maxLength = 96,
): string {
  const text = message.text.trim().replace(/\s+/g, ' ');
  if (text) {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
  }

  if (message.attachment) {
    const label = message.attachment.kind === 'image' ? labels.image : labels.file;
    return `${label}: ${message.attachment.name}`;
  }

  return '';
}
