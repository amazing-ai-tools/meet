import test from 'node:test';
import assert from 'node:assert/strict';

import { getNextFacingMode, getNextVideoDevice } from './cameraDevices';

function videoDevice(deviceId: string, label = deviceId): MediaDeviceInfo {
  return {
    deviceId,
    groupId: `group-${deviceId}`,
    kind: 'videoinput',
    label,
    toJSON: () => ({}),
  };
}

test('getNextVideoDevice cycles through available cameras', () => {
  const devices = [videoDevice('front'), videoDevice('back')];

  assert.equal(getNextVideoDevice(devices, 'front')?.deviceId, 'back');
  assert.equal(getNextVideoDevice(devices, 'back')?.deviceId, 'front');
});

test('getNextVideoDevice returns the first camera when the active camera is unknown', () => {
  const devices = [videoDevice('front'), videoDevice('back')];

  assert.equal(getNextVideoDevice(devices, 'missing')?.deviceId, 'front');
});

test('getNextFacingMode toggles between phone camera directions', () => {
  assert.equal(getNextFacingMode('user'), 'environment');
  assert.equal(getNextFacingMode('environment'), 'user');
});
