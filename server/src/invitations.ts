import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer/index.js';

import type { Identity, MeetingRoom, RoomInvitation } from './domain.js';

export type SmtpConfig = {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
};

export type InvitationEmailInput = {
  invitation: RoomInvitation;
  room: MeetingRoom;
  inviter: Identity;
  roomUrl: string;
  from: string;
};

export function readSmtpConfig(env: NodeJS.ProcessEnv = process.env): SmtpConfig {
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined,
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  };
}

export function isSmtpConfigured(config: SmtpConfig): boolean {
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
}

export function composeInvitationEmail(input: InvitationEmailInput): Mail.Options {
  const scheduleLine = input.invitation.scheduledAt
    ? `Data: ${input.invitation.scheduledAt}`
    : 'Data: a combinar';
  const noteLine = input.invitation.note ? `\nMensagem do host:\n${input.invitation.note}\n` : '';
  const text = [
    `${input.inviter.displayName} convidou voce para uma reuniao no amazing-ai meet.`,
    '',
    `Sala: ${input.room.title}`,
    scheduleLine,
    '',
    `Entrar: ${input.roomUrl}`,
    noteLine,
  ].join('\n');

  return {
    from: input.from,
    to: input.invitation.email,
    subject: `Convite: ${input.room.title}`,
    text,
    html: renderInvitationHtml(input, scheduleLine),
    attachments: input.invitation.scheduledAt
      ? [{
          filename: 'amazing-ai-meet.ics',
          content: createCalendarInvite(input),
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        }]
      : undefined,
  };
}

export async function sendInvitationEmail(
  config: SmtpConfig,
  input: Omit<InvitationEmailInput, 'from'>,
): Promise<'sent' | 'pending'> {
  if (!isSmtpConfigured(config)) {
    return 'pending';
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  await transport.sendMail(composeInvitationEmail({
    ...input,
    from: config.from!,
  }));
  return 'sent';
}

function renderInvitationHtml(input: InvitationEmailInput, scheduleLine: string): string {
  const escapedTitle = escapeHtml(input.room.title);
  const escapedInviter = escapeHtml(input.inviter.displayName);
  const escapedNote = input.invitation.note ? `<p>${escapeHtml(input.invitation.note)}</p>` : '';

  return `
    <div style="font-family: Arial, sans-serif; color: #172033; line-height: 1.5">
      <h1 style="font-size: 22px; margin-bottom: 8px">${escapedTitle}</h1>
      <p>${escapedInviter} convidou voce para uma reuniao no <strong>amazing-ai meet</strong>.</p>
      <p>${escapeHtml(scheduleLine)}</p>
      ${escapedNote}
      <p><a href="${escapeAttribute(input.roomUrl)}">Entrar na reuniao</a></p>
    </div>
  `;
}

function createCalendarInvite(input: InvitationEmailInput): string {
  const start = input.invitation.scheduledAt ? toIcsDate(new Date(input.invitation.scheduledAt)) : toIcsDate(new Date());
  const end = input.invitation.scheduledAt
    ? toIcsDate(new Date(new Date(input.invitation.scheduledAt).getTime() + 60 * 60 * 1000))
    : toIcsDate(new Date(Date.now() + 60 * 60 * 1000));
  const description = `${input.roomUrl}${input.invitation.note ? `\\n\\n${escapeIcs(input.invitation.note)}` : ''}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//amazing-ai meet//Meet Invitation//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${input.invitation.id}@meet.app.amazing-ai.tools`,
    `DTSTAMP:${toIcsDate(new Date(input.invitation.createdAt))}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(input.room.title)}`,
    `DESCRIPTION:${description}`,
    `URL:${input.roomUrl}`,
    `ORGANIZER;CN=${escapeIcs(input.inviter.displayName)}:mailto:${input.inviter.email || 'no-reply@amazing-ai.tools'}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${input.invitation.email}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
