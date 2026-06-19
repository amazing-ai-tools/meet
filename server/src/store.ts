import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { Identity, MeetingParticipant, MeetingRoom, Team } from './domain.js';

export type AppState = {
  identities: Identity[];
  rooms: MeetingRoom[];
  teams: Team[];
  participants: MeetingParticipant[];
};

const emptyState: AppState = {
  identities: [],
  rooms: [],
  teams: [],
  participants: [],
};

export class JsonStore {
  private state: AppState = structuredClone(emptyState);

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

  private async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(this.state, null, 2)}\n`);
  }
}
