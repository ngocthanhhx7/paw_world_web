import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('./ContactRequestPage.jsx', import.meta.url), 'utf8');

describe('ContactRequestPage design contract', () => {
  it('uses the available Figma decorative assets for the help-center screen', () => {
    assert.match(source, /\/assets\/icon\/khac\/pets\.svg/);
    assert.match(source, /\/assets\/icon\/khac\/OBJECTS\.svg/);
    assert.match(source, /\/assets\/cat\/image 154\.png/);
  });

  it('matches the Figma contact/help content structure', () => {
    assert.match(source, /CHÚNG MÌNH GIÚP ĐƯỢC GÌ NÈ\?/);
    assert.match(source, /DANH MỤC HỖ TRỢ/);
    assert.match(source, /HƯỚNG DẪN MUA HÀNG/);
    assert.match(source, /GIAO HÀNG & ĐỔI TRẢ/);
    assert.match(source, /CÂU HỎI THƯỜNG GẶP/);
    assert.match(source, /CÂU HỎI NỔI BẬT/);
    assert.match(source, /CHƯA TÌM THẤY CÂU TRẢ LỜI\?/);
    assert.match(source, /CHAT VỚI CHUYÊN VIÊN/);
  });

  it('does not keep the old lead capture form on the Figma help page', () => {
    assert.doesNotMatch(source, /leadApi/);
    assert.doesNotMatch(source, /Gửi yêu cầu tư vấn/);
  });
});
