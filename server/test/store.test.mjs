import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  createChatMessage,
  createGuestIdentity,
  createInstantRoom,
  createParticipant,
  createParticipantSession,
  createRoomAdmissionRequest,
  createRoomInvitation,
  createTeam,
} from '../dist/domain.js';
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

test('store persists and resolves room admission requests', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meetteams-store-'));
  const store = new JsonStore(join(dir, 'state.json'));
  const host = createGuestIdentity('Host');
  const guest = createGuestIdentity('Guest');
  const room = createInstantRoom(host, 'Admission Room');
  const events = [];

  await store.load();
  await store.addRoom(room);
  const unsubscribe = store.subscribeRoomAdmissions(room.id, (event) => events.push(event));

  const request = await store.upsertRoomAdmissionRequest(createRoomAdmissionRequest(room, guest));
  const approved = await store.resolveRoomAdmissionRequest(room.id, request.id, 'approved', host.id);

  unsubscribe();

  assert.equal(approved.status, 'approved');
  assert.equal(approved.resolvedByIdentityId, host.id);
  assert.deepEqual(store.listRoomAdmissionRequests(room.id), [approved]);
  assert.deepEqual(events, [
    { type: 'requested', roomId: room.id, request },
    { type: 'resolved', roomId: room.id, request: approved },
  ]);

  await rm(dir, { recursive: true, force: true });
});

test('store reports active room participant sessions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meetteams-store-'));
  const store = new JsonStore(join(dir, 'state.json'));
  const host = createGuestIdentity('Host');
  const guest = createGuestIdentity('Guest');
  const room = createInstantRoom(host, 'Active Room');
  const hostParticipant = createParticipant(room, host);
  const guestParticipant = createParticipant(room, guest);

  await store.load();
  await store.addRoom(room);
  await store.addParticipant(hostParticipant);
  await store.addParticipant(guestParticipant);
  await store.startParticipantSession(createParticipantSession(room, hostParticipant));
  await store.startParticipantSession({
    ...createParticipantSession(room, guestParticipant),
    leftAt: '2026-06-26T12:00:00.000Z',
  });

  assert.deepEqual(
    store.listActiveParticipantSessionsForRoom(room.id).map((session) => session.identityId),
    [host.id],
  );

  await rm(dir, { recursive: true, force: true });
});

test('store persists room invitations and delivery status updates', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meetteams-store-'));
  const store = new JsonStore(join(dir, 'state.json'));
  const host = createGuestIdentity('Host');
  const room = createInstantRoom(host, 'Invite Room');

  await store.load();
  await store.addRoom(room);

  const invitation = await store.addRoomInvitation(createRoomInvitation(room, host, {
    email: 'friend@example.com',
    scheduledAt: '2026-07-01T15:30:00.000Z',
  }));
  const updated = await store.updateRoomInvitationDelivery(invitation.id, 'sent');

  assert.equal(updated.deliveryStatus, 'sent');
  assert.deepEqual(store.listRoomInvitations(room.id), [updated]);

  await rm(dir, { recursive: true, force: true });
});

test('store maps external widget contexts to reusable rooms', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meetteams-store-'));
  const store = new JsonStore(join(dir, 'state.json'));
  const host = createGuestIdentity('Widget Host');
  const room = createInstantRoom(host, 'Game table chat');

  await store.load();
  await store.addRoom(room);
  await store.addWidgetRoomContext({
    contextId: 'game-room-123',
    roomId: room.id,
    createdAt: '2026-06-24T12:00:00.000Z',
  });

  const mapping = store.findWidgetRoomContext('game-room-123');

  assert.equal(mapping?.roomId, room.id);
  assert.equal(store.findRoomById(mapping.roomId)?.slug, room.slug);

  await rm(dir, { recursive: true, force: true });
});

test('store exposes persistent marketing stats for landing counters', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meetteams-store-'));
  const store = new JsonStore(join(dir, 'state.json'));
  const host = {
    id: 'google_host',
    displayName: 'Host User',
    email: 'host@example.com',
    provider: 'google',
  };
  const guest = createGuestIdentity('Guest User');
  const room = createInstantRoom(host, 'Metrics Room');
  const team = createTeam(host, 'Marketing Team');
  const hostParticipant = createParticipant(room, host);
  const guestParticipant = createParticipant(room, guest);

  await store.load();
  await store.addRoom(room);
  await store.addTeam(team);
  await store.addParticipant(hostParticipant);
  await store.addParticipant(guestParticipant);
  await store.startParticipantSession(createParticipantSession(room, hostParticipant, '2026-06-24T10:00:00.000Z'));
  await store.startParticipantSession({
    ...createParticipantSession(room, guestParticipant, '2026-06-24T10:30:00.000Z'),
    leftAt: '2026-06-24T11:30:00.000Z',
  });

  assert.deepEqual(store.getMarketingStats('2026-06-24T12:00:00.000Z'), {
    meetingsCreated: 1,
    teamsCreated: 1,
    usersJoined: 2,
    participantHours: 3,
  });

  await rm(dir, { recursive: true, force: true });
});

test('store persists team member emails without duplicates', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meetteams-store-'));
  const store = new JsonStore(join(dir, 'state.json'));
  const host = {
    id: 'google_host',
    displayName: 'Host User',
    email: 'host@example.com',
    provider: 'google',
  };
  const team = createTeam(host, 'Product Team');

  await store.load();
  await store.addTeam(team);
  const updated = await store.addTeamMemberEmails(team.id, ['Alice@Example.com', 'alice@example.com', 'bob@example.com']);

  assert.deepEqual(updated.memberEmails, ['host@example.com', 'alice@example.com', 'bob@example.com']);
  assert.deepEqual(store.findTeam(team.id).memberEmails, updated.memberEmails);

  await rm(dir, { recursive: true, force: true });
});

test('store lists teams for Google identities added by email', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'meetteams-store-'));
  const store = new JsonStore(join(dir, 'state.json'));
  const host = {
    id: 'google_host',
    displayName: 'Host User',
    email: 'host@example.com',
    provider: 'google',
  };
  const member = {
    id: 'google_member',
    displayName: 'Member User',
    email: 'member@example.com',
    provider: 'google',
  };
  const team = createTeam(host, 'Product Team');

  await store.load();
  await store.addTeam(team);
  await store.addTeamMemberEmails(team.id, ['member@example.com']);

  assert.equal(store.listTeamsForIdentity(member).length, 1);

  await rm(dir, { recursive: true, force: true });
});
