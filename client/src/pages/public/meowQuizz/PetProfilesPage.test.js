import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('./PetProfilesPage.jsx', import.meta.url), 'utf8');

test('PetProfilesPage uses explicit per-profile combo actions instead of implicit first profile continue', () => {
  assert.match(source, /function ProfileCard\(\{\s*profile,\s*onDelete,\s*onCreateCombo\s*\}\)/);
  assert.match(source, /onClick=\{onCreateCombo\}/);
  assert.match(source, /navigate\(`\/meow-quizz\/ket-qua\/\$\{profile\._id\}`\)/);
  assert.doesNotMatch(source, /profiles\[0\]/);
  assert.doesNotMatch(source, /primaryProfile/);
});
