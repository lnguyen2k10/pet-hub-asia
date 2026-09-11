import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { BlogCard } from "@/components/blog-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { blogCategoriesQuery, blogPostsQuery } from "@/lib/queries";

const TITLE = "Blog thú cưng — kinh nghiệm nuôi chó mèo | 1Pet.Asia";
const DESC =
  "Bài viết về chăm sóc chó mèo, dinh dưỡng, sức khỏe thú y và kinh nghiệm nuôi thú cưng tại Việt Nam.";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const posts = useQuery(blogPostsQuery());
  const cats = useQuery(blogCategoriesQuery);
  const [featured, ...rest] = posts.data ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="font-hand text-2xl text-terra-deep">góc chia sẻ</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Blog thú cưng</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">{DESC}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {cats.data?.map((c) => (
            <Link
              key={c.id}
              to="/blog/danh-muc/$slug"
              params={{ slug: c.slug }}
              className="rounded-full bg-sand-deep/70 px-4 py-2 text-sm font-medium text-ink hover:bg-secondary"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {posts.isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-sand-deep/60" />
            ))}
          </div>
        ) : featured ? (
          <>
            <section className="mt-8 overflow-hidden rounded-3xl bg-card ring-1 ring-border">
              <div className="grid gap-0 md:grid-cols-2">
                <Link to="/blog/$slug" params={{ slug: featured.slug }} className="block">
                  <div className="aspect-[16/10] bg-sand-deep/60">
                    {featured.cover_url ? (
                      <img
                        src={featured.cover_url}
                        alt={featured.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <span className="font-hand text-4xl text-terra-deep">1Pet.Asia</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex flex-col justify-center p-7">
                  <span className="font-hand text-xl text-terra-deep">bài nổi bật</span>
                  <h2 className="mt-1 text-2xl sm:text-3xl">
                    <Link
                      to="/blog/$slug"
                      params={{ slug: featured.slug }}
                      className="hover:text-terra-deep"
                    >
                      {featured.title}
                    </Link>
                  </h2>
                  {featured.excerpt ? (
                    <p className="mt-3 text-ink-soft">{featured.excerpt}</p>
                  ) : null}
                  <Link
                    to="/blog/$slug"
                    params={{ slug: featured.slug }}
                    className="mt-5 w-fit rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    Đọc bài viết
                  </Link>
                </div>
              </div>
            </section>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-10 rounded-3xl bg-sand-deep/60 p-10 text-center">
            <p className="font-hand text-2xl text-terra-deep">chưa có bài viết</p>
            <p className="mt-2 text-sm text-ink-soft">Nội dung mới sẽ sớm được cập nhật.</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
