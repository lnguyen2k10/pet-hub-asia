const fs = require('fs');
const path = require('path');

// Tên file bạn vừa tải về (có thể thay đổi nều cần)
const inputFile = path.resolve(__dirname, '../trangvangvietnam.com_categories_488824_thu-cung-do-dung-va-thuc-an-cho-thu-cung.html.2026-09-28T15_28_02.642Z (1).json');
const outputFile = path.resolve(__dirname, '../parsed_trangvang_shops.json');

if (!fs.existsSync(inputFile)) {
  console.error("❌ Không tìm thấy file:", inputFile);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
const markdown = rawData.data?.markdown || '';

if (!markdown) {
  console.error("❌ Không tìm thấy markdown data trong file.");
  process.exit(1);
}

// Hàm chia các block cửa hàng. Mỗi cửa hàng bắt đầu bằng "## [Tên công ty]" hoặc "## Tên công ty"
const blocks = markdown.split(/\n##\s+/).slice(1); // Bỏ phần header ban đầu

const results = [];

blocks.forEach(block => {
  const shop = {
    name: '',
    address: '',
    phone: '',
    website: '',
    email: '',
    description: '',
    logo: '',
    images: []
  };

  const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return;

  // Xử lý dòng tiêu đề (Tên & URL gốc)
  const titleLine = lines[0];
  const titleMatch = titleLine.match(/\[(.*?)\]\((.*?)\)/);
  if (titleMatch) {
    shop.name = titleMatch[1];
    // shop.trangvang_url = titleMatch[2]; // Không bắt buộc
  } else {
    shop.name = titleLine.replace(/^#+\s*/, '').trim();
  }

  // Phân tích các dòng còn lại
  let inDescription = false;
  let descriptionLines = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Lọc Logo (hình ảnh đầu tiên thường là logo)
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/g);
    if (imgMatch) {
      imgMatch.forEach(imgStr => {
        const urlMatch = imgStr.match(/!\[.*?\]\((.*?)\)/);
        if (urlMatch && urlMatch[1]) {
          const url = urlMatch[1];
          if (url.includes('logo.')) {
            shop.logo = url;
          } else {
            shop.images.push(url);
          }
        }
      });
      continue;
    }

    // Bỏ qua các dòng không cần thiết
    if (line.includes('Tài trợ Xác thực') || line.includes('NGÀNH:Thú Cưng') || line.includes('Cập nhật gần nhất')) {
      continue;
    }

    // Tìm Email
    if (line.includes('mailto:')) {
      const emailMatch = line.match(/mailto:([^\s"]+)/);
      if (emailMatch) shop.email = emailMatch[1].replace(/"/g, '').replace('Địa', ''); // Xóa chữ dư
    }
    
    // Tìm Website
    const webMatch = line.match(/\[(.*?)\]\((http.*?)\)/g);
    if (webMatch) {
      webMatch.forEach(w => {
        const urlMatch = w.match(/\[.*?\]\((http.*?)\)/);
        if (urlMatch && urlMatch[1] && !urlMatch[1].includes('trangvang') && !urlMatch[1].includes('mailto:')) {
          shop.website = urlMatch[1];
        }
      });
    }

    // Tìm Số điện thoại (dựa vào tel:)
    if (line.includes('tel:')) {
      const phoneMatches = [...line.matchAll(/tel:([\d]+)/g)];
      if (phoneMatches.length > 0) {
        shop.phone = phoneMatches.map(m => m[1]).join(' - ');
      }
      continue; // Dòng chứa điện thoại thường không chứa mô tả
    }

    // Dòng chứa địa chỉ (thường có chữ phường, quận, thành phố, tỉnh, Việt Nam)
    if (
      (line.includes('Phường') || line.includes('Quận') || line.includes('TP.') || line.includes('Hà Nội') || line.includes('Việt Nam') || line.includes('Xã') || line.includes('Thôn') || line.includes('Đường'))
      && !line.includes('http') && !shop.address
    ) {
      shop.address = line.replace(/\*\*/g, '').trim();
      continue;
    }

    // Mô tả (Những dòng dài hoặc có format text)
    if (!line.includes('http') && !line.includes('mailto:') && !line.includes('Gửi Email') && !line.includes('Chi tiết...')) {
      descriptionLines.push(line.replace(/\*\*/g, '').replace(/_/g, '').trim());
    }
  }

  shop.description = descriptionLines.join(' | ');

  // Sạch sẽ dữ liệu
  if (shop.name && shop.name !== 'Quảng cáo nổi bật' && shop.name !== 'Đăng ký doanh nghiệp') {
    results.push(shop);
  }
});

fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
console.log(`✅ Đã phân tích thành công ${results.length} cửa hàng!`);
console.log(`📁 File kết quả: ${outputFile}`);
