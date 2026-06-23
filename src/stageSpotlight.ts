export type StageSpotlightKey = string;

export type StageSpotlightTrackInfo = {
  participantIdentity: string;
  source: string;
  publicationTrackSid?: string;
};

export function getStageSpotlightKey(track: StageSpotlightTrackInfo): StageSpotlightKey {
  return [track.participantIdentity, track.source, track.publicationTrackSid || 'placeholder'].join(':');
}

export function getStageSpotlightSelectionAfterClick(
  current: StageSpotlightKey | null,
  clicked: StageSpotlightKey,
): StageSpotlightKey | null {
  return current === clicked ? null : clicked;
}

export function getSpotlightAriaLabel({
  participantName,
  source,
}: {
  participantName: string;
  source: string;
}): string {
  const mediaLabel = source === 'screen_share' ? 'tela compartilhada' : 'camera';
  return `Destacar ${mediaLabel} de ${participantName} em tela cheia`;
}
