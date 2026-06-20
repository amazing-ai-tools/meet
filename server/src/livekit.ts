import { AccessToken } from 'livekit-server-sdk';

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
