const router = require('express').Router();
const ctrl = require('../controllers/order.controller');

router.post('/', ctrl.create);
router.get('/:code', ctrl.getByCode);

module.exports = router;
