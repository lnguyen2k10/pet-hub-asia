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
  trial_ends_at: string | null;
  owner_name?: string | null;
};

const inputCls =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function trialStatus(trial_ends_at: string | null): { label: string; color: string; expired: boolean } {
  if (!trial_ends_at) return { label: "Không dùng thử", color: "text-ink-soft", expired: false };
  const ends = new Date(trial_ends_at);
  const now = new Date();
  const diff = Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 0) return { label: `Thử ${diff}d còn lại`, color: "text-emerald-600", expired: false };
  return { label: `Hết hạn ${Math.abs(diff)}d trước`, color: "text-rose-600", expired: true };
}

export function AdminShops() {
  const qc = useQueryClient();
  const [editingShop, setEditingShop] = useState<ShopRow | null>(null);
  const [editForm, setEditForm] = useState<Partial<ShopRow>>({});
  const [search, setSearch] = useState("");
  const [filterOwned, setFilterOwned] = useState<"all" | "owned" | "unclaimed">("all");

  // Modal tạo TK + Shop
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    shop_name: "",
    shop_slug: "",
    shop_category: "pet-shop",
    shop_city: "TP.HCM",
    shop_phone: "",
    shop_address: "",
  });
  const [createResult, setCreateResult] = useState<{ email: string; password: string; shop_url: string } | null>(null);

  const { data: shops, isLoading } = useQuery({
    queryKey: ["admin-shops-full"],
    queryFn: async (): Promise<ShopRow[]> => {
      const { data: shopsData, error } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ownerIds = [...new Set((shopsData ?? []).map((s: any) => s.owner_id).filter(Boolean))];
      let profileMap: Record<string, { full_name: string | null }> = {};
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIds as string[]);
        (profiles ?? []).forEach((p: any) => { profileMap[p.id] = { full_name: p.full_name }; });
      }

      return (shopsData ?? []).map((s: any) => ({
        ...s,
        trial_ends_at: s.trial_ends_at ?? null,
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
      const { error } = await supabase.from("shops").update({ is_published } as any).eq("id", id);
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
      const { error } = await supabase.from("shops").update({ is_featured } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { is_featured }) => {
      toast.success(is_featured ? "Đã đặt làm nổi bật." : "Đã bỏ nổi bật.");
      qc.invalidateQueries({ queryKey: ["admin-shops-full"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Toggle dùng thử 30 ngày
  const toggleTrial = useMutation({
    mutationFn: async ({ id, activate }: { id: string; activate: boolean }) => {
      const trial_ends_at = activate
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;
      const { error } = await supabase
        .from("shops")
        .update({ trial_ends_at, is_published: activate ? true : undefined } as any)
        .eq("id", id);
      if (error) throw error;
      return { trial_ends_at };
    },
    onSuccess: (_, { activate }) => {
      toast.success(activate ? "✅ Kích hoạt dùng thử 30 ngày thành công!" : "Đã tắt dùng thử.");
      qc.invalidateQueries({ queryKey: ["admin-shops-full"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeOwner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shops").update({ owner_id: null } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã gỡ chủ shop."); qc.invalidateQueries({ queryKey: ["admin-shops-full"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteShop = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã xóa shop."); qc.invalidateQueries({ queryKey: ["admin-shops-full"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Tạo TK + Shop qua server endpoint
  const [isCreating, setIsCreating] = useState(false);
  const handleCreate = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error("Email và mật khẩu bắt buộc"); return;
    }
    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          ...createForm,
          shop_name: createForm.shop_name || undefined,
          shop_slug: createForm.shop_slug || undefined,
        }),
      });
      const result = await resp.json();
      if (!result.success) {
        toast.error(result.error ?? "Tạo thất bại");
        return;
      }
      const shopUrl = result.shop_slug ? `https://1pet.asia/shop/${result.shop_slug}` : "";
      setCreateResult({ email: createForm.email, password: createForm.password, shop_url: shopUrl });
      toast.success("✅ Đã tạo tài khoản" + (result.shop_slug ? " + shop!" : "!"));
      qc.invalidateQueries({ queryKey: ["admin-shops-full"] });
      // Reset form
      setCreateForm({ email: "", password: "", full_name: "", shop_name: "", shop_slug: "", shop_category: "pet-shop", shop_city: "TP.HCM", shop_phone: "", shop_address: "" });
    } catch (err) {
      toast.error("Lỗi kết nối server");
    } finally {
      setIsCreating(false);
    }
  };

  const handleZaloInvite = (shop: ShopRow) => {
    if (!shop.phone) { toast.error("Shop này không có số điện thoại!"); return; }
    let cleanPhone = shop.phone.replace(/\s+/g, "");
    if (cleanPhone.startsWith("+84")) cleanPhone = "0" + cleanPhone.slice(3);
    cleanPhone = cleanPhone.replace(/\D/g, "");
    const shopUrl = `https://1pet.asia/shop/${shop.slug}`;
    const message = `Chào shop ${shop.name}, mình là quản trị viên của nền tảng 1Pet.Asia (Cộng đồng ưu đãi thú cưng lớn nhất VN).\nBên mình nhận thấy shop rất uy tín nên đã tạo tặng shop 1 trang thông tin riêng hoàn toàn miễn phí để khách hàng dễ tìm kiếm tại đây:\n👉 ${shopUrl}\n\nShop hãy bấm vào link, chọn "Nhận quyền quản lý" để tự do đổi ảnh, cập nhật số điện thoại và đăng Ưu đãi miễn phí lên nền tảng nhé!\nNếu cần hỗ trợ gì shop cứ nhắn lại cho mình. Chúc shop buôn may bán đắt!`;
    navigator.clipboard.writeText(message).then(() => {
      toast.success("Đã copy tin nhắn mời Zalo!");
      window.open(`https://zalo.me/${cleanPhone}`, "_blank");
    }).catch(() => toast.error("Không thể copy tự động."));
  };

  const filtered = (shops ?? []).filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.city ?? "").toLowerCase().includes(q) || (s.phone ?? "").includes(q) || (s.owner_name ?? "").toLowerCase().includes(q);
    const matchOwned = filterOwned === "all" || (filterOwned === "owned" && !!s.owner_id) || (filterOwned === "unclaimed" && !s.owner_id);
    return matchSearch && matchOwned;
  });

  if (isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-sand-deep/60" />;

  return (
    <>
      {/* ── Modal Tạo TK + Shop ─────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-xl rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tạo tài khoản + Shop cho chủ</h3>
              <button onClick={() => { setShowCreate(false); setCreateResult(null); }} className="rounded-lg p-1.5 hover:bg-sand-deep/60 text-ink-soft">✕</button>
            </div>

            {createResult ? (
              /* Hiển thị kết quả + copy */
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
                  <p className="font-semibold text-emerald-800 text-sm mb-3">✅ Tài khoản đã được tạo!</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-ink-soft">Email:</span>
                      <span className="font-mono font-bold">{createResult.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-ink-soft">Mật khẩu:</span>
                      <span className="font-mono font-bold">{createResult.password}</span>
                    </div>
                    {createResult.shop_url && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-ink-soft">Trang shop:</span>
                        <a href={createResult.shop_url} target="_blank" rel="noopener noreferrer" className="text-terra hover:underline text-xs">{createResult.shop_url}</a>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const msg = `Chào bạn!\n\nBên 1Pet.Asia đã tạo trang cho shop bạn rồi nhé:\n🌐 ${createResult.shop_url}\n\nĐăng nhập tại: https://1pet.asia/dang-nhap\n📧 Email: ${createResult.email}\n🔑 Mật khẩu: ${createResult.password}\n\nSau khi đăng nhập, bạn vào "Quản lý" để cập nhật thông tin và ảnh nhé!`;
                    navigator.clipboard.writeText(msg).then(() => toast.success("Đã copy thông tin gửi cho shop!"));
                  }}
                  className="w-full rounded-xl bg-terra px-4 py-2.5 text-sm font-semibold text-white"
                >
                  📋 Copy thông tin gửi cho shop
                </button>
                <button onClick={() => setCreateResult(null)} className="w-full rounded-xl border border-border px-4 py-2 text-sm hover:bg-sand-deep/60">
                  Tạo thêm tài khoản khác
                </button>
              </div>
            ) : (
              /* Form tạo */
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700 ring-1 ring-blue-200">
                  ℹ️ Tài khoản sẽ được tạo với email đã xác nhận sẵn. Gửi email + mật khẩu cho chủ shop.
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Email đăng nhập *</span>
                    <input type="email" className={inputCls} value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="shop@gmail.com" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Mật khẩu tạm *</span>
                    <input className={inputCls} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Tối thiểu 8 ký tự" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Tên chủ shop</span>
                    <input className={inputCls} value={createForm.full_name} onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })} placeholder="Nguyễn Văn A" />
                  </label>
                </div>

                <hr className="border-border/60" />
                <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Thông tin Shop (tuỳ chọn)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Tên shop</span>
                    <input
                      className={inputCls}
                      value={createForm.shop_name}
                      onChange={e => setCreateForm({ ...createForm, shop_name: e.target.value, shop_slug: slugify(e.target.value) })}
                      placeholder="Pawsome Pet Shop"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Slug (URL)</span>
                    <input className={inputCls} value={createForm.shop_slug} onChange={e => setCreateForm({ ...createForm, shop_slug: e.target.value })} placeholder="pawsome-pet-shop" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Danh mục</span>
                    <select className={inputCls} value={createForm.shop_category} onChange={e => setCreateForm({ ...createForm, shop_category: e.target.value })}>
                      <option value="pet-shop">Pet Shop</option>
                      <option value="spa">Spa / Grooming</option>
                      <option value="vet">Phòng khám thú y</option>
                      <option value="boarding">Boarding / Khách sạn thú cưng</option>
                      <option value="training">Huấn luyện</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Thành phố</span>
                    <input className={inputCls} value={createForm.shop_city} onChange={e => setCreateForm({ ...createForm, shop_city: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">SĐT shop</span>
                    <input className={inputCls} value={createForm.shop_phone} onChange={e => setCreateForm({ ...createForm, shop_phone: e.target.value })} placeholder="09xx..." />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Địa chỉ</span>
                    <input className={inputCls} value={createForm.shop_address} onChange={e => setCreateForm({ ...createForm, shop_address: e.target.value })} />
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowCreate(false)} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-sand-deep/60">Hủy</button>
                  <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="rounded-xl bg-terra px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isCreating ? "Đang tạo..." : "✨ Tạo tài khoản"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit shop modal ─────────────────────────────── */}
      {editingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border my-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">Chỉnh sửa: <span className="text-terra">{editingShop.name}</span></h3>
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
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">SĐT</span>
                <input className={inputCls} value={editForm.phone ?? ""} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Email</span>
                <input className={inputCls} value={editForm.email ?? ""} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Website</span>
                <input className={inputCls} value={editForm.website ?? ""} onChange={e => setEditForm({ ...editForm, website: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Fanpage</span>
                <input className={inputCls} value={editForm.fanpage ?? ""} onChange={e => setEditForm({ ...editForm, fanpage: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Danh mục</span>
                <input className={inputCls} value={editForm.category ?? ""} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Thành phố</span>
                <input className={inputCls} value={editForm.city ?? ""} onChange={e => setEditForm({ ...editForm, city: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Địa chỉ</span>
                <input className={inputCls} value={editForm.address ?? ""} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Mô tả</span>
                <textarea rows={3} className={inputCls} value={editForm.description ?? ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </label>
              <div className="flex items-center gap-6 sm:col-span-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.is_published ?? false} onChange={e => setEditForm({ ...editForm, is_published: e.target.checked })} className="size-4 accent-terra" />
                  <span className="text-sm font-medium">Công khai</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.is_featured ?? false} onChange={e => setEditForm({ ...editForm, is_featured: e.target.checked })} className="size-4 accent-terra" />
                  <span className="text-sm font-medium">Nổi bật</span>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Rating (0–5)</span>
                <input type="number" min={0} max={5} step={0.1} className={inputCls} value={editForm.rating ?? 0} onChange={e => setEditForm({ ...editForm, rating: Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Số đánh giá</span>
                <input type="number" min={0} className={inputCls} value={editForm.review_count ?? 0} onChange={e => setEditForm({ ...editForm, review_count: Number(e.target.value) })} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingShop(null)} className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-sand-deep/60">Hủy</button>
              <button onClick={() => updateShop.mutate({ id: editingShop.id, data: editForm })} disabled={updateShop.isPending}
                className="rounded-xl bg-terra px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {updateShop.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => { setShowCreate(true); setCreateResult(null); }}
          className="shrink-0 rounded-xl bg-terra px-4 py-2 text-sm font-semibold text-white hover:bg-terra-deep"
        >
          ✨ Tạo TK + Shop
        </button>
        <input
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-terra"
          placeholder="Tìm theo tên, thành phố, SĐT, chủ shop..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {(["all", "owned", "unclaimed"] as const).map(f => (
            <button key={f} onClick={() => setFilterOwned(f)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filterOwned === f ? "bg-terra text-white" : "bg-sand-deep/60 text-ink hover:bg-sand-deep"}`}>
              {f === "all" ? `Tất cả (${shops?.length ?? 0})` : f === "owned" ? "Đã có chủ" : "Vô chủ"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-border bg-background shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-sand-deep/40 text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Tên Shop</th>
              <th className="px-4 py-3 font-semibold">Chủ sở hữu</th>
              <th className="px-4 py-3 font-semibold">Liên hệ</th>
              <th className="px-4 py-3 font-semibold">Dùng thử</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((shop) => {
              const trial = trialStatus(shop.trial_ends_at);
              const isTrialActive = !!shop.trial_ends_at && !trial.expired;

              return (
                <tr key={shop.id} className="transition-colors hover:bg-sand-deep/10">
                  <td className="px-4 py-3">
                    <a href={`/shop/${shop.slug}`} target="_blank" rel="noopener noreferrer"
                      className="font-semibold text-ink hover:text-terra hover:underline">
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
                        <p className="text-xs font-mono text-ink-soft">{shop.owner_id.slice(0, 12)}…</p>
                        <button onClick={() => { if (confirm("Gỡ chủ shop này?")) removeOwner.mutate(shop.id); }}
                          className="mt-1 text-xs text-rose-500 hover:underline">Gỡ chủ</button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Vô chủ</span>
                        <br />
                        <button onClick={() => handleZaloInvite(shop)} className="text-xs font-semibold text-blue-600 hover:underline">💬 Mời Zalo</button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    <p>{shop.phone || "—"}</p>
                    <p className="text-xs">{shop.email || ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    {/* Trial toggle */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => toggleTrial.mutate({ id: shop.id, activate: !isTrialActive })}
                        disabled={toggleTrial.isPending}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                          isTrialActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : trial.expired
                              ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                              : "bg-sand-deep/60 text-ink hover:bg-sand-deep"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${isTrialActive ? "bg-emerald-500" : "bg-ink-soft/40"}`} />
                        {isTrialActive ? "🟢 Đang thử" : trial.expired ? "🔴 Hết hạn" : "Kích hoạt"}
                      </button>
                      {shop.trial_ends_at && (
                        <p className={`text-xs ${trial.color}`}>{trial.label}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => togglePublish.mutate({ id: shop.id, is_published: !shop.is_published })}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${shop.is_published ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}>
                        {shop.is_published ? "✓ Công khai" : "Ẩn"}
                      </button>
                      <button onClick={() => toggleFeatured.mutate({ id: shop.id, is_featured: !shop.is_featured })}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${shop.is_featured ? "bg-terra/10 text-terra hover:bg-terra/20" : "bg-sand-deep/60 text-ink-soft hover:bg-sand-deep"}`}>
                        {shop.is_featured ? "⭐ Nổi bật" : "Thường"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingShop(shop);
                          setEditForm({ name: shop.name, slug: shop.slug, phone: shop.phone, email: shop.email, website: shop.website, fanpage: shop.fanpage, category: shop.category, city: shop.city, address: shop.address, description: shop.description, is_published: shop.is_published, is_featured: shop.is_featured, rating: shop.rating, review_count: shop.review_count });
                        }}
                        className="rounded-lg bg-sand-deep px-3 py-1.5 text-xs font-semibold hover:bg-sand-deep/70">
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => { if (confirm(`Xóa vĩnh viễn shop "${shop.name}"?`)) deleteShop.mutate(shop.id); }}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-soft">Không tìm thấy shop nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-soft">Hiển thị {filtered.length} / {shops?.length ?? 0} shop</p>
    </>
  );
}
