export type TypingParticipant = {
  identityId: string;
  displayName: string;
};

export type TypingLocale = 'pt' | 'en' | 'fr';

export function getVisibleTypingParticipants(
  participants: TypingParticipant[],
  localIdentityId: string,
  limit = 3,
): TypingParticipant[] {
  const byIdentity = new Map<string, TypingParticipant>();

  for (const participant of participants) {
    if (participant.identityId === localIdentityId) {
      continue;
    }
    byIdentity.set(participant.identityId, participant);
  }

  return [...byIdentity.values()].slice(0, limit);
}

export function getTypingSummary(participants: TypingParticipant[], locale: TypingLocale = 'pt'): string {
  if (participants.length === 0) {
    return '';
  }

  if (locale === 'en') {
    if (participants.length === 1) {
      return `${participants[0].displayName} is typing...`;
    }
    if (participants.length === 2) {
      return `${participants[0].displayName} and ${participants[1].displayName} are typing...`;
    }
    return `${participants[0].displayName}, ${participants[1].displayName}, and ${
      participants.length - 2
    } more are typing...`;
  }

  if (locale === 'fr') {
    if (participants.length === 1) {
      return `${participants[0].displayName} ecrit...`;
    }
    if (participants.length === 2) {
      return `${participants[0].displayName} et ${participants[1].displayName} ecrivent...`;
    }
    return `${participants[0].displayName}, ${participants[1].displayName} et ${
      participants.length - 2
    } autre(s) ecrivent...`;
  }

  if (participants.length === 1) {
    return `${participants[0].displayName} esta digitando...`;
  }

  if (participants.length === 2) {
    return `${participants[0].displayName} e ${participants[1].displayName} estao digitando...`;
  }

  return `${participants[0].displayName}, ${participants[1].displayName} e mais ${
    participants.length - 2
  } estao digitando...`;
}
