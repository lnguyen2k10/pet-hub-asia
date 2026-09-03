import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { DealDialog } from "@/components/deal-dialog";
import { ProductDialog } from "@/components/product-dialog";
import { ShopHeroCarousel } from "@/components/shop-hero-carousel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { categoryLabel, shopInitials } from "@/lib/pet";
import { shopBySlugQuery, type Product } from "@/lib/queries";

function groupProducts(products: Product[]) {
  const map = new Map<string, Product[]>();
  for (const p of [...products].sort((a, b) => a.sort_order - b.sort_order)) {
    const key = p.category?.trim() || "Sản phẩm khác";
    map.set(key, [...(map.get(key) ?? []), p]);
  }
  return [...map.entries()];
}


export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params, context }) => {
    const shop = await context.queryClient.ensureQueryData(shopBySlugQuery(params.slug));
    return {
      name: shop?.name ?? null,
      description: shop?.description ?? null,
      city: shop?.city ?? null,
      cover: shop?.cover_url?.startsWith("https://") ? shop.cover_url : null,
    };
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.name ?? params.slug;
    const title = `${name} — Shop thú cưng trên 1Pet.Asia`.slice(0, 60);
    const desc = (
      loaderData?.description ||
      `Thông tin, sản phẩm, dịch vụ và ưu đãi của ${name}${loaderData?.city ? ` tại ${loaderData.city}` : ""} trên 1Pet.Asia.`
    ).slice(0, 155);
    const cover = loaderData?.cover;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
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

  errorComponent: () => (
    <div className="mx-auto max-w-6xl px-5 py-24 text-center">
      <h1 className="text-3xl">Không tải được trang shop</h1>
      <p className="mt-2 text-ink-soft">Vui lòng thử lại sau ít phút.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-6xl px-5 py-24 text-center">
      <h1 className="text-3xl">Không tìm thấy shop</h1>
    </div>
  ),
  component: ShopLanding,
});


function ShopLanding() {
  const { slug } = Route.useParams();
  const { data: shop, isLoading } = useQuery(shopBySlugQuery(slug));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {isLoading ? (
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="h-72 animate-pulse rounded-3xl bg-sand-deep/60" />
          </div>
        ) : !shop ? (
          <div className="mx-auto max-w-6xl px-5 py-24 text-center">
            <h1 className="text-3xl">Không tìm thấy shop</h1>
            <p className="mt-2 text-ink-soft">Shop này có thể đã đổi tên hoặc chưa công khai.</p>
            <Link
              to="/shops"
              className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-background"
            >
              Về danh bạ shop
            </Link>
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden">
              <div className="mx-auto max-w-6xl px-5 pt-6">
                <ShopHeroCarousel shop={shop} />
              </div>
            </section>

            <section className="mx-auto max-w-6xl px-5 py-10">
              <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
                <div>
                  <div className="flex items-center gap-4">
                    {shop.logo_url ? (
                      <img
                        src={shop.logo_url}
                        alt={shop.name}
                        className="size-16 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <span className="grid size-16 place-items-center rounded-full bg-sand-deep font-display text-xl font-semibold text-terra-deep ring-1 ring-border">
                        {shopInitials(shop.name)}
                      </span>
                    )}
                    <div>
                      <h2 className="font-display text-2xl font-semibold">{shop.name}</h2>
                      <p className="text-sm text-ink-soft">
                        <span className="text-terra">★</span> {shop.rating} ({shop.review_count}{" "}
                        đánh giá)
                      </p>
                    </div>
                  </div>

                  {shop.description ? (
                    <p className="mt-6 whitespace-pre-line leading-relaxed text-ink-soft">
                      {shop.description}
                    </p>
                  ) : null}

                  <h3 className="mt-10 font-display text-xl font-semibold">Ưu đãi tại shop</h3>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    {shop.deals?.length ? (
                      shop.deals.map((deal, i) => (
                        <DealDialog key={deal.id} deal={deal} index={i} shopName={shop.name} />
                      ))
                    ) : (
                      <p className="text-sm text-ink-soft">Shop chưa đăng ưu đãi nào.</p>
                    )}
                  </div>

                  <h3 className="mt-12 font-display text-xl font-semibold">Sản phẩm của shop</h3>
                  {shop.products?.length ? (
                    groupProducts(shop.products).map(([group, items]) => (
                      <div key={group} className="mt-6">
                        <p className="font-hand text-xl text-terra-deep">{group}</p>
                        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                          {items.map((p) => (
                            <ProductDialog key={p.id} product={p} shopName={shop.name} />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="mt-4 text-sm text-ink-soft">Shop chưa đăng sản phẩm nào.</p>
                  )}

                </div>

                <aside className="h-fit rounded-2xl bg-sand-deep/50 p-6 ring-1 ring-border">
                  <h3 className="font-display text-lg font-semibold">Thông tin liên hệ</h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-ink-soft">Địa chỉ</dt>
                      <dd className="font-medium">{shop.address ?? "Đang cập nhật"}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-soft">Thành phố</dt>
                      <dd className="font-medium">{shop.city}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-soft">Điện thoại</dt>
                      <dd className="font-medium">{shop.phone ?? "Đang cập nhật"}</dd>
                    </div>
                  </dl>
                  {shop.phone ? (
                    <a
                      href={`tel:${shop.phone}`}
                      className="mt-6 block rounded-full bg-terra px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground"
                    >
                      Gọi shop ngay
                    </a>
                  ) : null}
                </aside>
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
