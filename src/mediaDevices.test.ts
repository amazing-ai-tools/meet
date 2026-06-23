import test from 'node:test';
import assert from 'node:assert/strict';

import { getDeviceDisplayLabel, groupMediaDevices } from './mediaDevices';

function device(kind: MediaDeviceKind, deviceId: string, label = ''): MediaDeviceInfo {
  return {
    deviceId,
    groupId: `group-${deviceId}`,
    kind,
    label,
    toJSON: () => ({}),
  };
}

test('groupMediaDevices separates camera, microphone, and speaker devices', () => {
  const grouped = groupMediaDevices([
    device('videoinput', 'camera-1'),
    device('audioinput', 'mic-1'),
    device('audiooutput', 'speaker-1'),
  ]);

  assert.equal(grouped.cameras.length, 1);
  assert.equal(grouped.microphones.length, 1);
  assert.equal(grouped.speakers.length, 1);
});

test('getDeviceDisplayLabel uses friendly fallback labels when permissions hide device labels', () => {
  assert.equal(getDeviceDisplayLabel(device('videoinput', 'camera-1'), 0), 'Camera 1');
  assert.equal(getDeviceDisplayLabel(device('audioinput', 'mic-1'), 1), 'Microfone 2');
  assert.equal(getDeviceDisplayLabel(device('audiooutput', 'speaker-1'), 2), 'Saida de audio 3');
});

test('getDeviceDisplayLabel keeps browser-provided labels when available', () => {
  assert.equal(getDeviceDisplayLabel(device('audioinput', 'mic-1', 'AirPods Pro'), 0), 'AirPods Pro');
});
