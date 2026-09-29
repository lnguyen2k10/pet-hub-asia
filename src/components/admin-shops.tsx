import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  fanpage: string | null;
  category: string;
  city: string;
  description: string | null;
  is_published: boolean;
  is_featured: boolean;
  owner_id: string | null;
  rating: number;
  review_count: number;
  created_at: string;
  // joined
  owner_email?: string | null;
  owner_name?: string | null;
};

const inputCls =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra";

export function AdminShops() {
  const qc = useQueryClient();
  const [editingShop, setEditingShop] = useState<ShopRow | null>(null);
  const [editForm, setEditForm] = useState<Partial<ShopRow>>({});
  const [search, setSearch] = useState("");
  const [filterOwned, setFilterOwned] = useState<"all" | "owned" | "unclaimed">("all");

  // Fetch all shops with owner profile joined
  const { data: shops, isLoading } = useQuery({
    queryKey: ["admin-shops-full"],
    queryFn: async (): Promise<ShopRow[]> => {
      const { data: shopsData, error } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for owners
      const ownerIds = [...new Set((shopsData ?? []).map((s: any) => s.owner_id).filter(Boolean))];
      let profileMap: Record<string, { full_name: string | null }> = {};
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIds as string[]);
        (profiles ?? []).forEach((p: any) => {
          profileMap[p.id] = { full_name: p.full_name };
        });
      }

      // Fetch auth emails via admin query (profiles only have full_name, emails are in auth.users)
      // We use a workaround: join membership_requests to get email if available,
      // otherwise show owner_id truncated
      return (shopsData ?? []).map((s: any) => ({
        ...s,
        owner_name: s.owner_id ? (profileMap[s.owner_id]?.full_name ?? null) : null,
      }));
    },
  });

  const updateShop = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShopRow> }) => {
      const { error } = await supabase.from("shops").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật thông tin shop.");
      setEditingShop(null);
      qc.invalidateQueries({ queryKey: ["admin-shops-full"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("shops").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { is_published }) => {
      toast.success(is_published ? "Đã công khai shop." : "Đã ẩn shop.");
      qc.invalidateQueries({ queryKey: ["admin-shops-full"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase.from("shops").update({ is_featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { is_featured }) => {
      toast.success(is_featured ? "Đã đặt làm nổi bật." : "Đã bỏ nổi bật.");
      qc.invalidateQueries({ queryKey: ["admin-shops-full"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeOwner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shops").update({ owner_id: null } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã gỡ chủ shop.");
      qc.invalidateQueries({ queryKey: ["admin-shops-full"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteShop = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa shop.");
      qc.invalidateQueries({ queryKey: ["admin-shops-full"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleZaloInvite = (shop: ShopRow) => {
    if (!shop.phone) {
      toast.error("Shop này không có số điện thoại!");
      return;
    }
    let cleanPhone = shop.phone.replace(/\s+/g, "");
    if (cleanPhone.startsWith("+84")) cleanPhone = "0" + cleanPhone.slice(3);
    cleanPhone = cleanPhone.replace(/\D/g, "");
    const shopUrl = `https://1pet.asia/shop/${shop.slug}`;
    const message = `Chào shop ${shop.name}, mình là quản trị viên của nền tảng 1Pet.Asia (Cộng đồng ưu đãi thú cưng lớn nhất VN).\nBên mình nhận thấy shop rất uy tín nên đã tạo tặng shop 1 trang thông tin riêng hoàn toàn miễn phí để khách hàng dễ tìm kiếm tại đây:\n👉 ${shopUrl}\n\nShop hãy bấm vào link, chọn "Nhận quyền quản lý" để tự do đổi ảnh, cập nhật số điện thoại và đăng Ưu đãi miễn phí lên nền tảng nhé!\nNếu cần hỗ trợ gì shop cứ nhắn lại cho mình. Chúc shop buôn may bán đắt!`;
    navigator.clipboard.writeText(message)
      .then(() => {
        toast.success("Đã copy tin nhắn mời Zalo!");
        window.open(`https://zalo.me/${cleanPhone}`, "_blank");
      })
      .catch(() => toast.error("Không thể copy tự động."));
  };

  const filtered = (shops ?? []).filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.city ?? "").toLowerCase().includes(q) || (s.phone ?? "").includes(q);
    const matchOwned =
      filterOwned === "all" ||
      (filterOwned === "owned" && !!s.owner_id) ||
      (filterOwned === "unclaimed" && !s.owner_id);
    return matchSearch && matchOwned;
  });

  if (isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-sand-deep/60" />;

  return (
    <>
      {/* Edit modal */}
      {editingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border my-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Chỉnh sửa Shop: <span className="text-terra">{editingShop.name}</span></h3>
              <button onClick={() => setEditingShop(null)} className="rounded-lg p-1.5 hover:bg-sand-deep/60 text-ink-soft">✕</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Tên shop *</span>
                <input className={inputCls} value={editForm.name ?? ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Slug (URL)</span>
                <input className={inputCls} value={editForm.slug ?? ""} onChange={e => setEditForm({ ...editForm, slug: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Số điện thoại</span>
                <input className={inputCls} value={editForm.phone ?? ""} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Email</span>
                <input className={inputCls} value={editForm.email ?? ""} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Website</span>
                <input className={inputCls} value={editForm.website ?? ""} onChange={e => setEditForm({ ...editForm, website: e.target.value })} placeholder="https://..." />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Fanpage Facebook</span>
                <input className={inputCls} value={editForm.fanpage ?? ""} onChange={e => setEditForm({ ...editForm, fanpage: e.target.value })} placeholder="https://facebook.com/..." />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Danh mục</span>
                <input className={inputCls} value={editForm.category ?? ""} onChange={e => setEditForm({ ...editForm, category: e.target.value })} placeholder="pet-shop, spa, vet..." />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Thành phố</span>
                <input className={inputCls} value={editForm.city ?? ""} onChange={e => setEditForm({ ...editForm, city: e.target.value })} placeholder="TP.HCM, Hà Nội..." />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Địa chỉ</span>
                <input className={inputCls} value={editForm.address ?? ""} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Mô tả ngắn</span>
                <textarea rows={3} className={inputCls} value={editForm.description ?? ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </label>
              {/* Toggles */}
              <div className="flex items-center gap-6 sm:col-span-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_published ?? false}
                    onChange={e => setEditForm({ ...editForm, is_published: e.target.checked })}
                    className="size-4 accent-terra"
                  />
                  <span className="text-sm font-medium">Công khai (is_published)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_featured ?? false}
                    onChange={e => setEditForm({ ...editForm, is_featured: e.target.checked })}
                    className="size-4 accent-terra"
                  />
                  <span className="text-sm font-medium">Nổi bật (is_featured)</span>
                </label>
              </div>
              {/* Rating override */}
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Rating (0–5)</span>
                <input
                  type="number" min={0} max={5} step={0.1}
                  className={inputCls}
                  value={editForm.rating ?? 0}
                  onChange={e => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Số đánh giá</span>
                <input
                  type="number" min={0}
                  className={inputCls}
                  value={editForm.review_count ?? 0}
                  onChange={e => setEditForm({ ...editForm, review_count: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingShop(null)} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-sand-deep/60">
                Hủy
              </button>
              <button
                onClick={() => updateShop.mutate({ id: editingShop.id, data: editForm })}
                disabled={updateShop.isPending}
                className="rounded-xl bg-terra px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {updateShop.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-terra"
          placeholder="Tìm theo tên, thành phố, SĐT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {(["all", "owned", "unclaimed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterOwned(f)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filterOwned === f ? "bg-terra text-white" : "bg-sand-deep/60 text-ink hover:bg-sand-deep"}`}
            >
              {f === "all" ? `Tất cả (${shops?.length ?? 0})` : f === "owned" ? `Đã có chủ` : `Vô chủ`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-border bg-background shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-sand-deep/40 text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Tên Shop</th>
              <th className="px-4 py-3 font-semibold">Chủ sở hữu</th>
              <th className="px-4 py-3 font-semibold">Liên hệ</th>
              <th className="px-4 py-3 font-semibold">Khu vực</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((shop) => (
              <tr key={shop.id} className="transition-colors hover:bg-sand-deep/10">
                <td className="px-4 py-3">
                  <a
                    href={`/shop/${shop.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ink hover:text-terra hover:underline"
                  >
                    {shop.name}
                  </a>
                  <p className="text-xs text-ink-soft">{shop.category} · {shop.city}</p>
                  {!shop.is_published && (
                    <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Ẩn</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {shop.owner_id ? (
                    <div>
                      <p className="font-medium text-emerald-700">{shop.owner_name || "Chưa đặt tên"}</p>
                      <p className="text-xs text-ink-soft font-mono">{shop.owner_id.slice(0, 12)}…</p>
                      <button
                        onClick={() => { if (confirm("Gỡ chủ shop này?")) removeOwner.mutate(shop.id); }}
                        className="mt-1 text-xs text-rose-500 hover:underline"
                      >
                        Gỡ chủ
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Vô chủ
                      </span>
                      <br />
                      <button
                        onClick={() => handleZaloInvite(shop)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        💬 Mời Zalo
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  <p>{shop.phone || "—"}</p>
                  <p className="text-xs">{shop.email || ""}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  <p>{shop.city}</p>
                  <p className="text-xs truncate max-w-[120px]">{shop.address || "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => togglePublish.mutate({ id: shop.id, is_published: !shop.is_published })}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                        shop.is_published
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      }`}
                    >
                      {shop.is_published ? "✓ Công khai" : "Ẩn"}
                    </button>
                    <button
                      onClick={() => toggleFeatured.mutate({ id: shop.id, is_featured: !shop.is_featured })}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                        shop.is_featured
                          ? "bg-terra/10 text-terra hover:bg-terra/20"
                          : "bg-sand-deep/60 text-ink-soft hover:bg-sand-deep"
                      }`}
                    >
                      {shop.is_featured ? "⭐ Nổi bật" : "Thường"}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setEditingShop(shop);
                        setEditForm({
                          name: shop.name,
                          slug: shop.slug,
                          phone: shop.phone,
                          email: shop.email,
                          website: shop.website,
                          fanpage: shop.fanpage,
                          category: shop.category,
                          city: shop.city,
                          address: shop.address,
                          description: shop.description,
                          is_published: shop.is_published,
                          is_featured: shop.is_featured,
                          rating: shop.rating,
                          review_count: shop.review_count,
                        });
                      }}
                      className="rounded-lg bg-sand-deep px-3 py-1.5 text-xs font-semibold hover:bg-sand-deep/70"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xóa vĩnh viễn shop "${shop.name}"?`)) {
                          deleteShop.mutate(shop.id);
                        }
                      }}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-soft">
                  Không tìm thấy shop nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-soft">Hiển thị {filtered.length} / {shops?.length ?? 0} shop</p>
    </>
  );
}
