import test from 'node:test';
import assert from 'node:assert/strict';

import { toggleMeetingFullscreen } from './fullscreen';

test('toggleMeetingFullscreen requests fullscreen when available', async () => {
  let requested = false;
  const element = {
    requestFullscreen: async () => {
      requested = true;
    },
    querySelector: () => null,
  } as unknown as HTMLElement;
  const doc = { fullscreenElement: null } as unknown as Document;

  const entered = await toggleMeetingFullscreen(element, doc);

  assert.equal(entered, true);
  assert.equal(requested, true);
});

test('toggleMeetingFullscreen exits when already fullscreen', async () => {
  let exited = false;
  const element = { querySelector: () => null } as unknown as HTMLElement;
  const doc = {
    fullscreenElement: element,
    exitFullscreen: async () => {
      exited = true;
    },
  } as unknown as Document;

  const entered = await toggleMeetingFullscreen(element, doc);

  assert.equal(entered, false);
  assert.equal(exited, true);
});
