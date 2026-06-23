import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSpotlightAriaLabel,
  getStageSpotlightKey,
  getStageSpotlightSelectionAfterClick,
} from './stageSpotlight.ts';

test('getStageSpotlightKey separates participant camera and screen share tracks', () => {
  assert.equal(
    getStageSpotlightKey({
      participantIdentity: 'alice',
      source: 'camera',
      publicationTrackSid: 'camera-track',
    }),
    'alice:camera:camera-track',
  );

  assert.equal(
    getStageSpotlightKey({
      participantIdentity: 'alice',
      source: 'screen_share',
      publicationTrackSid: 'screen-track',
    }),
    'alice:screen_share:screen-track',
  );
});

test('getStageSpotlightSelectionAfterClick toggles the clicked tile focus', () => {
  assert.equal(getStageSpotlightSelectionAfterClick(null, 'alice:camera:camera-track'), 'alice:camera:camera-track');
  assert.equal(
    getStageSpotlightSelectionAfterClick('alice:camera:camera-track', 'alice:screen_share:screen-track'),
    'alice:screen_share:screen-track',
  );
  assert.equal(getStageSpotlightSelectionAfterClick('alice:camera:camera-track', 'alice:camera:camera-track'), null);
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
