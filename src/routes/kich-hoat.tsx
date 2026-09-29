import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
            <div
              className={`mt-10 grid gap-4 ${
                { 1: "max-w-sm", 2: "sm:grid-cols-2" }[plans.length] || "sm:grid-cols-3"
              }`}
            >
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
                onRefreshRequests={() => qc.invalidateQueries({ queryKey: ["membership_requests"] })}
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
  onRefreshRequests,
}: {
  userId: string;
  shopId: string | null;
  plan: MembershipPlan;
  requests: MembershipRequest[];
  loading: boolean;
  onRefreshRequests: () => void;
}) {
  const qc = useQueryClient();
  // Polling state
  const [isPolling, setIsPolling] = useState(false);
  const pollCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_POLL_COUNT = 120; // 120 × 5s = 10 phút
  const POLL_INTERVAL = 5000;

  // Kiểm tra đơn active cho đúng gói này
  const activePlanRequest = requests.find(
    (r) => r.status === "approved" && r.plan_id === plan.id && r.expires_at && new Date(r.expires_at) > new Date()
  );
  // Đơn đang chờ của đúng gói này
  const pendingForThisPlan = requests.find((r) => r.status === "pending" && r.plan_id === plan.id);

  // Kiểm tra xem đã từng nhận gói Free này bao giờ chưa (bất kể trạng thái)
  const hasClaimedFreePlanEver = plan.price_amount === 0 && requests.some((r) => r.plan_id === plan.id);

  // Dừng polling nếu đã approved hoặc component unmount
  useEffect(() => {
    if (activePlanRequest && isPolling) {
      stopPolling();
      toast.success("🎉 Gói thành viên đã được kích hoạt thành công!");
    }
  }, [activePlanRequest]);

  useEffect(() => {
    return () => stopPolling(); // cleanup on unmount
  }, []);

  function startPolling() {
    if (pollTimerRef.current) return; // đã đang chạy
    pollCountRef.current = 0;
    setIsPolling(true);
    pollTimerRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      await qc.invalidateQueries({ queryKey: ["membership_requests"] });
      onRefreshRequests();

      // Kiểm tra trong cache ngay sau refetch
      const cached = qc.getQueryData<MembershipRequest[]>(["membership_requests", "mine"]);
      const approved = cached?.find(
        (r) => r.status === "approved" && r.plan_id === plan.id
      );
      if (approved) {
        stopPolling();
        return;
      }

      if (pollCountRef.current >= MAX_POLL_COUNT) {
        stopPolling();
        toast.info("Hệ thống đã ngừng kiểm tra tự động. Vui lòng tải lại trang để cập nhật trạng thái.");
      }
    }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsPolling(false);
  }

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("membership_requests").insert({
        user_id: userId,
        shop_id: shopId,
        plan_id: plan.id,
        contact_name: "Khách hàng",
        contact_phone: "0000000000",
        note: `Tự kích hoạt qua QR`,
        amount: plan.price_amount,
        status: "pending",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      if (plan.price_amount === 0) {
        toast.success("Đã gửi yêu cầu nhận quà tặng! Hệ thống đang xử lý...");
      } else {
        toast.success("Đã tạo đơn thành công! Vui lòng quét mã QR để thanh toán.");
      }
      void qc.invalidateQueries({ queryKey: ["membership_requests"] });
      onRefreshRequests();
      // Bắt đầu polling để theo dõi kích hoạt
      startPolling();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gửi đơn thất bại."),
  });

  // ─── Đã có gói active ───
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

  // ─── Đang chờ xác nhận (đã bấm, đang polling) ───
  if (pendingForThisPlan?.id) {
    const paymentCode = pendingForThisPlan.id.split("-")[0].toUpperCase();

    return (
      <div className="mt-8 rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-200">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-amber-900">
              {isPolling ? "⏳ Đang chờ xác nhận thanh toán..." : "Đơn đang chờ xử lý"}
            </h2>
            <p className="mt-2 text-sm text-amber-800">
              {plan.price_amount > 0 ? (
                <>
                  Sau khi bạn chuyển khoản với nội dung{" "}
                  <strong className="font-mono text-terra">PET{paymentCode}</strong>, hệ thống sẽ tự động kích hoạt gói{" "}
                  <strong>{plan.name}</strong> trong vòng <strong>1–3 phút</strong>.
                  {isPolling && (
                    <span className="mt-1 block text-xs text-amber-600">
                      🔄 Hệ thống đang tự động kiểm tra mỗi 5 giây...
                    </span>
                  )}
                </>
              ) : (
                "Yêu cầu của bạn đang được xử lý. Vui lòng chờ trong giây lát."
              )}
            </p>
          </div>
          {isPolling && (
            <div className="shrink-0">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-amber-700" />
            </div>
          )}
        </div>

        {plan.price_amount > 0 && (
          <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-border shadow-sm">
            <h3 className="font-semibold text-base mb-4 text-center">Quét QR để thanh toán</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="rounded-2xl overflow-hidden ring-2 ring-terra/20 p-2 shadow-sm bg-white shrink-0">
                <img
                  decoding="async"
                  src={`https://qr.sepay.vn/img?acc=00003554020&bank=TPBank&amount=${plan.price_amount}&des=PET${paymentCode}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div className="text-sm space-y-2.5">
                <p>Ngân hàng: <strong className="text-base">TPBank</strong></p>
                <p>Số TK: <strong className="text-base">00003554020</strong></p>
                <p>Chủ TK: <strong className="text-base">1PET ASIA</strong></p>
                <p>Số tiền: <strong className="text-terra text-xl">{formatPrice(plan.price_amount)}</strong></p>
                <p>Nội dung CK: <strong className="font-mono text-terra text-xl bg-terra/10 px-2 py-1 rounded">PET{paymentCode}</strong></p>
                <p className="text-xs text-ink-soft pt-2">⚡ Hãy chuyển đúng nội dung để được duyệt tự động ngay lập tức.</p>
              </div>
            </div>
          </div>
        )}

        {!isPolling && (
          <button
            onClick={startPolling}
            className="mt-4 rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Kiểm tra lại trạng thái
          </button>
        )}
      </div>
    );
  }

  // ─── Đã từng nhận gói Free nhưng đã hết hạn hoặc bị từ chối ───
  if (hasClaimedFreePlanEver) {
    return (
      <div className="mt-8 rounded-3xl bg-sand-deep/40 p-6 ring-1 ring-border text-center">
        <span className="text-3xl">🎁</span>
        <h2 className="mt-3 text-lg font-semibold text-ink">
          Bạn đã sử dụng đặc quyền này
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Gói ưu đãi miễn phí này chỉ được áp dụng 1 lần duy nhất cho mỗi tài khoản.
        </p>
      </div>
    );
  }

  // ─── Chưa có đơn — hiện QR + nút xác nhận ý định CK ───
  return (
    <>
      <section className="mt-8 rounded-3xl bg-background p-6 md:p-8 ring-1 ring-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-terra/10 px-3 py-1 text-xs font-semibold text-terra">
            Gói đã chọn: {plan.name}
          </span>
          <span className="text-sm font-bold text-terra">{formatPrice(plan.price_amount)}</span>
        </div>
        <h2 className="text-2xl font-semibold text-terra-deep mb-2">
          {plan.price_amount === 0 ? "Nhận Quà Tặng" : "Thanh toán & Kích hoạt tự động"}
        </h2>
        <p className="text-ink-soft text-sm mb-6">
          {plan.price_amount === 0
            ? "Quà tặng thành viên sớm từ 1Pet.Asia"
            : `Quét mã QR bên dưới để thanh toán. Gói ${plan.name} sẽ được kích hoạt tự động ngay sau khi hệ thống xác nhận giao dịch thành công.`}
        </p>

        {plan.price_amount > 0 ? (
          // Gói có phí: Hiện thông tin ngắn gọn và nút tạo đơn
          <div className="flex flex-col gap-6 items-center max-w-lg mx-auto text-center">
            <div className="rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-200 text-left w-full">
              <p className="text-base text-blue-800 font-semibold mb-3">📋 Hướng dẫn thanh toán tự động:</p>
              <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
                <li>Bấm <strong>Tạo đơn & Mã QR thanh toán</strong>.</li>
                <li>Quét mã QR bằng ứng dụng ngân hàng.</li>
                <li>Hệ thống sẽ ghi nhận và kích hoạt gói ngay lập tức.</li>
              </ol>
            </div>
            
            <button
              type="button"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
              className="w-full rounded-full bg-terra px-6 py-4 text-base font-bold text-primary-foreground transition hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 shadow-lg shadow-terra/20"
            >
              {submit.isPending ? "Đang tạo mã QR..." : "Tạo đơn & Mã QR thanh toán"}
            </button>
            <p className="text-xs text-ink-soft -mt-2">
              Hoàn toàn bảo mật và tự động.
            </p>
          </div>

        ) : (
          // Gói miễn phí
          <div className="space-y-4">
            <div className="rounded-3xl bg-emerald-50 p-6 ring-1 ring-emerald-200">
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">🎁 Quà tặng dành riêng cho bạn!</h3>
              <p className="text-sm text-emerald-800">
                Nhấn nút bên dưới để nhận ngay đặc quyền 1 bài đăng trên blog hệ thống của 1Pet.Asia hoàn toàn miễn phí.
              </p>
            </div>
            <button
              type="button"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
              className="w-full rounded-full bg-terra px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 shadow-md shadow-terra/20"
            >
              {submit.isPending ? "Đang xử lý..." : "Nhận Ưu Đãi Ngay"}
            </button>
          </div>
        )}
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
