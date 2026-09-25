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
  allProfilesAdminQuery,
  allUserRolesAdminQuery,
  userRoleQuery,
  type MembershipPlan,
  type MembershipRequest,
  type MembershipSettings,
} from "@/lib/queries";

const TITLE = "Quáº£n trá»‹ thÃ nh viÃªn â€” 1Pet.Asia";
const DESC = "Khu vá»±c quáº£n trá»‹ 1Pet.Asia: táº¡o gÃ³i thÃ nh viÃªn, cáº¥u hÃ¬nh thanh toÃ¡n vÃ  duyá»‡t Ä‘Æ¡n Ä‘Äƒng kÃ½.";

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
          <h1 className="text-3xl">Khu vá»±c quáº£n trá»‹</h1>
          <p className="mt-2 text-ink-soft">
            {user ? "TÃ i khoáº£n cá»§a báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p khu vá»±c nÃ y." : "Vui lÃ²ng Ä‘Äƒng nháº­p báº±ng tÃ i khoáº£n quáº£n trá»‹/nhÃ¢n sá»±."}
          </p>
          <Link
            to={user ? "/quan-ly" : "/dang-nhap"}
            className="mt-6 inline-block rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {user ? "Vá» trang quáº£n lÃ½" : "ÄÄƒng nháº­p"}
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const TABS = [
    { id: "requests", label: "ÄÆ¡n Ä‘Äƒng kÃ½", show: true },
    { id: "blog", label: "Quáº£n lÃ½ Blog", show: true },
    { id: "plans", label: "GÃ³i thÃ nh viÃªn", show: isAdmin },
    { id: "settings", label: "CÃ i Ä‘áº·t thanh toÃ¡n", show: isAdmin },
    { id: "users", label: "PhÃ¢n quyá»n & User", show: isAdmin },
  ].filter(t => t.show);

  // If activeTab is hidden from this role, fallback
  if (!TABS.find(t => t.id === activeTab) && TABS[0]) {
    setActiveTab(TABS[0].id);
  }

  return (
    <div className="min-h-screen bg-sand-deep/20">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-1 md:w-64">
          <div className="mb-4 px-3">
            <p className="font-hand text-2xl text-terra-deep">quáº£n trá»‹</p>
            <p className="text-xs text-ink-soft font-medium uppercase tracking-wider">{isAdmin ? "Super Admin" : "Moderator"}</p>
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
              <h1 className="mb-6 text-3xl sm:text-4xl">ÄÆ¡n Ä‘Äƒng kÃ½ thÃ nh viÃªn</h1>
              <RequestsTable />
            </div>
          )}
          {activeTab === "blog" && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">Quáº£n lÃ½ Blog</h1>
              <BlogManager authorName={user.email ?? "Admin"} userId={user.id} />
            </div>
          )}
          {activeTab === "plans" && isAdmin && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">GÃ³i thÃ nh viÃªn</h1>
              <PlansManager userId={user.id} />
            </div>
          )}
          {activeTab === "settings" && isAdmin && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">CÃ i Ä‘áº·t thanh toÃ¡n</h1>
              <BankSettingsForm userId={user.id} />
            </div>
          )}
          {activeTab === "users" && isAdmin && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">PhÃ¢n quyá»n & User</h1>
              <UserManager />
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// â”€â”€â”€ Plans Manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PlansManager({ userId: _userId }: { userId: string }) {
  const qc = useQueryClient();
  const plansQ = useQuery(allMembershipPlansQuery);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [showForm, setShowForm] = useState(false);

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("membership_plans" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ÄÃ£ xÃ³a gÃ³i.");
      void qc.invalidateQueries({ queryKey: ["membership_plans" as any] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "XÃ³a tháº¥t báº¡i."),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("membership_plans" as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["membership_plans" as any] }),
  });

  const plans = plansQ.data ?? [];

  return (
    <section className="mt-8 rounded-3xl bg-background p-6 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">Quáº£n lÃ½ gÃ³i thÃ nh viÃªn</h2>
        <button
          type="button"
          onClick={() => { setEditingPlan(null); setShowForm(true); }}
          className="rounded-full bg-terra px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          + Táº¡o gÃ³i má»›i
        </button>
      </div>

      {(showForm || editingPlan) && (
        <PlanForm
          plan={editingPlan}
          onClose={() => { setShowForm(false); setEditingPlan(null); }}
          onSaved={() => {
            void qc.invalidateQueries({ queryKey: ["membership_plans" as any] });
            setShowForm(false);
            setEditingPlan(null);
          }}
        />
      )}

      {plansQ.isLoading ? (
        <div className="mt-4 h-24 animate-pulse rounded-3xl bg-sand-deep/60" />
      ) : plans.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">ChÆ°a cÃ³ gÃ³i nÃ o. Báº¥m "+ Táº¡o gÃ³i má»›i" Ä‘á»ƒ báº¯t Ä‘áº§u.</p>
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
                        Ná»•i báº­t
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {plan.is_active ? "Äang bÃ¡n" : "Táº¡m dá»«ng"}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft mt-0.5">
                    {formatPrice(plan.price_amount)} / {plan.period_label} â€¢ {plan.duration_days} ngÃ y
                  </p>
                  {plan.features.length > 0 && (
                    <p className="text-xs text-ink-soft mt-1">{plan.features.slice(0, 3).join(" â€¢ ")}{plan.features.length > 3 ? " ..." : ""}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive.mutate({ id: plan.id, is_active: !plan.is_active })}
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-sand-deep/40 transition"
                  >
                    {plan.is_active ? "Táº¡m dá»«ng" : "Báº­t láº¡i"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPlan(plan)}
                    className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-sand-deep/40 transition"
                  >
                    Sá»­a
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`XÃ³a gÃ³i "${plan.name}"? HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.`)) {
                        deletePlan.mutate(plan.id);
                      }
                    }}
                    className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                  >
                    XÃ³a
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

// â”€â”€â”€ Plan form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    period_label: plan?.period_label ?? "nÄƒm",
    features: (plan?.features ?? []).join("\n"),
    is_featured: plan?.is_featured ?? false,
    is_active: plan?.is_active ?? true,
    sort_order: String(plan?.sort_order ?? 0),
  });

  const save = useMutation({
    mutationFn: async () => {
      const price = Number(form.price_amount);
      if (!Number.isFinite(price) || price <= 0) throw new Error("Sá»‘ tiá»n khÃ´ng há»£p lá»‡.");
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_amount: price,
        duration_days: Number(form.duration_days) || 365,
        period_label: form.period_label.trim() || "nÄƒm",
        features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
        is_featured: form.is_featured,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };
      if (plan) {
        const { error } = await supabase.from("membership_plans" as any).update(payload).eq("id", plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("membership_plans" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(plan ? "ÄÃ£ cáº­p nháº­t gÃ³i." : "ÄÃ£ táº¡o gÃ³i má»›i.");
      onSaved();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Lá»—i lÆ°u gÃ³i."),
  });

  return (
    <div className="mt-4 rounded-2xl bg-sand-deep/30 p-5 ring-1 ring-border">
      <h3 className="font-semibold mb-4">{plan ? "Sá»­a gÃ³i" : "Táº¡o gÃ³i má»›i"}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">TÃªn gÃ³i *</span>
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: GÃ³i TiÃªu Chuáº©n" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">MÃ´ táº£</span>
          <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="MÃ´ táº£ ngáº¯n vá» gÃ³i" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">GiÃ¡ (VND) *</span>
          <input className={inputCls} inputMode="numeric" value={form.price_amount} onChange={(e) => setForm({ ...form, price_amount: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Thá»i háº¡n (ngÃ y)</span>
          <input className={inputCls} inputMode="numeric" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">NhÃ£n chu ká»³</span>
          <input className={inputCls} value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })} placeholder="VD: nÄƒm / thÃ¡ng / 6 thÃ¡ng" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Thá»© tá»± hiá»ƒn thá»‹</span>
          <input className={inputCls} inputMode="numeric" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">TÃ­nh nÄƒng (má»—i dÃ²ng má»™t tÃ­nh nÄƒng)</span>
          <textarea rows={4} className={inputCls} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"Landing page shop\nHiá»ƒn thá»‹ danh sÃ¡ch\nHuy hiá»‡u xÃ¡c minh"} />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="size-4 accent-terra" />
          <span className="text-sm font-medium">GÃ³i ná»•i báº­t (highlight)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="size-4 accent-terra" />
          <span className="text-sm font-medium">Äang bÃ¡n (active)</span>
        </label>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? "Äang lÆ°u..." : plan ? "Cáº­p nháº­t gÃ³i" : "Táº¡o gÃ³i"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-ink">
          Huá»·
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Bank settings (legacy single QR) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        refund_note: form.refund_note.trim() || "Cam káº¿t hoÃ n phÃ­ 100% trong vÃ²ng 1 nÄƒm náº¿u báº¡n khÃ´ng hÃ i lÃ²ng.",
        instructions: form.instructions.trim() || null,
      };
      const existing = settingsQ.data;
      const { error } = existing
        ? await supabase.from("membership_settings").update(payload).eq("id", existing.id)
        : await supabase.from("membership_settings").insert({ ...payload, price_amount: 0, currency: "VND", period_label: "nÄƒm" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ÄÃ£ lÆ°u cÃ i Ä‘áº·t.");
      void qc.invalidateQueries({ queryKey: ["membership_settings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "LÆ°u tháº¥t báº¡i."),
  });

  return (
    <section className="mt-6 rounded-3xl bg-background p-6 ring-1 ring-border">
      <h2 className="text-xl">CÃ i Ä‘áº·t chung</h2>
      <p className="text-sm text-ink-soft mt-1">ThÃ´ng tin ngÃ¢n hÃ ng vÃ  cam káº¿t hoÃ n phÃ­ hiá»ƒn thá»‹ trÃªn trang kÃ­ch hoáº¡t.</p>
      <div className="mt-4 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium">ThÃ´ng tin ngÃ¢n hÃ ng</span>
          <textarea rows={3} className={inputCls} value={form.bank_info} onChange={(e) => setForm({ ...form, bank_info: e.target.value })} placeholder="TÃªn TK: ...\nSá»‘ TK: ...\nNgÃ¢n hÃ ng: TPBank" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Cam káº¿t hoÃ n phÃ­</span>
          <textarea rows={2} className={inputCls} value={form.refund_note} onChange={(e) => setForm({ ...form, refund_note: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">HÆ°á»›ng dáº«n thÃªm</span>
          <textarea rows={2} className={inputCls} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
        </label>
      </div>
      <button
        type="button"
        disabled={save.isPending}
        onClick={() => save.mutate()}
        className="mt-5 rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {save.isPending ? "Äang lÆ°u..." : "LÆ°u cÃ i Ä‘áº·t"}
      </button>
    </section>
  );
}

// â”€â”€â”€ Requests table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      toast.success("ÄÃ£ cáº­p nháº­t Ä‘Æ¡n.");
      void qc.invalidateQueries({ queryKey: ["membership_requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Cáº­p nháº­t tháº¥t báº¡i."),
  });

  const allRequests = requestsQ.data ?? [];
  const requests = filterStatus === "all"
    ? allRequests
    : allRequests.filter((r) => r.status === filterStatus);

  const planMap = Object.fromEntries((plansQ.data ?? []).map((p) => [p.id, p]));

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">ÄÆ¡n Ä‘Äƒng kÃ½ ({allRequests.length})</h2>
        <div className="flex gap-1 rounded-xl bg-sand-deep/40 p-1">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filterStatus === s ? "bg-background shadow" : "hover:bg-background/60"}`}
            >
              {s === "all" ? "Táº¥t cáº£" : s === "pending" ? "Chá» duyá»‡t" : s === "approved" ? "ÄÃ£ duyá»‡t" : "Tá»« chá»‘i"}
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
        <p className="mt-2 text-sm text-ink-soft">KhÃ´ng cÃ³ Ä‘Æ¡n nÃ o.</p>
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
                        {r.contact_name ?? "KhÃ´ng rÃµ"} â€¢ {r.contact_phone ?? "â€”"}
                      </p>
                      {plan && (
                        <span className="rounded-full bg-terra/10 px-2 py-0.5 text-xs font-semibold text-terra">
                          {plan.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft">
                      {formatPrice(r.amount)} â€¢ {new Date(r.created_at).toLocaleString("vi-VN")} â€¢{" "}
                      {r.status === "approved" ? "âœ… ÄÃ£ duyá»‡t" : r.status === "rejected" ? "âŒ Tá»« chá»‘i" : "â³ Chá» duyá»‡t"}
                    </p>
                    {r.note ? <p className="mt-2 text-sm">{r.note}</p> : null}
                  </div>
                </div>
                {r.status === "pending" ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      placeholder="Ghi chÃº cho shop (tuá»³ chá»n)"
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
                      Duyá»‡t ({plan ? `${plan.period_label}` : "1 nÄƒm"})
                    </button>
                    <button
                      type="button"
                      disabled={review.isPending}
                      onClick={() => review.mutate({ req: r, status: "rejected", durationDays: 0 })}
                      className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60"
                    >
                      Tá»« chá»‘i
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-ink-soft">
                    {r.admin_note ? `Ghi chÃº: ${r.admin_note}` : null}
                    {r.expires_at ? ` â€¢ Hiá»‡u lá»±c Ä‘áº¿n ${new Date(r.expires_at).toLocaleDateString("vi-VN")}` : ""}
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
// â”€â”€â”€ User Manager â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UserManager() {
  const qc = useQueryClient();
  const profilesQ = useQuery(allProfilesAdminQuery);
  const rolesQ = useQuery(allUserRolesAdminQuery);

  const setRole = useMutation({
    mutationFn: async ({ userId, newRole, oldRole }: { userId: string; newRole: string | null; oldRole: string | null }) => {
      if (oldRole) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", oldRole as any);
        if (error) throw error;
      }
      if (newRole) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("ÄÃ£ cáº­p nháº­t quyá»n.");
      void qc.invalidateQueries({ queryKey: ["admin", "user_roles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Tháº¥t báº¡i."),
  });

  const profiles = profilesQ.data ?? [];
  const rolesMap = new Map((rolesQ.data ?? []).map((r) => [r.user_id, r.role]));

  return (
    <section className="mt-8 rounded-3xl bg-background p-6 ring-1 ring-border">
      <h2 className="mb-4 text-xl font-semibold">TÃ i khoáº£n thÃ nh viÃªn ({profiles.length})</h2>
      {profilesQ.isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-sand-deep/60" />
      ) : profiles.length === 0 ? (
        <p className="text-sm text-ink-soft">ChÆ°a cÃ³ thÃ nh viÃªn nÃ o.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 font-semibold">ThÃ nh viÃªn</th>
                <th className="py-3 font-semibold">NgÃ y Ä‘Äƒng kÃ½</th>
                <th className="py-3 font-semibold">Vai trÃ² hiá»‡n táº¡i</th>
                <th className="py-3 text-right font-semibold">HÃ nh Ä‘á»™ng</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const currentRole = rolesMap.get(p.id) || null;
                const isAdmin = currentRole === "admin";
                const isMod = currentRole === "moderator";
                
                return (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{p.full_name || "ChÆ°a cÃ³ tÃªn"}</p>
                      <p className="text-xs text-ink-soft opacity-60">{p.id.slice(0, 8)}...</p>
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">
                      {new Date(p.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3 pr-4">
                      {isAdmin ? (
                        <span className="rounded-full bg-terra/10 px-2.5 py-1 text-xs font-semibold text-terra">Admin</span>
                      ) : isMod ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Moderator</span>
                      ) : (
                        <span className="text-xs text-ink-soft">ThÃ nh viÃªn</span>
                      )}
                    </td>
                    <td className="py-3 text-right flex items-center justify-end gap-2">
                      <select
                        className="rounded-xl border border-border bg-transparent px-2 py-1 text-xs outline-none"
                        value={currentRole || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRole.mutate({ userId: p.id, newRole: val || null, oldRole: currentRole });
                        }}
                      >
                        <option value="">ThÃ nh viÃªn thÆ°á»ng</option>
                        <option value="moderator">Moderator (Duyá»‡t bÃ i/Ä‘Æ¡n)</option>
                        <option value="admin">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

