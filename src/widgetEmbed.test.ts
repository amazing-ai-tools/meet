import test from 'node:test';
import assert from 'node:assert/strict';

import { readWidgetEmbedParams } from './widgetEmbed.ts';

test('readWidgetEmbedParams requires context id and keeps optional display metadata', () => {
  const params = readWidgetEmbedParams('?contextId=Game%20Room%20123&displayName=Ana&title=Mesa%20Final');

  assert.deepEqual(params, {
    contextId: 'Game Room 123',
    displayName: 'Ana',
    title: 'Mesa Final',
  });
});

test('readWidgetEmbedParams uses safe defaults for missing optional fields', () => {
  const params = readWidgetEmbedParams('?contextId=room-42');

  assert.equal(params.contextId, 'room-42');
  assert.equal(params.displayName, '');
  assert.equal(params.title, '');
});
