export type DesktopMeetingPanel = 'participants' | 'chat' | 'share' | 'effects' | 'host' | null;

export function toggleDesktopPanel(
  current: DesktopMeetingPanel,
  next: Exclude<DesktopMeetingPanel, null>,
): DesktopMeetingPanel {
  return current === next ? null : next;
}
