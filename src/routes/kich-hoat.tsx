import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ImageUpload } from "@/components/image-upload";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pet";
import {
  membershipSettingsQuery,
  myMembershipRequestsQuery,
  myShopQuery,
  type MembershipRequest,
} from "@/lib/queries";

const TITLE = "Kích hoạt thành viên shop — 1Pet.Asia";
const DESC =
  "Đăng ký gói thành viên 1Pet.Asia để kích hoạt landing page shop: chuyển khoản qua mã QR và được duyệt thủ công, cam kết hoàn phí trong 1 năm.";

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

function MembershipPage() {
  const { user, loading } = useAuth();
  const settingsQ = useQuery(membershipSettingsQuery);
  const requestsQ = useQuery({ ...myMembershipRequestsQuery, enabled: !!user });
  const shopQ = useQuery({ ...myShopQuery, enabled: !!user });
  const settings = settingsQ.data;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="font-hand text-2xl text-terra-deep">thành viên 1Pet</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Kích hoạt tài khoản shop</h1>
        <p className="mt-3 text-ink-soft">
          Thanh toán một lần cho cả năm, đội ngũ 1Pet.Asia duyệt thủ công trong vòng 24 giờ làm việc.
        </p>

        <section className="mt-8 rounded-3xl bg-sand-deep/50 p-6 ring-1 ring-border">
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-4xl font-semibold text-terra-deep">
              {formatPrice(settings?.price_amount ?? 299000, settings?.currency ?? "VND")}
            </span>
            <span className="text-ink-soft">/ {settings?.period_label ?? "năm"}</span>
          </div>
          <p className="mt-3 rounded-2xl bg-background p-4 text-sm">
            {settings?.refund_note ??
              "Cam kết hoàn phí 100% trong vòng 1 năm nếu bạn không hài lòng."}
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
            {settings?.qr_image_url ? (
              <img
                src={settings.qr_image_url}
                alt="Mã QR chuyển khoản 1Pet.Asia"
                className="size-44 rounded-2xl bg-background object-contain ring-1 ring-border"
              />
            ) : (
              <div className="grid size-44 place-items-center rounded-2xl bg-background text-center text-xs text-ink-soft ring-1 ring-border">
                Quản trị viên chưa tải mã QR
              </div>
            )}
            <div className="text-sm">
              {settings?.bank_info ? (
                <p className="whitespace-pre-line">{settings.bank_info}</p>
              ) : (
                <p className="text-ink-soft">Thông tin chuyển khoản sẽ được cập nhật sớm.</p>
              )}
              {settings?.instructions ? (
                <p className="mt-3 whitespace-pre-line text-ink-soft">{settings.instructions}</p>
              ) : null}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-8 h-40 animate-pulse rounded-3xl bg-sand-deep/60" />
        ) : !user ? (
          <div className="mt-8 rounded-3xl bg-background p-6 text-center ring-1 ring-border">
            <p>Đăng nhập để gửi đơn đăng ký thành viên.</p>
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
            amount={settings?.price_amount ?? 299000}
            requests={requestsQ.data ?? []}
            loading={requestsQ.isLoading}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function RequestSection({
  userId,
  shopId,
  amount,
  requests,
  loading,
}: {
  userId: string;
  shopId: string | null;
  amount: number;
  requests: MembershipRequest[];
  loading: boolean;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ contact_name: "", contact_phone: "", note: "", proof_url: "" });
  const pending = requests.find((r) => r.status === "pending");

  const submit = useMutation({
    mutationFn: async () => {
      if (form.contact_name.trim().length < 2) throw new Error("Vui lòng nhập tên liên hệ.");
      if (!/^[0-9+\s.-]{8,15}$/.test(form.contact_phone.trim()))
        throw new Error("Số điện thoại chưa hợp lệ.");
      if (!form.proof_url) throw new Error("Vui lòng tải ảnh chứng từ chuyển khoản.");
      const { error } = await supabase.from("membership_requests").insert({
        user_id: userId,
        shop_id: shopId,
        contact_name: form.contact_name.trim(),
        contact_phone: form.contact_phone.trim(),
        note: form.note.trim() || null,
        proof_url: form.proof_url,
        amount,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã gửi đơn! Chúng tôi sẽ duyệt trong 24 giờ làm việc.");
      setForm({ contact_name: "", contact_phone: "", note: "", proof_url: "" });
      void qc.invalidateQueries({ queryKey: ["membership_requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Gửi đơn thất bại."),
  });

  return (
    <>
      {pending ? (
        <div className="mt-8 rounded-3xl bg-background p-6 ring-1 ring-border">
          <h2 className="text-xl">Đơn của bạn đang chờ duyệt</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Chúng tôi đã nhận chứng từ và sẽ phản hồi sớm. Bạn có thể liên hệ hỗ trợ nếu cần gấp.
          </p>
        </div>
      ) : (
        <section className="mt-8 rounded-3xl bg-background p-6 ring-1 ring-border">
          <h2 className="text-xl">Gửi đơn đăng ký</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Tên liên hệ</span>
              <input
                className={inputCls}
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Số điện thoại</span>
              <input
                className={inputCls}
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </label>
            <div className="sm:col-span-2">
              <ImageUpload
                label="Ảnh chứng từ chuyển khoản"
                value={form.proof_url}
                onChange={(url) => setForm({ ...form, proof_url: url })}
                userId={userId}
                folder="membership-proof"
              />
            </div>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Ghi chú (tuỳ chọn)</span>
              <textarea
                rows={3}
                className={inputCls}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </label>
          </div>
          <button
            type="button"
            disabled={submit.isPending}
            onClick={() => submit.mutate()}
            className="mt-5 rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submit.isPending ? "Đang gửi..." : `Gửi đơn ${formatPrice(amount)}`}
          </button>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl">Lịch sử đăng ký</h2>
        {loading ? (
          <div className="mt-4 h-24 animate-pulse rounded-3xl bg-sand-deep/60" />
        ) : requests.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Bạn chưa có đơn đăng ký nào.</p>
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
    </>
  );
}
