import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getChatToastSummary,
  shouldShowChatToast,
  mergeRoomChatMessages,
} from './chatMessages.ts';
import type { ChatMessage } from './types';

const baseMessage: ChatMessage = {
  id: 'chat_1',
  roomId: 'room_1',
  senderIdentityId: 'identity_1',
  senderName: 'Ana',
  text: 'primeira',
  createdAt: '2026-06-21T10:00:00.000Z',
};

test('mergeRoomChatMessages appends new messages without duplicating existing ids', () => {
  const merged = mergeRoomChatMessages([baseMessage], [
    { ...baseMessage, text: 'primeira atualizada' },
    { ...baseMessage, id: 'chat_2', text: 'segunda', createdAt: '2026-06-21T10:01:00.000Z' },
  ]);

  assert.deepEqual(merged.map((message) => [message.id, message.text]), [
    ['chat_1', 'primeira atualizada'],
    ['chat_2', 'segunda'],
  ]);
});

test('mergeRoomChatMessages keeps messages ordered by creation time and capped', () => {
  const messages = Array.from({ length: 205 }, (_, index) => ({
    ...baseMessage,
    id: `chat_${index}`,
    text: `${index}`,
    createdAt: new Date(Date.UTC(2026, 5, 21, 10, index)).toISOString(),
  }));

  const merged = mergeRoomChatMessages([], messages, 200);

  assert.equal(merged.length, 200);
  assert.equal(merged[0].id, 'chat_5');
  assert.equal(merged.at(-1)?.id, 'chat_204');
});

test('shouldShowChatToast only notifies for other users while chat is hidden', () => {
  assert.equal(shouldShowChatToast(baseMessage, 'identity_2', 'video'), true);
  assert.equal(shouldShowChatToast(baseMessage, 'identity_1', 'video'), false);
  assert.equal(shouldShowChatToast(baseMessage, 'identity_2', 'chat'), false);
});

test('getChatToastSummary prefers text and falls back to attachment labels', () => {
  assert.equal(
    getChatToastSummary(
      { ...baseMessage, text: '  Esta mensagem tem bastante conteudo para aparecer resumida no toast.  ' },
      { image: 'Imagem', file: 'Arquivo' },
      32,
    ),
    'Esta mensagem tem bastante co...',
  );

  assert.equal(
    getChatToastSummary(
      {
        ...baseMessage,
        text: '',
        attachment: {
          id: 'att_1',
          name: 'screen.png',
          type: 'image/png',
          size: 1200,
          kind: 'image',
          dataUrl: 'data:image/png;base64,AA==',
        },
      },
      { image: 'Imagem', file: 'Arquivo' },
    ),
    'Imagem: screen.png',
  );

  assert.equal(getChatToastSummary({ ...baseMessage, text: '' }, { image: 'Imagem', file: 'Arquivo' }), '');
});
