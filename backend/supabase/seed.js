/**
 * KeyHub - Seed script
 * Creates admin account, sample products, keys, settings, news and discount codes.
 *
 * Usage:
 *   1. Create tables first (run supabase/schema.sql in the Supabase SQL editor)
 *   2. npm run seed   (requires .env with SUPABASE_SERVICE_ROLE_KEY)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function upsertUser(email, data) {
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) {
    await supabase.from('users').update(data).eq('id', existing.id);
    return existing.id;
  }
  const { data: created, error } = await supabase
    .from('users')
    .insert({ email, ...data })
    .select('id')
    .single();
  if (error) throw error;
  return created.id;
}

async function ensureWallet(userId) {
  const { data: existing } = await supabase.from('wallets').select('id').eq('user_id', userId).maybeSingle();
  if (!existing) {
    await supabase.from('wallets').insert({ user_id: userId, balance: 0, total_deposited: 0, total_spent: 0 });
  }
}

async function seed() {
  console.log('[seed] Starting...');

  // 1. Admin + demo user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@keyhub.vn';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminId = await upsertUser(adminEmail, {
    password_hash: await bcrypt.hash(adminPassword, 10),
    name: 'Quản trị viên',
    role: 'admin',
    is_banned: false,
  });
  await ensureWallet(adminId);
  console.log(`[seed] Admin ready: ${adminEmail} / ${adminPassword}`);

  const demoId = await upsertUser('demo@keyhub.vn', {
    password_hash: await bcrypt.hash('Demo@123456', 10),
    name: 'Game thủ Demo',
    role: 'user',
    is_banned: false,
  });
  await ensureWallet(demoId);
  await supabase.from('wallets').update({ balance: 100000 }).eq('user_id', demoId);
  console.log('[seed] Demo user ready: demo@keyhub.vn / Demo@123456 (100.000đ)');

  // 2. Categories
  const categoryDefs = [
    { name: 'Tool Free Fire', slug: 'tool-free-fire', icon: '🎯', description: 'Công cụ hỗ trợ Free Fire', sort_order: 1, is_active: true },
    { name: 'Mod Free Fire', slug: 'mod-free-fire', icon: '🧩', description: 'Mod, hack menu Free Fire', sort_order: 2, is_active: true },
    { name: 'Dịch vụ', slug: 'dich-vu', icon: '🛎️', description: 'Dịch vụ đặt hàng, nạp hộ', sort_order: 3, is_active: true },
  ];
  const catIdByName = {};
  for (const def of categoryDefs) {
    const { data: existing } = await supabase.from('categories').select('id').eq('slug', def.slug).maybeSingle();
    if (existing) {
      catIdByName[def.name] = existing.id;
      await supabase.from('categories').update(def).eq('id', existing.id);
    } else {
      const { data: created } = await supabase.from('categories').insert(def).select('id').single();
      catIdByName[def.name] = created.id;
    }
  }
  console.log('[seed] Categories ready');

  // 3. Products
  const products = [
    {
      name: 'Tool Auto Bắn Free Fire VIP 1',
      slug: 'tool-auto-ban-ff-vip-1',
      short_description: 'Tool tự động bắn headshot, tăng độ chính xác, không lo bị khóa acc.',
      description: 'Tool Auto Bắn Free Fire VIP 1\n\n- Tự động ngắm headshot\n- Hỗ trợ tất cả server\n- Không cần root / không cần jailbreak\n- Bảo hành đổi key trọn đời nếu lỗi\n- Hướng dẫn sử dụng chi tiết kèm theo\n\nHình thức: Giao key ngay sau thanh toán.',
      price: 30000,
      original_price: 50000,
      category: 'Tool Free Fire',
      type: 'instant',
      badge: 'HOT',
      is_featured: true,
      is_hot: true,
      image_url: null,
    },
    {
      name: 'Tool Auto Bắn Free Fire VIP 2',
      slug: 'tool-auto-ban-ff-vip-2',
      short_description: 'Bản nâng cấp: lock aim, bắn nhanh x2, chống anti-cheat.',
      description: 'Tool Auto Bắn Free Fire VIP 2\n\n- Headshot 100% (thấp ping)\n- Tốc độ bắn nhanh x2\n- Chống phát hiện anti-cheat\n- Hỗ trợ trực tiếp 24/7\n\nHình thức: Giao key ngay sau thanh toán.',
      price: 60000,
      original_price: 90000,
      category: 'Tool Free Fire',
      type: 'instant',
      badge: 'SALE',
      is_featured: true,
      is_sale: true,
      discount: 33,
      image_url: null,
    },
    {
      name: 'Mod Menu Free Fire MAX',
      slug: 'mod-menu-ff-max',
      short_description: 'Mod menu đầy đủ: x-ray, aimbot, ESP, wallhack.',
      description: 'Mod Menu Free Fire MAX\n\n- ESP nhìn xuyên vật cản\n- Aimbot tùy chỉnh độ nhạy\n- X-Ray\n- Cập nhật theo phiên bản game\n\nHình thức: Giao key ngay sau thanh toán.',
      price: 45000,
      category: 'Mod Free Fire',
      type: 'instant',
      badge: 'NEW',
      is_featured: true,
      image_url: null,
    },
    {
      name: 'Auto Thả Lửa Free Fire',
      slug: 'auto-tha-lua-ff',
      short_description: 'Tự động thả lửa khi đối thủ đến gần, bảo kê đồng đội.',
      description: 'Auto Thả Lửa Free Fire\n\n- Bật/tắt bằng phím nóng\n- Nhận diện kẻ địch trong bán kính cấu hình\n- Hoạt động nền nhẹ\n\nHình thức: Giao key ngay sau thanh toán.',
      price: 25000,
      category: 'Tool Free Fire',
      type: 'instant',
      image_url: null,
    },
    {
      name: 'Bắn Đầu Nhận Xu Free Fire',
      slug: 'ban-dau-nhan-xu-ff',
      short_description: 'Hack xu trải nghiệm, không ảnh hưởng tài khoản.',
      description: 'Bắn Đầu Nhận Xu Free Fire\n\n- Nhận xu trải nghiệm tự động\n- An toàn, không cần mật khẩu\n- Hoạt động tốt trên máy yếu\n\nHình thức: Giao key ngay sau thanh toán.',
      price: 20000,
      category: 'Tool Free Fire',
      type: 'instant',
      image_url: null,
    },
    {
      name: 'Garena FF - Nạp Hộ Xu',
      slug: 'nap-ho-xu-ff',
      short_description: 'Nhận nạp hộ xu giá rẻ, tiến hành trong 24h. Cung cấp UID + tên nhân vật.',
      description: 'Dịch vụ nạp hộ xu Free Fire giá rẻ\n\n- Giá tốt hơn chợ đen\n- Tiến hành trong 24h\n- Cần cung cấp UID, tên nhân vật, server\n- Admin liên hệ xác nhận khi hoàn thành\n\nHình thức: Đặt hàng, admin xử lý sau khi thanh toán.',
      price: 100000,
      original_price: 120000,
      category: 'Dịch vụ',
      type: 'custom',
      is_featured: true,
      image_url: null,
    },
    {
      name: 'Bùa May Mắn Free Fire 7 Ngày',
      slug: 'bua-may-man-ff-7ngay',
      short_description: 'Tăng tỉ lệ trúng skin, súng, nhân vật khi mở rương.',
      description: 'Bùa May Mắn Free Fire 7 Ngày\n\n- Tăng 30% tỉ lệ trúng đồ hiếm\n- Hiệu lực 7 ngày kể từ khi kích hoạt\n- Cung cấp UID, tên nhân vật\n\nHình thức: Đặt hàng, admin xử lý sau khi thanh toán.',
      price: 35000,
      category: 'Dịch vụ',
      type: 'custom',
      image_url: null,
    },
  ];

  for (const p of products) {
    const { data: existing } = await supabase.from('products').select('id').eq('slug', p.slug).maybeSingle();
    const row = { ...p, category_id: catIdByName[p.category] || null };
    if (existing) {
      await supabase.from('products').update(row).eq('id', existing.id);
      console.log(`[seed] Product updated: ${p.name}`);
    } else {
      await supabase.from('products').insert(row);
      console.log(`[seed] Product created: ${p.name}`);
    }
  }

  // 4. Inventory keys for instant products
  const { data: instantProducts } = await supabase
    .from('products')
    .select('id, slug')
    .eq('type', 'instant');

  for (const product of instantProducts) {
    const { data: count } = await supabase
      .from('inventory_keys')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', product.id)
      .eq('is_sold', false);

    if ((count?.count || 0) >= 20) continue;

    const needed = Math.max(0, 20 - (count?.count || 0));
    const rows = [];
    for (let i = 0; i < needed; i++) {
      rows.push({
        product_id: product.id,
        key_value: `KH-${product.slug.toUpperCase()}-${String(i + 1).padStart(3, '0')}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        is_sold: false,
      });
    }
    if (rows.length) await supabase.from('inventory_keys').insert(rows);
    console.log(`[seed] Added ${needed} keys for ${product.slug}`);
  }

  // 5. Settings
  const settings = [
    ['shop_name', 'KeyHub', 'Tên shop'],
    ['slogan', 'Key nhanh - Giá tốt - Uy tín hàng đầu', 'Khẩu hiệu'],
    ['logo_url', '', 'Logo'],
    ['banner_url', '', 'Banner'],
    ['main_color', '#7c3aed', 'Màu chủ đạo'],
    ['background_color', '#0b0f19', 'Màu nền'],
    ['facebook', 'https://facebook.com/keyhub', 'Facebook'],
    ['discord', 'https://discord.gg/keyhub', 'Discord'],
    ['telegram', 'https://t.me/keyhub', 'Telegram'],
    ['zalo', 'https://zalo.me/keyhub', 'Zalo'],
    ['email', 'support@keyhub.vn', 'Email hỗ trợ'],
    ['phone', '0987654321', 'Số điện thoại'],
    ['announcement', '🎁 Ưu đãi giảm 20% cho lần mua đầu tiên với mã WELCOME20', 'Thông báo'],
    ['notifications_enabled', 'true', 'Bật/tắt thông báo'],
    ['terms', 'Điều khoản sử dụng KeyHub...', 'Điều khoản'],
    ['privacy_policy', 'Chính sách bảo mật KeyHub...', 'Chính sách bảo mật'],
    ['payment_guide', 'Hướng dẫn thanh toán KeyHub...', 'Hướng dẫn thanh toán'],
  ];

  for (const [key, value, description] of settings) {
    const { data: existing } = await supabase.from('settings').select('id').eq('key', key).maybeSingle();
    if (existing) {
      await supabase.from('settings').update({ value, description }).eq('id', existing.id);
    } else {
      await supabase.from('settings').insert({ key, value, description });
    }
  }
  console.log('[seed] Settings ready');

  // 6. News
  const news = [
    {
      title: 'Chào mừng đến với KeyHub 🎉',
      content: 'KeyHub chính thức ra mắt! Shop chuyên cung cấp tool, mod và dịch vụ Free Fire với hệ thống giao key tự động 24/7. Chúc bạn có trải nghiệm mua hàng tốt nhất!',
      is_published: true,
    },
    {
      title: 'Sự kiện giảm giá đầu tháng',
      content: 'Trong 3 ngày đầu tháng, tất cả sản phẩm giảm 20% khi dùng mã THANG7. Nhanh tay săn deal nào!',
      is_published: true,
    },
  ];
  for (const n of news) {
    const { data: existing } = await supabase.from('news').select('id').eq('title', n.title).maybeSingle();
    if (existing) {
      await supabase.from('news').update({ content: n.content, is_published: n.is_published }).eq('id', existing.id);
    } else {
      await supabase.from('news').insert(n);
    }
  }
  console.log('[seed] News ready');

  // 7. Discount codes
  const codes = [
    { code: 'WELCOME20', discount_type: 'percent', value: 20, max_uses: 100, min_amount: 10000 },
    { code: 'GIAM10', discount_type: 'percent', value: 10, max_uses: 500, min_amount: 0 },
  ];
  for (const c of codes) {
    const { data: existing } = await supabase.from('discount_codes').select('id').eq('code', c.code).maybeSingle();
    if (!existing) await supabase.from('discount_codes').insert(c);
  }
  console.log('[seed] Discount codes ready');

  console.log('[seed] Done! ✅');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err.message);
  process.exit(1);
});
