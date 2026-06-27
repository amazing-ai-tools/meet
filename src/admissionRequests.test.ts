import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mergeAdmissionRequestEvent,
  getLatestPendingAdmissionRequest,
  type AdmissionRequestEvent,
} from './admissionRequests';
import type { RoomAdmissionRequest } from './types';

const baseRequest: RoomAdmissionRequest = {
  id: 'admit_1',
  roomId: 'room_1',
  identityId: 'guest_1',
  displayName: 'Ana',
  status: 'pending',
  requestedAt: '2026-06-27T10:00:00.000Z',
};

test('mergeAdmissionRequestEvent keeps pending requests and removes resolved requests', () => {
  const requested: AdmissionRequestEvent = { type: 'requested', payload: { type: 'requested', roomId: 'room_1', request: baseRequest } };
  const resolved: AdmissionRequestEvent = {
    type: 'resolved',
    payload: {
      type: 'resolved',
      roomId: 'room_1',
      request: {
        ...baseRequest,
        status: 'approved',
        resolvedAt: '2026-06-27T10:01:00.000Z',
        resolvedByIdentityId: 'host_1',
      },
    },
  };

  const withRequest = mergeAdmissionRequestEvent([], requested);
  assert.deepEqual(withRequest, [baseRequest]);
  assert.deepEqual(mergeAdmissionRequestEvent(withRequest, resolved), []);
});

test('getLatestPendingAdmissionRequest returns the newest pending request for the popup', () => {
  const older: RoomAdmissionRequest = {
    ...baseRequest,
    id: 'admit_old',
    requestedAt: '2026-06-27T09:59:00.000Z',
  };
  const newer: RoomAdmissionRequest = {
    ...baseRequest,
    id: 'admit_new',
    identityId: 'guest_2',
    displayName: 'Bob',
    requestedAt: '2026-06-27T10:02:00.000Z',
  };

  assert.equal(getLatestPendingAdmissionRequest([older, newer])?.id, 'admit_new');
});
