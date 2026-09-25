-- Sửa lỗi: Cấp lại quyền thực thi cho hàm has_role đối với người dùng đã đăng nhập.
-- Trước đó, quyền này đã bị thu hồi trong một file migration (REVOKE EXECUTE ON FUNCTION public.has_role... FROM anon, authenticated).
-- Hậu quả là khi truy vấn membership_plans, RLS của bảng user_roles được gọi ngầm và sinh lỗi "permission denied for function has_role", khiến danh sách trả về mảng rỗng.

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
