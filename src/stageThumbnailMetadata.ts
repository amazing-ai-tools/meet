export type StageThumbnailSurface = 'fullscreen-strip' | 'fullscreen-local-preview' | 'mobile-strip' | 'chat-preview';

const revealableThumbnailSurfaces = new Set<StageThumbnailSurface>([
  'fullscreen-strip',
  'fullscreen-local-preview',
  'mobile-strip',
  'chat-preview',
]);

export function shouldHideStageThumbnailMetadataByDefault(surface: StageThumbnailSurface): boolean {
  return revealableThumbnailSurfaces.has(surface);
}

export function getStageThumbnailMetadataClass(surface: StageThumbnailSurface): string {
  return shouldHideStageThumbnailMetadataByDefault(surface) ? 'is-metadata-on-interaction' : '';
}
