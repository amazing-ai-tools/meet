import type { ChatAttachment, ChatMessage, ChatStreamEvent, JoinResponse, MeetingRoom, Session, Team } from './types';

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

export async function getAppConfig(): Promise<{ googleClientId: string }> {
  return api<{ googleClientId: string }>('/config');
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

export async function listRoomChat(slug: string): Promise<{
  messages: ChatMessage[];
  blockedIdentityIds: string[];
}> {
  return api<{ messages: ChatMessage[]; blockedIdentityIds: string[] }>(`/rooms/${slug}/chat`);
}

export function subscribeRoomChat(
  slug: string,
  onEvent: (event: ChatStreamEvent) => void,
  onError?: () => void,
): () => void {
  const source = new EventSource(createApiUrl(`/rooms/${slug}/chat/stream`));

  source.addEventListener('snapshot', (event) => {
    onEvent({ type: 'snapshot', payload: JSON.parse(event.data) });
  });
  source.addEventListener('message', (event) => {
    onEvent({ type: 'message', payload: JSON.parse(event.data) });
  });
  source.addEventListener('blocked', (event) => {
    onEvent({ type: 'blocked', payload: JSON.parse(event.data) });
  });
  source.onerror = () => {
    onError?.();
  };

  return () => source.close();
}

export async function sendRoomChatMessage(
  slug: string,
  input: { text?: string; attachment?: Omit<ChatAttachment, 'id' | 'kind'> },
): Promise<{ message: ChatMessage }> {
  return api<{ message: ChatMessage }>(`/rooms/${slug}/chat`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function moderateRoomParticipant(
  slug: string,
  input:
    | { action: 'mute'; targetIdentityId: string; trackSid?: string }
    | { action: 'remove' | 'block-chat' | 'unblock-chat'; targetIdentityId: string },
): Promise<{ ok: true; action: string; blockedIdentityIds?: string[]; muted?: boolean; trackSid?: string }> {
  return api<{ ok: true; action: string; blockedIdentityIds?: string[]; muted?: boolean; trackSid?: string }>(
    `/rooms/${slug}/moderation`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
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
  const response = await fetch(createApiUrl(path), {
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

function createApiUrl(path: string): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return new URL(`${base}${path}`, window.location.origin).toString();
}
