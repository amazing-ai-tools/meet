import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveDashboardSection } from './dashboardSections.ts';

test('resolves known dashboard sections', () => {
  assert.equal(resolveDashboardSection('meetings'), 'meetings');
  assert.equal(resolveDashboardSection('teams'), 'teams');
  assert.equal(resolveDashboardSection('rooms'), 'rooms');
});

test('falls back to meetings for unknown sections', () => {
  assert.equal(resolveDashboardSection(undefined), 'meetings');
  assert.equal(resolveDashboardSection('landing'), 'meetings');
});
