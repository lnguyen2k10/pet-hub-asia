const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Nạp biến môi trường
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Thiếu VITE_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const inputFile = path.resolve(__dirname, '../parsed_trangvang_shops.json');

async function importShops() {
  if (!fs.existsSync(inputFile)) {
    console.error("❌ Không tìm thấy file:", inputFile);
    return;
  }

  const rawData = fs.readFileSync(inputFile, 'utf-8');
  let shops = [];
  try {
    shops = JSON.parse(rawData);
  } catch(e) {
    console.error("❌ File JSON không hợp lệ.");
    return;
  }

  console.log(`🚀 Bắt đầu import ${shops.length} cửa hàng vào Database...`);
  
  let successCount = 0;
  let failCount = 0;

  for (const shop of shops) {
    // Bỏ qua các mục không hợp lệ ở cuối file
    if (!shop.name || shop.name.includes("Mục lục ngành nghề") || shop.name.includes("Đưa doanh nghiệp của bạn")) {
      continue;
    }

    // Tách City từ Address (Giả định: Hà Nội, Hồ Chí Minh, Đà Nẵng...)
    let city = 'Khác';
    if (shop.address.includes('Hà Nội')) city = 'Hà Nội';
    else if (shop.address.includes('Hồ Chí Minh') || shop.address.includes('HCM')) city = 'Hồ Chí Minh';
    else if (shop.address.includes('Đà Nẵng')) city = 'Đà Nẵng';
    else if (shop.address.includes('Bình Dương')) city = 'Bình Dương';
    else if (shop.address.includes('Đồng Nai')) city = 'Đồng Nai';
    
    // Lấy banner từ hình ảnh đầu tiên nếu có, logo từ thuộc tính logo
    const coverUrl = shop.images && shop.images.length > 0 ? shop.images[0] : null;
    
    // Tạo slug từ tên (đơn giản)
    const slug = shop.name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
      .replace(/[^a-z0-9]+/g, '-') // Thay thế ký tự đặc biệt bằng dấu gạch ngang
      .replace(/(^-|-$)+/g, '') // Xóa gạch ngang ở đầu và cuối
      + '-' + Math.random().toString(36).substring(2, 7); // Thêm random để đảm bảo unique

    const payload = {
      name: shop.name.substring(0, 255),
      slug: slug,
      description: shop.description ? shop.description.substring(0, 1000) : null,
      address: shop.address,
      city: city,
      phone: shop.phone ? shop.phone.substring(0, 50) : null,
      email: shop.email ? shop.email.substring(0, 255) : null,
      website: shop.website ? shop.website.substring(0, 255) : null,
      logo_url: shop.logo || null,
      cover_url: coverUrl,
      category: 'pet-shop', // Mặc định
      is_published: true
    };

    const { data, error } = await supabase
      .from('shops')
      .insert(payload)
      .select();

    if (error) {
      console.error(`❌ Lỗi import [${shop.name}]:`, error.message);
      failCount++;
    } else {
      console.log(`✅ Đã import: ${shop.name}`);
      successCount++;
    }
  }

  console.log("=====================================");
  console.log(`🎉 HOÀN TẤT IMPORT! Thành công: ${successCount} | Thất bại: ${failCount}`);
  console.log("=====================================");
}

importShops();
