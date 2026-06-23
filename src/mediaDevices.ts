export type GroupedMediaDevices = {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
};

export function groupMediaDevices(devices: MediaDeviceInfo[]): GroupedMediaDevices {
  return {
    cameras: devices.filter((device) => device.kind === 'videoinput'),
    microphones: devices.filter((device) => device.kind === 'audioinput'),
    speakers: devices.filter((device) => device.kind === 'audiooutput'),
  };
}

export function getDeviceDisplayLabel(device: MediaDeviceInfo, index: number): string {
  if (device.label.trim()) {
    return device.label;
  }

  const fallbackNameByKind: Record<MediaDeviceKind, string> = {
    audioinput: 'Microfone',
    audiooutput: 'Saida de audio',
    videoinput: 'Camera',
  };

  return `${fallbackNameByKind[device.kind] || 'Dispositivo'} ${index + 1}`;
}
