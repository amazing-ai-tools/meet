import { createHmac, timingSafeEqual } from 'node:crypto';

import { OAuth2Client } from 'google-auth-library';

import type { Identity } from './domain.js';
import { createGuestIdentity } from './domain.js';

export type SessionClaims = {
  identityId: string;
  provider: Identity['provider'];
  displayName: string;
  email?: string;
};

export type AuthConfig = {
  sessionSecret: string;
  googleClientId?: string;
};

export function createGuestSession(displayName: string, config: AuthConfig): { identity: Identity; token: string } {
  const identity = createGuestIdentity(displayName);
  return { identity, token: signSession(identity, config.sessionSecret) };
}

export async function verifyGoogleIdentity(
  credential: string,
  config: AuthConfig,
): Promise<{ identity: Identity; token: string }> {
  if (!config.googleClientId) {
    throw new Error('Google login is not configured on this server');
  }

  const client = new OAuth2Client(config.googleClientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.name || !payload.email) {
    throw new Error('Google token did not include the required profile claims');
  }

  const identity: Identity = {
    id: `google_${payload.sub}`,
    displayName: payload.name,
    email: payload.email,
    avatarUrl: payload.picture,
    provider: 'google',
  };

  return { identity, token: signSession(identity, config.sessionSecret) };
}

export function signSession(identity: Identity, secret: string): string {
  const claims: SessionClaims = {
    identityId: identity.id,
    provider: identity.provider,
    displayName: identity.displayName,
    email: identity.email,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');

  return `${payload}.${signature}`;
}

export function verifySession(token: string, secret: string): SessionClaims {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    throw new Error('Invalid session token');
  }

  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error('Invalid session token');
  }

  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionClaims;
}

export function readBearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith('Bearer ')) {
    return undefined;
  }

  return header.slice('Bearer '.length).trim();
}
