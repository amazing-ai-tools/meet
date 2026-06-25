export type FloatingPreviewPosition = {
  x: number;
  y: number;
};

export type FloatingPreviewBounds = {
  viewportWidth: number;
  viewportHeight: number;
  previewWidth: number;
  previewHeight: number;
  margin: number;
  topOffset: number;
};

export function clampFloatingPreviewPosition(
  position: FloatingPreviewPosition,
  bounds: FloatingPreviewBounds,
): FloatingPreviewPosition {
  const minX = bounds.margin;
  const maxX = Math.max(minX, bounds.viewportWidth - bounds.previewWidth - bounds.margin);
  const minY = bounds.margin + bounds.topOffset;
  const maxY = Math.max(minY, bounds.viewportHeight - bounds.previewHeight - bounds.margin);

  return {
    x: Math.min(Math.max(position.x, minX), maxX),
    y: Math.min(Math.max(position.y, minY), maxY),
  };
}

export function getDefaultFloatingPreviewPosition(bounds: FloatingPreviewBounds): FloatingPreviewPosition {
  return clampFloatingPreviewPosition(
    {
      x: bounds.viewportWidth - bounds.previewWidth - bounds.margin,
      y: bounds.margin + bounds.topOffset,
    },
    bounds,
  );
}
