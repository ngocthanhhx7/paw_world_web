const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { requireAdmin, requireCustomer, requireSameOriginJson } = require('../middlewares/auth');

router.post('/admin/login', ctrl.login);
router.get('/admin/me', requireAdmin, ctrl.me);
router.post('/admin/logout', ctrl.logout);

router.post('/customer/register', requireSameOriginJson, ctrl.customerRegister);
router.post('/customer/login', requireSameOriginJson, ctrl.customerLogin);
router.post('/customer/google', requireSameOriginJson, ctrl.customerGoogleLogin);
router.get('/customer/me', requireCustomer, ctrl.customerMe);
router.post('/customer/logout', requireSameOriginJson, ctrl.customerLogout);
router.post('/customer/forgot-password', requireSameOriginJson, ctrl.customerForgotPassword);
router.post('/customer/reset-password', requireSameOriginJson, ctrl.customerResetPassword);

module.exports = router;
