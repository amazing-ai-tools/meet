import assert from 'node:assert/strict';
import test from 'node:test';

import {
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
