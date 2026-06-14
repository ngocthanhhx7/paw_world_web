import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('./RecommendationPage.jsx', import.meta.url), 'utf8');
const endpointsSource = readFileSync(new URL('../../../api/endpoints.js', import.meta.url), 'utf8');
const cartStoreSource = readFileSync(new URL('../../../store/cartStore.js', import.meta.url), 'utf8');

test('recommendation API posts duration payload and cart combo API posts combo items', () => {
  assert.match(endpointsSource, /recommend:\s*\(id,\s*payload\s*=\s*\{\}\)\s*=>\s*api\.post\(`\/customer\/pet-profiles\/\$\{id\}\/recommendation`,\s*payload,\s*\{\s*timeout:\s*45000\s*\}\)/);
  assert.match(endpointsSource, /addCombo:\s*\(payload\)\s*=>\s*api\.post\('\/cart\/combo-items',\s*payload\)/);
  assert.match(cartStoreSource, /addCombo:\s*async\s*\(payload\)\s*=>/);
  assert.match(cartStoreSource, /cartApi\.addCombo\(payload\)/);
});

test('RecommendationPage uses recommended products as an interactive hero carousel', () => {
  assert.match(source, /const \[activeProductIndex,\s*setActiveProductIndex\] = useState\(0\)/);
  assert.match(source, /const carouselProducts = products\.length \? products : \[primaryProduct\]/);
  assert.match(source, /const activeProduct = carouselProducts\[activeProductIndex\] \|\| primaryProduct/);
  assert.match(source, /function showPreviousProduct\(\)/);
  assert.match(source, /function showNextProduct\(\)/);
  assert.match(source, /setActiveProductIndex\(0\)/);
  assert.match(source, /onClick=\{showPreviousProduct\}/);
  assert.match(source, /onClick=\{showNextProduct\}/);
  assert.match(source, /carouselProducts\.map\(\(product,\s*index\) =>/);
});

test('RecommendationPage derives main ingredient card from recommended products', () => {
  assert.match(source, /const PRODUCT_ROLE_ORDER =/);
  assert.match(source, /const mainIngredientProducts = useMemo\(\(\) =>/);
  assert.match(source, /mainIngredientProducts\.map\(\(product,\s*index\) =>/);
  assert.match(source, /ingredientBodyText\(product\)/);
  assert.doesNotMatch(source, /\/assets\/cat\/image 649\.png/);
  assert.doesNotMatch(source, /\/assets\/cat\/image 650\.png/);
  assert.doesNotMatch(source, /Thá»‹t gÃ  tÆ°Æ¡i/);
  assert.doesNotMatch(source, /CÃ  rá»‘t/);
});

test('RecommendationPage asks duration before requesting recommendation', () => {
  assert.match(source, /const durationOptions = \[/);
  assert.match(source, /durationDays:\s*1/);
  assert.match(source, /durationDays:\s*7/);
  assert.match(source, /durationDays:\s*30/);
  assert.match(source, /if \(!selectedDurationDays\) return;/);
  assert.match(source, /petProfileApi\.recommend\(profileId,\s*\{\s*durationDays:\s*selectedDurationDays\s*\}\)/);
});

test('RecommendationPage adds all DB products as a combo with quantities and safe fallback', () => {
  assert.match(source, /const addCombo = useCartStore\(\(s\) => s\.addCombo\)/);
  assert.match(source, /function getProductQuantity\(product\)/);
  assert.match(source, /const cartableProducts = products\.filter\(isDbProduct\)/);
  assert.match(source, /cartableProducts\.reduce/);
  assert.doesNotMatch(source, /products\.reduce\(\(sum, product\) => sum \+ Number\(product\.price \|\| product\.finalPrice \|\| 0\) \* getProductQuantity\(product\), 0\)/);
  assert.match(source, /await addCombo\(\{\s*items:\s*cartableProducts\.map/);
  assert.match(source, /quantity:\s*getProductQuantity\(product\)/);
  assert.match(source, /toast\.error\([^)]*danh m\u1ee5c/i);
  assert.match(source, /navigate\('\/danh-muc'\)/);
  assert.doesNotMatch(source, /addToCart\(getProductId\(dbProducts\[0\]\),\s*1\)/);
});

test('RecommendationPage keeps route visuals while replacing hardcoded profile details', () => {
  assert.match(source, /const \{ profileId \} = useParams\(\)/);
  assert.match(source, /profile\?\.name/);
  assert.match(source, /foodTypeLabel\(primaryProduct\.foodType/);
  assert.match(source, /selectedDurationDays/);
  assert.doesNotMatch(source, /Milo/);
  assert.doesNotMatch(source, /Pun/);
});

test('RecommendationPage displays server-normalized package quantity details', () => {
  assert.match(source, /function quantityDetailText\(product\)/);
  assert.match(source, /product\?\.packageLabel/);
  assert.match(source, /product\?\.quantityBasis/);
  assert.match(source, /product\?\.estimatedDaysCovered/);
  assert.match(source, /product\?\.servingNote/);
  assert.match(source, /Số lượng trong combo/);
});
