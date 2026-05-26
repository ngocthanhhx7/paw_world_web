const router = require('express').Router();
const ctrl = require('../../controllers/admin/stat.admin.controller');
const { requireAdmin } = require('../../middlewares/auth');

router.use(requireAdmin);

router.get('/overview', ctrl.overview);

module.exports = router;
