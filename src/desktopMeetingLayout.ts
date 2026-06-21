export type DesktopMeetingPanel = 'participants' | 'chat' | 'share' | 'host' | null;

export function toggleDesktopPanel(
  current: DesktopMeetingPanel,
  next: Exclude<DesktopMeetingPanel, null>,
): DesktopMeetingPanel {
  return current === next ? null : next;
}
