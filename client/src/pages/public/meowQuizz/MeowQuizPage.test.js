import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('./MeowQuizPage.jsx', import.meta.url), 'utf8');

test('MeowQuizPage keeps the 10-step screenshot wizard contract', () => {
  assert.match(source, /const visualSteps = \[/);
  assert.match(source, /visualSteps\.length - 1/);
  assert.match(source, /Bước \{step \+ 1\} trên 10/);
  assert.match(source, /meow-quiz-card/);
  assert.match(source, /meow-quiz-bg/);
  assert.match(source, /weight-stepper/);
  assert.match(source, /upload-dropzone/);
  assert.doesNotMatch(source, /MEOW QUIZZ/);
  assert.doesNotMatch(source, /shadow-\[0_18px_0/);
});
