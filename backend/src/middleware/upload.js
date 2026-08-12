const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) return cb(null, true);
  return cb(new Error('Chỉ chấp nhận file ảnh hoặc video định dạng JPG, PNG, WEBP, GIF, MP4, WEBM, MOV'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
});

module.exports = upload;
