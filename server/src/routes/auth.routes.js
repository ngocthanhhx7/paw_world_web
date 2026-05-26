const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { requireAdmin } = require('../middlewares/auth');

router.post('/admin/login', ctrl.login);
router.get('/admin/me', requireAdmin, ctrl.me);
router.post('/admin/logout', ctrl.logout);

module.exports = router;
