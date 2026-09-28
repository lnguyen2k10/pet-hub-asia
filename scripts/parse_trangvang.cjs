const fs = require('fs');
const path = require('path');

const inputDir = path.resolve(__dirname, '../trang vàng');
const outputFile = path.resolve(__dirname, '../parsed_trangvang_shops.json');

if (!fs.existsSync(inputDir)) {
  console.error("❌ Không tìm thấy thư mục:", inputDir);
  process.exit(1);
}

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));

if (files.length === 0) {
  console.error("❌ Không tìm thấy file JSON nào trong thư mục 'trang vàng'.");
  process.exit(1);
}

const results = [];

for (const file of files) {
  const inputFile = path.join(inputDir, file);
  console.log(`Đang phân tích file: ${file}...`);
  const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const markdown = rawData.data?.markdown || '';

  if (!markdown) {
    console.error(`❌ Không tìm thấy markdown data trong file: ${file}`);
    continue;
  }

  // Hàm chia các block cửa hàng
  const blocks = markdown.split(/\n##\s+/).slice(1);

  blocks.forEach(block => {
    const shop = {
      name: '',
      address: '',
      phone: '',
      website: '',
      email: '',
      fanpage: '',
      description: '',
      logo: '',
      images: []
    };

    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    // Xử lý dòng tiêu đề
    const titleLine = lines[0];
    const titleMatch = titleLine.match(/\[(.*?)\]\((.*?)\)/);
    if (titleMatch) {
      shop.name = titleMatch[1];
    } else {
      shop.name = titleLine.replace(/^#+\s*/, '').trim();
    }

    // Phân tích các dòng còn lại
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
        if (emailMatch) shop.email = emailMatch[1].replace(/"/g, '').replace('Địa', ''); 
      }
      
      // Tìm Website & Fanpage
      const webMatch = line.match(/\[(.*?)\]\((http.*?)\)/g);
      if (webMatch) {
        webMatch.forEach(w => {
          const urlMatch = w.match(/\[.*?\]\((http.*?)\)/);
          if (urlMatch && urlMatch[1] && !urlMatch[1].includes('trangvang') && !urlMatch[1].includes('mailto:')) {
            const url = urlMatch[1];
            if (url.includes('facebook.com') || url.includes('fb.com')) {
              shop.fanpage = url;
            } else {
              shop.website = url;
            }
          }
        });
      }

      // Tìm Số điện thoại (dựa vào tel:)
      if (line.includes('tel:')) {
        const phoneMatches = [...line.matchAll(/tel:([\d]+)/g)];
        if (phoneMatches.length > 0) {
          shop.phone = phoneMatches.map(m => m[1]).join(' - ');
        }
        continue; 
      }

      // Dòng chứa địa chỉ
      if (
        (line.includes('Phường') || line.includes('Quận') || line.includes('TP.') || line.includes('Hà Nội') || line.includes('Việt Nam') || line.includes('Xã') || line.includes('Thôn') || line.includes('Đường'))
        && !line.includes('http') && !shop.address
      ) {
        shop.address = line.replace(/\*\*/g, '').trim();
        continue;
      }

      // Mô tả
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
}

fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
console.log(`✅ Đã phân tích thành công ${results.length} cửa hàng từ ${files.length} file!`);
console.log(`📁 File kết quả: ${outputFile}`);


