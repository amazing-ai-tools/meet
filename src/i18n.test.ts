import test from 'node:test';
import assert from 'node:assert/strict';

import { createTranslator, resolveLocale } from './i18n.ts';

test('resolveLocale chooses supported browser language variants', () => {
  assert.equal(resolveLocale(['en-US', 'pt-BR']), 'en');
  assert.equal(resolveLocale(['fr-CA', 'en-US']), 'fr');
  assert.equal(resolveLocale(['pt-PT', 'en-US']), 'pt');
});

test('resolveLocale falls back to portuguese for unsupported languages', () => {
  assert.equal(resolveLocale(['de-DE', 'es-ES']), 'pt');
  assert.equal(resolveLocale([]), 'pt');
});

test('createTranslator returns localized strings with interpolation', () => {
  assert.equal(createTranslator('pt')('controls.chatUnread', { count: 3 }), 'Chat (3 novas)');
  assert.equal(createTranslator('en')('controls.chatUnread', { count: 3 }), 'Chat (3 new)');
  assert.equal(createTranslator('fr')('controls.chatUnread', { count: 3 }), 'Chat (3 nouveaux)');
});

test('createTranslator falls back to portuguese for missing keys', () => {
  assert.equal(createTranslator('en')('status.linkCopied'), 'Link copied');
  assert.equal(createTranslator('pt')('status.linkCopied'), 'Link copiado');
});
