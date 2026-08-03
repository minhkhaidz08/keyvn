const { admin } = require('../config/supabase');
const crypto = require('crypto');
const { ok, sanitizeLimit } = require('../utils/helpers');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { submitCard, PARTNER_ID } = require('../services/thesieure.service');
const { createPaymentLink } = require('../services/payos.service');

const summary = asyncHandler(async (req, res) => {
  const { data: wallet } = await admin
    .from('wallets')
    .select('*')
    .eq('user_id', req.userId)
    .single();

  ok(res, wallet || { balance: 0 });
});

const transactions = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const limit = sanitizeLimit(req.query.limit, 100, 200);
  let query = admin
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw new AppError('Failed to fetch transactions', 500);
  ok(res, data || []);
});

/**
 * POST /api/wallet/deposit/card
 * body: { card_type, pin, serial, amount }
 */
const depositCard = asyncHandler(async (req, res) => {
  // The placeholder value from the template .env is truthy, so also treat it
  // as "not configured" to avoid burning real cards against a fake merchant.
  const notConfigured = !PARTNER_ID || PARTNER_ID === 'your_partner_id' || PARTNER_ID.startsWith('your_');
  if (notConfigured) throw new AppError('Nạp thẻ hiện chưa được kích hoạt (thiếu cấu hình TheSieuRe)', 503);

  const { card_type, pin, serial, amount } = req.body;
  if (!card_type || !pin || !serial || !amount) {
    throw new AppError('Vui lòng nhập đầy đủ: loại thẻ, mã thẻ, serial, mệnh giá');
  }

  const validTypes = ['VIETTEL', 'VINAPHONE', 'MOBIFONE', 'VIETNAMOBILE', 'ZING', 'GARENA'];
  if (!validTypes.includes(String(card_type).toUpperCase())) {
    throw new AppError('Loại thẻ không hỗ trợ');
  }

  const validAmounts = [10000, 20000, 50000, 100000, 200000, 300000, 500000, 1000000];
  if (!validAmounts.includes(Number(amount))) {
    throw new AppError('Mệnh giá thẻ không hợp lệ');
  }

  const cleanPin = String(pin).trim();
  const cleanSerial = String(serial).trim();
  if (cleanPin.length < 8 || cleanPin.length > 40) {
    throw new AppError('Mã thẻ (PIN) không hợp lệ');
  }
  if (cleanSerial.length < 8 || cleanSerial.length > 40) {
    throw new AppError('Serial không hợp lệ');
  }

  const paymentCode = await submitCard({
    userId: req.userId,
    cardType: String(card_type).toUpperCase(),
    pin: cleanPin,
    serial: cleanSerial,
    amount: Number(amount),
  });

  ok(res, { payment_code: paymentCode }, 'Thẻ đã được gửi đi, hệ thống sẽ tự động xác nhận');
});

/**
 * POST /api/wallet/deposit/bank
 * body: { amount, description? }
 * Returns PayOS checkout URL + QR code
 */
const depositBank = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || amount < 10000 || amount > 100000000) {
    throw new AppError('Số tiền nạp từ 10.000đ đến 100.000.000đ');
  }

  const returnUrl = req.body.returnUrl || `${process.env.FRONTEND_URL || ''}/#/wallet?deposit=done`;
  const cancelUrl = req.body.cancelUrl || `${process.env.FRONTEND_URL || ''}/#/wallet`;

  // Unique 8-char transfer content: sha256(user's name + user id) -> 8 hex chars.
  // Mixing in the user id guarantees distinct codes even when two users share
  // the exact same display name, so deposits can never be confused.
  const { data: profile } = await admin
    .from('users')
    .select('name')
    .eq('id', req.userId)
    .maybeSingle();
  const namePart = String(profile?.name || '').trim();
  const content = crypto
    .createHash('sha256')
    .update(`${namePart}:${req.userId}`, 'utf8')
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();

  const link = await createPaymentLink({
    userId: req.userId,
    amount,
    description: content,
    cancelUrl,
    returnUrl,
  });

  ok(res, link, 'Đã tạo yêu cầu nạp tiền, vui lòng quét QR hoặc bấm vào link thanh toán');
});

/**
 * POST /api/wallet/deposit/bank/verify - poll PayOS status
 */
const verifyBankDeposit = asyncHandler(async (req, res) => {
  const { payment_code } = req.body;
  if (!payment_code) throw new AppError('payment_code is required');

  const { data: payment, error } = await admin
    .from('payments')
    .select('*')
    .eq('payment_code', payment_code)
    .eq('user_id', req.userId)
    .maybeSingle();
  if (error || !payment) throw new AppError('Payment not found', 404);

  ok(res, { status: payment.status });
});

module.exports = {
  walletController: { summary, transactions, depositCard, depositBank, verifyBankDeposit },
};
