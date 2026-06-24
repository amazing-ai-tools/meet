export function getNextVideoDevice(devices: MediaDeviceInfo[], activeDeviceId?: string): MediaDeviceInfo | undefined {
  const videoDevices = devices.filter((device) => device.kind === 'videoinput' && device.deviceId);
  if (videoDevices.length === 0) {
    return undefined;
  }

  const activeIndex = videoDevices.findIndex((device) => device.deviceId === activeDeviceId);
  return videoDevices[(activeIndex + 1) % videoDevices.length];
}

export function getNextFacingMode(current: 'user' | 'environment'): 'user' | 'environment' {
  return current === 'user' ? 'environment' : 'user';
}

export function getCameraDeviceForFacingMode(
  devices: MediaDeviceInfo[],
  facingMode: 'user' | 'environment',
): MediaDeviceInfo | undefined {
  const videoDevices = devices.filter((device) => device.kind === 'videoinput' && device.deviceId);
  if (videoDevices.length === 0) {
    return undefined;
  }

  const frontPatterns = ['front', 'frontal', 'user', 'face', 'selfie', 'avant'];
  const backPatterns = ['back', 'rear', 'environment', 'world', 'arriere', 'arrière', 'traseira', 'tras'];
  const patterns = facingMode === 'user' ? frontPatterns : backPatterns;
  const matchingDevice = videoDevices.find((device) => {
    const label = normalizeCameraLabel(device.label);
    return patterns.some((pattern) => label.includes(pattern));
  });

  return matchingDevice;
}

function normalizeCameraLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
