export type IdentityProvider = 'guest' | 'google';

export type Identity = {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  provider: IdentityProvider;
};

export type MeetingRoom = {
  id: string;
  slug: string;
  kind: 'instant' | 'team';
  title: string;
  hostIdentityId: string;
  requiresLogin: boolean;
  teamId?: string;
  createdAt: string;
};

export type MeetingParticipant = {
  id: string;
  roomId: string;
  identityId: string;
  displayName: string;
  role: 'host' | 'member' | 'guest';
  joinedAt: string;
};

export type Team = {
  id: string;
  name: string;
  ownerIdentityId: string;
  memberIdentityIds: string[];
  createdAt: string;
};

export type Session = {
  identity: Identity;
  token: string;
};

export type LiveKitJoin = {
  url: string;
  token: string;
  roomName: string;
};

export type JoinResponse = {
  room: MeetingRoom;
  identity: Identity;
  participant: MeetingParticipant;
  livekit: LiveKitJoin;
  sessionToken?: string;
};

export type ChatAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: 'image' | 'file';
  dataUrl: string;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  senderIdentityId: string;
  senderName: string;
  text: string;
  attachment?: ChatAttachment;
  createdAt: string;
};
