import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createChatMessage, createGuestIdentity, createInstantRoom } from '../dist/domain.js';
import { JsonStore } from '../dist/store.js';

test('store emits room chat events for new messages and chat block changes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meetteams-store-'));
  const store = new JsonStore(join(dir, 'state.json'));
  const host = createGuestIdentity('Host');
  const guest = createGuestIdentity('Guest');
  const room = createInstantRoom(host, 'SSE Chat');
  const events = [];

  await store.load();
  await store.addRoom(room);
  const unsubscribe = store.subscribeRoomChat(room.id, (event) => events.push(event));

  const message = await store.addChatMessage(createChatMessage(room, guest, { text: 'ao vivo' }));
  const blockedIdentityIds = await store.setChatBlocked(room.id, guest.id, true);

  unsubscribe();
  await store.addChatMessage(createChatMessage(room, guest, { text: 'nao deve emitir depois' }));

  assert.deepEqual(events, [
    { type: 'message', roomId: room.id, message },
    { type: 'blocked', roomId: room.id, blockedIdentityIds },
  ]);

  await rm(dir, { recursive: true, force: true });
});

test('store emits room chat typing events without persisting them', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meetteams-store-'));
  const store = new JsonStore(join(dir, 'state.json'));
  const host = createGuestIdentity('Host');
  const guest = createGuestIdentity('Guest');
  const room = createInstantRoom(host, 'Typing Chat');
  const events = [];

  await store.load();
  await store.addRoom(room);
  const unsubscribe = store.subscribeRoomChat(room.id, (event) => events.push(event));

  store.setChatTyping(room.id, guest.id, guest.displayName, true);
  store.setChatTyping(room.id, guest.id, guest.displayName, false);

  unsubscribe();

  assert.deepEqual(events, [
    { type: 'typing', roomId: room.id, identityId: guest.id, displayName: guest.displayName, typing: true },
    { type: 'typing', roomId: room.id, identityId: guest.id, displayName: guest.displayName, typing: false },
  ]);
  assert.deepEqual(store.snapshot().chatMessages, []);

  await rm(dir, { recursive: true, force: true });
});
