import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { BlogCard, formatBlogDate } from "@/components/blog-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { blogPostBySlugQuery, blogPostsQuery } from "@/lib/queries";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(blogPostBySlugQuery(params.slug));
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) {
      return {
        meta: [
          { title: "Không tìm thấy bài viết — 1Pet.Asia" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const desc = post.excerpt ?? `${post.title} — chia sẻ từ 1Pet.Asia.`;
    const cover = post.cover_url?.startsWith("https://") ? post.cover_url : null;
    return {
      meta: [
        { title: `${post.title} — 1Pet.Asia` },
        { name: "description", content: desc },
        { property: "og:title", content: post.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(cover
          ? [
              { property: "og:image", content: cover },
              { name: "twitter:image", content: cover },
            ]
          : []),
      ],
    };
  },
  component: BlogPostPage,
});

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    const text = line.trim();
    if (!text) return null;
    if (text.startsWith("### "))
      return (
        <h3 key={i} className="mt-6 text-xl">
          {text.slice(4)}
        </h3>
      );
    if (text.startsWith("## "))
      return (
        <h2 key={i} className="mt-8 text-2xl">
          {text.slice(3)}
        </h2>
      );
    if (text.startsWith("# "))
      return (
        <h2 key={i} className="mt-8 text-2xl">
          {text.slice(2)}
        </h2>
      );
    if (text.startsWith("- "))
      return (
        <li key={i} className="ml-5 list-disc text-ink-soft">
          {text.slice(2)}
        </li>
      );
    return (
      <p key={i} className="mt-4 leading-relaxed text-ink-soft">
        {text}
      </p>
    );
  });
}

function BlogPostPage() {
  const { slug } = Route.useParams();
  const postQ = useQuery(blogPostBySlugQuery(slug));
  const related = useQuery(blogPostsQuery());
  const post = postQ.data;

  if (postQ.isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-5 py-16">
          <div className="h-96 animate-pulse rounded-3xl bg-sand-deep/60" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-md px-5 py-24 text-center">
          <h1 className="text-3xl">Không tìm thấy bài viết</h1>
          <Link
            to="/blog"
            className="mt-6 inline-block rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Về trang blog
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const others = (related.data ?? []).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <nav className="text-sm text-ink-soft">
          <Link to="/blog" className="hover:text-ink">
            Blog
          </Link>
          {post.blog_categories ? (
            <>
              <span className="px-1.5">/</span>
              <Link
                to="/blog/danh-muc/$slug"
                params={{ slug: post.blog_categories.slug }}
                className="hover:text-ink"
              >
                {post.blog_categories.name}
              </Link>
            </>
          ) : null}
        </nav>

        <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-ink-soft">
          {post.author_name ?? "1Pet.Asia"} · {formatBlogDate(post.published_at ?? post.created_at)}{" "}
          · {post.read_minutes} phút đọc
        </p>

        {post.cover_url ? (
          <img decoding="async"
            src={post.cover_url}
            alt={post.title}
            className="mt-6 aspect-[16/9] w-full rounded-3xl object-cover"
          />
        ) : null}

        <article className="mt-6">{renderContent(post.content)}</article>

        {others.length ? (
          <section className="mt-14">
            <h2 className="text-2xl">Bài viết liên quan</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {others.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
