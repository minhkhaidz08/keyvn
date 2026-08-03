const router = require('express').Router();
const { orderController } = require('../controllers/order.controller');
const { authMiddleware } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

router.use(authMiddleware);

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Thanh toán quá nhanh, vui lòng thử lại sau',
  keyFn: (req) => `u:${req.userId}`,
});

router.get('/', orderController.myOrders);
router.get('/:id', orderController.detail);
router.post('/checkout', checkoutLimiter, orderController.checkout);
router.post('/custom', orderController.createCustomOrder);
router.post('/cart/preview', orderController.previewCart);

module.exports = router;
