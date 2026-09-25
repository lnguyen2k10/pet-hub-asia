import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
<br />
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BlogManager } from "@/components/blog-manager";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pet";
import {
  allMembershipPlansQuery,
  allMembershipRequestsQuery,
  isAdminQuery,
  membershipSettingsQuery,
  type MembershipPlan,
  type MembershipRequest,
  type MembershipSettings,
} from "@/lib/queries";

const TITLE = "Quản trị thành viên — 1Pet.Asia";
const DESC = "Khu vực quản trị 1Pet.Asia: tạo gói thành viên, cấu hình thanh toán và duyệt đơn đăng ký.";

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
  const adminQ = useQuery({ ...isAdminQuery, enabled: !!user });

  if (loading || (user && adminQ.isLoading)) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-5 py-16">
          <div className="h-64 animate-pulse rounded-3xl bg-sand-deep/60" />
        </div>
      </div>
    );
  }

  if (!user || !adminQ.data) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-5 py-24 text-center">
          <h1 className="text-3xl">Khu vực quản trị</h1>
          <p className="mt-2 text-ink-soft">
            {user ? "Tài khoản của bạn không có quyền quản trị." : "Vui lòng đăng nhập bằng tài khoản quản trị."}
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

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="font-hand text-2xl text-terra-deep">quản trị</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Gói thành viên & Thanh toán</h1>
        <PlansManager userId={user.id} />
        <BankSettingsForm userId={user.id} />
        <RequestsTable />
        <BlogManager authorName={user.email ?? "Admin"} />
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
          onClick={() => { setEditingPlan(null); setShowForm(true); }}
          className="rounded-full bg-terra px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          + Tạo gói mới
        </button>
      </div>

      {(showForm || editingPlan) && (
        <PlanForm
          plan={editingPlan}
          onClose={() => { setShowForm(false); setEditingPlan(null); }}
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
        <p className="mt-4 text-sm text-ink-soft">Chưa có gói nào. Bấm "+ Tạo gói mới" để bắt đầu.</p>
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
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {plan.is_active ? "Đang bán" : "Tạm dừng"}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft mt-0.5">
                    {formatPrice(plan.price_amount)} / {plan.period_label} • {plan.duration_days} ngày
                  </p>
                  {plan.features.length > 0 && (
                    <p className="text-xs text-ink-soft mt-1">{plan.features.slice(0, 3).join(" • ")}{plan.features.length > 3 ? " ..." : ""}</p>
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
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
        is_featured: form.is_featured,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
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
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Gói Tiêu Chuẩn" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Mô tả</span>
          <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn về gói" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Giá (VND) *</span>
          <input className={inputCls} inputMode="numeric" value={form.price_amount} onChange={(e) => setForm({ ...form, price_amount: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Thời hạn (ngày)</span>
          <input className={inputCls} inputMode="numeric" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Nhãn chu kỳ</span>
          <input className={inputCls} value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })} placeholder="VD: năm / tháng / 6 tháng" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Thứ tự hiển thị</span>
          <input className={inputCls} inputMode="numeric" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Tính năng (mỗi dòng một tính năng)</span>
          <textarea rows={4} className={inputCls} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"Landing page shop\nHiển thị danh sách\nHuy hiệu xác minh"} />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="size-4 accent-terra" />
          <span className="text-sm font-medium">Gói nổi bật (highlight)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="size-4 accent-terra" />
          <span className="text-sm font-medium">Đang bán (active)</span>
        </label>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? "Đang lưu..." : plan ? "Cập nhật gói" : "Tạo gói"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-ink">
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
        refund_note: form.refund_note.trim() || "Cam kết hoàn phí 100% trong vòng 1 năm nếu bạn không hài lòng.",
        instructions: form.instructions.trim() || null,
      };
      const existing = settingsQ.data;
      const { error } = existing
        ? await supabase.from("membership_settings").update(payload).eq("id", existing.id)
        : await supabase.from("membership_settings").insert({ ...payload, price_amount: 0, currency: "VND", period_label: "năm" });
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
      <p className="text-sm text-ink-soft mt-1">Thông tin ngân hàng và cam kết hoàn phí hiển thị trên trang kích hoạt.</p>
      <div className="mt-4 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium">Thông tin ngân hàng</span>
          <textarea rows={3} className={inputCls} value={form.bank_info} onChange={(e) => setForm({ ...form, bank_info: e.target.value })} placeholder="Tên TK: ...\nSố TK: ...\nNgân hàng: TPBank" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Cam kết hoàn phí</span>
          <textarea rows={2} className={inputCls} value={form.refund_note} onChange={(e) => setForm({ ...form, refund_note: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Hướng dẫn thêm</span>
          <textarea rows={2} className={inputCls} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
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
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const review = useMutation({
    mutationFn: async ({
      req,
      status,
      durationDays,
    }: {
      req: MembershipRequest;
      status: "approved" | "rejected";
      durationDays: number;
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
      if (status === "approved" && req.shop_id) {
        await supabase.from("shops").update({ is_published: true }).eq("id", req.shop_id);
      }
    },
    onSuccess: () => {
      toast.success("Đã cập nhật đơn.");
      void qc.invalidateQueries({ queryKey: ["membership_requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Cập nhật thất bại."),
  });

  const allRequests = requestsQ.data ?? [];
  const requests = filterStatus === "all"
    ? allRequests
    : allRequests.filter((r) => r.status === filterStatus);

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
              {s === "all" ? "Tất cả" : s === "pending" ? "Chờ duyệt" : s === "approved" ? "Đã duyệt" : "Từ chối"}
              {s !== "all" && (
                <span className="ml-1 opacity-60">({allRequests.filter((r) => r.status === s).length})</span>
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
                      {r.status === "approved" ? "✅ Đã duyệt" : r.status === "rejected" ? "❌ Từ chối" : "⏳ Chờ duyệt"}
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
                      onClick={() => review.mutate({ req: r, status: "approved", durationDays })}
                      className="rounded-full bg-terra px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Duyệt ({plan ? `${plan.period_label}` : "1 năm"})
                    </button>
                    <button
                      type="button"
                      disabled={review.isPending}
                      onClick={() => review.mutate({ req: r, status: "rejected", durationDays: 0 })}
                      className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
                    >
                      Từ chối
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-ink-soft">
                    {r.admin_note ? `Ghi chú: ${r.admin_note}` : null}
                    {r.expires_at ? ` • Hiệu lực đến ${new Date(r.expires_at).toLocaleDateString("vi-VN")}` : ""}
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
