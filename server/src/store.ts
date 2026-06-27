import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type {
  ChatMessage,
  Identity,
  MeetingParticipant,
  MeetingParticipantSession,
  MeetingRoom,
  MarketingStats,
  RoomInvitation,
  RoomInvitationDeliveryStatus,
  RoomAdmissionRequest,
  RoomAdmissionStatus,
  Team,
  WidgetRoomContext,
} from './domain.js';
import { calculateParticipantHours, isTeamMember, normalizeTeamMemberEmails } from './domain.js';

export type RoomChatEvent =
  | { type: 'message'; roomId: string; message: ChatMessage }
  | { type: 'blocked'; roomId: string; blockedIdentityIds: string[] }
  | { type: 'typing'; roomId: string; identityId: string; displayName: string; typing: boolean };

export type RoomAdmissionEvent =
  | { type: 'requested'; roomId: string; request: RoomAdmissionRequest }
  | { type: 'resolved'; roomId: string; request: RoomAdmissionRequest };

export type AppState = {
  identities: Identity[];
  rooms: MeetingRoom[];
  teams: Team[];
  participants: MeetingParticipant[];
  participantSessions: MeetingParticipantSession[];
  chatMessages: ChatMessage[];
  chatBlockedIdentityIds: Record<string, string[]>;
  roomInvitations: RoomInvitation[];
  roomAdmissionRequests: RoomAdmissionRequest[];
  widgetRoomContexts: WidgetRoomContext[];
};

const emptyState: AppState = {
  identities: [],
  rooms: [],
  teams: [],
  participants: [],
  participantSessions: [],
  chatMessages: [],
  chatBlockedIdentityIds: {},
  roomInvitations: [],
  roomAdmissionRequests: [],
  widgetRoomContexts: [],
};

export class JsonStore {
  private state: AppState = structuredClone(emptyState);
  private readonly roomChatListeners = new Map<string, Set<(event: RoomChatEvent) => void>>();
  private readonly roomAdmissionListeners = new Map<string, Set<(event: RoomAdmissionEvent) => void>>();

  constructor(private readonly filePath: string) {}

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      this.state = { ...structuredClone(emptyState), ...JSON.parse(raw) };
      this.state.teams = this.state.teams.map((team) => ({
        ...team,
        memberEmails: normalizeTeamMemberEmails(team.memberEmails || []),
      }));
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

  listTeamsForIdentity(identity: Identity | string): Team[] {
    if (typeof identity === 'string') {
      return this.state.teams.filter((team) => team.memberIdentityIds.includes(identity));
    }

    return this.state.teams.filter((team) => isTeamMember(team, identity));
  }

  listRoomsForTeam(teamId: string): MeetingRoom[] {
    return this.state.rooms.filter((room) => room.teamId === teamId);
  }

  listParticipantsForRoom(roomId: string): MeetingParticipant[] {
    return this.state.participants.filter((participant) => participant.roomId === roomId);
  }

  listActiveParticipantSessionsForRoom(roomId: string): MeetingParticipantSession[] {
    return this.state.participantSessions.filter((session) => session.roomId === roomId && !session.leftAt);
  }

  getMarketingStats(now = new Date().toISOString()): MarketingStats {
    const uniqueJoinedIdentityIds = new Set([
      ...this.state.participants.map((participant) => participant.identityId),
      ...this.state.participantSessions.map((session) => session.identityId),
    ]);

    return {
      meetingsCreated: this.state.rooms.length,
      teamsCreated: this.state.teams.length,
      usersJoined: uniqueJoinedIdentityIds.size,
      participantHours: calculateParticipantHours(this.state.participantSessions, now),
    };
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

  listRoomInvitations(roomId: string): RoomInvitation[] {
    return this.state.roomInvitations
      .filter((invitation) => invitation.roomId === roomId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listRoomAdmissionRequests(roomId: string): RoomAdmissionRequest[] {
    return this.state.roomAdmissionRequests
      .filter((request) => request.roomId === roomId)
      .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  }

  findRoomAdmissionRequest(requestId: string): RoomAdmissionRequest | undefined {
    return this.state.roomAdmissionRequests.find((request) => request.id === requestId);
  }

  findWidgetRoomContext(contextId: string): WidgetRoomContext | undefined {
    return this.state.widgetRoomContexts.find((context) => context.contextId === contextId);
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

  subscribeRoomAdmissions(roomId: string, listener: (event: RoomAdmissionEvent) => void): () => void {
    const listeners = this.roomAdmissionListeners.get(roomId) || new Set<(event: RoomAdmissionEvent) => void>();
    listeners.add(listener);
    this.roomAdmissionListeners.set(roomId, listeners);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.roomAdmissionListeners.delete(roomId);
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
    this.state.teams.push({
      ...team,
      memberEmails: normalizeTeamMemberEmails(team.memberEmails || []),
    });
    await this.save();
    return team;
  }

  async addTeamMemberEmails(teamId: string, emails: string[]): Promise<Team> {
    const team = this.state.teams.find((saved) => saved.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    team.memberEmails = normalizeTeamMemberEmails([...(team.memberEmails || []), ...emails]);
    await this.save();
    return structuredClone(team);
  }

  async deleteTeam(teamId: string): Promise<Team> {
    const team = this.state.teams.find((saved) => saved.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const removedRoomIds = new Set(
      this.state.rooms
        .filter((room) => room.teamId === teamId)
        .map((room) => room.id),
    );

    this.state.teams = this.state.teams.filter((saved) => saved.id !== teamId);
    this.state.rooms = this.state.rooms.filter((room) => room.teamId !== teamId);
    this.state.participants = this.state.participants.filter((participant) => !removedRoomIds.has(participant.roomId));
    this.state.participantSessions = this.state.participantSessions.filter((session) => !removedRoomIds.has(session.roomId));
    this.state.chatMessages = this.state.chatMessages.filter((message) => !removedRoomIds.has(message.roomId));
    this.state.roomInvitations = this.state.roomInvitations.filter((invitation) => !removedRoomIds.has(invitation.roomId));
    this.state.roomAdmissionRequests = this.state.roomAdmissionRequests.filter((request) => !removedRoomIds.has(request.roomId));

    for (const roomId of removedRoomIds) {
      delete this.state.chatBlockedIdentityIds[roomId];
      this.roomChatListeners.delete(roomId);
      this.roomAdmissionListeners.delete(roomId);
    }

    await this.save();
    return structuredClone(team);
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

  async startParticipantSession(session: MeetingParticipantSession): Promise<MeetingParticipantSession> {
    this.state.participantSessions.push(session);
    await this.save();
    return structuredClone(session);
  }

  async endActiveParticipantSession(
    roomId: string,
    identityId: string,
    leftAt = new Date().toISOString(),
  ): Promise<MeetingParticipantSession | undefined> {
    const session = [...this.state.participantSessions]
      .reverse()
      .find((saved) => saved.roomId === roomId && saved.identityId === identityId && !saved.leftAt);

    if (!session) {
      return undefined;
    }

    session.leftAt = leftAt;
    await this.save();
    return structuredClone(session);
  }

  async upsertRoomAdmissionRequest(request: RoomAdmissionRequest): Promise<RoomAdmissionRequest> {
    const existingIndex = this.state.roomAdmissionRequests.findIndex(
      (saved) => saved.roomId === request.roomId
        && saved.identityId === request.identityId
        && saved.status === 'pending',
    );

    if (existingIndex >= 0) {
      this.state.roomAdmissionRequests[existingIndex] = {
        ...this.state.roomAdmissionRequests[existingIndex],
        displayName: request.displayName,
        requestedAt: request.requestedAt,
      };
      await this.save();
      return structuredClone(this.state.roomAdmissionRequests[existingIndex]);
    }

    this.state.roomAdmissionRequests.push(request);
    await this.save();
    this.emitRoomAdmissionEvent({ type: 'requested', roomId: request.roomId, request: structuredClone(request) });
    return structuredClone(request);
  }

  async resolveRoomAdmissionRequest(
    roomId: string,
    requestId: string,
    status: Exclude<RoomAdmissionStatus, 'pending'>,
    resolvedByIdentityId: string,
  ): Promise<RoomAdmissionRequest> {
    const request = this.state.roomAdmissionRequests.find(
      (saved) => saved.roomId === roomId && saved.id === requestId,
    );
    if (!request) {
      throw new Error('Admission request not found');
    }

    request.status = status;
    request.resolvedAt = new Date().toISOString();
    request.resolvedByIdentityId = resolvedByIdentityId;
    await this.save();
    const cloned = structuredClone(request);
    this.emitRoomAdmissionEvent({ type: 'resolved', roomId, request: cloned });
    return cloned;
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

  async addRoomInvitation(invitation: RoomInvitation): Promise<RoomInvitation> {
    this.state.roomInvitations.push(invitation);
    await this.save();
    return invitation;
  }

  async updateRoomInvitationDelivery(
    invitationId: string,
    deliveryStatus: RoomInvitationDeliveryStatus,
    deliveryError?: string,
  ): Promise<RoomInvitation> {
    const invitation = this.state.roomInvitations.find((saved) => saved.id === invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    invitation.deliveryStatus = deliveryStatus;
    invitation.deliveryError = deliveryError;
    await this.save();
    return structuredClone(invitation);
  }

  async addWidgetRoomContext(context: WidgetRoomContext): Promise<WidgetRoomContext> {
    const existingIndex = this.state.widgetRoomContexts.findIndex((saved) => saved.contextId === context.contextId);
    if (existingIndex >= 0) {
      this.state.widgetRoomContexts[existingIndex] = context;
    } else {
      this.state.widgetRoomContexts.push(context);
    }

    await this.save();
    return structuredClone(context);
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

  private emitRoomAdmissionEvent(event: RoomAdmissionEvent): void {
    const listeners = this.roomAdmissionListeners.get(event.roomId);
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
