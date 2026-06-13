import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('./ContactRequestPage.jsx', import.meta.url), 'utf8');
const floatingContactSource = readFileSync(new URL('../../components/layout/FloatingContact.jsx', import.meta.url), 'utf8');

describe('ContactRequestPage design contract', () => {
  it('uses the available Figma decorative assets for the help-center screen', () => {
    assert.match(source, /\/assets\/icon\/khac\/pets\.svg/);
    assert.match(source, /\/assets\/icon\/khac\/OBJECTS\.svg/);
    assert.match(source, /\/assets\/cat\/image 154\.png/);
  });

  it('matches the Figma contact/help content structure', () => {
    assert.match(source, /supportCategories/);
    assert.match(source, /featuredQuestions/);
    assert.match(source, /contactBlocks/);
    assert.match(source, /CHAT/);
  });

  it('does not keep the old lead capture form on the Figma help page', () => {
    assert.doesNotMatch(source, /leadApi/);
    assert.doesNotMatch(source, /create\(/);
  });

  it('uses the approved public hotline across contact surfaces', () => {
    assert.match(source, /0772211666/);
    assert.match(source, /support@pawworld\.vn/);
    assert.match(floatingContactSource, /tel:0772211666/);
    assert.match(floatingContactSource, /0772\.211\.666/);
    assert.doesNotMatch(floatingContactSource, /0909\.123\.456/);
    assert.doesNotMatch(floatingContactSource, /tel:0909123456/);
  });
});
