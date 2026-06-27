import type { RoomAdmissionRequest } from './types';

export type AdmissionSnapshotEvent = {
  type: 'snapshot';
  payload: { requests: RoomAdmissionRequest[] };
};

export type AdmissionRequestedEvent = {
  type: 'requested';
  payload: { type: 'requested'; roomId: string; request: RoomAdmissionRequest };
};

export type AdmissionResolvedEvent = {
  type: 'resolved';
  payload: { type: 'resolved'; roomId: string; request: RoomAdmissionRequest };
};

export type AdmissionRequestEvent =
  | AdmissionSnapshotEvent
  | AdmissionRequestedEvent
  | AdmissionResolvedEvent;

export function mergeAdmissionRequestEvent(
  requests: RoomAdmissionRequest[],
  event: AdmissionRequestEvent,
): RoomAdmissionRequest[] {
  if (event.type === 'snapshot') {
    return sortPendingRequests(event.payload.requests);
  }

  if (event.type === 'requested') {
    return sortPendingRequests([
      ...requests.filter((request) => request.id !== event.payload.request.id),
      event.payload.request,
    ]);
  }

  return sortPendingRequests(
    requests.filter((request) => request.id !== event.payload.request.id),
  );
}

export function getLatestPendingAdmissionRequest(
  requests: RoomAdmissionRequest[],
): RoomAdmissionRequest | undefined {
  return sortPendingRequests(requests).at(-1);
}

function sortPendingRequests(requests: RoomAdmissionRequest[]): RoomAdmissionRequest[] {
  return requests
    .filter((request) => request.status === 'pending')
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
}
