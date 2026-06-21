import { randomBytes } from 'node:crypto';

export type IdentityProvider = 'guest' | 'google';

export type Identity = {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  provider: IdentityProvider;
};

export type RoomKind = 'instant' | 'team';

export type MeetingRoom = {
  id: string;
  slug: string;
  kind: RoomKind;
  title: string;
  hostIdentityId: string;
  requiresLogin: boolean;
  teamId?: string;
  createdAt: string;
};

export type Team = {
  id: string;
  name: string;
  ownerIdentityId: string;
  memberIdentityIds: string[];
  createdAt: string;
};

export type ParticipantRole = 'host' | 'member' | 'guest';

export type MeetingParticipant = {
  id: string;
  roomId: string;
  identityId: string;
  displayName: string;
  role: ParticipantRole;
  joinedAt: string;
};

export type ChatAttachmentKind = 'image' | 'file';

export type ChatAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: ChatAttachmentKind;
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

export type ChatMessageInput = {
  text?: string;
  attachment?: {
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  };
};

const maxAttachmentBytes = 5 * 1024 * 1024;

export function createId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10).padEnd(10, '0')}`;
}

export function createGuestIdentity(displayName: string): Identity {
  const normalizedName = normalizeDisplayName(displayName);

  return {
    id: createId('guest'),
    displayName: normalizedName,
    provider: 'guest',
  };
}

export function createInstantRoom(host: Identity, title?: string): MeetingRoom {
  return {
    id: createId('meeting'),
    slug: createRoomSlug(),
    kind: 'instant',
    title: normalizeRoomTitle(title || 'Reuniao avulsa'),
    hostIdentityId: host.id,
    requiresLogin: false,
    createdAt: new Date().toISOString(),
  };
}

export function createTeam(owner: Identity, name: string): Team {
  if (owner.provider !== 'google') {
    throw new Error('Google login is required to create a team');
  }

  return {
    id: createId('team'),
    name: normalizeRoomTitle(name),
    ownerIdentityId: owner.id,
    memberIdentityIds: [owner.id],
    createdAt: new Date().toISOString(),
  };
}

export function createTeamRoom(team: Team, host: Identity, title: string): MeetingRoom {
  if (host.provider !== 'google') {
    throw new Error('Google login is required to create a team room');
  }

  if (!team.memberIdentityIds.includes(host.id)) {
    throw new Error('Only team members can create rooms in this team');
  }

  return {
    id: createId('room'),
    slug: createRoomSlug(),
    kind: 'team',
    title: normalizeRoomTitle(title),
    hostIdentityId: host.id,
    requiresLogin: true,
    teamId: team.id,
    createdAt: new Date().toISOString(),
  };
}

export function createParticipant(room: MeetingRoom, identity: Identity): MeetingParticipant {
  if (room.requiresLogin && identity.provider !== 'google') {
    throw new Error('Google login is required to join this room');
  }

  return {
    id: createId('participant'),
    roomId: room.id,
    identityId: identity.id,
    displayName: identity.displayName,
    role: room.hostIdentityId === identity.id ? 'host' : identity.provider === 'google' ? 'member' : 'guest',
    joinedAt: new Date().toISOString(),
  };
}

export function canHostControlParticipant(
  room: MeetingRoom,
  actor: Identity,
  targetIdentityId: string,
): boolean {
  return room.hostIdentityId === actor.id && actor.id !== targetIdentityId;
}

export function canSendChatMessage(room: MeetingRoom, sender: Identity, blockedIdentityIds: string[]): boolean {
  return room.hostIdentityId === sender.id || !blockedIdentityIds.includes(sender.id);
}

export function createChatMessage(
  room: MeetingRoom,
  sender: Identity,
  input: ChatMessageInput,
): ChatMessage {
  const text = normalizeOptionalText(input.text);
  const attachment = input.attachment ? normalizeAttachment(input.attachment) : undefined;

  if (!text && !attachment) {
    throw new Error('Message text or attachment is required');
  }

  return {
    id: createId('chat'),
    roomId: room.id,
    senderIdentityId: sender.id,
    senderName: sender.displayName,
    text,
    attachment,
    createdAt: new Date().toISOString(),
  };
}

export function normalizeDisplayName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ');
  if (normalized.length < 2) {
    throw new Error('Display name must have at least 2 characters');
  }

  return normalized.slice(0, 80);
}

function normalizeRoomTitle(title: string): string {
  const normalized = title.trim().replace(/\s+/g, ' ');
  if (normalized.length < 2) {
    throw new Error('Room title must have at least 2 characters');
  }

  return normalized.slice(0, 120);
}

function normalizeOptionalText(text: string | undefined): string {
  return typeof text === 'string' ? text.trim().replace(/\s+/g, ' ').slice(0, 2000) : '';
}

function normalizeAttachment(attachment: ChatMessageInput['attachment']): ChatAttachment {
  if (!attachment) {
    throw new Error('Attachment is required');
  }

  if (attachment.size > maxAttachmentBytes) {
    throw new Error('Attachments must be 5 MB or smaller');
  }

  if (!attachment.dataUrl.startsWith('data:') || !attachment.dataUrl.includes(';base64,')) {
    throw new Error('Attachment data must be a base64 data URL');
  }

  const name = attachment.name
    .split(/[\\/]/)
    .pop()
    ?.trim()
    .replace(/\s+/g, ' ')
    .slice(0, 140);
  if (!name) {
    throw new Error('Attachment name is required');
  }

  const type = attachment.type.trim().slice(0, 120) || 'application/octet-stream';

  return {
    id: createId('file'),
    name,
    type,
    size: attachment.size,
    kind: type.startsWith('image/') ? 'image' : 'file',
    dataUrl: attachment.dataUrl,
  };
}

function createRoomSlug(): string {
  return randomBytes(8)
    .toString('base64url')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10)
    .padEnd(10, '0');
}
