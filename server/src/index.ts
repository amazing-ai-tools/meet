import express, { type Request, type Response } from 'express';

import {
  canHostControlParticipant,
  canSendChatMessage,
  createChatMessage,
  createInstantRoom,
  createParticipant,
  createTeam,
  createTeamRoom,
  type Identity,
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
  const participant = await store.addParticipant(createParticipant(room, joinedIdentity));
  const livekit = await createLiveKitJoinToken(liveKitConfig, room, joinedIdentity, participant);

  response.status(201).json({
    room,
    identity: joinedIdentity,
    participant,
    livekit,
    sessionToken: identity ? undefined : signInMemoryGuest(joinedIdentity),
  });
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

app.get('/api/teams', withIdentity(true, (request, response, identity) => {
  response.json({ teams: store.listTeamsForIdentity(identity!.id) });
}));

app.post('/api/teams', withIdentity(true, async (request, response, identity) => {
  const team = await store.addTeam(createTeam(identity!, readString(request.body?.name, 'Meu time')));
  response.status(201).json({ team });
}));

app.post('/api/teams/:teamId/rooms', withIdentity(true, async (request, response, identity) => {
  const team = store.findTeam(request.params.teamId);
  if (!team) {
    response.status(404).json({ error: 'Team not found' });
    return;
  }

  const room = await store.addRoom(createTeamRoom(team, identity!, readString(request.body?.title, 'Sala persistente')));
  response.status(201).json({ room, url: `${publicOrigin}/r/${room.slug}` });
}));

app.get('/api/teams/:teamId/rooms', withIdentity(true, (request, response, identity) => {
  const team = store.findTeam(request.params.teamId);
  if (!team || !team.memberIdentityIds.includes(identity!.id)) {
    response.status(404).json({ error: 'Team not found' });
    return;
  }

  response.json({ rooms: store.listRoomsForTeam(team.id) });
}));

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

function signInMemoryGuest(identity: Identity): string {
  return signSession(identity, authConfig.sessionSecret);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
