import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error("Error fetching users:", error)
    return
  }
  
  if (users.users.length === 0) {
    console.log("Không có user nào trong hệ thống!")
    return
  }
  
  for (const u of users.users) {
    const { error: roleErr } = await supabase.from('user_roles').upsert({
      user_id: u.id,
      role: 'admin'
    }, { onConflict: 'user_id, role' })
    
    if (roleErr) {
      console.error("Lỗi khi cấp quyền cho:", u.email, roleErr)
    } else {
      console.log("Đã cấp quyền ADMIN thành công cho:", u.email)
    }
  }
}

run()
