import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { ChatMessage, Identity, MeetingParticipant, MeetingRoom, Team } from './domain.js';

export type RoomChatEvent =
  | { type: 'message'; roomId: string; message: ChatMessage }
  | { type: 'blocked'; roomId: string; blockedIdentityIds: string[] }
  | { type: 'typing'; roomId: string; identityId: string; displayName: string; typing: boolean };

export type AppState = {
  identities: Identity[];
  rooms: MeetingRoom[];
  teams: Team[];
  participants: MeetingParticipant[];
  chatMessages: ChatMessage[];
  chatBlockedIdentityIds: Record<string, string[]>;
};

const emptyState: AppState = {
  identities: [],
  rooms: [],
  teams: [],
  participants: [],
  chatMessages: [],
  chatBlockedIdentityIds: {},
};

export class JsonStore {
  private state: AppState = structuredClone(emptyState);
  private readonly roomChatListeners = new Map<string, Set<(event: RoomChatEvent) => void>>();

  constructor(private readonly filePath: string) {}

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      this.state = { ...structuredClone(emptyState), ...JSON.parse(raw) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }

      await this.save();
    }
  }

  snapshot(): AppState {
    return structuredClone(this.state);
  }

  findIdentity(id: string): Identity | undefined {
    return this.state.identities.find((identity) => identity.id === id);
  }

  findRoomBySlug(slug: string): MeetingRoom | undefined {
    return this.state.rooms.find((room) => room.slug === slug);
  }

  findRoomById(id: string): MeetingRoom | undefined {
    return this.state.rooms.find((room) => room.id === id);
  }

  findTeam(id: string): Team | undefined {
    return this.state.teams.find((team) => team.id === id);
  }

  listTeamsForIdentity(identityId: string): Team[] {
    return this.state.teams.filter((team) => team.memberIdentityIds.includes(identityId));
  }

  listRoomsForTeam(teamId: string): MeetingRoom[] {
    return this.state.rooms.filter((room) => room.teamId === teamId);
  }

  listParticipantsForRoom(roomId: string): MeetingParticipant[] {
    return this.state.participants.filter((participant) => participant.roomId === roomId);
  }

  listChatMessagesForRoom(roomId: string): ChatMessage[] {
    return this.state.chatMessages
      .filter((message) => message.roomId === roomId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-200);
  }

  listChatBlockedIdentityIds(roomId: string): string[] {
    return [...(this.state.chatBlockedIdentityIds[roomId] || [])];
  }

  subscribeRoomChat(roomId: string, listener: (event: RoomChatEvent) => void): () => void {
    const listeners = this.roomChatListeners.get(roomId) || new Set<(event: RoomChatEvent) => void>();
    listeners.add(listener);
    this.roomChatListeners.set(roomId, listeners);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.roomChatListeners.delete(roomId);
      }
    };
  }

  async upsertIdentity(identity: Identity): Promise<Identity> {
    const index = this.state.identities.findIndex((saved) => saved.id === identity.id);
    if (index >= 0) {
      this.state.identities[index] = identity;
    } else {
      this.state.identities.push(identity);
    }

    await this.save();
    return identity;
  }

  async addRoom(room: MeetingRoom): Promise<MeetingRoom> {
    this.state.rooms.push(room);
    await this.save();
    return room;
  }

  async addTeam(team: Team): Promise<Team> {
    this.state.teams.push(team);
    await this.save();
    return team;
  }

  async addParticipant(participant: MeetingParticipant): Promise<MeetingParticipant> {
    const existingIndex = this.state.participants.findIndex(
      (saved) => saved.roomId === participant.roomId && saved.identityId === participant.identityId,
    );

    if (existingIndex >= 0) {
      this.state.participants[existingIndex] = participant;
    } else {
      this.state.participants.push(participant);
    }

    await this.save();
    return participant;
  }

  async addChatMessage(message: ChatMessage): Promise<ChatMessage> {
    this.state.chatMessages.push(message);
    this.state.chatMessages = this.state.chatMessages.slice(-1000);
    await this.save();
    this.emitRoomChatEvent({ type: 'message', roomId: message.roomId, message });
    return message;
  }

  async setChatBlocked(roomId: string, identityId: string, blocked: boolean): Promise<string[]> {
    const blockedSet = new Set(this.state.chatBlockedIdentityIds[roomId] || []);
    if (blocked) {
      blockedSet.add(identityId);
    } else {
      blockedSet.delete(identityId);
    }

    const blockedIds = [...blockedSet];
    this.state.chatBlockedIdentityIds[roomId] = blockedIds;
    await this.save();
    this.emitRoomChatEvent({ type: 'blocked', roomId, blockedIdentityIds: blockedIds });
    return blockedIds;
  }

  setChatTyping(roomId: string, identityId: string, displayName: string, typing: boolean): void {
    this.emitRoomChatEvent({
      type: 'typing',
      roomId,
      identityId,
      displayName,
      typing,
    });
  }

  private emitRoomChatEvent(event: RoomChatEvent): void {
    const listeners = this.roomChatListeners.get(event.roomId);
    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(event);
    }
  }

  private async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(this.state, null, 2)}\n`);
  }
}
