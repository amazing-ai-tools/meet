type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type IOSFullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

const FULLSCREEN_VIDEO_SELECTOR = '.mobile-immersive-main video, .fullscreen-stage-grid video, video';

function enterVideoFullscreen(element: HTMLElement): boolean {
  const video = element.querySelector(FULLSCREEN_VIDEO_SELECTOR) as IOSFullscreenVideo | null;
  if (video?.webkitEnterFullscreen) {
    video.webkitEnterFullscreen();
    return true;
  }

  return false;
}

export async function toggleMeetingFullscreen(element: HTMLElement, doc: FullscreenDocument = document): Promise<boolean> {
  const activeFullscreenElement = doc.fullscreenElement || doc.webkitFullscreenElement;
  if (activeFullscreenElement) {
    if (doc.exitFullscreen) {
      await doc.exitFullscreen();
      return false;
    }
    if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
      return false;
    }
  }

  const fullscreenElement = element as FullscreenElement;
  if (fullscreenElement.requestFullscreen) {
    try {
      await fullscreenElement.requestFullscreen();
      return true;
    } catch {
      return enterVideoFullscreen(element);
    }
  }
  if (fullscreenElement.webkitRequestFullscreen) {
    try {
      await fullscreenElement.webkitRequestFullscreen();
      return true;
    } catch {
      return enterVideoFullscreen(element);
    }
  }

  return enterVideoFullscreen(element);
}
