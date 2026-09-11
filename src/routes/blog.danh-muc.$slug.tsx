import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { BlogCard } from "@/components/blog-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { blogCategoriesQuery, blogPostsQuery } from "@/lib/queries";

export const Route = createFileRoute("/blog/danh-muc/$slug")({
  head: ({ params }) => {
    const title = `Danh mục blog: ${params.slug} — 1Pet.Asia`;
    const desc = `Các bài viết thú cưng thuộc danh mục ${params.slug} trên 1Pet.Asia.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BlogCategoryPage,
});

function BlogCategoryPage() {
  const { slug } = Route.useParams();
  const cats = useQuery(blogCategoriesQuery);
  const posts = useQuery(blogPostsQuery(slug));
  const current = cats.data?.find((c) => c.slug === slug);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <nav className="text-sm text-ink-soft">
          <Link to="/blog" className="hover:text-ink">
            Blog
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-ink">{current?.name ?? slug}</span>
        </nav>

        <p className="mt-3 font-hand text-2xl text-terra-deep">danh mục</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">{current?.name ?? slug}</h1>
        {current?.description ? (
          <p className="mt-2 max-w-2xl text-ink-soft">{current.description}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/blog"
            className="rounded-full bg-sand-deep/70 px-4 py-2 text-sm font-medium text-ink hover:bg-secondary"
          >
            Tất cả
          </Link>
          {cats.data?.map((c) => (
            <Link
              key={c.id}
              to="/blog/danh-muc/$slug"
              params={{ slug: c.slug }}
              className={`rounded-full px-4 py-2 text-sm font-medium text-ink ${
                c.slug === slug ? "bg-terra text-primary-foreground" : "bg-sand-deep/70 hover:bg-secondary"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-3xl bg-sand-deep/60" />
              ))
            : posts.data?.map((p) => <BlogCard key={p.id} post={p} />)}
        </div>

        {!posts.isLoading && (posts.data?.length ?? 0) === 0 ? (
          <div className="mt-10 rounded-3xl bg-sand-deep/60 p-10 text-center">
            <p className="font-hand text-2xl text-terra-deep">chưa có bài viết</p>
            <p className="mt-2 text-sm text-ink-soft">Danh mục này sẽ sớm có nội dung mới.</p>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
