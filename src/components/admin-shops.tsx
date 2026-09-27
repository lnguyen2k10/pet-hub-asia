import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function AdminShops() {
  const { data: shops, isLoading } = useQuery({
    queryKey: ["admin-shops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, slug, address, phone, owner_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleZaloInvite = (shop: any) => {
    if (!shop.phone) {
      toast.error("Shop này không có số điện thoại!");
      return;
    }

    // Clean phone number: remove spaces, +84 -> 0
    let cleanPhone = shop.phone.replace(/\s+/g, "");
    if (cleanPhone.startsWith("+84")) {
      cleanPhone = "0" + cleanPhone.slice(3);
    }
    
    // Only digits
    cleanPhone = cleanPhone.replace(/\D/g, "");

    const shopUrl = `https://1pet.asia/shop/${shop.slug}`;
    const message = `Chào shop ${shop.name}, mình là quản trị viên của nền tảng 1Pet.Asia (Cộng đồng ưu đãi thú cưng lớn nhất VN).
Bên mình nhận thấy shop rất uy tín nên đã tạo tặng shop 1 trang thông tin riêng hoàn toàn miễn phí để khách hàng dễ tìm kiếm tại đây:
👉 ${shopUrl}

Shop hãy bấm vào link, chọn "Nhận quyền quản lý" để tự do đổi ảnh, cập nhật số điện thoại và đăng Ưu đãi miễn phí lên nền tảng nhé!
Nếu cần hỗ trợ gì shop cứ nhắn lại cho mình. Chúc shop buôn may bán đắt!`;

    // Copy to clipboard
    navigator.clipboard.writeText(message)
      .then(() => {
        toast.success("Đã copy tin nhắn mồi nhử!");
        // Open Zalo PC/Web link
        window.open(`https://zalo.me/${cleanPhone}`, "_blank");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error("Không thể copy tự động, vui lòng thử lại.");
      });
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-sand-deep/60" />;
  }

  return (
    <div className="overflow-x-auto rounded-3xl ring-1 ring-border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-sand-deep/40 text-ink-soft">
          <tr>
            <th className="px-6 py-4 font-semibold">Tên Shop</th>
            <th className="px-6 py-4 font-semibold">Số điện thoại</th>
            <th className="px-6 py-4 font-semibold">Trạng thái</th>
            <th className="px-6 py-4 font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {shops?.map((shop) => (
            <tr key={shop.id} className="transition-colors hover:bg-sand-deep/10">
              <td className="px-6 py-4 font-medium text-ink">
                <a href={`/shop/${shop.slug}`} target="_blank" className="hover:underline hover:text-terra-deep">
                  {shop.name}
                </a>
              </td>
              <td className="px-6 py-4 text-ink-soft">{shop.phone || "Trống"}</td>
              <td className="px-6 py-4">
                {shop.owner_id ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    Đã có chủ
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    Vô chủ
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {!shop.owner_id && (
                  <button
                    onClick={() => handleZaloInvite(shop)}
                    className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    💬 Mời Zalo (Auto Copy)
                  </button>
                )}
              </td>
            </tr>
          ))}
          {(!shops || shops.length === 0) && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-ink-soft">
                Chưa có shop nào trong hệ thống.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
