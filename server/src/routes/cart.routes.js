const router = require('express').Router();
const ctrl = require('../controllers/cart.controller');

router.get('/', ctrl.getCart);
router.post('/combo-items', ctrl.addComboItems);
router.post('/items', ctrl.addItem);
router.put('/items', ctrl.updateItem);
router.delete('/items/:productId', ctrl.removeItem);
router.delete('/', ctrl.clearCart);

module.exports = router;
