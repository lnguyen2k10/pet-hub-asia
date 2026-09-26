import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pet";
import {
  membershipPlansQuery,
  myMembershipRequestsQuery,
  myShopQuery,
  type MembershipPlan,
  type MembershipRequest,
} from "@/lib/queries";

const TITLE = "Kích hoạt thành viên shop — 1Pet.Asia";
const DESC =
  "Chọn gói thành viên 1Pet.Asia phù hợp để kích hoạt landing page shop của bạn. Thanh toán tự động qua mã QR — hệ thống duyệt trong vài phút.";

export const Route = createFileRoute("/kich-hoat")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  component: MembershipPage,
});

const inputCls =
  "mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-terra";

export function statusLabel(status: string) {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Từ chối";
  return "Chờ duyệt";
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : status === "rejected"
        ? "bg-rose-100 text-rose-800"
        : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{statusLabel(status)}</span>
  );
}

// ─── Plan card component ────────────────────────────────────────────────────
function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: MembershipPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative w-full rounded-3xl p-6 text-left transition-all ring-2",
        plan.is_featured ? "bg-terra/5" : "bg-background",
        selected
          ? "ring-terra shadow-lg shadow-terra/10 scale-[1.02]"
          : "ring-border hover:ring-terra/40 hover:shadow-md",
      ].join(" ")}
    >
      {plan.is_featured && (
        <span className="absolute -top-3 left-6 rounded-full bg-terra px-3 py-1 text-xs font-bold text-white shadow">
          ⭐ Phổ biến nhất
        </span>
      )}
      {selected && (
        <span className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-terra text-white text-sm">
          ✓
        </span>
      )}
      <h3 className="text-lg font-bold text-terra-deep">{plan.name}</h3>
      {plan.description && (
        <p className="mt-1 text-sm text-ink-soft">{plan.description}</p>
      )}
      <div className="mt-3 flex items-baseline gap-1.5">
        {plan.price_amount === 0 ? (
          <>
            <span className="text-3xl font-bold text-terra">Miễn phí</span>
            <span className="text-sm text-ink-soft line-through ml-1">100.000đ</span>
          </>
        ) : (
          <>
            <span className="text-3xl font-bold">{formatPrice(plan.price_amount)}</span>
            <span className="text-sm text-ink-soft">/ {plan.period_label}</span>
          </>
        )}
      </div>
      {plan.features.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 shrink-0 text-terra">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
function MembershipPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  // Force refetch plans in case of stale cache
  useState(() => {
    qc.invalidateQueries({ queryKey: ["membership_plans"] });
  });
  const plansQ = useQuery(membershipPlansQuery);
  const requestsQ = useQuery({ ...myMembershipRequestsQuery, enabled: !!user });
  const shopQ = useQuery({ ...myShopQuery, enabled: !!user });

  const plans = plansQ.data ?? [];
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? (plans.length === 1 ? plans[0] : null);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12">
        <p className="font-hand text-2xl text-terra-deep">thành viên 1Pet</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Kích hoạt tài khoản shop</h1>
        <p className="mt-3 text-ink-soft">
          Chọn gói phù hợp — quét mã QR thanh toán — hệ thống kích hoạt tự động trong vài phút.
        </p>

        {/* Bảng chọn gói */}
        {plansQ.isLoading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-sand-deep/60" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-sand-deep/40 p-8 text-center text-ink-soft">
            Chưa có gói thành viên nào được thiết lập. Vui lòng liên hệ quản trị viên.
          </div>
        ) : (
          <>
            <div className={`mt-10 grid gap-4 ${plans.length === 1 ? "max-w-sm" : plans.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan?.id === plan.id}
                  onSelect={() => setSelectedPlanId(plan.id)}
                />
              ))}
            </div>
            {plans.length > 1 && !selectedPlan && (
              <p className="mt-4 text-sm font-medium text-terra animate-pulse">
                ↑ Chọn một gói để tiếp tục thanh toán
              </p>
            )}
          </>
        )}

        {/* Khu vực thanh toán — chỉ hiện khi đã chọn gói */}
        {selectedPlan && (
          <>
            {loading ? (
              <div className="mt-8 h-40 animate-pulse rounded-3xl bg-sand-deep/60" />
            ) : !user ? (
              <div className="mt-8 rounded-3xl bg-background p-6 text-center ring-1 ring-border">
                <p>Đăng nhập để tiếp tục đăng ký gói <strong>{selectedPlan.name}</strong>.</p>
                <Link
                  to="/dang-nhap"
                  className="mt-4 inline-block rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Đăng nhập / Đăng ký
                </Link>
              </div>
            ) : (
              <RequestSection
                userId={user.id}
                shopId={shopQ.data?.id ?? null}
                plan={selectedPlan}
                requests={requestsQ.data ?? []}
                loading={requestsQ.isLoading}
              />
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

// ─── Request section ─────────────────────────────────────────────────────────
function RequestSection({
  userId,
  shopId,
  plan,
  requests,
  loading,
}: {
  userId: string;
  shopId: string | null;
  plan: MembershipPlan;
  requests: MembershipRequest[];
  loading: boolean;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ contact_name: "", contact_phone: "", note: "" });

  // Kiểm tra đơn active cho đúng gói này
  const activePlanRequest = requests.find(
    (r) => r.status === "approved" && r.plan_id === plan.id && r.expires_at && new Date(r.expires_at) > new Date()
  );
  // Đơn đang chờ (bất kỳ gói)
  const pendingRequest = requests.find((r) => r.status === "pending");

  const submit = useMutation({
    mutationFn: async () => {
      let cName = form.contact_name.trim();
      let cPhone = form.contact_phone.trim();
      
      if (plan.price_amount > 0) {
        if (cName.length < 2) throw new Error("Vui lòng nhập tên liên hệ.");
        if (!/^[0-9+\s.-]{8,15}$/.test(cPhone))
          throw new Error("Số điện thoại chưa hợp lệ.");
      } else {
        cName = cName || "Quà Tặng";
        cPhone = cPhone || "0000000000";
      }

      const { error } = await supabase.from("membership_requests").insert({
        user_id: userId,
        shop_id: shopId,
        plan_id: plan.id,
        contact_name: cName,
        contact_phone: cPhone,
        note: form.note.trim() || null,
        amount: plan.price_amount,
        status: "pending",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(plan.price_amount === 0 ? "Nhận quà tặng thành công!" : "Đã gửi đơn! Vui lòng hoàn tất thanh toán theo mã QR bên dưới.");
      setForm({ contact_name: "", contact_phone: "", note: "" });
      void qc.invalidateQueries({ queryKey: ["membership_requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gửi đơn thất bại."),
  });

  const phone = form.contact_phone.replace(/\D/g, "");

  if (activePlanRequest) {
    return (
      <div className="mt-8 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎉</span>
          <div>
            <h2 className="text-xl font-bold text-emerald-800">Gói {plan.name} đang hoạt động!</h2>
            <p className="text-sm text-emerald-700">
              Hiệu lực đến {new Date(activePlanRequest.expires_at!).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
        <Link
          to="/quan-ly"
          className="mt-4 inline-block rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Quản lý shop của bạn →
        </Link>
      </div>
    );
  }

  if (pendingRequest && pendingRequest.plan_id === plan.id) {
    return (
      <div className="mt-8 rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-200">
        <h2 className="text-xl font-semibold text-amber-900">Đơn đang chờ xử lý</h2>
        <p className="mt-2 text-sm text-amber-800">
          Bạn đã gửi đơn cho gói <strong>{plan.name}</strong>. Nếu bạn đã chuyển khoản với nội dung{" "}
          <strong className="font-mono">PET{pendingRequest.contact_phone}</strong>, hệ thống sẽ tự động duyệt trong vài phút.
        </p>

        {/* Vẫn hiện QR để khách hàng có thể thanh toán nếu chưa */}
        <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-border">
          <h3 className="font-semibold text-sm mb-3">Chưa thanh toán? Quét mã QR ngay:</h3>
          <div className="flex items-start gap-4">
            <img decoding="async"
              src={`https://qr.sepay.vn/img?acc=00003554020&bank=TPBank&amount=${plan.price_amount}&des=PET${pendingRequest.contact_phone ?? ""}`}
              alt="QR Code"
              className="w-32 h-32 rounded-xl ring-1 ring-border"
            />
            <div className="text-sm space-y-1">
              <p>Ngân hàng: <strong>TPBank</strong></p>
              <p>Số TK: <strong>00003554020</strong></p>
              <p>Số tiền: <strong className="text-terra">{formatPrice(plan.price_amount)}</strong></p>
              <p>Nội dung: <strong className="font-mono text-terra">PET{pendingRequest.contact_phone}</strong></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="mt-8 rounded-3xl bg-background p-6 md:p-8 ring-1 ring-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-terra/10 px-3 py-1 text-xs font-semibold text-terra">
            Gói đã chọn: {plan.name}
          </span>
          <span className="text-sm font-bold text-terra">{formatPrice(plan.price_amount)}</span>
        </div>
        <h2 className="text-2xl font-semibold text-terra-deep mb-2">{plan.price_amount === 0 ? "Nhận Quà Tặng" : "Thanh toán & Gửi đơn"}</h2>
        <p className="text-ink-soft text-sm mb-6">
          {plan.price_amount === 0 ? "Nhập thông tin để nhận ngay gói quà tặng miễn phí." : `Hệ thống sẽ tự động kích hoạt gói ${plan.name} cho bạn trong 1–3 phút sau khi chuyển khoản thành công.`}
        </p>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Cột mã QR */}
          {plan.price_amount > 0 && (
            <div className="order-2 md:order-1 flex flex-col items-center rounded-3xl bg-sand-deep/30 p-6 ring-1 ring-border/50">
              <h3 className="font-semibold mb-1">Quét mã QR để thanh toán</h3>
              <p className="text-xs text-ink-soft text-center mb-4">
                Mã QR cập nhật theo số điện thoại bạn nhập bên phải.
              </p>
              <div className="rounded-2xl overflow-hidden bg-white ring-2 ring-terra/20 p-2 shadow-sm">
                <img decoding="async"
                  src={`https://qr.sepay.vn/img?acc=00003554020&bank=TPBank&amount=${plan.price_amount}&des=PET${phone || "SDTCUABAN"}`}
                  alt="QR Code Thanh Toán"
                  className="w-full max-w-[220px] aspect-square object-contain"
                />
              </div>
              <div className="mt-4 space-y-1 text-sm text-center">
                <p>Ngân hàng: <strong>TPBank</strong></p>
                <p>Số tài khoản: <strong>00003554020</strong></p>
                <p>Số tiền: <strong className="text-terra">{formatPrice(plan.price_amount)}</strong></p>
                <p>Nội dung: <strong className="font-mono text-terra">PET{phone || "SDTCUABAN"}</strong></p>
              </div>
            </div>
          )}

          {/* Cột điền thông tin */}
          <div className="order-1 md:order-2">
            <div className="space-y-4">
              {plan.price_amount > 0 ? (
                <>
                  <label className="block">
                    <span className="text-sm font-medium">1. Số điện thoại đăng ký</span>
                    <input
                      className={inputCls}
                      placeholder="VD: 0912345678"
                      value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    />
                    <p className="mt-1.5 text-xs text-terra font-medium">
                      * Nhập SĐT trước để mã QR cập nhật đúng nội dung chuyển khoản!
                    </p>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">2. Tên liên hệ</span>
                    <input
                      className={inputCls}
                      value={form.contact_name}
                      onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">3. Ghi chú (tuỳ chọn)</span>
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                    />
                  </label>
                </>
              ) : (
                <div className="rounded-3xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-2">🎁 Quà tặng dành riêng cho bạn!</h3>
                  <p className="text-sm text-emerald-800 mb-4">
                    Nhấn nút bên dưới để nhận ngay đặc quyền 1 bài đăng trên blog hệ thống của 1Pet.Asia hoàn toàn miễn phí.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={submit.isPending}
                  onClick={() => submit.mutate()}
                  className="w-full rounded-full bg-terra px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 shadow-md shadow-terra/20"
                >
                  {submit.isPending ? "Đang xử lý..." : plan.price_amount === 0 ? "Nhận Ưu Đãi Ngay" : "Tôi đã thanh toán & Gửi đơn"}
                </button>
                {plan.price_amount > 0 && (
                  <p className="mt-3 text-center text-xs text-ink-soft">
                    Hãy đảm bảo bạn đã quét mã và chuyển khoản thành công trước khi gửi đơn.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lịch sử đăng ký */}
      <HistorySection requests={requests} loading={loading} plans={[]} />
    </>
  );
}

function HistorySection({
  requests,
  loading,
}: {
  requests: MembershipRequest[];
  loading: boolean;
  plans: MembershipPlan[];
}) {
  if (requests.length === 0 && !loading) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl">Lịch sử đăng ký</h2>
      {loading ? (
        <div className="mt-4 h-24 animate-pulse rounded-3xl bg-sand-deep/60" />
      ) : (
        <ul className="mt-4 space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl bg-background p-4 ring-1 ring-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{formatPrice(r.amount)}</span>
                <StatusPill status={r.status} />
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Gửi ngày {new Date(r.created_at).toLocaleDateString("vi-VN")}
                {r.status === "approved" && r.expires_at
                  ? ` • Hiệu lực đến ${new Date(r.expires_at).toLocaleDateString("vi-VN")}`
                  : ""}
              </p>
              {r.admin_note ? <p className="mt-2 text-sm">Ghi chú: {r.admin_note}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
