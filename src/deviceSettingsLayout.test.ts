import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const stylesPath = join(dirname(fileURLToPath(import.meta.url)), 'styles.css');

function cssRule(selector: string): string {
  const styles = readFileSync(stylesPath, 'utf8');
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'm'));
  return match?.[1] || '';
}

test('device settings panel keeps audio and video controls reachable with internal scroll', () => {
  const devicesPanelRule = cssRule('.devices-panel');
  const settingsPanelRule = cssRule('.device-settings-panel');

  assert.match(devicesPanelRule, /overflow-y:\s*auto/);
  assert.match(settingsPanelRule, /overflow-y:\s*auto/);
  assert.match(settingsPanelRule, /max-height:\s*100%/);
});
