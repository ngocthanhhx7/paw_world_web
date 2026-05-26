const router = require('express').Router();
const ctrl = require('../../controllers/admin/product.admin.controller');
const { requireAdmin } = require('../../middlewares/auth');
const upload = require('../../middlewares/upload');

router.use(requireAdmin);

const productUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 8 },
]);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', productUpload, ctrl.create);
router.put('/:id', productUpload, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
