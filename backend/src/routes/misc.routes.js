const router = require('express').Router();
const { miscController } = require('../controllers/misc.controller');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.get('/news', miscController.listNews);
router.get('/news/:id', miscController.newsDetail);
router.get('/settings/public', miscController.publicSettings);

// Protected
router.post('/upload', authMiddleware, upload.single('file'), miscController.uploadFile);

module.exports = router;
