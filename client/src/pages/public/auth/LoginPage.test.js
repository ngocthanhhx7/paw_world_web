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
test('customer auth endpoints expose Facebook login API', () => {
  assert.match(
    endpointsSource,
    /facebookLogin:\s*\(payload\)\s*=>\s*api\.post\('\/auth\/customer\/facebook',\s*payload\)/,
  );
});

test('customer auth store logs in with Facebook access token and stores returned customer', () => {
  assert.match(storeSource, /facebookLogin:\s*async\s*\(accessToken\)\s*=>/);
  assert.match(storeSource, /customerAuthApi\.facebookLogin\(\{\s*accessToken\s*\}\)/);
  assert.match(storeSource, /set\(\{\s*customer:\s*data\.customer\s*\|\|\s*null\s*\}\)/);
});

test('LoginPage Facebook button uses Facebook SDK instead of development toast', () => {
  assert.match(loginSource, /VITE_FACEBOOK_APP_ID/);
  assert.match(loginSource, /connect\.facebook\.net\/vi_VN\/sdk\.js/);
  assert.match(loginSource, /FB\.init/);
  assert.match(loginSource, /FB\.login/);
  assert.match(loginSource, /scope:\s*'public_profile,email'/);
  assert.match(loginSource, /facebookLogin\(response\.authResponse\.accessToken\)/);
  assert.doesNotMatch(loginSource, /Facebook[^]*onClick=\{socialToast\}/);
});

test('LoginPage Facebook login clears loading when the SDK callback never returns', () => {
  assert.match(loginSource, /FACEBOOK_LOGIN_TIMEOUT_MS/);
  assert.match(loginSource, /setTimeout\(\(\)\s*=>\s*\{/);
  assert.match(loginSource, /setFacebookLoading\(false\)/);
  assert.match(loginSource, /clearTimeout\(timeoutId\)/);
});

test('LoginPage Facebook login reports SDK open failures with diagnostics', () => {
  assert.match(loginSource, /typeof window\.FB\.login !== 'function'/);
  assert.match(loginSource, /console\.error\('\[facebook-login\] FB\.login failed:', err\)/);
  assert.match(loginSource, /Khong mo duoc Facebook Login.*Kiem tra JavaScript SDK va mien duoc phep/);
});

test('LoginPage Facebook login passes a plain callback to the SDK', () => {
  assert.doesNotMatch(loginSource, /window\.FB\.login\(\s*async\s*\(/);
  assert.match(loginSource, /\(async\s*\(\)\s*=>\s*\{/);
});
