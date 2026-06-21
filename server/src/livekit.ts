import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

import type { Identity, MeetingParticipant, MeetingRoom } from './domain.js';

export const defaultLiveKitUrl = 'wss://livekit.meet.api.amazing-ai.tools';

export type LiveKitConfig = {
  url: string;
  apiKey: string;
  apiSecret: string;
};

export async function createLiveKitJoinToken(
  config: LiveKitConfig,
  room: MeetingRoom,
  identity: Identity,
  participant: MeetingParticipant,
): Promise<{ url: string; token: string; roomName: string }> {
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: identity.id,
    name: identity.displayName,
    metadata: JSON.stringify({
      participantId: participant.id,
      roomId: room.id,
      role: participant.role,
      provider: identity.provider,
    }),
  });

  token.addGrant({
    room: room.slug,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return {
    url: config.url,
    token: await token.toJwt(),
    roomName: room.slug,
  };
}

export function createLiveKitRoomServiceClient(config: LiveKitConfig): RoomServiceClient {
  return new RoomServiceClient(toHttpLiveKitUrl(config.url), config.apiKey, config.apiSecret);
}

export async function removeLiveKitParticipant(
  config: LiveKitConfig,
  roomName: string,
  identityId: string,
): Promise<void> {
  await createLiveKitRoomServiceClient(config).removeParticipant(roomName, identityId, {
    revokeTokenTs: BigInt(Math.floor(Date.now() / 1000)),
  });
}

export async function muteLiveKitParticipantMicrophone(
  config: LiveKitConfig,
  roomName: string,
  identityId: string,
  trackSid?: string,
): Promise<{ muted: boolean; trackSid?: string }> {
  const client = createLiveKitRoomServiceClient(config);
  const audioTrackSid = trackSid || (await findMicrophoneTrackSid(client, roomName, identityId));
  if (!audioTrackSid) {
    return { muted: false };
  }

  await client.mutePublishedTrack(roomName, identityId, audioTrackSid, true);
  return { muted: true, trackSid: audioTrackSid };
}

function toHttpLiveKitUrl(url: string): string {
  return url.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
}

async function findMicrophoneTrackSid(
  client: RoomServiceClient,
  roomName: string,
  identityId: string,
): Promise<string | undefined> {
  const participant = await client.getParticipant(roomName, identityId);
  const microphoneSource = 2;
  const audioTrack = participant.tracks.find((track) => track.source === microphoneSource);
  return audioTrack?.sid;
}
