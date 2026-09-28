const FirecrawlApp = require('@mendable/firecrawl-js').default;
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = new FirecrawlApp({ apiKey: process.env.VITE_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY });
const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const urls = [
    'https://toplist.vn/top-list/dia-chi-ban-meo-canh-dep-va-chat-luong-nhat-thanh-pho-ho-chi-minh-35004.htm',
    'https://toplist.vn/top-list/shop-ban-phu-kien-cho-thu-cung-o-ha-noi-9804.htm'
  ];

  console.log('🚀 Đang dùng AI của Firecrawl để đọc 2 bài viết từ Toplist...');

  try {
    let successCount = 0;
    
    for (const url of urls) {
      console.log(`Đang đọc: ${url}`);
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url: url,
          formats: ["extract"],
          extract: {
            prompt: "Hãy trích xuất danh sách tất cả các cửa hàng thú cưng (pet shop) hoặc địa điểm bán thú cưng được nhắc đến trong bài viết này. Với mỗi cửa hàng, hãy tìm Tên, Địa chỉ, Số điện thoại, Fanpage/Website, Mô tả về cửa hàng (dài khoảng 2-3 câu), và link Hình Ảnh cửa hàng. Nếu thiếu thông tin nào thì để rỗng.",
            schema: {
              type: "object",
              properties: {
                shops: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      address: { type: "string" },
                      phone: { type: "string" },
                      fanpage: { type: "string" },
                      website: { type: "string" },
                      description: { type: "string" },
                      image_url: { type: "string" }
                    },
                    required: ["name", "address"]
                  }
                }
              }
            }
          }
        })
      });

      const data = await response.json();

      if (data.success && data.data && data.data.extract && data.data.extract.shops) {
        const shops = data.data.extract.shops;
        console.log(`✅ Lấy được ${shops.length} shop từ link này. Đang lưu DB...`);
        for (const shop of shops) {
          let city = 'Khác';
          if (shop.address.includes('Hà Nội')) city = 'Hà Nội';
          else if (shop.address.includes('Hồ Chí Minh') || shop.address.includes('HCM') || shop.address.includes('Thủ Đức')) city = 'Hồ Chí Minh';

          const slug = shop.name
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
            + '-' + Math.random().toString(36).substring(2, 7);

          const payload = {
            name: shop.name.substring(0, 255),
            slug: slug,
            description: shop.description ? shop.description.substring(0, 1000) : null,
            address: shop.address,
            city: city,
            phone: shop.phone ? shop.phone.substring(0, 50) : null,
            fanpage: shop.fanpage ? shop.fanpage.substring(0, 255) : null,
            website: shop.website ? shop.website.substring(0, 255) : null,
            cover_url: shop.image_url || null,
            category: 'pet-shop',
            is_published: true
          };
          await supabase.from('shops').insert(payload);
          successCount++;
        }
      } else {
        console.log(`❌ Không lấy được dữ liệu từ link này:`, data);
      }
    }
    console.log(`🎉 Đã nạp thành công tổng cộng ${successCount} cửa hàng vào Database!`);
  } catch (err) {
    console.error("❌ Lỗi gọi API:", err.message);
  }
}

run();
