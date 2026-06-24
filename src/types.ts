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

export type WidgetRoomResponse = {
  contextId: string;
  room: MeetingRoom;
  roomUrl: string;
  session: Session;
  participant: MeetingParticipant;
  livekit: LiveKitJoin;
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

export type ChatSnapshotEvent = {
  messages: ChatMessage[];
  blockedIdentityIds: string[];
};

export type ChatStreamEvent =
  | { type: 'snapshot'; payload: ChatSnapshotEvent }
  | { type: 'message'; payload: { type: 'message'; roomId: string; message: ChatMessage } }
  | { type: 'blocked'; payload: { type: 'blocked'; roomId: string; blockedIdentityIds: string[] } }
  | {
      type: 'typing';
      payload: {
        type: 'typing';
        roomId: string;
        identityId: string;
        displayName: string;
        typing: boolean;
      };
    };

export type RoomInvitation = {
  id: string;
  roomId: string;
  invitedByIdentityId: string;
  email: string;
  scheduledAt?: string;
  note?: string;
  deliveryStatus: 'pending' | 'sent' | 'failed';
  deliveryError?: string;
  createdAt: string;
};

export type MarketingStats = {
  meetingsCreated: number;
  teamsCreated: number;
  usersJoined: number;
  participantHours: number;
};
