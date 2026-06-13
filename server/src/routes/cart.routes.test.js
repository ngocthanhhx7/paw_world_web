const assert = require('node:assert/strict');
const test = require('node:test');

const router = require('./cart.routes');

test('cart routes expose POST /combo-items', () => {
  const hasComboRoute = router.stack.some((layer) => {
    return layer.route?.path === '/combo-items' && layer.route?.methods?.post === true;
  });

  assert.equal(hasComboRoute, true);
});
