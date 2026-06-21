import test from 'node:test';
import assert from 'node:assert/strict';

import { getVisibleTypingParticipants, getTypingSummary } from './chatPresence.ts';

test('getVisibleTypingParticipants hides the local participant and caps the visible names', () => {
  const visible = getVisibleTypingParticipants(
    [
      { identityId: 'local', displayName: 'Eu' },
      { identityId: 'ana', displayName: 'Ana' },
      { identityId: 'bia', displayName: 'Bia' },
      { identityId: 'caio', displayName: 'Caio' },
    ],
    'local',
    2,
  );

  assert.deepEqual(visible, [
    { identityId: 'ana', displayName: 'Ana' },
    { identityId: 'bia', displayName: 'Bia' },
  ]);
});

test('getTypingSummary writes natural Portuguese typing labels', () => {
  assert.equal(getTypingSummary([]), '');
  assert.equal(getTypingSummary([{ identityId: 'ana', displayName: 'Ana' }]), 'Ana esta digitando...');
  assert.equal(
    getTypingSummary([
      { identityId: 'ana', displayName: 'Ana' },
      { identityId: 'bia', displayName: 'Bia' },
    ]),
    'Ana e Bia estao digitando...',
  );
  assert.equal(
    getTypingSummary([
      { identityId: 'ana', displayName: 'Ana' },
      { identityId: 'bia', displayName: 'Bia' },
      { identityId: 'caio', displayName: 'Caio' },
    ]),
    'Ana, Bia e mais 1 estao digitando...',
  );
});
