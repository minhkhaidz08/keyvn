const axios = require('axios');

const sendTelegramMessage = async (msg) => {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return;
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Lỗi khi gửi thông báo Telegram:', error?.response?.data || error.message);
  }
};

const formatMoney = (amount) => {
  return Number(amount).toLocaleString('vi-VN') + 'đ';
};

const notifyNewOrder = async (orders) => {
  if (!orders || orders.length === 0) return;
  
  for (const o of orders) {
    const msg = `🛒 <b>CÓ ĐƠN MUA KEY MỚI</b>
━━━━━━━━━━━━━━━━━━
🏷 <b>Mã đơn:</b>
👉 <code>${o.order_code}</code>

📦 <b>Sản phẩm:</b>
👉 <b>${o.product_name}</b>

🔖 <b>Loại key:</b>
👉 ${o.variant_name || 'Mặc định'}

🔑 <b>Key đã giao:</b>
👉 <code>${o.key_value}</code>

💰 <b>Thành tiền:</b>
👉 ${formatMoney(o.price)}

✅ <b>Trạng thái:</b>
👉 Đã thanh toán tự động
━━━━━━━━━━━━━━━━━━`;
    await sendTelegramMessage(msg);
  }
};

const notifyNewCustomOrder = async (o, userEmail) => {
  if (!o) return;
  const msg = `📦 <b>CÓ ĐƠN ĐẶT HÀNG MỚI</b>
━━━━━━━━━━━━━━━━━━
🏷 <b>Mã đơn:</b>
👉 <code>${o.order_code}</code>

👤 <b>Khách hàng:</b>
👉 ${userEmail || 'Không rõ'}

📦 <b>Sản phẩm:</b>
👉 <b>${o.product_name}</b>

📊 <b>Số lượng:</b>
👉 ${o.qty || 1}

💰 <b>Thành tiền:</b>
👉 ${formatMoney(o.paid_amount)}

📝 <b>Ghi chú:</b>
👉 ${o.note || 'Không có'}

⏳ <b>Trạng thái:</b>
👉 Chờ Admin vào giao key
━━━━━━━━━━━━━━━━━━`;
  await sendTelegramMessage(msg);
};

module.exports = {
  sendTelegramMessage,
  notifyNewOrder,
  notifyNewCustomOrder
};
