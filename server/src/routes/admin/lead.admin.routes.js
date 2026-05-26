const router = require('express').Router();
const ctrl = require('../../controllers/admin/lead.admin.controller');
const { requireAdmin } = require('../../middlewares/auth');

router.use(requireAdmin);

router.get('/', ctrl.list);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
