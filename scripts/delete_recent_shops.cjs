const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabase
    .from('shops')
    .delete()
    .gt('created_at', new Date(Date.now() - 30 * 60000).toISOString()); // Xóa những shop vừa tạo 30 phút trước
    
  if (error) {
    console.error("Lỗi:", error);
  } else {
    console.log("Đã xóa các shop bị lỗi thiếu cột email/website!");
  }
}
run();
