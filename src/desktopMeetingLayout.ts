export type DesktopMeetingPanel = 'participants' | 'share' | 'effects' | 'host' | 'devices' | null;

export function toggleDesktopPanel(
  current: DesktopMeetingPanel,
  next: Exclude<DesktopMeetingPanel, null>,
): DesktopMeetingPanel {
  return current === next ? null : next;
}
