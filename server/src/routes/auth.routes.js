const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { requireAdmin, requireCustomer } = require('../middlewares/auth');

router.post('/admin/login', ctrl.login);
router.get('/admin/me', requireAdmin, ctrl.me);
router.post('/admin/logout', ctrl.logout);

router.post('/customer/register', ctrl.customerRegister);
router.post('/customer/login', ctrl.customerLogin);
router.get('/customer/me', requireCustomer, ctrl.customerMe);
router.post('/customer/logout', ctrl.customerLogout);
router.post('/customer/forgot-password', ctrl.customerForgotPassword);
router.post('/customer/reset-password', ctrl.customerResetPassword);

module.exports = router;
