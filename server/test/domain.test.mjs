import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createChatMessage,
  createGuestIdentity,
  createInstantRoom,
  createRoomInvitation,
  createTeam,
  createTeamRoom,
  normalizeTeamMemberEmails,
  calculateParticipantHours,
  canHostControlParticipant,
  canSendChatMessage,
  createId,
  createParticipant,
  createParticipantSession,
  createRoomAdmissionRequest,
  resolveRoomAdmissionPolicy,
  normalizeWidgetContextId,
} from '../dist/domain.js';
import { defaultLiveKitUrl } from '../dist/livekit.js';

test('createId returns url-safe readable identifiers', () => {
  const id = createId('room');

  assert.match(id, /^room_[a-z0-9]{10}$/);
});

test('createInstantRoom creates a public room with the creator as host', () => {
  const host = createGuestIdentity('Ada Lovelace');
  const room = createInstantRoom(host, 'Daily standup');

  assert.equal(room.kind, 'instant');
  assert.equal(room.title, 'Daily standup');
  assert.equal(room.requiresLogin, false);
  assert.equal(room.hostIdentityId, host.id);
  assert.equal(room.slug.length, 10);
});

test('createTeam requires an authenticated Google identity', () => {
  const guest = createGuestIdentity('Guest User');

  assert.throws(
    () => createTeam(guest, 'Amazing Product'),
    /Google login is required to create a team/,
  );
});

test('createTeamRoom creates a persistent room inside the team', () => {
  const owner = {
    id: 'user_google_123',
    displayName: 'Grace Hopper',
    email: 'grace@example.com',
    provider: 'google',
  };

  const team = createTeam(owner, 'Engineering');
  const room = createTeamRoom(team, owner, 'Architecture');

  assert.equal(room.kind, 'team');
  assert.equal(room.teamId, team.id);
  assert.equal(room.requiresLogin, true);
  assert.equal(room.hostIdentityId, owner.id);
});

test('createTeamRoom allows a Google user whose email is a team member', () => {
  const owner = {
    id: 'user_google_owner',
    displayName: 'Grace Hopper',
    email: 'grace@example.com',
    provider: 'google',
  };
  const member = {
    id: 'user_google_member',
    displayName: 'Katherine Johnson',
    email: 'member@example.com',
    provider: 'google',
  };

  const team = {
    ...createTeam(owner, 'Engineering'),
    memberEmails: ['grace@example.com', 'member@example.com'],
  };
  const room = createTeamRoom(team, member, 'Architecture');

  assert.equal(room.hostIdentityId, member.id);
  assert.equal(room.teamId, team.id);
});

test('team member emails are normalized and deduplicated', () => {
  assert.deepEqual(
    normalizeTeamMemberEmails(' Ada@Example.com, bob@example.com\nada@example.com '),
    ['ada@example.com', 'bob@example.com'],
  );

  assert.throws(
    () => normalizeTeamMemberEmails('not-an-email'),
    /valid email/,
  );
});

test('host controls are limited to the room host', () => {
  const host = createGuestIdentity('Host');
  const participant = createGuestIdentity('Participant');
  const room = createInstantRoom(host, 'Retro');

  assert.equal(canHostControlParticipant(room, host, participant.id), true);
  assert.equal(canHostControlParticipant(room, participant, host.id), false);
  assert.equal(canHostControlParticipant(room, host, host.id), false);
});

test('default LiveKit URL is the public Caddy websocket endpoint', () => {
  assert.equal(defaultLiveKitUrl, 'wss://livekit.meet.api.amazing-ai.tools');
  assert.doesNotMatch(defaultLiveKitUrl, /localhost|127\.0\.0\.1|^ws:\/\//);
});

test('chat messages allow text, images, and regular files with safe attachment metadata', () => {
  const sender = createGuestIdentity('Chat Sender');
  const room = createInstantRoom(sender, 'Chat Room');
  const message = createChatMessage(room, sender, {
    text: 'Segue o arquivo',
    attachment: {
      name: '../report final.png',
      type: 'image/png',
      size: 2048,
      dataUrl: 'data:image/png;base64,ZmFrZQ==',
    },
  });

  assert.equal(message.roomId, room.id);
  assert.equal(message.senderIdentityId, sender.id);
  assert.equal(message.text, 'Segue o arquivo');
  assert.equal(message.attachment?.name, 'report final.png');
  assert.equal(message.attachment?.kind, 'image');
});

test('chat messages reject empty payloads and oversized attachments', () => {
  const sender = createGuestIdentity('Chat Sender');
  const room = createInstantRoom(sender, 'Chat Room');

  assert.throws(
    () => createChatMessage(room, sender, { text: '   ' }),
    /Message text or attachment is required/,
  );

  assert.throws(
    () => createChatMessage(room, sender, {
      attachment: {
        name: 'large.pdf',
        type: 'application/pdf',
        size: 6 * 1024 * 1024,
        dataUrl: 'data:application/pdf;base64,ZmFrZQ==',
      },
    }),
    /Attachments must be 5 MB or smaller/,
  );
});

test('host can block a participant from sending chat messages', () => {
  const host = createGuestIdentity('Host');
  const participant = createGuestIdentity('Participant');
  const room = createInstantRoom(host, 'Moderated Chat');

  assert.equal(canSendChatMessage(room, participant, []), true);
  assert.equal(canSendChatMessage(room, participant, [participant.id]), false);
  assert.equal(canSendChatMessage(room, host, [host.id]), true);
});

test('room admission requires approval only when someone is already inside', () => {
  const host = createGuestIdentity('Host');
  const guest = createGuestIdentity('Guest');
  const room = createInstantRoom(host, 'Approval Room');
  const hostParticipant = createParticipant(room, host);
  const hostSession = createParticipantSession(room, hostParticipant, '2026-06-26T10:00:00.000Z');

  assert.equal(resolveRoomAdmissionPolicy(room, guest, [], []).decision, 'allow');
  assert.equal(resolveRoomAdmissionPolicy(room, guest, [hostSession], []).decision, 'request');

  const request = createRoomAdmissionRequest(room, guest);
  assert.equal(request.status, 'pending');
  assert.equal(request.displayName, guest.displayName);

  assert.equal(
    resolveRoomAdmissionPolicy(room, guest, [hostSession], [{ ...request, status: 'approved' }]).decision,
    'allow',
  );

  assert.equal(
    resolveRoomAdmissionPolicy(room, host, [hostSession], []).decision,
    'allow',
  );
});

test('room invitations normalize email recipients and optional schedule time', () => {
  const host = createGuestIdentity('Host User');
  const room = createInstantRoom(host, 'Planning Review');
  const invitation = createRoomInvitation(room, host, {
    email: '  FRIEND@Example.COM ',
    scheduledAt: '2026-07-01T15:30:00.000Z',
    note: '  Vamos revisar o plano. ',
  });

  assert.equal(invitation.roomId, room.id);
  assert.equal(invitation.invitedByIdentityId, host.id);
  assert.equal(invitation.email, 'friend@example.com');
  assert.equal(invitation.scheduledAt, '2026-07-01T15:30:00.000Z');
  assert.equal(invitation.note, 'Vamos revisar o plano.');
  assert.equal(invitation.deliveryStatus, 'pending');
});

test('room invitations reject invalid emails and past schedule dates', () => {
  const host = createGuestIdentity('Host User');
  const room = createInstantRoom(host, 'Planning Review');

  assert.throws(
    () => createRoomInvitation(room, host, { email: 'not-an-email' }),
    /valid email/,
  );

  assert.throws(
    () => createRoomInvitation(room, host, { email: 'friend@example.com', scheduledAt: '2020-01-01T00:00:00.000Z' }),
    /future date/,
  );
});

test('widget context ids are stable and safe for external embeds', () => {
  assert.equal(normalizeWidgetContextId('  Game Room 123  '), 'game-room-123');
  assert.equal(normalizeWidgetContextId('mesa:partida/42'), 'mesa-partida-42');

  assert.throws(
    () => normalizeWidgetContextId('   '),
    /Widget context is required/,
  );
});

test('participant hours sum elapsed time across ended and active sessions', () => {
  const host = createGuestIdentity('Host User');
  const guest = createGuestIdentity('Guest User');
  const room = createInstantRoom(host, 'Metrics Room');
  const hostParticipant = createParticipant(room, host);
  const guestParticipant = createParticipant(room, guest);
  const hostSession = createParticipantSession(room, hostParticipant, '2026-06-24T10:00:00.000Z');
  const guestSession = {
    ...createParticipantSession(room, guestParticipant, '2026-06-24T10:30:00.000Z'),
    leftAt: '2026-06-24T12:00:00.000Z',
  };

  assert.equal(calculateParticipantHours([hostSession, guestSession], '2026-06-24T12:00:00.000Z'), 3.5);
});
