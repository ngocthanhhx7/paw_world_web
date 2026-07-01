const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const analyticsRateLimit = require('../middlewares/analyticsRateLimit');

router.use(analyticsRateLimit());

router.post('/session/start', ctrl.startSession);
router.post('/session/heartbeat', ctrl.heartbeat);
router.post('/page-view', ctrl.pageView);
router.post('/event', ctrl.event);

module.exports = router;
