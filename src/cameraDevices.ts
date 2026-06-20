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
