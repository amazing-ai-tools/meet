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
    await fullscreenElement.requestFullscreen();
    return true;
  }
  if (fullscreenElement.webkitRequestFullscreen) {
    await fullscreenElement.webkitRequestFullscreen();
    return true;
  }

  const video = element.querySelector('video') as IOSFullscreenVideo | null;
  if (video?.webkitEnterFullscreen) {
    video.webkitEnterFullscreen();
    return true;
  }

  return false;
}
