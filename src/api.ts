import type {
  ChatAttachment,
  ChatMessage,
  ChatStreamEvent,
  JoinResponse,
  MarketingStats,
  MeetingRoom,
  AdmissionStreamEvent,
  RoomAdmissionRequest,
  RoomJoinResponse,
  RoomInvitation,
  Session,
  Team,
  WidgetRoomResponse,
} from './types';

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

export async function resolveWidgetRoom(input: {
  contextId: string;
  displayName: string;
  title?: string;
}): Promise<WidgetRoomResponse> {
  const response = await api<WidgetRoomResponse>('/widget/rooms/resolve', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  saveSession(response.session);
  return response;
}

export async function getRoom(slug: string): Promise<{ room: MeetingRoom }> {
  return api<{ room: MeetingRoom }>(`/rooms/${slug}`);
}

export async function joinRoom(slug: string, displayName: string): Promise<RoomJoinResponse> {
  const response = await api<RoomJoinResponse>(`/rooms/${slug}/join`, {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });

  if (response.sessionToken) {
    saveSession({ identity: response.identity, token: response.sessionToken });
  }

  return response;
}

export async function getRoomAdmissionStatus(
  slug: string,
  requestId: string,
): Promise<{ request: RoomAdmissionRequest }> {
  return api<{ request: RoomAdmissionRequest }>(`/rooms/${slug}/admissions/${requestId}`);
}

export async function listRoomAdmissions(slug: string): Promise<{ requests: RoomAdmissionRequest[] }> {
  return api<{ requests: RoomAdmissionRequest[] }>(`/rooms/${slug}/admissions`);
}

export async function resolveRoomAdmission(
  slug: string,
  requestId: string,
  decision: 'approved' | 'rejected',
): Promise<{ request: RoomAdmissionRequest }> {
  return api<{ request: RoomAdmissionRequest }>(`/rooms/${slug}/admissions/${requestId}`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  });
}

export function subscribeRoomAdmissions(
  slug: string,
  onEvent: (event: AdmissionStreamEvent) => void,
  onError?: () => void,
): () => void {
  const session = loadSession();
  const tokenParam = session ? `?token=${encodeURIComponent(session.token)}` : '';
  const source = new EventSource(createApiUrl(`/rooms/${slug}/admissions/stream${tokenParam}`));

  source.addEventListener('snapshot', (event) => {
    onEvent({ type: 'snapshot', payload: JSON.parse(event.data) });
  });
  source.addEventListener('requested', (event) => {
    onEvent({ type: 'requested', payload: JSON.parse(event.data) });
  });
  source.addEventListener('resolved', (event) => {
    onEvent({ type: 'resolved', payload: JSON.parse(event.data) });
  });
  source.onerror = () => {
    onError?.();
  };

  return () => source.close();
}

export async function leaveRoom(slug: string, keepalive = false): Promise<void> {
  await api<void>(`/rooms/${slug}/leave`, {
    method: 'POST',
    keepalive,
  });
}

export async function getMarketingStats(): Promise<{ stats: MarketingStats }> {
  return api<{ stats: MarketingStats }>('/stats/marketing');
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
  source.addEventListener('typing', (event) => {
    onEvent({ type: 'typing', payload: JSON.parse(event.data) });
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

export async function setRoomChatTyping(slug: string, typing: boolean): Promise<void> {
  await api<void>(`/rooms/${slug}/chat/typing`, {
    method: 'POST',
    body: JSON.stringify({ typing }),
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

export async function listRoomInvitations(slug: string): Promise<{ invitations: RoomInvitation[] }> {
  return api<{ invitations: RoomInvitation[] }>(`/rooms/${slug}/invitations`);
}

export async function sendRoomInvitations(
  slug: string,
  input: { emails: string; scheduledAt?: string; note?: string },
): Promise<{ invitations: RoomInvitation[]; smtpConfigured: boolean }> {
  return api<{ invitations: RoomInvitation[]; smtpConfigured: boolean }>(`/rooms/${slug}/invitations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
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

export async function addTeamMembers(teamId: string, emails: string): Promise<{ team: Team }> {
  return api<{ team: Team }>(`/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify({ emails }),
  });
}

export async function deleteTeam(teamId: string): Promise<{ team: Team }> {
  return api<{ team: Team }>(`/teams/${teamId}`, {
    method: 'DELETE',
  });
}

export async function createTeamRoom(
  teamId: string,
  title: string,
  options: { inviteTeamMembers?: boolean; scheduledAt?: string; note?: string } = {},
): Promise<{ room: MeetingRoom; url: string; invitations: RoomInvitation[]; smtpConfigured: boolean }> {
  return api<{ room: MeetingRoom; url: string; invitations: RoomInvitation[]; smtpConfigured: boolean }>(`/teams/${teamId}/rooms`, {
    method: 'POST',
    body: JSON.stringify({ title, ...options }),
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
