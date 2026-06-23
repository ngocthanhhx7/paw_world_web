import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const loginSource = readFileSync(new URL('./LoginPage.jsx', import.meta.url), 'utf8');
const endpointsSource = readFileSync(new URL('../../../api/endpoints.js', import.meta.url), 'utf8');
const storeSource = readFileSync(new URL('../../../store/customerAuthStore.js', import.meta.url), 'utf8');

test('customer auth endpoints expose Google login API', () => {
  assert.match(
    endpointsSource,
    /googleLogin:\s*\(payload\)\s*=>\s*api\.post\('\/auth\/customer\/google',\s*payload\)/,
  );
});

test('customer auth store logs in with Google credential and stores returned customer', () => {
  assert.match(storeSource, /googleLogin:\s*async\s*\(credential\)\s*=>/);
  assert.match(storeSource, /customerAuthApi\.googleLogin\(\{\s*credential\s*\}\)/);
  assert.match(storeSource, /set\(\{\s*customer:\s*data\.customer\s*\|\|\s*null\s*\}\)/);
});

test('LoginPage Google button uses Google Identity Services instead of development toast', () => {
  assert.match(loginSource, /VITE_GOOGLE_CLIENT_ID/);
  assert.match(loginSource, /accounts\.id\.initialize/);
  assert.match(loginSource, /accounts\.id\.renderButton/);
  assert.match(loginSource, /googleLogin\(response\.credential\)/);
  assert.doesNotMatch(loginSource, /Tiếp tục với Google[^]*onClick=\{socialToast\}/);
});
test('customer auth removes Facebook login API surface', () => {
  assert.doesNotMatch(endpointsSource, /facebookLogin/);
  assert.doesNotMatch(endpointsSource, /\/auth\/customer\/facebook/);
  assert.doesNotMatch(storeSource, /facebookLogin/);
  assert.doesNotMatch(loginSource, /VITE_FACEBOOK_APP_ID/);
  assert.doesNotMatch(loginSource, /connect\.facebook\.net/);
  assert.doesNotMatch(loginSource, /FB\.login|FB\.init|fbAsyncInit/);
  assert.doesNotMatch(loginSource, /Tiáº¿p tá»¥c vá»›i Facebook|Facebook Login/);
});
