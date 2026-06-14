import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('./MeowQuizzLayout.jsx', import.meta.url), 'utf8');

test('MeowQuizzLayout renders the shared screenshot stepper shell', () => {
  assert.match(source, /meow-shell-stepper/);
  assert.match(source, /meow-shell-mobile-stepper/);
  assert.match(source, /Thú cưng của bạn/);
  assert.match(source, /Thực đơn/);
  assert.match(source, /Đặt hàng/);
  assert.match(source, /assets\/logo\/ngang\.png/);
  assert.doesNotMatch(source, /ChatbotWidget/);
  assert.doesNotMatch(source, /Meow Quizz progress[^]*max-lg:hidden/);
});

test('MeowQuizzLayout routes account icon by customer auth state', () => {
  assert.match(source, /useCustomerAuthStore/);
  assert.match(source, /const customer = useCustomerAuthStore\(\(s\) => s\.customer\)/);
  assert.match(source, /to=\{customer \? '\/meow-quizz\/ho-so' : '\/dang-nhap'\}/);
});

test('MeowQuizzLayout only disables sticky header on pet profile edit route', () => {
  assert.match(source, /isEditingPetProfile/);
  assert.match(source, /\/\^\\\/meow-quizz\\\/ho-so\\\/\[\^\/\]\+\\\/chinh-sua\$\/\.test\(pathname\)/);
  assert.match(source, /isEditingPetProfile \? 'relative z-40' : 'sticky top-0 z-40'/);
});
