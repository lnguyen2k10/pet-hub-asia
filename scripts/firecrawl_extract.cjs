const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Load biến môi trường từ file .env ở thư mục gốc
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.VITE_FIRECRAWL_API_KEY;
if (!API_KEY) {
  console.error("❌ Lỗi: Không tìm thấy VITE_FIRECRAWL_API_KEY trong file .env!");
  process.exit(1);
}

// -------------------------------------------------------------
// CẤU HÌNH CÁC ĐƯỜNG LINK CẦN CÀO (DỄ DÀNG THÊM/BỚT)
// -------------------------------------------------------------
// Bạn có thể bỏ URL của trang vàng (danh sách theo tỉnh) hoặc Toplist vào đây.
// Ví dụ: Trang Vàng có cấu trúc URL phân trang
const urlsToScrape = [
  // -- Thú Cưng (Pet Shop / Vet) --
  "https://trangvangvietnam.com/categories/468840/phong-kham-thu-y.html",
  "https://trangvangvietnam.com/categories/468840/phong-kham-thu-y.html?page=2",
  "https://trangvangvietnam.com/categories/468840/phong-kham-thu-y.html?page=3",
  // Thêm page 4, 5, 6... tương tự

  // -- Làm Đẹp (Spa / Thẩm Mỹ - Để dành cho dự án sau) --
  "https://trangvangvietnam.com/categories/436660/spa-cham-soc-da.html",
  "https://trangvangvietnam.com/categories/436660/spa-cham-soc-da.html?page=2",
];

// -------------------------------------------------------------
// SCHEMA ĐỊNH NGHĨA DỮ LIỆU
// -------------------------------------------------------------
const schema = {
  type: "object",
  properties: {
    shops: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Tên công ty, cửa hàng hoặc phòng khám" },
          address: { type: "string", description: "Địa chỉ chi tiết" },
          phone: { type: "string", description: "Số điện thoại liên hệ" },
          website: { type: "string", description: "URL Website hoặc Fanpage (nếu có)" },
          email: { type: "string", description: "Địa chỉ Email (nếu có)" },
          category: { type: "string", description: "Phân loại: 'Thú Y', 'Pet Shop' hoặc 'Spa Làm Đẹp'" }
        },
        required: ["name", "address", "phone"]
      }
    }
  },
  required: ["shops"]
};

// -------------------------------------------------------------
// HÀM TIỆN ÍCH
// -------------------------------------------------------------
// Tạo độ trễ ngẫu nhiên từ min đến max (ms) để chống bị chặn
const sleep = (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  console.log(`⏳ Tạm nghỉ ${ms / 1000}s để tránh bị block...`);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// -------------------------------------------------------------
// LOGIC CÀO DỮ LIỆU BẰNG FIRECRAWL
// -------------------------------------------------------------
async function extractData(url, retryCount = 0) {
  console.log(`\n🚀 Bắt đầu cào: ${url}`);
  try {
    const response = await axios.post(
      "https://api.firecrawl.dev/v1/scrape",
      {
        url: url,
        formats: ["extract"],
        extract: {
          schema: schema,
          prompt: "Trích xuất danh sách tất cả các phòng khám, cửa hàng, công ty được liệt kê trong trang web này. Bao gồm tên, địa chỉ, số điện thoại, website, email và lĩnh vực kinh doanh."
        }
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 60000 // Timeout 60s
      }
    );

    if (response.data && response.data.success) {
      return response.data.data.extract.shops || [];
    }
    
    console.warn("⚠️ API không trả về lỗi, nhưng không có dữ liệu.");
    return [];
  } catch (error) {
    const status = error.response?.status;
    console.error(`❌ Lỗi khi cào ${url} (Status: ${status || "Network"}):`, error.response?.data?.error || error.message);
    
    // Thử lại nếu gặp lỗi 429 (Rate Limit) hoặc 5xx (Server Error)
    if ((status === 429 || status >= 500) && retryCount < 3) {
      console.log(`♻️ Đang thử lại lần ${retryCount + 1}...`);
      await sleep(10000, 15000); // Đợi 10-15s rồi thử lại
      return extractData(url, retryCount + 1);
    }
    return [];
  }
}

// -------------------------------------------------------------
// CHƯƠNG TRÌNH CHÍNH
// -------------------------------------------------------------
async function run() {
  const outputFile = path.resolve(__dirname, "../scraped_shops.json");
  
  // Đọc dữ liệu cũ nếu script bị dừng giữa chừng (Tính năng Resume)
  let allShops = [];
  if (fs.existsSync(outputFile)) {
    try {
      allShops = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
      console.log(`📂 Đã load ${allShops.length} shops từ lần chạy trước.`);
    } catch (e) {
      console.warn("⚠️ File scraped_shops.json bị lỗi, sẽ ghi đè.");
    }
  }

  for (let i = 0; i < urlsToScrape.length; i++) {
    const url = urlsToScrape[i];
    const shops = await extractData(url);
    
    if (shops.length > 0) {
      allShops = allShops.concat(shops);
      console.log(`✅ Lấy thành công ${shops.length} shops.`);
      
      // Ghi ra file NGAY LẬP TỨC để tránh mất dữ liệu nếu cúp điện / crash
      fs.writeFileSync(outputFile, JSON.stringify(allShops, null, 2), "utf-8");
      console.log(`💾 Đã lưu dữ liệu tạm thời vào file scraped_shops.json`);
    } else {
      console.log(`⚠️ Không tìm thấy shop nào ở link này.`);
    }

    // Nghỉ ngơi giữa các vòng lặp (Random từ 3s - 7s)
    if (i < urlsToScrape.length - 1) {
      await sleep(3000, 7000);
    }
  }
  
  console.log(`\n🎉 HOÀN THÀNH! Tổng cộng thu được: ${allShops.length} shops.`);
}

run();
