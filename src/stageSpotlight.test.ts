import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getChatPreviewSpotlightKey,
  getMobileStageSpotlightKey,
  getSpotlightAriaLabel,
  getStageSpotlightKey,
  getStageSpotlightSelectionAfterClick,
} from './stageSpotlight.ts';

test('getStageSpotlightKey separates participant camera and screen share tracks without depending on track sid', () => {
  assert.equal(
    getStageSpotlightKey({
      participantIdentity: 'alice',
      source: 'camera',
      publicationTrackSid: 'camera-track',
    }),
    'alice:camera',
  );

  assert.equal(
    getStageSpotlightKey({
      participantIdentity: 'alice',
      source: 'screen_share',
      publicationTrackSid: 'screen-track',
    }),
    'alice:screen_share',
  );
});

test('getStageSpotlightSelectionAfterClick toggles the clicked tile focus', () => {
  assert.equal(getStageSpotlightSelectionAfterClick(null, 'alice:camera'), 'alice:camera');
  assert.equal(
    getStageSpotlightSelectionAfterClick('alice:camera', 'alice:screen_share'),
    'alice:screen_share',
  );
  assert.equal(getStageSpotlightSelectionAfterClick('alice:camera', 'alice:camera'), null);
});

test('getStageSpotlightKey keeps the local tile stable before identity metadata arrives', () => {
  assert.equal(
    getStageSpotlightKey({
      participantIdentity: '',
      isLocal: true,
      source: 'camera',
    }),
    'local:camera',
  );
});

test('getSpotlightAriaLabel names cameras and shared screens clearly', () => {
  assert.equal(
    getSpotlightAriaLabel({ participantName: 'Alice', source: 'camera' }),
    'Destacar camera de Alice em tela cheia',
  );
  assert.equal(
    getSpotlightAriaLabel({ participantName: 'Bob', source: 'screen_share' }),
    'Destacar tela compartilhada de Bob em tela cheia',
  );
});

test('getChatPreviewSpotlightKey keeps the selected screen or camera when chat is focused', () => {
  const tracks = [
    { key: 'alice:camera', isLocal: true, source: 'camera' },
    { key: 'bob:camera', isLocal: false, source: 'camera' },
    { key: 'bob:screen_share', isLocal: false, source: 'screen_share' },
  ];

  assert.equal(getChatPreviewSpotlightKey(tracks, 'bob:screen_share'), 'bob:screen_share');
  assert.equal(getChatPreviewSpotlightKey(tracks, 'bob:camera'), 'bob:camera');
});

test('getChatPreviewSpotlightKey falls back to local camera, then any camera, then first track', () => {
  assert.equal(
    getChatPreviewSpotlightKey([
      { key: 'alice:camera', isLocal: true, source: 'camera' },
      { key: 'bob:screen_share', isLocal: false, source: 'screen_share' },
    ], null),
    'alice:camera',
  );

  assert.equal(
    getChatPreviewSpotlightKey([
      { key: 'bob:camera', isLocal: false, source: 'camera' },
      { key: 'bob:screen_share', isLocal: false, source: 'screen_share' },
    ], null),
    'bob:camera',
  );

  assert.equal(
    getChatPreviewSpotlightKey([{ key: 'bob:screen_share', isLocal: false, source: 'screen_share' }], null),
    'bob:screen_share',
  );
});

test('getMobileStageSpotlightKey prioritizes selected stream, then screen share, then remote camera', () => {
  const tracks = [
    { key: 'alice:camera', isLocal: true, source: 'camera' },
    { key: 'bob:camera', isLocal: false, source: 'camera' },
    { key: 'bob:screen_share', isLocal: false, source: 'screen_share' },
  ];

  assert.equal(getMobileStageSpotlightKey(tracks, 'bob:camera'), 'bob:camera');
  assert.equal(getMobileStageSpotlightKey(tracks, null), 'bob:screen_share');
  assert.equal(getMobileStageSpotlightKey(tracks.slice(0, 2), null), 'bob:camera');
  assert.equal(getMobileStageSpotlightKey([tracks[0]], null), 'alice:camera');
});
