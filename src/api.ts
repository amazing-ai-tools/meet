import type { JoinResponse, MeetingRoom, Session, Team } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const SESSION_KEY = 'meetteams.session';

export function loadSession(): Session | undefined {
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : undefined;
}

export function saveSession(session: Session): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function createGuestSession(displayName: string): Promise<Session> {
  const session = await api<Session>('/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });
  saveSession(session);
  return session;
}

export async function createGoogleSession(credential: string): Promise<Session> {
  const session = await api<Session>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  saveSession(session);
  return session;
}

export async function createInstantRoom(title: string, displayName: string): Promise<{
  room: MeetingRoom;
  host: Session['identity'];
  url: string;
  sessionToken?: string;
}> {
  const response = await api<{
    room: MeetingRoom;
    host: Session['identity'];
    url: string;
    sessionToken?: string;
  }>('/rooms/instant', {
    method: 'POST',
    body: JSON.stringify({ title, displayName }),
  });

  if (response.sessionToken) {
    saveSession({ identity: response.host, token: response.sessionToken });
  }

  return response;
}

export async function getRoom(slug: string): Promise<{ room: MeetingRoom }> {
  return api<{ room: MeetingRoom }>(`/rooms/${slug}`);
}

export async function joinRoom(slug: string, displayName: string): Promise<JoinResponse> {
  const response = await api<JoinResponse>(`/rooms/${slug}/join`, {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });

  if (response.sessionToken) {
    saveSession({ identity: response.identity, token: response.sessionToken });
  }

  return response;
}

export async function listTeams(): Promise<{ teams: Team[] }> {
  return api<{ teams: Team[] }>('/teams');
}

export async function createTeam(name: string): Promise<{ team: Team }> {
  return api<{ team: Team }>('/teams', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createTeamRoom(teamId: string, title: string): Promise<{ room: MeetingRoom; url: string }> {
  return api<{ room: MeetingRoom; url: string }>(`/teams/${teamId}/rooms`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function listTeamRooms(teamId: string): Promise<{ rooms: MeetingRoom[] }> {
  return api<{ rooms: MeetingRoom[] }>(`/teams/${teamId}/rooms`);
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = loadSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
