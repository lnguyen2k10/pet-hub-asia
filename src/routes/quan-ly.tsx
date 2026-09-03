import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ImageUpload, uploadShopImage } from "@/components/image-upload";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CITIES, formatPrice, slugify } from "@/lib/pet";
import {
  myPartnerListingsQuery,
  myShopQuery,
  type Deal,
  type MyPartnerListing,
  type Product,
  type Shop,
} from "@/lib/queries";

const TITLE = "Trang quản lý shop — 1Pet.Asia";
const DESC = "Chủ shop tạo và chỉnh sửa landing page, sản phẩm, ưu đãi và tin tìm đại lý trên 1Pet.Asia.";

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
            {shopQ.data ? <DealsManager shop={shopQ.data} userId={user.id} /> : null}
            {shopQ.data ? <ProductsManager shop={shopQ.data} userId={user.id} /> : null}
            <PartnerManager userId={user.id} />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

type ShopWithDeals = Shop & { deals: Deal[]; products: Product[] };

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
      const name = form.name.trim();
      if (name.length < 2) throw new Error("Vui lòng nhập tên shop (tối thiểu 2 ký tự).");
      const slug = (form.slug || slugify(name)).trim();
      if (!/^[a-z0-9-]{3,}$/.test(slug))
        throw new Error("Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang (tối thiểu 3 ký tự).");
      const phone = form.phone.trim();
      if (phone && !/^[0-9+\s.()-]{8,15}$/.test(phone))
        throw new Error("Số điện thoại không hợp lệ.");
      const payload = {
        owner_id: userId,
        name,
        slug,

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
        <ImageUpload
          label="Ảnh logo"
          aspect="square"
          userId={userId}
          folder="logo"
          value={form.logo_url}
          onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))}
        />
        <ImageUpload
          label="Ảnh bìa (hero)"
          userId={userId}
          folder="cover"
          value={form.cover_url}
          onChange={(url) => setForm((f) => ({ ...f, cover_url: url }))}
        />
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

const emptyDeal = {
  title: "",
  description: "",
  discount_label: "",
  image_url: "",
  ends_at: "",
  is_featured: false,
};

function DealsManager({ shop, userId }: { shop: ShopWithDeals; userId: string }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...emptyDeal });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["shop"] });
    qc.invalidateQueries({ queryKey: ["deals"] });
  };

  const reset = () => {
    setEditingId(null);
    setDraft({ ...emptyDeal });
  };

  const saveDeal = useMutation({
    mutationFn: async () => {
      const payload = {
        shop_id: shop.id,
        title: draft.title,
        description: draft.description || null,
        discount_label: draft.discount_label || null,
        image_url: draft.image_url || null,
        ends_at: draft.ends_at || null,
        is_featured: draft.is_featured,
      };
      const { error } = editingId
        ? await supabase.from("deals").update(payload).eq("id", editingId)
        : await supabase.from("deals").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editingId ? "Đã cập nhật ưu đãi!" : "Đã thêm ưu đãi!");
      reset();
      invalidate();
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
      reset();
      invalidate();
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
              <div className="flex min-w-0 gap-3">
                {deal.image_url ? (
                  <img
                    src={deal.image_url}
                    alt={deal.title}
                    className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-border"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="font-semibold">{deal.title}</p>
                  {deal.description ? (
                    <p className="line-clamp-2 text-sm text-ink-soft">{deal.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {deal.discount_label ? (
                      <span className="rounded-full bg-terra px-2.5 py-1 text-xs font-bold text-primary-foreground">
                        {deal.discount_label}
                      </span>
                    ) : null}
                    {deal.ends_at ? (
                      <span className="text-xs text-ink-soft">HSD: {deal.ends_at}</span>
                    ) : null}
                    {deal.is_featured ? (
                      <span className="rounded-full bg-sand-deep px-2.5 py-1 text-xs font-semibold text-terra-deep">
                        Nổi bật
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button
                  onClick={() => {
                    setEditingId(deal.id);
                    setDraft({
                      title: deal.title,
                      description: deal.description ?? "",
                      discount_label: deal.discount_label ?? "",
                      image_url: deal.image_url ?? "",
                      ends_at: deal.ends_at ?? "",
                      is_featured: deal.is_featured,
                    });
                  }}
                  className="text-sm font-medium text-terra-deep hover:underline"
                >
                  Sửa
                </button>
                <button
                  onClick={() => removeDeal.mutate(deal.id)}
                  className="text-sm font-medium text-ink-soft hover:text-terra-deep"
                >
                  Xoá
                </button>
              </div>
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
          saveDeal.mutate();
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
        <Field label="Nhãn giảm giá">
          <input
            className={inputCls}
            placeholder="-20%"
            value={draft.discount_label}
            onChange={(e) => setDraft((d) => ({ ...d, discount_label: e.target.value }))}
          />
        </Field>
        <Field label="Hạn áp dụng">
          <input
            type="date"
            className={inputCls}
            value={draft.ends_at}
            onChange={(e) => setDraft((d) => ({ ...d, ends_at: e.target.value }))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Mô tả">
            <textarea
              rows={3}
              className={inputCls}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </Field>
        </div>
        <ImageUpload
          label="Ảnh ưu đãi"
          userId={userId}
          folder="deal"
          value={draft.image_url}
          onChange={(url) => setDraft((d) => ({ ...d, image_url: url }))}
        />
        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input
            type="checkbox"
            checked={draft.is_featured}
            onChange={(e) => setDraft((d) => ({ ...d, is_featured: e.target.checked }))}
          />
          Đề xuất hiển thị ở mục ưu đãi nổi bật
        </label>
        <div className="flex flex-wrap gap-3 sm:col-span-3">
          <button
            type="submit"
            disabled={saveDeal.isPending}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
          >
            {editingId ? "Lưu ưu đãi" : "Thêm ưu đãi"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-ink"
            >
              Huỷ chỉnh sửa
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

const PRODUCT_TEMPLATE = [
  ["name", "description", "category", "price", "image_url", "in_stock"],
  ["Hạt cho mèo 1kg", "Hạt khô vị cá hồi", "Thức ăn", 250000, "", "co"],
];

const emptyProduct = {
  name: "",
  category: "",
  price: "",
  image_url: "",
  description: "",
  in_stock: true,
};

function ProductsManager({ shop, userId }: { shop: ShopWithDeals; userId: string }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ ...emptyProduct });
  const [importing, setImporting] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["shop"] });
  const reset = () => {
    setEditingId(null);
    setDraft({ ...emptyProduct });
  };

  const saveProduct = useMutation({
    mutationFn: async () => {
      const payload = {
        shop_id: shop.id,
        name: draft.name,
        category: draft.category || null,
        price: draft.price ? Number(draft.price) : null,
        image_url: draft.image_url || null,
        description: draft.description || null,
        in_stock: draft.in_stock,
      };
      const { error } = editingId
        ? await supabase.from("products").update(payload).eq("id", editingId)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editingId ? "Đã cập nhật sản phẩm!" : "Đã thêm sản phẩm!");
      reset();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá sản phẩm.");
      reset();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStock = useMutation({
    mutationFn: async (p: Product) => {
      const { error } = await supabase
        .from("products")
        .update({ in_stock: !p.in_stock })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(PRODUCT_TEMPLATE), "san-pham");
    XLSX.writeFile(wb, "mau-nhap-san-pham.xlsx");
  }

  async function handleFile(file: File) {
    setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = wb.SheetNames[0];
      const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
      if (!sheet) throw new Error("File không có dữ liệu.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const payload = rows
        .map((r, i) => {
          const pick = (...keys: string[]) => {
            for (const k of keys) {
              const found = Object.keys(r).find(
                (key) => key.trim().toLowerCase() === k.toLowerCase(),
              );
              if (found && String(r[found]).trim() !== "") return String(r[found]).trim();
            }
            return "";
          };
          const name = pick("name", "ten", "tên", "tên sản phẩm", "san pham");
          if (!name) return null;
          const rawPrice = pick("price", "gia", "giá");
          const stock = pick("in_stock", "con hang", "còn hàng").toLowerCase();
          return {
            shop_id: shop.id,
            name,
            description: pick("description", "mo ta", "mô tả") || null,
            category: pick("category", "danh muc", "danh mục") || null,
            price: rawPrice ? Number(rawPrice.replace(/[^0-9.]/g, "")) || null : null,
            image_url: pick("image_url", "anh", "ảnh", "hinh anh") || null,
            in_stock:
              stock === "" ? true : !["khong", "không", "no", "false", "0", "het"].includes(stock),
            sort_order: i,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (!payload.length) throw new Error("Không tìm thấy dòng sản phẩm hợp lệ (thiếu cột tên).");
      const { error } = await supabase.from("products").insert(payload);
      if (error) throw error;
      toast.success(`Đã nhập ${payload.length} sản phẩm!`);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không đọc được file.");
    } finally {
      setImporting(false);
    }
  }

  const products = [...(shop.products ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="mt-8 rounded-3xl bg-card p-6 ring-1 ring-border sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Sản phẩm của shop</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="rounded-full bg-sand-deep px-4 py-2 text-sm font-semibold text-terra-deep"
          >
            Tải file mẫu Excel
          </button>
          <label className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-semibold text-background">
            {importing ? "Đang nhập..." : "Nhập từ Excel"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleFile(file);
              }}
            />
          </label>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        Các cột hỗ trợ: name, description, category, price, image_url, in_stock.
      </p>

      <ul className="mt-5 space-y-3">
        {products.length ? (
          products.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-sand-deep/40 p-4 ring-1 ring-border"
            >
              <div className="flex min-w-0 items-center gap-3">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-border"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-sm text-ink-soft">
                    {p.category ? `${p.category} · ` : ""}
                    {formatPrice(p.price, p.currency)}
                    {p.in_stock ? "" : " · Tạm hết hàng"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setDraft({
                      name: p.name,
                      category: p.category ?? "",
                      price: p.price != null ? String(p.price) : "",
                      image_url: p.image_url ?? "",
                      description: p.description ?? "",
                      in_stock: p.in_stock,
                    });
                  }}
                  className="text-sm font-medium text-terra-deep hover:underline"
                >
                  Sửa
                </button>
                <button
                  onClick={() => toggleStock.mutate(p)}
                  className="text-xs font-medium text-ink-soft hover:text-ink"
                >
                  {p.in_stock ? "Đánh dấu hết hàng" : "Đánh dấu còn hàng"}
                </button>
                <button
                  onClick={() => removeProduct.mutate(p.id)}
                  className="text-sm font-medium text-ink-soft hover:text-terra-deep"
                >
                  Xoá
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="text-sm text-ink-soft">Chưa có sản phẩm nào.</li>
        )}
      </ul>

      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          saveProduct.mutate();
        }}
      >
        <Field label="Tên sản phẩm">
          <input
            required
            className={inputCls}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </Field>
        <Field label="Danh mục">
          <input
            className={inputCls}
            placeholder="Thức ăn, Phụ kiện..."
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          />
        </Field>
        <Field label="Giá (VNĐ)">
          <input
            type="number"
            min="0"
            className={inputCls}
            value={draft.price}
            onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
          />
        </Field>
        <ImageUpload
          label="Ảnh sản phẩm"
          aspect="square"
          userId={userId}
          folder="product"
          value={draft.image_url}
          onChange={(url) => setDraft((d) => ({ ...d, image_url: url }))}
        />
        <div className="sm:col-span-2">
          <Field label="Mô tả">
            <textarea
              rows={3}
              className={inputCls}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={draft.in_stock}
            onChange={(e) => setDraft((d) => ({ ...d, in_stock: e.target.checked }))}
          />
          Còn hàng
        </label>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={saveProduct.isPending}
            className="rounded-full bg-terra px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {editingId ? "Lưu sản phẩm" : "Thêm sản phẩm"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-ink"
            >
              Huỷ chỉnh sửa
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

const LISTING_TYPES = [
  { value: "tim_dai_ly", label: "Tìm đại lý" },
  { value: "tim_nha_phan_phoi", label: "Tìm nhà phân phối" },
  { value: "nhuong_quyen", label: "Nhượng quyền" },
  { value: "hop_tac", label: "Hợp tác khác" },
];

const emptyListing = {
  company_name: "",
  title: "",
  listing_type: "tim_dai_ly",
  summary: "",
  description: "",
  category: "",
  city: CITIES[0] as string,
  investment_note: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  website: "",
  logo_url: "",
  cover_url: "",
  is_published: true,
};

function PartnerManager({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const listingsQ = useQuery(myPartnerListingsQuery);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ...emptyListing });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["partner_listings"] });
  const reset = () => {
    setEditingId(null);
    setDraft({ ...emptyListing });
    setOpen(false);
  };

  const saveListing = useMutation({
    mutationFn: async () => {
      const payload = {
        owner_id: userId,
        company_name: draft.company_name,
        title: draft.title,
        listing_type: draft.listing_type,
        summary: draft.summary || null,
        description: draft.description || null,
        category: draft.category || null,
        city: draft.city || null,
        investment_note: draft.investment_note || null,
        contact_name: draft.contact_name || null,
        contact_phone: draft.contact_phone || null,
        contact_email: draft.contact_email || null,
        website: draft.website || null,
        logo_url: draft.logo_url || null,
        cover_url: draft.cover_url || null,
        is_published: draft.is_published,
      };
      const { error } = editingId
        ? await supabase.from("partner_listings").update(payload).eq("id", editingId)
        : await supabase.from("partner_listings").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editingId ? "Đã cập nhật tin đăng!" : "Đã đăng tin tìm đối tác!");
      reset();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("partner_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá tin đăng.");
      reset();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(l: MyPartnerListing) {
    setEditingId(l.id);
    setOpen(true);
    setDraft({
      company_name: l.company_name,
      title: l.title,
      listing_type: l.listing_type,
      summary: l.summary ?? "",
      description: l.description ?? "",
      category: l.category ?? "",
      city: l.city ?? (CITIES[0] as string),
      investment_note: l.investment_note ?? "",
      contact_name: l.contact_name ?? "",
      contact_phone: l.contact_phone ?? "",
      contact_email: l.contact_email ?? "",
      website: l.website ?? "",
      logo_url: l.logo_url ?? "",
      cover_url: l.cover_url ?? "",
      is_published: l.is_published,
    });
  }

  return (
    <section className="mt-8 rounded-3xl bg-sand-deep/50 p-6 ring-1 ring-border sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Tin tìm đại lý / nhà phân phối</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Đăng tin để xuất hiện ở mục “Cơ hội kinh doanh” trên trang chủ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (open ? reset() : setOpen(true))}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-background"
        >
          {open ? "Đóng" : "Đăng tin mới"}
        </button>
      </div>

      <ul className="mt-5 space-y-3">
        {listingsQ.isLoading ? (
          <li className="h-16 animate-pulse rounded-2xl bg-card" />
        ) : listingsQ.data?.length ? (
          listingsQ.data.map((l) => (
            <li
              key={l.id}
              className="flex items-start justify-between gap-4 rounded-2xl bg-card p-4 ring-1 ring-border"
            >
              <div className="min-w-0">
                <p className="font-semibold">{l.title}</p>
                <p className="text-sm text-ink-soft">
                  {l.company_name}
                  {l.city ? ` · ${l.city}` : ""}
                  {l.is_published ? "" : " · Đang ẩn"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button
                  onClick={() => startEdit(l)}
                  className="text-sm font-medium text-terra-deep hover:underline"
                >
                  Sửa
                </button>
                <button
                  onClick={() => removeListing.mutate(l.id)}
                  className="text-sm font-medium text-ink-soft hover:text-terra-deep"
                >
                  Xoá
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="text-sm text-ink-soft">Bạn chưa đăng tin nào.</li>
        )}
      </ul>

      {open ? (
        <form
          className="mt-6 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveListing.mutate();
          }}
        >
          <Field label="Tên công ty">
            <input
              required
              className={inputCls}
              value={draft.company_name}
              onChange={(e) => setDraft((d) => ({ ...d, company_name: e.target.value }))}
            />
          </Field>
          <Field label="Tiêu đề tin">
            <input
              required
              className={inputCls}
              placeholder="Tuyển đại lý thức ăn cho chó mèo"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </Field>
          <Field label="Loại hợp tác">
            <select
              className={inputCls}
              value={draft.listing_type}
              onChange={(e) => setDraft((d) => ({ ...d, listing_type: e.target.value }))}
            >
              {LISTING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Khu vực">
            <select
              className={inputCls}
              value={draft.city}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ngành hàng">
            <input
              className={inputCls}
              placeholder="Thức ăn, phụ kiện, spa..."
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            />
          </Field>
          <Field label="Mức đầu tư">
            <input
              className={inputCls}
              placeholder="Từ 50 triệu"
              value={draft.investment_note}
              onChange={(e) => setDraft((d) => ({ ...d, investment_note: e.target.value }))}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Tóm tắt ngắn">
              <input
                className={inputCls}
                value={draft.summary}
                onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Mô tả chi tiết">
              <textarea
                rows={5}
                className={inputCls}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Người liên hệ">
            <input
              className={inputCls}
              value={draft.contact_name}
              onChange={(e) => setDraft((d) => ({ ...d, contact_name: e.target.value }))}
            />
          </Field>
          <Field label="Điện thoại / Zalo">
            <input
              className={inputCls}
              value={draft.contact_phone}
              onChange={(e) => setDraft((d) => ({ ...d, contact_phone: e.target.value }))}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              value={draft.contact_email}
              onChange={(e) => setDraft((d) => ({ ...d, contact_email: e.target.value }))}
            />
          </Field>
          <Field label="Website">
            <input
              className={inputCls}
              placeholder="https://"
              value={draft.website}
              onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
            />
          </Field>
          <ImageUpload
            label="Logo công ty"
            aspect="square"
            userId={userId}
            folder="partner-logo"
            value={draft.logo_url}
            onChange={(url) => setDraft((d) => ({ ...d, logo_url: url }))}
          />
          <ImageUpload
            label="Ảnh bìa tin đăng"
            userId={userId}
            folder="partner-cover"
            value={draft.cover_url}
            onChange={(url) => setDraft((d) => ({ ...d, cover_url: url }))}
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.is_published}
              onChange={(e) => setDraft((d) => ({ ...d, is_published: e.target.checked }))}
            />
            Hiển thị công khai
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={saveListing.isPending}
              className="rounded-full bg-terra px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {editingId ? "Lưu tin đăng" : "Đăng tin"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-ink"
            >
              Huỷ
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
