const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = file.originalname
      .replace(ext, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-_]/g, '-')
      .slice(0, 40);
    cb(null, `${Date.now()}-${safe || 'image'}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif, svg)'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
