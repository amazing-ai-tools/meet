export type TypingParticipant = {
  identityId: string;
  displayName: string;
};

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

export function getTypingSummary(participants: TypingParticipant[]): string {
  if (participants.length === 0) {
    return '';
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
