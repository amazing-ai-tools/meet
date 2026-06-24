import test from 'node:test';
import assert from 'node:assert/strict';

import { getCameraDeviceForFacingMode, getNextFacingMode, getNextVideoDevice } from './cameraDevices';

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

test('getCameraDeviceForFacingMode prefers camera labels that match phone directions', () => {
  const devices = [
    videoDevice('front-device', 'Front Camera'),
    videoDevice('back-device', 'Back Camera'),
  ];

  assert.equal(getCameraDeviceForFacingMode(devices, 'user')?.deviceId, 'front-device');
  assert.equal(getCameraDeviceForFacingMode(devices, 'environment')?.deviceId, 'back-device');
});

test('getCameraDeviceForFacingMode supports common mobile labels in Portuguese and French', () => {
  const devices = [
    videoDevice('front-device', 'Camera frontal'),
    videoDevice('back-device', 'Camera arrière'),
  ];

  assert.equal(getCameraDeviceForFacingMode(devices, 'user')?.deviceId, 'front-device');
  assert.equal(getCameraDeviceForFacingMode(devices, 'environment')?.deviceId, 'back-device');
});
