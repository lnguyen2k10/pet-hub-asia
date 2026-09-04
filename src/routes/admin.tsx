import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ImageUpload } from "@/components/image-upload";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/pet";
import {
  allMembershipRequestsQuery,
  isAdminQuery,
  membershipSettingsQuery,
  type MembershipRequest,
  type MembershipSettings,
} from "@/lib/queries";

const TITLE = "Quản trị thành viên — 1Pet.Asia";
const DESC = "Khu vực quản trị 1Pet.Asia: cấu hình phí thành viên, mã QR và duyệt đơn đăng ký của shop.";

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
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="font-hand text-2xl text-terra-deep">quản trị</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Thành viên &amp; thanh toán</h1>
        <SettingsForm userId={user.id} />
        <RequestsTable />
      </main>
      <SiteFooter />
    </div>
  );
}

function SettingsForm({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const settingsQ = useQuery(membershipSettingsQuery);
  const [form, setForm] = useState({
    price_amount: "299000",
    period_label: "năm",
    qr_image_url: "",
    bank_info: "",
    refund_note: "",
    instructions: "",
  });

  useEffect(() => {
    const s = settingsQ.data as MembershipSettings | null | undefined;
    if (!s) return;
    setForm({
      price_amount: String(s.price_amount),
      period_label: s.period_label,
      qr_image_url: s.qr_image_url ?? "",
      bank_info: s.bank_info ?? "",
      refund_note: s.refund_note,
      instructions: s.instructions ?? "",
    });
  }, [settingsQ.data]);

  const save = useMutation({
    mutationFn: async () => {
      const price = Number(form.price_amount);
      if (!Number.isFinite(price) || price < 0) throw new Error("Số tiền chưa hợp lệ.");
      const payload = {
        price_amount: price,
        period_label: form.period_label.trim() || "năm",
        qr_image_url: form.qr_image_url || null,
        bank_info: form.bank_info.trim() || null,
        refund_note:
          form.refund_note.trim() || "Cam kết hoàn phí 100% trong vòng 1 năm nếu bạn không hài lòng.",
        instructions: form.instructions.trim() || null,
      };
      const existing = settingsQ.data;
      const { error } = existing
        ? await supabase.from("membership_settings").update(payload).eq("id", existing.id)
        : await supabase.from("membership_settings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã lưu cấu hình thành viên.");
      void qc.invalidateQueries({ queryKey: ["membership_settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Lưu thất bại."),
  });

  return (
    <section className="mt-8 rounded-3xl bg-background p-6 ring-1 ring-border">
      <h2 className="text-xl">Cấu hình gói thành viên</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Số tiền (VND)</span>
          <input
            className={inputCls}
            inputMode="numeric"
            value={form.price_amount}
            onChange={(e) => setForm({ ...form, price_amount: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Chu kỳ</span>
          <input
            className={inputCls}
            value={form.period_label}
            onChange={(e) => setForm({ ...form, period_label: e.target.value })}
          />
        </label>
        <div className="sm:col-span-2">
          <ImageUpload
            label="Mã QR chuyển khoản"
            value={form.qr_image_url}
            onChange={(url) => setForm({ ...form, qr_image_url: url })}
            userId={userId}
            folder="membership-qr"
            aspect="square"
          />
        </div>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Thông tin chuyển khoản</span>
          <textarea
            rows={3}
            className={inputCls}
            value={form.bank_info}
            onChange={(e) => setForm({ ...form, bank_info: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Cam kết hoàn phí</span>
          <textarea
            rows={2}
            className={inputCls}
            value={form.refund_note}
            onChange={(e) => setForm({ ...form, refund_note: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">Hướng dẫn thanh toán</span>
          <textarea
            rows={3}
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
        {save.isPending ? "Đang lưu..." : "Lưu cấu hình"}
      </button>
    </section>
  );
}

function RequestsTable() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const requestsQ = useQuery(allMembershipRequestsQuery);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const review = useMutation({
    mutationFn: async ({ req, status }: { req: MembershipRequest; status: "approved" | "rejected" }) => {
      const today = new Date();
      const expires = new Date(today);
      expires.setFullYear(expires.getFullYear() + 1);
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

  const requests = requestsQ.data ?? [];

  return (
    <section className="mt-10">
      <h2 className="text-xl">Đơn đăng ký thành viên</h2>
      {requestsQ.isLoading ? (
        <div className="mt-4 h-32 animate-pulse rounded-3xl bg-sand-deep/60" />
      ) : requests.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">Chưa có đơn nào.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {requests.map((r) => (
            <li key={r.id} className="rounded-3xl bg-background p-5 ring-1 ring-border">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {r.contact_name ?? "Không rõ"} • {r.contact_phone ?? "—"}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {formatPrice(r.amount)} • {new Date(r.created_at).toLocaleString("vi-VN")} •{" "}
                    {r.status === "approved" ? "Đã duyệt" : r.status === "rejected" ? "Từ chối" : "Chờ duyệt"}
                  </p>
                  {r.note ? <p className="mt-2 text-sm">{r.note}</p> : null}
                </div>
                {r.proof_url ? (
                  <a href={r.proof_url} target="_blank" rel="noreferrer">
                    <img
                      src={r.proof_url}
                      alt="Chứng từ chuyển khoản"
                      className="h-24 w-24 rounded-xl object-cover ring-1 ring-border"
                    />
                  </a>
                ) : null}
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
                    onClick={() => review.mutate({ req: r, status: "approved" })}
                    className="rounded-full bg-terra px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    Duyệt 1 năm
                  </button>
                  <button
                    type="button"
                    disabled={review.isPending}
                    onClick={() => review.mutate({ req: r, status: "rejected" })}
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
          ))}
        </ul>
      )}
    </section>
  );
}
