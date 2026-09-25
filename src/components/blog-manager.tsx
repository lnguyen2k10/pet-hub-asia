import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { ImageUpload } from "@/components/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { allBlogPostsAdminQuery, blogCategoriesQuery, type BlogCategory } from "@/lib/queries";

const inputCls =
  "mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-terra";

const emptyPostForm = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_url: "",
  category_id: "",
  read_minutes: "4",
  is_published: true,
};

const emptyCatForm = { id: "", name: "", slug: "", description: "", sort_order: "0" };

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ─── Category manager ────────────────────────────────────────────────────────
function CategoryManager() {
  const qc = useQueryClient();
  const cats = useQuery(blogCategoriesQuery);
  const [form, setForm] = useState(emptyCatForm);
  const [showForm, setShowForm] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (name.length < 2) throw new Error("Tên danh mục cần ít nhất 2 ký tự.");
      const slug = (form.slug.trim() || slugify(name)).toLowerCase();
      if (!/^[a-z0-9-]{2,}$/.test(slug)) throw new Error("Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang.");
      const payload = {
        name,
        slug,
        description: form.description.trim() || null,
        sort_order: Number(form.sort_order) || 0,
      };
      if (form.id) {
        const { error } = await supabase.from("blog_categories").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(form.id ? "Đã cập nhật danh mục." : "Đã tạo danh mục mới.");
      setForm(emptyCatForm);
      setShowForm(false);
      void qc.invalidateQueries({ queryKey: ["blog_categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa danh mục.");
      void qc.invalidateQueries({ queryKey: ["blog_categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function editCat(c: BlogCategory) {
    setForm({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", sort_order: String(c.sort_order) });
    setShowForm(true);
  }

  return (
    <div className="mt-6 rounded-2xl bg-sand-deep/30 p-5 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Danh mục blog</h3>
        <button
          type="button"
          onClick={() => { setForm(emptyCatForm); setShowForm((v) => !v); }}
          className="rounded-full bg-terra/10 px-3 py-1.5 text-sm font-semibold text-terra hover:bg-terra/20"
        >
          {showForm && !form.id ? "Đóng" : "+ Thêm danh mục"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-xl bg-background p-4 ring-1 ring-border">
          <label className="block">
            <span className="text-sm font-medium">Tên danh mục *</span>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Sức khỏe thú cưng" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Đường dẫn (slug)</span>
            <input className={inputCls} value={form.slug} placeholder={slugify(form.name) || "tu-dong-tao"} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Mô tả</span>
            <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Thứ tự hiển thị</span>
            <input className={inputCls} type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate()}
              className="rounded-full bg-terra px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {save.isPending ? "Đang lưu..." : form.id ? "Cập nhật" : "Tạo danh mục"}
            </button>
            {form.id && (
              <button type="button" onClick={() => { setForm(emptyCatForm); setShowForm(false); }} className="rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-ink">
                Huỷ
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {(cats.data?.length ?? 0) === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Chưa có danh mục nào.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {cats.data?.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-background px-4 py-2.5 ring-1 ring-border">
              <div>
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-xs text-ink-soft">/{c.slug}</span>
                {c.description && <p className="text-xs text-ink-soft mt-0.5">{c.description}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => editCat(c)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-sand-deep/40">Sửa</button>
                <button
                  type="button"
                  onClick={() => { if (confirm(`Xóa danh mục "${c.name}"?`)) remove.mutate(c.id); }}
                  className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Blog manager ─────────────────────────────────────────────────────────────
export function BlogManager({ authorName, userId }: { authorName: string; userId: string }) {
  const qc = useQueryClient();
  const cats = useQuery(blogCategoriesQuery);
  const posts = useQuery(allBlogPostsAdminQuery);
  const [form, setForm] = useState(emptyPostForm);
  const [tab, setTab] = useState<"posts" | "categories">("posts");

  const save = useMutation({
    mutationFn: async () => {
      const title = form.title.trim();
      if (title.length < 5) throw new Error("Tiêu đề cần ít nhất 5 ký tự.");
      const slug = (form.slug.trim() || slugify(title)).toLowerCase();
      if (!/^[a-z0-9-]{3,}$/.test(slug)) throw new Error("Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang.");
      if (form.content.trim().length < 20) throw new Error("Nội dung còn quá ngắn.");

      const payload = {
        title,
        slug,
        excerpt: form.excerpt.trim() || null,
        content: form.content,
        cover_url: form.cover_url || null,
        category_id: form.category_id || null,
        read_minutes: Math.max(1, Number(form.read_minutes) || 3),
        is_published: form.is_published,
        published_at: form.is_published ? new Date().toISOString() : null,
        author_name: authorName,
      };

      if (form.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã lưu bài viết.");
      setForm(emptyPostForm);
      void qc.invalidateQueries({ queryKey: ["blog_posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa bài viết.");
      void qc.invalidateQueries({ queryKey: ["blog_posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allPosts = posts.data ?? [];
  const draftCount = allPosts.filter((p) => !p.is_published).length;
  const publishedCount = allPosts.filter((p) => p.is_published).length;

  return (
    <section className="mt-10 rounded-3xl bg-card p-6 ring-1 ring-border">
      {/* Tab bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl">Quản lý Blog</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            {publishedCount} đã đăng · {draftCount} bản nháp
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-sand-deep/40 p-1">
          <button
            type="button"
            onClick={() => setTab("posts")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === "posts" ? "bg-background shadow" : "hover:bg-background/60"}`}
          >
            Bài viết
          </button>
          <button
            type="button"
            onClick={() => setTab("categories")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${tab === "categories" ? "bg-background shadow" : "hover:bg-background/60"}`}
          >
            Danh mục
          </button>
        </div>
      </div>

      {tab === "categories" ? (
        <CategoryManager />
      ) : (
        <>
          {/* Post form */}
          <div className="mt-5 rounded-2xl bg-sand-deep/20 p-5 ring-1 ring-border">
            <h3 className="font-semibold">{form.id ? "Chỉnh sửa bài viết" : "Viết bài mới"}</h3>
            <p className="mt-0.5 text-xs text-ink-soft">
              Định dạng: dòng bắt đầu <code>## </code> = tiêu đề mục, <code>- </code> = gạch đầu dòng.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Tiêu đề *
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium">
                Đường dẫn (để trống sẽ tự tạo)
                <input
                  className={inputCls}
                  value={form.slug}
                  placeholder={slugify(form.title) || "tu-dong-tao"}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium">
                Danh mục
                <select
                  className={inputCls}
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">— Chọn danh mục —</option>
                  {cats.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Thời gian đọc (phút)
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  value={form.read_minutes}
                  onChange={(e) => setForm({ ...form, read_minutes: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Tóm tắt
                <textarea
                  className={`${inputCls} min-h-16`}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Nội dung *
                <textarea
                  className={`${inputCls} min-h-56 font-mono text-xs`}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder={"## Giới thiệu\n\nViết nội dung của bạn ở đây...\n\n## Mục tiếp theo\n\n- Điểm 1\n- Điểm 2"}
                />
              </label>
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Ảnh bìa"
                  userId={userId}
                  value={form.cover_url}
                  folder="blog-covers"
                  onChange={(url) => setForm({ ...form, cover_url: url ?? "" })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 accent-terra"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                />
                Đăng công khai ngay
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {save.isPending ? "Đang lưu..." : form.id ? "Cập nhật bài viết" : "Đăng bài viết"}
              </button>
              {form.id ? (
                <button
                  type="button"
                  onClick={() => setForm(emptyPostForm)}
                  className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-ink"
                >
                  Huỷ chỉnh sửa
                </button>
              ) : null}
            </div>
          </div>

          {/* Post list */}
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-sm text-ink-soft uppercase tracking-wider">Danh sách bài viết ({allPosts.length})</h3>
            {posts.isLoading ? (
              <div className="h-24 animate-pulse rounded-2xl bg-sand-deep/60" />
            ) : allPosts.length === 0 ? (
              <p className="text-sm text-ink-soft">Chưa có bài viết nào.</p>
            ) : (
              allPosts.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sand-deep/40 px-4 py-3 ring-1 ring-border/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate font-semibold">{p.title}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {p.is_published ? "Đã đăng" : "Bản nháp"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {p.blog_categories?.name ?? "Chưa phân loại"} · {new Date(p.created_at).toLocaleDateString("vi-VN")}
                      {p.excerpt ? ` · ${p.excerpt.slice(0, 60)}...` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-background"
                    >
                      Xem
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          id: p.id,
                          title: p.title,
                          slug: p.slug,
                          excerpt: p.excerpt ?? "",
                          content: p.content,
                          cover_url: p.cover_url ?? "",
                          category_id: p.category_id ?? "",
                          read_minutes: String(p.read_minutes),
                          is_published: p.is_published,
                        })
                      }
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-background"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirm(`Xóa bài "${p.title}"?`)) remove.mutate(p.id); }}
                      className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
