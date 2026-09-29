const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function run() {
  const filePath = path.resolve(__dirname, "../TOPLIST/agent-result.json");
  console.log("🚀 Đang đọc file dữ liệu:", filePath);

  try {
    const rawData = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(rawData);

    if (!data.pet_shops || !Array.isArray(data.pet_shops)) {
      console.log("❌ File không đúng định dạng (thiếu mảng pet_shops)");
      return;
    }

    const shops = data.pet_shops;
    console.log(`✅ Tìm thấy ${shops.length} shop trong file. Bắt đầu xử lý...`);

    let successCount = 0;

    for (const shop of shops) {
      if (!shop.name) continue;

      let city = "Khác";
      const address = shop.address || "";

      if (address.toLowerCase().includes("hà nội")) city = "Hà Nội";
      else if (
        address.toLowerCase().includes("hồ chí minh") ||
        address.toLowerCase().includes("hcm") ||
        address.toLowerCase().includes("sài gòn") ||
        address.toLowerCase().includes("thủ đức")
      )
        city = "Hồ Chí Minh";
      else if (address.toLowerCase().includes("đà nẵng")) city = "Đà Nẵng";
      else if (address.toLowerCase().includes("cần thơ")) city = "Cần Thơ";
      else if (address.toLowerCase().includes("quảng ninh")) city = "Quảng Ninh";

      const slug =
        shop.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") +
        "-" +
        Math.random().toString(36).substring(2, 7);

      let description = "";
      if (shop.opening_hours) {
        description += `Giờ mở cửa: ${shop.opening_hours}\n`;
      }
      if (shop.list_title) {
        description += `Vinh danh trong: ${shop.list_title}\n`;
      }
      if (shop.source_url) {
        description += `Nguồn đánh giá: ${shop.source_url}\n`;
      }

      const payload = {
        name: shop.name.substring(0, 255),
        slug: slug,
        description: description ? description.substring(0, 1000) : null,
        address: address ? address : null,
        city: city,
        phone: shop.phone ? shop.phone.substring(0, 50) : null,
        email: shop.email ? shop.email.substring(0, 255) : null,
        fanpage: shop.fanpage ? shop.fanpage.substring(0, 255) : null,
        website: shop.website ? shop.website.substring(0, 255) : null,
        category: "pet-shop",
        is_published: true,
      };

      const { error } = await supabase.from("shops").insert(payload);

      if (error) {
        console.error(`❌ Lỗi import [${shop.name}]:`, error.message);
      } else {
        successCount++;
        console.log(`✅ Đã import: ${shop.name}`);
      }
    }

    console.log(
      `🎉 Đã nạp thành công tổng cộng ${successCount} cửa hàng siêu chất lượng vào Database!`,
    );
  } catch (err) {
    console.error("❌ Lỗi xử lý:", err.message);
  }
}

run();
