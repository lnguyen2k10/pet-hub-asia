import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BlogManager } from "@/components/blog-manager";
import { AdminShops } from "@/components/admin-shops";
import { AdminShopClaims } from "@/components/admin-shop-claims";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pet";
import {
  allMembershipPlansQuery,
  allMembershipRequestsQuery,
  membershipSettingsQuery,
  allProfilesAdminQuery,
  allUserRolesAdminQuery,
  userRoleQuery,
  shopCategoriesQuery,
  shopLocationsQuery,
  type MembershipPlan,
  type MembershipRequest,
  type MembershipSettings,
} from "@/lib/queries";
import React from "react";

const TITLE = "Quản trị thành viên — 1Pet.Asia";
const DESC =
  "Khu vực quản trị 1Pet.Asia: tạo gói thành viên, cấu hình thanh toán và duyệt đơn đăng ký.";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: AdminPage,
});

const inputCls =
  "mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-terra";

function AdminPage() {
  const { user, loading } = useAuth();
  const roleQ = useQuery({ ...userRoleQuery, enabled: !!user });
  const [activeTab, setActiveTab] = useState("requests");

  const role = roleQ.data;
  const isAdmin = role === "admin";

  if (loading || (user && roleQ.isLoading)) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-5 py-16">
          <div className="h-64 animate-pulse rounded-3xl bg-sand-deep/60" />
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-5 py-24 text-center">
          <h1 className="text-3xl">Khu vực quản trị</h1>
          <p className="mt-2 text-ink-soft">
            {user
              ? "Tài khoản của bạn không có quyền truy cập khu vực này."
              : "Vui lòng đăng nhập bằng tài khoản quản trị/nhân sự."}
          </p>
          <Link
            to={user ? "/quan-ly" : "/dang-nhap"}
            className="mt-6 inline-block rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {user ? "Về trang quản lý" : "Đăng nhập"}
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const TABS = [
    { id: "requests", label: "Đơn đăng ký", show: true },
    { id: "shop_claims", label: "Duyệt nhận Shop", show: true },
    { id: "shops", label: "Danh bạ Shop", show: true },
    { id: "blog", label: "Quản lý Blog", show: true },
    { id: "plans", label: "Gói thành viên", show: isAdmin },
    { id: "settings", label: "Cài đặt thanh toán", show: isAdmin },
    { id: "locations", label: "Địa điểm & Danh mục", show: isAdmin },
    { id: "users", label: "Phân quyền & User", show: isAdmin },
  ].filter((t) => t.show);

  // If activeTab is hidden from this role, fallback
  if (!TABS.find((t) => t.id === activeTab)) {
    setActiveTab(TABS[0]?.id || "requests");
  }

  return (
    <div className="min-h-screen bg-sand-deep/20">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-1 md:w-64">
          <div className="mb-4 px-3">
            <p className="font-hand text-2xl text-terra-deep">quản trị</p>
            <p className="text-xs text-ink-soft font-medium uppercase tracking-wider">
              {isAdmin ? "Super Admin" : "Moderator"}
            </p>
          </div>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-terra text-primary-foreground shadow-sm"
                  : "text-ink-soft hover:bg-sand-deep/60 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="min-w-0 flex-1">
          {activeTab === "requests" && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">Đơn đăng ký thành viên</h1>
              <RequestsTable />
            </div>
          )}
          {activeTab === "shop_claims" && (
            <div>
              <h1 className="mb-2 text-3xl sm:text-4xl">Duyệt nhận Shop</h1>
              <p className="mb-6 text-ink-soft">Duyệt yêu cầu nhận quyền quản lý từ các chủ Shop</p>
              <AdminShopClaims />
            </div>
          )}
          {activeTab === "shops" && (
            <div>
              <h1 className="mb-2 text-3xl sm:text-4xl">Danh bạ Shop</h1>
              <p className="mb-6 text-ink-soft">Danh sách tất cả các shop (Mời Zalo 1 chạm)</p>
              <AdminShops />
            </div>
          )}
          {activeTab === "blog" && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">Quản lý Blog</h1>
              <BlogManager authorName={user.email ?? "Admin"} userId={user.id} />
            </div>
          )}
          {activeTab === "plans" && isAdmin && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">Gói thành viên</h1>
              <PlansManager userId={user.id} />
            </div>
          )}
          {activeTab === "settings" && isAdmin && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">Cài đặt thanh toán</h1>
              <BankSettingsForm userId={user.id} />
            </div>
          )}
          {activeTab === "locations" && isAdmin && (
            <div>
              <h1 className="mb-2 text-3xl sm:text-4xl">Địa điểm & Danh mục</h1>
              <p className="mb-6 text-ink-soft">Quản lý danh mục và địa điểm cho các Shop</p>
              <CategoryLocationManager />
            </div>
          )}
          {activeTab === "users" && isAdmin && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">Phân quyền & User</h1>
              <UserManager />
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ─── Plans Manager ───────────────────────────────────────────────────────────
function PlansManager({ userId: _userId }: { userId: string }) {
  const qc = useQueryClient();
  const plansQ = useQuery(allMembershipPlansQuery);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [showForm, setShowForm] = useState(false);

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("membership_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa gói.");
      void qc.invalidateQueries({ queryKey: ["membership_plans"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Xóa thất bại."),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("membership_plans").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["membership_plans"] }),
  });

  const plans = plansQ.data ?? [];

  return (
    <section className="mt-8 rounded-3xl bg-background p-6 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">Quản lý gói thành viên</h2>
        <button
          type="button"
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
          }}
          className="rounded-full bg-terra px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          + Tạo gói mới
        </button>
      </div>

      {(showForm || editingPlan) && (
        <PlanForm
          plan={editingPlan}
          onClose={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
          onSaved={() => {
            void qc.invalidateQueries({ queryKey: ["membership_plans"] });
            setShowForm(false);
            setEditingPlan(null);
          }}
        />
      )}

      {plansQ.isLoading ? (
        <div className="mt-4 h-24 animate-pulse rounded-3xl bg-sand-deep/60" />
      ) : plans.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">
          Chưa có gói nào. Bấm "+ Tạo gói mới" để bắt đầu.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-4 ring-1 ${plan.is_active ? "bg-background ring-border" : "bg-sand-deep/30 ring-border/40 opacity-60"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{plan.name}</span>
                    {plan.is_featured && (
                      <span className="rounded-full bg-terra/10 px-2 py-0.5 text-xs font-semibold text-terra">
                        Nổi bật
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {plan.is_active ? "Đang bán" : "Tạm dừng"}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft mt-0.5">
                    {formatPrice(plan.price_amount)} / {plan.period_label} • {plan.duration_days}{" "}
                    ngày
                  </p>
                  {/* Quota summary */}
                  <p className="text-xs mt-1 font-mono">
                    <span className="text-ink-soft">Quota: </span>
                    {plan.max_deals === 0 && plan.max_products === 0 && plan.featured_slots === 0 && plan.max_partner_posts === 0 && plan.max_blog_posts === 0
                      ? <span className="text-rose-500 font-semibold">⚠️ Chưa set quota (tất cả = 0)</span>
                      : <span className="text-emerald-700">
                          ưu đãi: {plan.max_deals} • sản phẩm: {plan.max_products === -1 ? '∞' : plan.max_products} • blog: {plan.max_blog_posts} • hợp tác: {plan.max_partner_posts}
                        </span>
                    }
                  </p>
                  {plan.features.length > 0 && (
                    <p className="text-xs text-ink-soft mt-1">
                      {plan.features.slice(0, 3).join(" • ")}
                      {plan.features.length > 3 ? " ..." : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive.mutate({ id: plan.id, is_active: !plan.is_active })}
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-sand-deep/40 transition"
                  >
                    {plan.is_active ? "Tạm dừng" : "Bật lại"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPlan(plan)}
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-sand-deep/40 transition"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Xóa gói "${plan.name}"? Hành động này không thể hoàn tác.`)) {
                        deletePlan.mutate(plan.id);
                      }
                    }}
                    className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Plan form ────────────────────────────────────────────────────────────────
function PlanForm({
  plan,
  onClose,
  onSaved,
}: {
  plan: MembershipPlan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    price_amount: String(plan?.price_amount ?? 299000),
    duration_days: String(plan?.duration_days ?? 365),
    period_label: plan?.period_label ?? "năm",
    features: (plan?.features ?? []).join("\n"),
    is_featured: plan?.is_featured ?? false,
    is_active: plan?.is_active ?? true,
    sort_order: String(plan?.sort_order ?? 0),
    max_deals: String(plan?.max_deals ?? 0),
    max_products: String(plan?.max_products ?? 0),
    featured_slots: String(plan?.featured_slots ?? 0),
    max_partner_posts: String(plan?.max_partner_posts ?? 0),
    max_blog_posts: String(plan?.max_blog_posts ?? 0),
  });

  const save = useMutation({
    mutationFn: async () => {
      const price = Number(form.price_amount);
      if (!Number.isFinite(price) || price <= 0) throw new Error("Số tiền không hợp lệ.");
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_amount: price,
        duration_days: Number(form.duration_days) || 365,
        period_label: form.period_label.trim() || "năm",
        features: form.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        is_featured: form.is_featured,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        max_deals: Number(form.max_deals) || 0,
        max_products: Number(form.max_products) || 0,
        featured_slots: Number(form.featured_slots) || 0,
        max_partner_posts: Number(form.max_partner_posts) || 0,
        max_blog_posts: Number(form.max_blog_posts) || 0,
      };
      if (plan) {
        const { error } = await supabase.from("membership_plans").update(payload).eq("id", plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("membership_plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(plan ? "Đã cập nhật gói." : "Đã tạo gói mới.");
      onSaved();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Lỗi lưu gói."),
  });

  return (
    <div className="mt-4 rounded-2xl bg-sand-deep/30 p-5 ring-1 ring-border">
      <h3 className="font-semibold mb-4">{plan ? "Sửa gói" : "Tạo gói mới"}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Tên gói *</span>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Gói Tiêu Chuẩn"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Mô tả</span>
          <input
            className={inputCls}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả ngắn về gói"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Giá (VND) *</span>
          <input
            className={inputCls}
            inputMode="numeric"
            value={form.price_amount}
            onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Thời hạn (ngày)</span>
          <input
            className={inputCls}
            inputMode="numeric"
            value={form.duration_days}
            onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Nhãn chu kỳ</span>
          <input
            className={inputCls}
            value={form.period_label}
            onChange={(e) => setForm({ ...form, period_label: e.target.value })}
            placeholder="VD: năm / tháng / 6 tháng"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Thứ tự hiển thị</span>
          <input
            className={inputCls}
            inputMode="numeric"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
        </label>

        {/* Cấu hình Quota */}
        <div className="col-span-1 sm:col-span-2 mt-2 rounded-xl bg-black/5 p-4 ring-1 ring-border">
          <div className="mb-4">
            <h4 className="font-semibold">Cấu hình Quota (Quyền lợi kích hoạt)</h4>
            <p className="text-xs text-ink-soft">
              Lưu ý: Nhập -1 nếu không giới hạn (áp dụng cho Quota Sản phẩm).
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium">Quota Ưu đãi</span>
              <input
                className={inputCls}
                inputMode="numeric"
                value={form.max_deals}
                onChange={(e) => setForm({ ...form, max_deals: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Quota Sản phẩm</span>
              <input
                className={inputCls}
                inputMode="numeric"
                value={form.max_products}
                onChange={(e) => setForm({ ...form, max_products: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Đẩy Nổi bật (số lần)</span>
              <input
                className={inputCls}
                inputMode="numeric"
                value={form.featured_slots}
                onChange={(e) => setForm({ ...form, featured_slots: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Quota Hợp tác kinh doanh</span>
              <input
                className={inputCls}
                inputMode="numeric"
                value={form.max_partner_posts}
                onChange={(e) => setForm({ ...form, max_partner_posts: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Quota Bài Blog</span>
              <input
                className={inputCls}
                inputMode="numeric"
                value={form.max_blog_posts}
                onChange={(e) => setForm({ ...form, max_blog_posts: e.target.value })}
              />
            </label>
          </div>
        </div>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Tính năng (mỗi dòng một tính năng)</span>
          <textarea
            rows={4}
            className={inputCls}
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            placeholder={"Landing page shop\nHiển thị danh sách\nHuy hiệu xác minh"}
          />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            className="size-4 accent-terra"
          />
          <span className="text-sm font-medium">Gói nổi bật (highlight)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="size-4 accent-terra"
          />
          <span className="text-sm font-medium">Đang bán (active)</span>
        </label>
      </div>
      <div className="mt-4 flex gap-3">
        {/* Warning khi quota all = 0 mà gói có phí */}
        {Number(form.price_amount) > 0 &&
          Number(form.max_deals) === 0 &&
          Number(form.max_products) === 0 &&
          Number(form.featured_slots) === 0 &&
          Number(form.max_partner_posts) === 0 &&
          Number(form.max_blog_posts) === 0 && (
          <div className="w-full mb-3 rounded-xl bg-rose-50 px-4 py-3 ring-1 ring-rose-200 text-sm text-rose-700">
            ⚠️ <strong>Tất cả quota đang = 0!</strong> User mua gói này sẽ không được cấp thêm quota nào.
            Hãy nhập số vào phần "Cấu hình Quota" bên trên trước khi lưu.
          </div>
        )}
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? "Đang lưu..." : plan ? "Cập nhật gói" : "Tạo gói"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-ink"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}

// ─── Bank settings (legacy single QR) ────────────────────────────────────────
function BankSettingsForm({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const settingsQ = useQuery(membershipSettingsQuery);
  const [form, setForm] = useState({
    bank_info: "",
    refund_note: "",
    instructions: "",
  });

  useEffect(() => {
    const s = settingsQ.data as MembershipSettings | null | undefined;
    if (!s) return;
    setForm({
      bank_info: s.bank_info ?? "",
      refund_note: s.refund_note,
      instructions: s.instructions ?? "",
    });
  }, [settingsQ.data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        bank_info: form.bank_info.trim() || null,
        refund_note:
          form.refund_note.trim() ||
          "Cam kết hoàn phí 100% trong vòng 1 năm nếu bạn không hài lòng.",
        instructions: form.instructions.trim() || null,
      };
      const existing = settingsQ.data;
      const { error } = existing
        ? await supabase.from("membership_settings").update(payload).eq("id", existing.id)
        : await supabase
            .from("membership_settings")
            .insert({ ...payload, price_amount: 0, currency: "VND", period_label: "năm" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã lưu cài đặt.");
      void qc.invalidateQueries({ queryKey: ["membership_settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Lưu thất bại."),
  });

  return (
    <section className="mt-6 rounded-3xl bg-background p-6 ring-1 ring-border">
      <h2 className="text-xl">Cài đặt chung</h2>
      <p className="text-sm text-ink-soft mt-1">
        Thông tin ngân hàng và cam kết hoàn phí hiển thị trên trang kích hoạt.
      </p>
      <div className="mt-4 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium">Thông tin ngân hàng</span>
          <textarea
            rows={3}
            className={inputCls}
            value={form.bank_info}
            onChange={(e) => setForm({ ...form, bank_info: e.target.value })}
            placeholder="Tên TK: ...\nSố TK: ...\nNgân hàng: TPBank"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Cam kết hoàn phí</span>
          <textarea
            rows={2}
            className={inputCls}
            value={form.refund_note}
            onChange={(e) => setForm({ ...form, refund_note: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Hướng dẫn thêm</span>
          <textarea
            rows={2}
            className={inputCls}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </label>
      </div>
      <button
        type="button"
        disabled={save.isPending}
        onClick={() => save.mutate()}
        className="mt-5 rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {save.isPending ? "Đang lưu..." : "Lưu cài đặt"}
      </button>
    </section>
  );
}

// ─── Requests table ───────────────────────────────────────────────────────────
function RequestsTable() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const requestsQ = useQuery(allMembershipRequestsQuery);
  const plansQ = useQuery(allMembershipPlansQuery);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">(
    "all",
  );

  const review = useMutation({
    mutationFn: async ({
      req,
      status,
      durationDays,
      plan,
    }: {
      req: MembershipRequest;
      status: "approved" | "rejected";
      durationDays: number;
      plan?: MembershipPlan | null;
    }) => {
      const today = new Date();
      const expires = new Date(today);
      expires.setDate(expires.getDate() + durationDays);
      const { error } = await supabase
        .from("membership_requests")
        .update({
          status,
          admin_note: notes[req.id]?.trim() || null,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          starts_at: status === "approved" ? today.toISOString().slice(0, 10) : null,
          expires_at: status === "approved" ? expires.toISOString().slice(0, 10) : null,
        })
        .eq("id", req.id);
      if (error) throw error;
      if (status === "approved" && req.user_id) {
        await supabase
          .from("profiles")
          .update({
            membership_until: expires.toISOString(),
          } as any)
          .eq("id", req.user_id);
      }
    },
    onSuccess: () => {
      toast.success("Đã cập nhật đơn.");
      void qc.invalidateQueries({ queryKey: ["membership_requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Cập nhật thất bại."),
  });

  const allRequests = requestsQ.data ?? [];
  const requests =
    filterStatus === "all" ? allRequests : allRequests.filter((r) => r.status === filterStatus);

  const planMap = Object.fromEntries((plansQ.data ?? []).map((p) => [p.id, p]));

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">Đơn đăng ký ({allRequests.length})</h2>
        <div className="flex gap-1 rounded-xl bg-sand-deep/40 p-1">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filterStatus === s ? "bg-background shadow" : "hover:bg-background/60"}`}
            >
              {s === "all"
                ? "Tất cả"
                : s === "pending"
                  ? "Chờ duyệt"
                  : s === "approved"
                    ? "Đã duyệt"
                    : "Từ chối"}
              {s !== "all" && (
                <span className="ml-1 opacity-60">
                  ({allRequests.filter((r) => r.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {requestsQ.isLoading ? (
        <div className="mt-4 h-32 animate-pulse rounded-3xl bg-sand-deep/60" />
      ) : requests.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">Không có đơn nào.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {requests.map((r) => {
            const plan = r.plan_id ? planMap[r.plan_id] : null;
            const durationDays = plan?.duration_days ?? 365;
            return (
              <li key={r.id} className="rounded-3xl bg-background p-5 ring-1 ring-border">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">
                        {r.contact_name ?? "Không rõ"} • {r.contact_phone ?? "—"}
                      </p>
                      {plan && (
                        <span className="rounded-full bg-terra/10 px-2 py-0.5 text-xs font-semibold text-terra">
                          {plan.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft">
                      {formatPrice(r.amount)} • {new Date(r.created_at).toLocaleString("vi-VN")} •{" "}
                      {r.status === "approved"
                        ? "✅ Đã duyệt"
                        : r.status === "rejected"
                          ? "❌ Từ chối"
                          : "⏳ Chờ duyệt"}
                    </p>
                    {r.note ? <p className="mt-2 text-sm">{r.note}</p> : null}
                  </div>
                </div>
                {r.status === "pending" ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      placeholder="Ghi chú cho shop (tuỳ chọn)"
                      className="min-w-56 flex-1 rounded-xl bg-sand-deep/40 px-4 py-2 text-sm ring-1 ring-border outline-none"
                      value={notes[r.id] ?? ""}
                      onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                    />
                    <button
                      type="button"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({
                          req: r,
                          status: "approved",
                          durationDays,
                          plan: plan || null,
                        })
                      }
                      className="rounded-full bg-terra px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Duyệt ({plan ? `${plan.period_label}` : "1 năm"})
                    </button>
                    <button
                      type="button"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({
                          req: r,
                          status: "rejected",
                          durationDays: 0,
                          plan: plan || null,
                        })
                      }
                      className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
                    >
                      Từ chối
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-ink-soft">
                    {r.admin_note ? `Ghi chú: ${r.admin_note}` : null}
                    {r.expires_at
                      ? ` • Hiệu lực đến ${new Date(r.expires_at).toLocaleDateString("vi-VN")}`
                      : ""}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
// ─── User Manager ─────────────────────────────────────────────────────────────
function UserManager() {
  const qc = useQueryClient();
  const profilesQ = useQuery(allProfilesAdminQuery);
  const rolesQ = useQuery(allUserRolesAdminQuery);

  // Fetch ALL shops with owner_id to support multi-shop per user
  const shopsQ = useQuery({
    queryKey: ["admin", "all-shops-owners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("owner_id, id, name, slug, is_published")
        .not("owner_id", "is", null);
      if (error) throw error;
      return data as {
        owner_id: string;
        id: string;
        name: string;
        slug: string;
        is_published: boolean;
      }[];
    },
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [search, setSearch] = useState("");

  const setRole = useMutation({
    mutationFn: async ({
      userId,
      newRole,
      oldRole,
    }: {
      userId: string;
      newRole: string | null;
      oldRole: string | null;
    }) => {
      if (newRole) {
        const { error } = await supabase
          .from("user_roles")
          .upsert({ user_id: userId, role: newRole as any }, { onConflict: "user_id, role" });
        if (error) throw error;
      }
      if (oldRole && oldRole !== newRole) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", oldRole as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã cập nhật quyền.");
      void qc.invalidateQueries({ queryKey: ["admin", "user_roles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Thất bại."),
  });

  const consumeBlogQuota = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error: fetchErr } = await supabase
        .from("profiles")
        .select("quota_blog_posts")
        .eq("id", userId)
        .single();
      if (fetchErr) throw fetchErr;
      const current = (data as any).quota_blog_posts || 0;
      if (current <= 0) throw new Error("Thành viên không còn quota blog.");
      const { error } = await supabase
        .from("profiles")
        .update({ quota_blog_posts: current - 1 } as any)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xác nhận đăng Blog (trừ 1 quota).");
      void qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Thất bại."),
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!data.membership_until) data.membership_until = null;
      const { error } = await supabase.from("profiles").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật hồ sơ thành viên.");
      setEditingUserId(null);
      void qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Cập nhật thất bại."),
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá hồ sơ thành viên.");
      void qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Xoá thất bại."),
  });

  const profiles = profilesQ.data ?? [];
  const rolesMap = new Map((rolesQ.data ?? []).map((r) => [r.user_id, r.role]));

  // Build map userId -> shops[]
  const shopsMap = new Map<
    string,
    { id: string; name: string; slug: string; is_published: boolean }[]
  >();
  (shopsQ.data ?? []).forEach((s) => {
    if (!s.owner_id) return;
    const existing = shopsMap.get(s.owner_id) ?? [];
    shopsMap.set(s.owner_id, [
      ...existing,
      { id: s.id, name: s.name, slug: s.slug, is_published: s.is_published },
    ]);
  });

  const filtered = search
    ? profiles.filter(
        (p) =>
          ((p as any).full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          p.id.includes(search),
      )
    : profiles;

  return (
    <section className="mt-4 rounded-3xl bg-background p-6 ring-1 ring-border">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-semibold">Tài khoản thành viên ({profiles.length})</h2>
        <input
          className="min-w-0 w-60 rounded-xl border border-border bg-sand-deep/30 px-4 py-2 text-sm outline-none focus:border-terra"
          placeholder="Tìm theo tên, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {profilesQ.isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-sand-deep/60" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink-soft">Chưa có thành viên nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 font-semibold">Thành viên</th>
                <th className="py-3 pr-4 font-semibold">Shop quản lý</th>
                <th className="py-3 pr-4 font-semibold">Hạn thành viên</th>
                <th className="py-3 pr-4 font-semibold">Quota Blog</th>
                <th className="py-3 pr-4 font-semibold">Vai trò</th>
                <th className="py-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const currentRole = rolesMap.get(p.id) || null;
                const isAdminRole = currentRole === "admin";
                const isMod = currentRole === "moderator";
                const isEditing = editingUserId === p.id;
                const userShops = shopsMap.get(p.id) ?? [];
                const profile = p as any;

                return (
                  <React.Fragment key={p.id}>
                    <tr className="border-b border-border/50 hover:bg-sand-deep/10 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-semibold">
                          {profile.full_name || (
                            <span className="italic text-ink-soft">Chưa có tên</span>
                          )}
                        </p>
                        <p className="text-xs font-mono text-ink-soft">{p.id.slice(0, 14)}…</p>
                        <p className="text-xs text-ink-soft">
                          Tham gia: {new Date(p.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        {userShops.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {userShops.map((s) => (
                              <a
                                key={s.id}
                                href={`/shop/${s.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-terra font-medium hover:underline text-xs"
                              >
                                {s.name}
                                {!s.is_published && (
                                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700">
                                    ẩn
                                  </span>
                                )}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-soft opacity-60">Không có</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {profile.membership_until ? (
                          <span
                            className={`text-xs font-semibold ${new Date(profile.membership_until) > new Date() ? "text-emerald-700" : "text-rose-600"}`}
                          >
                            {new Date(profile.membership_until).toLocaleDateString("vi-VN")}
                            {new Date(profile.membership_until) < new Date() ? " (hết hạn)" : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-soft">Không có</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {(profile.quota_blog_posts ?? 0) > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-terra">
                              {profile.quota_blog_posts} bài
                            </span>
                            <button
                              type="button"
                              disabled={consumeBlogQuota.isPending}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Xác nhận đã đăng bài cho ${profile.full_name || "thành viên này"} và trừ 1 quota?`,
                                  )
                                ) {
                                  consumeBlogQuota.mutate(p.id);
                                }
                              }}
                              className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                            >
                              ✓ Đã đăng
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-soft">0 bài</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {isAdminRole ? (
                          <span className="rounded-full bg-terra/10 px-2.5 py-1 text-xs font-semibold text-terra">
                            Admin
                          </span>
                        ) : isMod ? (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            Moderator
                          </span>
                        ) : (
                          <span className="text-xs text-ink-soft">Thành viên</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            className="rounded-xl border border-border bg-transparent px-2 py-1 text-xs outline-none"
                            value={currentRole || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRole.mutate({
                                userId: p.id,
                                newRole: val || null,
                                oldRole: currentRole,
                              });
                            }}
                          >
                            <option value="">Thành viên</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Super Admin</option>
                          </select>
                          <button
                            onClick={() => {
                              if (isEditing) setEditingUserId(null);
                              else {
                                setEditingUserId(p.id);
                                setEditForm({
                                  full_name: profile.full_name || "",
                                  quota_deals: profile.quota_deals || 0,
                                  quota_products: profile.quota_products || 0,
                                  quota_featured_slots: profile.quota_featured_slots || 0,
                                  quota_partner_posts: profile.quota_partner_posts || 0,
                                  quota_blog_posts: profile.quota_blog_posts || 0,
                                  membership_until: profile.membership_until
                                    ? profile.membership_until.slice(0, 10)
                                    : "",
                                });
                              }
                            }}
                            className="rounded bg-sand-deep/40 px-3 py-1 text-xs font-semibold hover:bg-sand-deep/60"
                          >
                            {isEditing ? "Đóng" : "Sửa"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Xoá hồ sơ "${profile.full_name || p.id}"?`)) {
                                deleteProfile.mutate(p.id);
                              }
                            }}
                            className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-200"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr>
                        <td
                          colSpan={6}
                          className="bg-sand-deep/10 px-4 py-4 border-b border-border"
                        >
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">Họ và tên</span>
                              <input
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra"
                                value={editForm.full_name}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, full_name: e.target.value })
                                }
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">
                                Hạn thành viên
                              </span>
                              <input
                                type="date"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra"
                                value={editForm.membership_until}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, membership_until: e.target.value })
                                }
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">
                                Quota Ưu đãi
                              </span>
                              <input
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra"
                                value={editForm.quota_deals}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, quota_deals: Number(e.target.value) })
                                }
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">
                                Quota Sản phẩm
                              </span>
                              <input
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra"
                                value={editForm.quota_products}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    quota_products: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">
                                Quota Đẩy nổi bật
                              </span>
                              <input
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra"
                                value={editForm.quota_featured_slots}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    quota_featured_slots: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">
                                Quota Cơ hội KD
                              </span>
                              <input
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra"
                                value={editForm.quota_partner_posts}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    quota_partner_posts: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">
                                Quota Bài Blog
                              </span>
                              <input
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra"
                                value={editForm.quota_blog_posts}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    quota_blog_posts: Number(e.target.value),
                                  })
                                }
                              />
                            </label>
                            <div className="flex items-end pb-1">
                              <button
                                disabled={updateProfile.isPending}
                                onClick={() => updateProfile.mutate({ id: p.id, data: editForm })}
                                className="w-full rounded-xl bg-terra px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-terra-deep disabled:opacity-60"
                              >
                                Lưu thay đổi
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Category & Location Manager ─────────────────────────────────────────────────────────────
function CategoryLocationManager() {
  const qc = useQueryClient();
  const categoriesQ = useQuery(shopCategoriesQuery);
  const locationsQ = useQuery(shopLocationsQuery);

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catSort, setCatSort] = useState(0);

  const [locName, setLocName] = useState("");
  const [locSlug, setLocSlug] = useState("");
  const [locSort, setLocSort] = useState(0);

  const addCategory = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("shop_categories" as any)
        .insert({ name: catName, slug: catSlug, sort_order: catSort });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thêm danh mục thành công");
      setCatName("");
      setCatSlug("");
      setCatSort(0);
      void qc.invalidateQueries({ queryKey: ["shop_categories"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shop_categories" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa danh mục");
      void qc.invalidateQueries({ queryKey: ["shop_categories"] });
    },
  });

  const addLocation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("shop_locations" as any)
        .insert({ name: locName, slug: locSlug, sort_order: locSort });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thêm địa điểm thành công");
      setLocName("");
      setLocSlug("");
      setLocSort(0);
      void qc.invalidateQueries({ queryKey: ["shop_locations"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shop_locations" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa địa điểm");
      void qc.invalidateQueries({ queryKey: ["shop_locations"] });
    },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-background p-6 ring-1 ring-border">
        <h2 className="mb-4 text-xl font-semibold">Danh mục (Categories)</h2>
        <div className="mb-6 grid gap-3 sm:grid-cols-4 items-end">
          <div>
            <label className="text-xs font-medium text-ink-soft">Tên danh mục</label>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className={inputCls}
              placeholder="VD: Pet shop"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Slug (URL)</label>
            <input
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value)}
              className={inputCls}
              placeholder="VD: pet-shop"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Thứ tự hiển thị</label>
            <input
              type="number"
              value={catSort}
              onChange={(e) => setCatSort(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <button
            disabled={!catName || !catSlug || addCategory.isPending}
            onClick={() => addCategory.mutate()}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            Thêm mới
          </button>
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {categoriesQ.data?.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold">
                  {c.name} <span className="text-xs text-ink-soft">({c.slug})</span>
                </p>
                <p className="text-xs text-ink-soft">Thứ tự: {c.sort_order}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Xóa danh mục?")) deleteCategory.mutate(c.id);
                }}
                className="text-sm font-semibold text-red-600"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-background p-6 ring-1 ring-border">
        <h2 className="mb-4 text-xl font-semibold">Địa điểm (Locations)</h2>
        <div className="mb-6 grid gap-3 sm:grid-cols-4 items-end">
          <div>
            <label className="text-xs font-medium text-ink-soft">Tên địa điểm</label>
            <input
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              className={inputCls}
              placeholder="VD: TP.HCM"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Slug (URL)</label>
            <input
              value={locSlug}
              onChange={(e) => setLocSlug(e.target.value)}
              className={inputCls}
              placeholder="VD: tp-hcm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Thứ tự hiển thị</label>
            <input
              type="number"
              value={locSort}
              onChange={(e) => setLocSort(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <button
            disabled={!locName || !locSlug || addLocation.isPending}
            onClick={() => addLocation.mutate()}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            Thêm mới
          </button>
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {locationsQ.data?.map((l) => (
            <li key={l.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold">
                  {l.name} <span className="text-xs text-ink-soft">({l.slug})</span>
                </p>
                <p className="text-xs text-ink-soft">Thứ tự: {l.sort_order}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Xóa địa điểm?")) deleteLocation.mutate(l.id);
                }}
                className="text-sm font-semibold text-red-600"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
