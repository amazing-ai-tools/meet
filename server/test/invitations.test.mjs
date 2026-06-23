import test from 'node:test';
import assert from 'node:assert/strict';

import { createGuestIdentity, createInstantRoom, createRoomInvitation } from '../dist/domain.js';
import { composeInvitationEmail, isSmtpConfigured } from '../dist/invitations.js';

test('composeInvitationEmail includes the room link, schedule, note, and calendar attachment', () => {
  const host = createGuestIdentity('Host User');
  const room = createInstantRoom(host, 'Review Semanal');
  const invitation = createRoomInvitation(room, host, {
    email: 'friend@example.com',
    scheduledAt: '2026-07-01T15:30:00.000Z',
    note: 'Traga o relatorio.',
  });

  const email = composeInvitationEmail({
    invitation,
    room,
    inviter: host,
    roomUrl: 'https://meet.app.amazing-ai.tools/r/abc123',
    from: 'amazing-ai meet <meet@example.com>',
  });

  assert.equal(email.to, 'friend@example.com');
  assert.equal(email.subject, 'Convite: Review Semanal');
  assert.match(email.text, /https:\/\/meet\.app\.amazing-ai\.tools\/r\/abc123/);
  assert.match(email.text, /Traga o relatorio\./);
  assert.match(email.text, /2026-07-01/);
  assert.equal(email.attachments?.[0]?.filename, 'amazing-ai-meet.ics');
  assert.match(String(email.attachments?.[0]?.content), /BEGIN:VCALENDAR/);
});

test('isSmtpConfigured only enables delivery when required SMTP fields exist', () => {
  assert.equal(isSmtpConfigured({}), false);
  assert.equal(isSmtpConfigured({
    host: 'smtp.example.com',
    port: 587,
    user: 'user',
    pass: 'pass',
    from: 'meet@example.com',
  }), true);
});
