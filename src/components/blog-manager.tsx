import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { ImageUpload } from "@/components/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { allBlogPostsAdminQuery, blogCategoriesQuery } from "@/lib/queries";

const inputCls =
  "mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-terra";

const emptyForm = {
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

export function BlogManager({ authorName }: { authorName: string }) {
  const qc = useQueryClient();
  const cats = useQuery(blogCategoriesQuery);
  const posts = useQuery(allBlogPostsAdminQuery);
  const [form, setForm] = useState(emptyForm);

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
      setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["blog_posts"] });
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
      qc.invalidateQueries({ queryKey: ["blog_posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-10 rounded-3xl bg-card p-6 ring-1 ring-border">
      <h2 className="text-2xl">Bài viết blog</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Viết nội dung dạng đơn giản: dòng bắt đầu bằng &quot;## &quot; là tiêu đề mục, &quot;- &quot; là gạch đầu dòng.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Tiêu đề
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
            placeholder={slugify(form.title)}
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
            value={form.read_minutes}
            onChange={(e) => setForm({ ...form, read_minutes: e.target.value })}
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Tóm tắt
          <textarea
            className={`${inputCls} min-h-20`}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Nội dung
          <textarea
            className={`${inputCls} min-h-56`}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </label>
        <div className="sm:col-span-2">
          <span className="text-sm font-medium">Ảnh bìa</span>
          <ImageUpload
            value={form.cover_url}
            folder="blog-covers"
            onChange={(url) => setForm({ ...form, cover_url: url ?? "" })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
          />
          Đăng công khai
        </label>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {form.id ? "Cập nhật bài viết" : "Đăng bài viết"}
        </button>
        {form.id ? (
          <button
            onClick={() => setForm(emptyForm)}
            className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Hủy chỉnh sửa
          </button>
        ) : null}
      </div>

      <div className="mt-8 space-y-3">
        {posts.data?.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sand-deep/50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{p.title}</p>
              <p className="text-xs text-ink-soft">
                {p.blog_categories?.name ?? "Chưa phân loại"} ·{" "}
                {p.is_published ? "Đã đăng" : "Bản nháp"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
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
                className="rounded-full bg-background px-4 py-2 text-sm font-semibold ring-1 ring-border"
              >
                Sửa
              </button>
              <button
                onClick={() => remove.mutate(p.id)}
                className="rounded-full bg-background px-4 py-2 text-sm font-semibold text-destructive ring-1 ring-border"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
