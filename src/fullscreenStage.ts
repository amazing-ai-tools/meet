export type FullscreenStageFocus = 'self' | 'friends';

export function toggleFullscreenStageFocus(current: FullscreenStageFocus): FullscreenStageFocus {
  return current === 'self' ? 'friends' : 'self';
}

export function getFullscreenStageToggleLabel(current: FullscreenStageFocus): string {
  return current === 'self' ? 'Ver amigos' : 'Ver eu';
}
