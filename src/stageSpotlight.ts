export type StageSpotlightKey = string;

export type StageSpotlightTrackInfo = {
  participantIdentity: string;
  isLocal?: boolean;
  source: string;
  publicationTrackSid?: string;
};

export type ChatPreviewSpotlightTrack = {
  key: StageSpotlightKey;
  isLocal?: boolean;
  source: string;
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

export function getChatPreviewSpotlightKey(
  tracks: ChatPreviewSpotlightTrack[],
  selected: StageSpotlightKey | null,
): StageSpotlightKey | null {
  if (selected && tracks.some((track) => track.key === selected)) {
    return selected;
  }

  return (
    tracks.find((track) => track.isLocal && track.source === 'camera')?.key ||
    tracks.find((track) => track.source === 'camera')?.key ||
    tracks[0]?.key ||
    null
  );
}

export function getMobileStageSpotlightKey(
  tracks: ChatPreviewSpotlightTrack[],
  selected: StageSpotlightKey | null,
): StageSpotlightKey | null {
  if (selected && tracks.some((track) => track.key === selected)) {
    return selected;
  }

  return (
    tracks.find((track) => track.source === 'screen_share')?.key ||
    tracks.find((track) => !track.isLocal && track.source === 'camera')?.key ||
    tracks.find((track) => track.source === 'camera')?.key ||
    tracks[0]?.key ||
    null
  );
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
