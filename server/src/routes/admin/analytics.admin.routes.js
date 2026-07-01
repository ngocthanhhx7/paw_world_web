const router = require('express').Router();
const ctrl = require('../../controllers/admin/analytics.admin.controller');
const { requireAdmin } = require('../../middlewares/auth');

router.use(requireAdmin);

router.get('/overview', ctrl.overview);
router.get('/traffic-sources', ctrl.trafficSources);
router.get('/funnel', ctrl.funnel);
router.get('/ai-usage', ctrl.aiUsage);
router.get('/pages', ctrl.pages);
router.post('/ai-report/generate', ctrl.generateReport);

module.exports = router;
