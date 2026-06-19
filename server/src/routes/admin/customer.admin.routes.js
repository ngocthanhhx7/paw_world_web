const router = require('express').Router();
const ctrl = require('../../controllers/admin/customer.admin.controller');
const { requireAdmin } = require('../../middlewares/auth');

router.use(requireAdmin);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.patch('/:id/status', ctrl.updateStatus);

module.exports = router;
