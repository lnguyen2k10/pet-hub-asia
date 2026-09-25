import { Link } from "@tanstack/react-router";

import type { BlogPostWithCategory } from "@/lib/queries";

export function formatBlogDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogCard({ post }: { post: BlogPostWithCategory }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-border transition-transform hover:-translate-y-1">
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="block">
        <div className="aspect-[16/9] overflow-hidden bg-sand-deep/60">
          {post.cover_url ? (
            <img decoding="async"
              src={post.cover_url}
              alt={post.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="font-hand text-3xl text-terra-deep">1Pet.Asia</span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {post.blog_categories ? (
          <Link
            to="/blog/danh-muc/$slug"
            params={{ slug: post.blog_categories.slug }}
            className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-ink"
          >
            {post.blog_categories.name}
          </Link>
        ) : null}
        <h3 className="mt-3 text-xl leading-snug">
          <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-terra-deep">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{post.excerpt}</p>
        ) : null}
        <p className="mt-auto pt-4 text-xs text-ink-soft">
          {formatBlogDate(post.published_at ?? post.created_at)} · {post.read_minutes} phút đọc
        </p>
      </div>
    </article>
  );
}
