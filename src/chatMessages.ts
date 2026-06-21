import type { ChatMessage } from './types';

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
