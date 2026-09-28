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
// 1. CẤU HÌNH CÁC ĐƯỜNG LINK CẦN CÀO & PHÂN LOẠI DATA
// -------------------------------------------------------------
const scrapingTasks = [
  {
    category: "pets",
    outputFile: path.resolve(__dirname, "../scraped_shops_pets.json"),
    urls: [
      "https://toplist.vn/top-list/phong-kham-thu-y-uy-tin-nhat-tai-tp-hcm-10023.htm",
      "https://toplist.vn/top-list/phong-kham-thu-y-uy-tin-nhat-ha-noi-10021.htm",
    ]
  },
  {
    category: "beauty",
    outputFile: path.resolve(__dirname, "../scraped_shops_beauty.json"),
    urls: [
      "https://toplist.vn/top-list/spa-lam-dep-uy-tin-nhat-ha-noi-2035.htm",
      "https://toplist.vn/top-list/spa-lam-dep-uy-tin-nhat-tp-hcm-2036.htm",
    ]
  }
];

// -------------------------------------------------------------
// 2. SCHEMA ĐỊNH NGHĨA DỮ LIỆU
// -------------------------------------------------------------
const schema = {
  type: "object",
  properties: {
    shops: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Tên công ty, cửa hàng, phòng khám hoặc Spa" },
          address: { type: "string", description: "Địa chỉ chi tiết" },
          phone: { type: "string", description: "Số điện thoại liên hệ" },
          website: { type: "string", description: "URL Website hoặc Fanpage (nếu có)" },
          email: { type: "string", description: "Địa chỉ Email (nếu có)" },
        },
        required: ["name", "address"]
      }
    }
  },
  required: ["shops"]
};

// -------------------------------------------------------------
// 3. HÀM TIỆN ÍCH
// -------------------------------------------------------------
const sleep = (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  console.log(`⏳ Tạm nghỉ ${ms / 1000}s...`);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// -------------------------------------------------------------
// 4. LOGIC CÀO DỮ LIỆU BẰNG FIRECRAWL
// -------------------------------------------------------------
async function extractData(url, categoryName, retryCount = 0) {
  console.log(`\n🚀 Đang lấy dữ liệu (${categoryName}): ${url}`);
  try {
    const response = await axios.post(
      "https://api.firecrawl.dev/v1/scrape",
      {
        url: url,
        formats: ["extract"],
        extract: {
          schema: schema,
          prompt: `Trích xuất chính xác các địa điểm/cửa hàng nằm trong BÀI VIẾT XẾP HẠNG CHÍNH (ví dụ: Top 10, Top 5). TUYỆT ĐỐI BỎ QUA các banner quảng cáo, quảng cáo công ty, hoặc các link bài viết liên quan ở cuối trang. Chỉ lấy các ${categoryName === 'pets' ? 'phòng khám thú y, cửa hàng thú cưng' : 'spa, thẩm mỹ viện'} thực sự. Bắt buộc có Tên và Số điện thoại hoặc Địa chỉ.`
        }
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 90000 
      }
    );

    if (response.data && response.data.success && response.data.data.extract) {
      const extracted = response.data.data.extract;
      if (extracted.shops) return extracted.shops;
      console.log("Debug extracted data:", extracted);
    } else {
      console.log("Debug full response:", JSON.stringify(response.data, null, 2));
    }
    
    console.warn("⚠️ Không lấy được mảng shops nào từ Firecrawl.");
    return [];
  } catch (error) {
    const status = error.response?.status;
    console.error(`❌ Lỗi (Status ${status}):`, error.response?.data?.error || error.message);
    
    if ((status === 429 || status >= 500) && retryCount < 3) {
      console.log(`♻️ Đang thử lại lần ${retryCount + 1}...`);
      await sleep(10000, 15000); 
      return extractData(url, categoryName, retryCount + 1);
    }
    return [];
  }
}

// -------------------------------------------------------------
// 5. CHƯƠNG TRÌNH CHÍNH
// -------------------------------------------------------------
async function run() {
  for (const task of scrapingTasks) {
    console.log(`\n=============================================================`);
    console.log(`📦 BẮT ĐẦU CÀO LĨNH VỰC: ${task.category.toUpperCase()}`);
    console.log(`=============================================================`);
    
    let allShops = [];
    if (fs.existsSync(task.outputFile)) {
      try {
        allShops = JSON.parse(fs.readFileSync(task.outputFile, "utf-8"));
        console.log(`📂 Đã load ${allShops.length} records cũ từ ${task.outputFile}`);
      } catch (e) {
        console.warn("⚠️ File cũ bị lỗi format, sẽ tạo mới hoàn toàn.");
      }
    }

    for (let i = 0; i < task.urls.length; i++) {
      const url = task.urls[i];
      const shops = await extractData(url, task.category);
      
      if (shops && shops.length > 0) {
        allShops = allShops.concat(shops);
        console.log(`✅ Lấy thành công ${shops.length} records.`);
        fs.writeFileSync(task.outputFile, JSON.stringify(allShops, null, 2), "utf-8");
        console.log(`💾 Đã lưu dữ liệu tạm vào: ${path.basename(task.outputFile)}`);
      } else {
        console.log(`⚠️ Không tìm thấy dữ liệu hoặc bị lỗi ở link này.`);
      }

      if (i < task.urls.length - 1) {
        await sleep(4000, 8000);
      }
    }
    console.log(`🎉 HOÀN THÀNH LĨNH VỰC ${task.category.toUpperCase()}! Tổng cộng: ${allShops.length} records.\n`);
  }
}

run();
