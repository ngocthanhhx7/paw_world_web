const router = require('express').Router();
const ctrl = require('../controllers/lead.controller');

router.post('/', ctrl.create);

module.exports = router;
