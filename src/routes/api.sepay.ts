import { createAPIFileRoute } from '@tanstack/react-start/api'
import { createClient } from '@supabase/supabase-js'

// Khởi tạo Supabase client với quyền Admin (bỏ qua RLS) để cập nhật database
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export const APIRoute = createAPIFileRoute('/api/sepay')({
  POST: async ({ request }) => {
    try {
      // Bảo mật bằng Mã xác nhận (Token) từ SePay
      // Chúng ta sẽ kiểm tra Authorization header ở đây.
      const authHeader = request.headers.get('Authorization')
      
      // Chúng ta lấy mã token từ biến môi trường Vercel (bạn cần thêm SEPAY_WEBHOOK_TOKEN)
      const expectedToken = process.env.SEPAY_WEBHOOK_TOKEN
      
      if (expectedToken && authHeader !== `Bearer ${expectedToken}` && authHeader !== `Apikey ${expectedToken}`) {
         return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401 })
      }

      const payload = await request.json()
      console.log('Nhận webhook từ SePay:', payload)

      // Kiểm tra giao dịch là tiền vào và có mã thanh toán
      if (payload.transferType === 'in' && payload.code) {
        // Cấu hình SePay mã tiền tố là "PET"
        const prefix = 'PET'
        
        if (payload.code.startsWith(prefix)) {
          const phone = payload.code.replace(prefix, '').trim()

          // Tìm đơn đăng ký (pending) mới nhất có số điện thoại tương ứng
          const { data: requestRecord, error: searchError } = await supabaseAdmin
            .from('membership_requests')
            .select('*')
            .eq('contact_phone', phone)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (!searchError && requestRecord) {
            const now = new Date()
            const nextYear = new Date()
            nextYear.setFullYear(now.getFullYear() + 1)

            const { error: updateError } = await supabaseAdmin
              .from('membership_requests')
              .update({
                status: 'approved',
                reviewed_at: now.toISOString(),
                starts_at: now.toISOString(),
                expires_at: nextYear.toISOString(),
                admin_note: `Duyệt tự động qua SePay (Giao dịch: ${payload.id})`
              })
              .eq('id', requestRecord.id)

            if (updateError) {
              console.error('Lỗi khi duyệt tự động:', updateError)
            } else {
              console.log(`Đã duyệt tự động thành công cho đơn ${requestRecord.id}`)
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    } catch (error) {
      console.error('Lỗi server xử lý webhook:', error)
      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    }
  },
})
