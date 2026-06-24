export type MobileMeetingPanel = 'participants' | 'chat' | 'share' | 'effects' | null;
export type MobileStageMediaSource = 'camera' | 'screen_share';
export type MobileStageFitMode = 'cover' | 'contain';

export function toggleMobilePanel(current: MobileMeetingPanel, next: Exclude<MobileMeetingPanel, null>): MobileMeetingPanel {
  return current === next ? null : next;
}

export function getMobileStageFitMode(source: MobileStageMediaSource): MobileStageFitMode {
  return source === 'screen_share' ? 'contain' : 'cover';
}
