import express, { type Request, type Response } from 'express';

import {
  canHostControlParticipant,
  canSendChatMessage,
  createChatMessage,
  createInstantRoom,
  createParticipant,
  createParticipantSession,
  createRoomAdmissionRequest,
  createRoomInvitation,
  createTeam,
  createTeamRoom,
  isTeamMember,
  normalizeWidgetContextId,
  resolveRoomAdmissionPolicy,
  type Identity,
  type MeetingRoom,
  type RoomInvitation,
  type MeetingParticipant,
} from './domain.js';
import {
  createGuestSession,
  readBearerToken,
  signSession,
  verifyGoogleIdentity,
  verifySession,
  type AuthConfig,
} from './auth.js';
import {
  createLiveKitJoinToken,
  defaultLiveKitUrl,
  muteLiveKitParticipantMicrophone,
  removeLiveKitParticipant,
  type LiveKitConfig,
} from './livekit.js';
import { readSmtpConfig, sendInvitationEmail } from './invitations.js';
import { JsonStore } from './store.js';

const port = Number(process.env.PORT || 8787);
const publicOrigin = process.env.PUBLIC_ORIGIN || 'https://meet.app.amazing-ai.tools';
const dataPath = process.env.MEETTEAMS_DATA_PATH || './data/meetteams.json';

const authConfig: AuthConfig = {
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
};

const liveKitConfig: LiveKitConfig = {
  url: process.env.LIVEKIT_URL || defaultLiveKitUrl,
  apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
  apiSecret: process.env.LIVEKIT_API_SECRET || 'secret',
};
const smtpConfig = readSmtpConfig();

const store = new JsonStore(dataPath);
const app = express();

app.use(express.json({ limit: '8mb' }));
app.use((request, response, next) => {
  const origin = request.header('origin');
  if (origin && (origin === publicOrigin || origin.endsWith('.amazing-ai.tools'))) {
    response.header('Access-Control-Allow-Origin', origin);
  }
  response.header('Vary', 'Origin');
  response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }
  next();
});

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'meetteams-backend',
    livekitConfigured: Boolean(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET),
    googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
  });
});

app.get('/api/config', (_request, response) => {
  response.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});

app.post('/api/auth/guest', async (request, response, next) => {
  try {
    const { displayName } = request.body as { displayName?: string };
    const session = createGuestSession(displayName || 'Guest', authConfig);
    await store.upsertIdentity(session.identity);
    response.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/google', async (request, response, next) => {
  try {
    const { credential } = request.body as { credential?: string };
    if (!credential) {
      response.status(400).json({ error: 'Google credential is required' });
      return;
    }

    const session = await verifyGoogleIdentity(credential, authConfig);
    await store.upsertIdentity(session.identity);
    response.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

app.get('/api/me', withIdentity(false, (request, response, identity) => {
  response.json({ identity });
}));

app.post('/api/rooms/instant', withIdentity(false, async (request, response, identity) => {
  const title = readString(request.body?.title, 'Reuniao amazing-ai meet');
  const host = identity || (await createAndSaveGuest(readString(request.body?.displayName, 'Host')));
  const room = await store.addRoom(createInstantRoom(host, title));

  response.status(201).json({
    room,
    host,
    url: `${publicOrigin}/r/${room.slug}`,
    sessionToken: identity ? undefined : signInMemoryGuest(host),
  });
}));

app.post('/api/widget/rooms/resolve', async (request, response, next) => {
  try {
    const contextId = normalizeWidgetContextId(readString(request.body?.contextId, ''));
    const displayName = readString(request.body?.displayName, 'Guest');
    const title = readString(request.body?.title, `Widget ${contextId}`);
    const existingContext = store.findWidgetRoomContext(contextId);
    let room = existingContext ? store.findRoomById(existingContext.roomId) : undefined;
    let host: Identity | undefined = room ? store.findIdentity(room.hostIdentityId) : undefined;

    if (!room || !host) {
      host = await createAndSaveGuest(`Widget ${contextId}`);
      room = await store.addRoom(createInstantRoom(host, title));
      await store.addWidgetRoomContext({
        contextId,
        roomId: room.id,
        createdAt: new Date().toISOString(),
      });
    }

    const session = createGuestSession(displayName, authConfig);
    await store.upsertIdentity(session.identity);
    const participant = await store.addParticipant(createParticipant(room, session.identity));
    await store.startParticipantSession(createParticipantSession(room, participant));
    const livekit = await createLiveKitJoinToken(liveKitConfig, room, session.identity, participant);

    response.status(201).json({
      contextId,
      room,
      roomUrl: `${publicOrigin}/r/${room.slug}`,
      session,
      participant,
      livekit,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/rooms/:slug', (request, response) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  response.json({
    room,
    participants: store.listParticipantsForRoom(room.id),
  });
});

app.post('/api/rooms/:slug/join', withIdentity(false, async (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  const joinedIdentity = identity || (await createAndSaveGuest(readString(request.body?.displayName, 'Guest')));
  const activeSessions = store.listActiveParticipantSessionsForRoom(room.id);
  const existingParticipant = store
    .listParticipantsForRoom(room.id)
    .find((participant) => participant.identityId === joinedIdentity.id);
  const admissionPolicy = resolveRoomAdmissionPolicy(
    room,
    joinedIdentity,
    activeSessions,
    store.listRoomAdmissionRequests(room.id),
  );

  if (!existingParticipant && admissionPolicy.decision === 'request') {
    const admissionRequest = await store.upsertRoomAdmissionRequest(createRoomAdmissionRequest(room, joinedIdentity));
    response.status(202).json({
      status: 'waiting',
      room,
      identity: joinedIdentity,
      request: admissionRequest,
      sessionToken: identity ? undefined : signInMemoryGuest(joinedIdentity),
    });
    return;
  }

  response.status(201).json(await createJoinPayload(room, joinedIdentity, identity ? undefined : signInMemoryGuest(joinedIdentity)));
}));

app.get('/api/rooms/:slug/admissions/stream', async (request, response) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  const token = typeof request.query.token === 'string' ? request.query.token : undefined;
  if (!token) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }

  let identityId: string;
  try {
    identityId = verifySession(token, authConfig.sessionSecret).identityId;
  } catch {
    response.status(401).json({ error: 'Invalid session token' });
    return;
  }

  if (!isActiveRoomParticipant(room.id, identityId)) {
    response.status(403).json({ error: 'Only participants in the room can approve entry requests' });
    return;
  }

  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  writeServerSentEvent(response, 'snapshot', {
    requests: store
      .listRoomAdmissionRequests(room.id)
      .filter((admissionRequest) => admissionRequest.status === 'pending'),
  });

  const unsubscribe = store.subscribeRoomAdmissions(room.id, (event) => {
    writeServerSentEvent(response, event.type, event);
  });
  const heartbeat = windowlessSetInterval(() => {
    response.write(': keepalive\n\n');
  }, 25000);

  request.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    response.end();
  });
});

app.get('/api/rooms/:slug/admissions/:requestId', withIdentity(true, async (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  const admissionRequest = store.findRoomAdmissionRequest(request.params.requestId);
  if (!admissionRequest || admissionRequest.roomId !== room.id || admissionRequest.identityId !== identity!.id) {
    response.status(404).json({ error: 'Admission request not found' });
    return;
  }

  response.json({ request: admissionRequest });
}));

app.get('/api/rooms/:slug/admissions', withIdentity(true, async (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  if (!isActiveRoomParticipant(room.id, identity!.id)) {
    response.status(403).json({ error: 'Only participants in the room can approve entry requests' });
    return;
  }

  response.json({
    requests: store
      .listRoomAdmissionRequests(room.id)
      .filter((admissionRequest) => admissionRequest.status === 'pending'),
  });
}));

app.post('/api/rooms/:slug/admissions/:requestId', withIdentity(true, async (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  if (!isActiveRoomParticipant(room.id, identity!.id)) {
    response.status(403).json({ error: 'Only participants in the room can approve entry requests' });
    return;
  }

  const decision = request.body?.decision === 'approved' ? 'approved' : request.body?.decision === 'rejected' ? 'rejected' : undefined;
  if (!decision) {
    response.status(400).json({ error: 'Admission decision must be approved or rejected' });
    return;
  }

  const admissionRequest = await store.resolveRoomAdmissionRequest(room.id, request.params.requestId, decision, identity!.id);
  response.json({ request: admissionRequest });
}));

app.post('/api/rooms/:slug/leave', withIdentity(true, async (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  const session = await store.endActiveParticipantSession(room.id, identity!.id);
  response.json({ ok: true, session });
}));

app.get('/api/rooms/:slug/chat', (request, response) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  response.json({
    messages: store.listChatMessagesForRoom(room.id),
    blockedIdentityIds: store.listChatBlockedIdentityIds(room.id),
  });
});

app.get('/api/rooms/:slug/chat/stream', (request, response) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  writeServerSentEvent(response, 'snapshot', {
    messages: store.listChatMessagesForRoom(room.id),
    blockedIdentityIds: store.listChatBlockedIdentityIds(room.id),
  });

  const unsubscribe = store.subscribeRoomChat(room.id, (event) => {
    writeServerSentEvent(response, event.type, event);
  });
  const heartbeat = windowlessSetInterval(() => {
    response.write(': keepalive\n\n');
  }, 25000);

  request.on('close', () => {
    unsubscribe();
    clearInterval(heartbeat);
    response.end();
  });
});

app.post('/api/rooms/:slug/chat/typing', withIdentity(true, async (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  store.setChatTyping(room.id, identity!.id, identity!.displayName, Boolean(request.body?.typing));
  response.status(204).end();
}));

app.post('/api/rooms/:slug/chat', withIdentity(true, async (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  const blockedIdentityIds = store.listChatBlockedIdentityIds(room.id);
  if (!canSendChatMessage(room, identity!, blockedIdentityIds)) {
    response.status(403).json({ error: 'You are blocked from sending chat messages in this room' });
    return;
  }

  const message = await store.addChatMessage(createChatMessage(room, identity!, {
    text: readOptionalString(request.body?.text),
    attachment: request.body?.attachment,
  }));
  response.status(201).json({ message });
}));

app.post('/api/rooms/:slug/moderation', withIdentity(true, async (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  const action = readString(request.body?.action, '');
  const targetIdentityId = readString(request.body?.targetIdentityId, '');
  if (!canHostControlParticipant(room, identity!, targetIdentityId)) {
    response.status(403).json({ error: 'Only the host can moderate other participants' });
    return;
  }

  if (action === 'remove') {
    await removeLiveKitParticipant(liveKitConfig, room.slug, targetIdentityId);
    response.json({ ok: true, action });
    return;
  }

  if (action === 'mute') {
    const result = await muteLiveKitParticipantMicrophone(
      liveKitConfig,
      room.slug,
      targetIdentityId,
      readOptionalString(request.body?.trackSid),
    );
    response.json({ ok: true, action, ...result });
    return;
  }

  if (action === 'block-chat' || action === 'unblock-chat') {
    const blockedIdentityIds = await store.setChatBlocked(room.id, targetIdentityId, action === 'block-chat');
    response.json({ ok: true, action, blockedIdentityIds });
    return;
  }

  response.status(400).json({ error: 'Unsupported moderation action' });
}));

app.get('/api/rooms/:slug/invitations', withIdentity(true, (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  if (room.hostIdentityId !== identity!.id) {
    response.status(403).json({ error: 'Only the host can list invitations' });
    return;
  }

  response.json({ invitations: store.listRoomInvitations(room.id) });
}));

app.post('/api/rooms/:slug/invitations', withIdentity(true, async (request, response, identity) => {
  const room = store.findRoomBySlug(request.params.slug);
  if (!room) {
    response.status(404).json({ error: 'Room not found' });
    return;
  }

  if (room.hostIdentityId !== identity!.id) {
    response.status(403).json({ error: 'Only the host can send invitations' });
    return;
  }

  const emails = readEmailList(request.body?.emails);
  if (emails.length === 0) {
    response.status(400).json({ error: 'At least one email is required' });
    return;
  }

  const scheduledAt = readOptionalString(request.body?.scheduledAt);
  const note = readOptionalString(request.body?.note);
  const invitations = await createAndDeliverRoomInvitations(room, identity!, emails, { scheduledAt, note });

  response.status(201).json({
    invitations,
    smtpConfigured: isSmtpConfigured(),
  });
}));

app.get('/api/teams', withIdentity(true, (request, response, identity) => {
  response.json({ teams: store.listTeamsForIdentity(identity!) });
}));

app.post('/api/teams', withIdentity(true, async (request, response, identity) => {
  const team = await store.addTeam(createTeam(identity!, readString(request.body?.name, 'Meu time')));
  response.status(201).json({ team });
}));

app.post('/api/teams/:teamId/members', withIdentity(true, async (request, response, identity) => {
  const team = store.findTeam(request.params.teamId);
  if (!team || !isTeamMember(team, identity!)) {
    response.status(404).json({ error: 'Team not found' });
    return;
  }

  const emails = readEmailList(request.body?.emails);
  if (emails.length === 0) {
    response.status(400).json({ error: 'At least one email is required' });
    return;
  }

  const updatedTeam = await store.addTeamMemberEmails(team.id, emails);
  response.json({ team: updatedTeam });
}));

app.delete('/api/teams/:teamId', withIdentity(true, async (request, response, identity) => {
  const team = store.findTeam(request.params.teamId);
  if (!team || !isTeamMember(team, identity!)) {
    response.status(404).json({ error: 'Team not found' });
    return;
  }

  if (team.ownerIdentityId !== identity!.id) {
    response.status(403).json({ error: 'Only the team owner can delete this team' });
    return;
  }

  const deletedTeam = await store.deleteTeam(team.id);
  response.json({ team: deletedTeam });
}));

app.post('/api/teams/:teamId/rooms', withIdentity(true, async (request, response, identity) => {
  const team = store.findTeam(request.params.teamId);
  if (!team || !isTeamMember(team, identity!)) {
    response.status(404).json({ error: 'Team not found' });
    return;
  }

  const room = await store.addRoom(createTeamRoom(team, identity!, readString(request.body?.title, 'Sala persistente')));
  const teamMemberEmails = team.memberEmails.filter((email) => email !== identity!.email?.toLowerCase());
  const invitations = request.body?.inviteTeamMembers
    ? await createAndDeliverRoomInvitations(room, identity!, teamMemberEmails, {
        scheduledAt: readOptionalString(request.body?.scheduledAt),
        note: readOptionalString(request.body?.note),
      })
    : [];

  response.status(201).json({
    room,
    url: `${publicOrigin}/r/${room.slug}`,
    invitations,
    smtpConfigured: isSmtpConfigured(),
  });
}));

app.get('/api/teams/:teamId/rooms', withIdentity(true, (request, response, identity) => {
  const team = store.findTeam(request.params.teamId);
  if (!team || !isTeamMember(team, identity!)) {
    response.status(404).json({ error: 'Team not found' });
    return;
  }

  response.json({ rooms: store.listRoomsForTeam(team.id) });
}));

app.get('/api/stats/marketing', (_request, response) => {
  response.json({ stats: store.getMarketingStats() });
});

app.use((error: Error, _request: Request, response: Response, _next: unknown) => {
  const status = /required|invalid|must|only/i.test(error.message) ? 400 : 500;
  response.status(status).json({ error: error.message });
});

await store.load();
app.listen(port, () => {
  console.log(`amazing-ai meet backend listening on ${port}`);
});

function withIdentity(
  required: boolean,
  handler: (request: Request, response: Response, identity?: Identity) => void | Promise<void>,
): express.RequestHandler {
  return async (request, response, next) => {
    try {
      const token = readBearerToken(request.header('authorization'));
      const identity = token ? resolveIdentity(token) : undefined;
      if (required && !identity) {
        response.status(401).json({ error: 'Login is required' });
        return;
      }

      await handler(request, response, identity);
    } catch (error) {
      next(error);
    }
  };
}

function resolveIdentity(token: string): Identity | undefined {
  const claims = verifySession(token, authConfig.sessionSecret);
  const stored = store.findIdentity(claims.identityId);
  if (stored) {
    return stored;
  }

  return {
    id: claims.identityId,
    provider: claims.provider,
    displayName: claims.displayName,
    email: claims.email,
  };
}

async function createAndSaveGuest(displayName: string): Promise<Identity> {
  const session = createGuestSession(displayName, authConfig);
  await store.upsertIdentity(session.identity);
  return session.identity;
}

async function createJoinPayload(
  room: MeetingRoom,
  identity: Identity,
  sessionToken?: string,
): Promise<{
  room: MeetingRoom;
  identity: Identity;
  participant: MeetingParticipant;
  livekit: Awaited<ReturnType<typeof createLiveKitJoinToken>>;
  sessionToken?: string;
}> {
  const participant = await store.addParticipant(createParticipant(room, identity));
  await store.startParticipantSession(createParticipantSession(room, participant));
  const livekit = await createLiveKitJoinToken(liveKitConfig, room, identity, participant);

  return {
    room,
    identity,
    participant,
    livekit,
    sessionToken,
  };
}

function isActiveRoomParticipant(roomId: string, identityId: string): boolean {
  return store
    .listActiveParticipantSessionsForRoom(roomId)
    .some((session) => session.identityId === identityId);
}

async function createAndDeliverRoomInvitations(
  room: MeetingRoom,
  inviter: Identity,
  emails: string[],
  options: { scheduledAt?: string; note?: string },
): Promise<RoomInvitation[]> {
  const invitations: RoomInvitation[] = [];

  for (const email of emails) {
    const invitation = await store.addRoomInvitation(createRoomInvitation(room, inviter, {
      email,
      scheduledAt: options.scheduledAt,
      note: options.note,
    }));
    try {
      const delivery = await sendInvitationEmail(smtpConfig, {
        invitation,
        room,
        inviter,
        roomUrl: `${publicOrigin}/r/${room.slug}`,
      });
      invitations.push(delivery === 'sent'
        ? await store.updateRoomInvitationDelivery(invitation.id, 'sent')
        : invitation);
    } catch (error) {
      invitations.push(await store.updateRoomInvitationDelivery(
        invitation.id,
        'failed',
        (error as Error).message.slice(0, 300),
      ));
    }
  }

  return invitations;
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

function signInMemoryGuest(identity: Identity): string {
  return signSession(identity, authConfig.sessionSecret);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readEmailList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.join(',') : typeof value === 'string' ? value : '';
  return raw
    .split(/[,\n;]/)
    .map((email) => email.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function writeServerSentEvent(response: Response, event: string, payload: unknown): void {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function windowlessSetInterval(callback: () => void, delay: number): NodeJS.Timeout {
  return setInterval(callback, delay);
}
