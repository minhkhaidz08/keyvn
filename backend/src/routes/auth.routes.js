const router = require('express').Router();
const { authController } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Đăng ký quá nhanh, vui lòng thử lại sau' });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Đăng nhập sai quá nhiều lần, thử lại sau 15 phút' });
const forgotLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Yêu cầu đặt lại mật khẩu quá nhiều lần' });
const resetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Thử đặt lại mật khẩu quá nhiều lần' });

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', forgotLimiter, authController.forgotPassword);
router.post('/reset-password', resetLimiter, authController.resetPassword);
router.get('/me', authMiddleware, authController.me);
router.put('/password', authMiddleware, authController.changePassword);
router.put('/avatar', authMiddleware, authController.updateAvatar);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
