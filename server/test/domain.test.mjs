import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGuestIdentity,
  createInstantRoom,
  createTeam,
  createTeamRoom,
  canHostControlParticipant,
  createId,
} from '../dist/domain.js';

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

test('host controls are limited to the room host', () => {
  const host = createGuestIdentity('Host');
  const participant = createGuestIdentity('Participant');
  const room = createInstantRoom(host, 'Retro');

  assert.equal(canHostControlParticipant(room, host, participant.id), true);
  assert.equal(canHostControlParticipant(room, participant, host.id), false);
  assert.equal(canHostControlParticipant(room, host, host.id), false);
});
