const express = require('express');
const { requireCustomer } = require('../middlewares/auth');
const ctrl = require('../controllers/petProfile.controller');

const router = express.Router();

router.use(requireCustomer);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.get);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/recommendation', ctrl.recommendation);

module.exports = router;
