import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CITIES, slugify } from "@/lib/pet";
import { myShopQuery, type Deal, type Shop } from "@/lib/queries";

const TITLE = "Trang quản lý shop — 1Pet.Asia";
const DESC = "Chủ shop tạo và chỉnh sửa landing page, thông tin liên hệ và ưu đãi trên 1Pet.Asia.";

export const Route = createFileRoute("/quan-ly")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: DashboardPage,
});

const inputCls =
  "mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-terra";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function DashboardPage() {
  const { user, loading } = useAuth();
  const shopQ = useQuery({ ...myShopQuery, enabled: !!user });

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-5 py-16">
          <div className="h-64 animate-pulse rounded-3xl bg-sand-deep/60" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-5 py-24 text-center">
          <h1 className="text-3xl">Khu vực dành cho shop</h1>
          <p className="mt-2 text-ink-soft">Đăng nhập để quản lý landing page của bạn.</p>
          <Link
            to="/dang-nhap"
            className="mt-6 inline-block rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Đăng nhập / Đăng ký
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
        <p className="font-hand text-2xl text-terra-deep">xin chào</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Quản lý shop của bạn</h1>

        {shopQ.isLoading ? (
          <div className="mt-8 h-64 animate-pulse rounded-3xl bg-sand-deep/60" />
        ) : (
          <>
            <ShopForm shop={shopQ.data ?? null} userId={user.id} />
            {shopQ.data ? <DealsManager shop={shopQ.data} /> : null}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

type ShopWithDeals = Shop & { deals: Deal[] };

function ShopForm({ shop, userId }: { shop: ShopWithDeals | null; userId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: CATEGORIES[0].value as string,
    city: CITIES[0] as string,
    address: "",
    phone: "",
    description: "",
    logo_url: "",
    cover_url: "",
    hero_title: "",
    hero_subtitle: "",
    is_published: true,
  });

  useEffect(() => {
    if (!shop) return;
    setForm({
      name: shop.name,
      slug: shop.slug,
      category: shop.category,
      city: shop.city,
      address: shop.address ?? "",
      phone: shop.phone ?? "",
      description: shop.description ?? "",
      logo_url: shop.logo_url ?? "",
      cover_url: shop.cover_url ?? "",
      hero_title: shop.hero_title ?? "",
      hero_subtitle: shop.hero_subtitle ?? "",
      is_published: shop.is_published,
    });
  }, [shop]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        owner_id: userId,
        name: form.name,
        slug: form.slug || slugify(form.name),
        category: form.category,
        city: form.city,
        address: form.address || null,
        phone: form.phone || null,
        description: form.description || null,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
        hero_title: form.hero_title || null,
        hero_subtitle: form.hero_subtitle || null,
        is_published: form.is_published,
      };
      if (shop) {
        const { error } = await supabase.from("shops").update(payload).eq("id", shop.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shops").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã lưu thông tin shop!");
      qc.invalidateQueries({ queryKey: ["shop"] });
      qc.invalidateQueries({ queryKey: ["shops"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-8 rounded-3xl bg-card p-6 ring-1 ring-border sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">
          {shop ? "Chỉnh sửa landing page" : "Tạo landing page cho shop"}
        </h2>
        {shop ? (
          <Link
            to="/shop/$slug"
            params={{ slug: shop.slug }}
            className="text-sm font-medium text-terra-deep hover:underline"
          >
            Xem trang công khai →
          </Link>
        ) : null}
      </div>

      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="Tên shop">
          <input
            required
            className={inputCls}
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
                slug: shop ? f.slug : slugify(e.target.value),
              }))
            }
          />
        </Field>
        <Field label="Đường dẫn (slug)">
          <input
            required
            className={inputCls}
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
          />
        </Field>
        <Field label="Danh mục">
          <select
            className={inputCls}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Thành phố">
          <select
            className={inputCls}
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Địa chỉ">
          <input
            className={inputCls}
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </Field>
        <Field label="Điện thoại">
          <input
            className={inputCls}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </Field>
        <Field label="Tiêu đề hero">
          <input
            className={inputCls}
            value={form.hero_title}
            onChange={(e) => setForm((f) => ({ ...f, hero_title: e.target.value }))}
          />
        </Field>
        <Field label="Mô tả hero">
          <input
            className={inputCls}
            value={form.hero_subtitle}
            onChange={(e) => setForm((f) => ({ ...f, hero_subtitle: e.target.value }))}
          />
        </Field>
        <Field label="Ảnh logo (URL)">
          <input
            className={inputCls}
            value={form.logo_url}
            onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
          />
        </Field>
        <Field label="Ảnh bìa (URL)">
          <input
            className={inputCls}
            value={form.cover_url}
            onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Giới thiệu shop">
            <textarea
              rows={5}
              className={inputCls}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
          />
          Hiển thị công khai trong danh bạ
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-full bg-terra px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </section>
  );
}

function DealsManager({ shop }: { shop: ShopWithDeals }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState({ title: "", description: "", discount_label: "" });

  const addDeal = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("deals").insert({
        shop_id: shop.id,
        title: draft.title,
        description: draft.description || null,
        discount_label: draft.discount_label || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã thêm ưu đãi!");
      setDraft({ title: "", description: "", discount_label: "" });
      qc.invalidateQueries({ queryKey: ["shop"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeDeal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá ưu đãi.");
      qc.invalidateQueries({ queryKey: ["shop"] });
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-8 rounded-3xl bg-sand-deep/50 p-6 ring-1 ring-border sm:p-8">
      <h2 className="font-display text-xl font-semibold">Ưu đãi của shop</h2>

      <ul className="mt-5 space-y-3">
        {shop.deals?.length ? (
          shop.deals.map((deal) => (
            <li
              key={deal.id}
              className="flex items-start justify-between gap-4 rounded-2xl bg-card p-4 ring-1 ring-border"
            >
              <div>
                <p className="font-semibold">{deal.title}</p>
                {deal.description ? (
                  <p className="text-sm text-ink-soft">{deal.description}</p>
                ) : null}
                {deal.discount_label ? (
                  <span className="mt-2 inline-block rounded-full bg-terra px-2.5 py-1 text-xs font-bold text-primary-foreground">
                    {deal.discount_label}
                  </span>
                ) : null}
              </div>
              <button
                onClick={() => removeDeal.mutate(deal.id)}
                className="shrink-0 text-sm font-medium text-ink-soft hover:text-terra-deep"
              >
                Xoá
              </button>
            </li>
          ))
        ) : (
          <li className="text-sm text-ink-soft">Chưa có ưu đãi nào.</li>
        )}
      </ul>

      <form
        className="mt-6 grid gap-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          addDeal.mutate();
        }}
      >
        <Field label="Tên ưu đãi">
          <input
            required
            className={inputCls}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </Field>
        <Field label="Mô tả ngắn">
          <input
            className={inputCls}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </Field>
        <Field label="Nhãn giảm giá">
          <input
            className={inputCls}
            placeholder="-20%"
            value={draft.discount_label}
            onChange={(e) => setDraft((d) => ({ ...d, discount_label: e.target.value }))}
          />
        </Field>
        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={addDeal.isPending}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
          >
            Thêm ưu đãi
          </button>
        </div>
      </form>
    </section>
  );
}
