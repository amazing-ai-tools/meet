export type StageSpotlightKey = string;

export type StageSpotlightTrackInfo = {
  participantIdentity: string;
  isLocal?: boolean;
  source: string;
  publicationTrackSid?: string;
};

export function getStageSpotlightKey(track: StageSpotlightTrackInfo): StageSpotlightKey {
  const participantKey = track.participantIdentity || (track.isLocal ? 'local' : 'unknown');
  return [participantKey, track.source].join(':');
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
