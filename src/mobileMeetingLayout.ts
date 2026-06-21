export type MobileMeetingPanel = 'participants' | 'chat' | 'share' | 'effects' | null;

export function toggleMobilePanel(current: MobileMeetingPanel, next: Exclude<MobileMeetingPanel, null>): MobileMeetingPanel {
  return current === next ? null : next;
}
