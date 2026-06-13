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

test('MeowQuizPage keeps the wizard usable on narrow mobile widths', () => {
  assert.match(source, /relative z-10 mx-auto w-\[calc\(100vw-32px\)\] min-w-0 max-w-\[602px\] sm:w-full/);
  assert.match(source, /meow-quiz-card[^"]*w-full[^"]*min-w-0/);
  assert.match(source, /break-words/);
  assert.match(source, /max-sm:whitespace-normal/);
});

test('MeowQuizPage does not call protected photo upload for logged-out users and shows 5MB limit', () => {
  assert.match(source, /const MAX_PHOTO_SIZE_MB = 5/);
  assert.match(source, /if \(file\.size > MAX_PHOTO_SIZE_BYTES\)/);
  assert.match(source, /if \(!customer\) \{\s*update\(\{ photoUrl:\s*''/);
  assert.doesNotMatch(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /return;\s*\}\s*setUploadingPhoto\(true\);/);
  assert.match(source, /Tối đa \{MAX_PHOTO_SIZE_MB\}MB/);
  assert.doesNotMatch(source, /Tối đa 10MB/);
});
