import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { SearchBar } from "@/components/search-bar";
import { ShopCard } from "@/components/shop-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { searchShopsQuery } from "@/lib/queries";

const TITLE = "Tìm shop chó mèo — 1Pet.Asia";
const DESC =
  "Lọc pet shop, spa, phòng khám thú y theo từ khoá, danh mục và khu vực trên khắp Việt Nam.";

type ShopSearch = { q?: string; category?: string; city?: string };

export const Route = createFileRoute("/shops")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    category:
      typeof search.category === "string" && search.category ? search.category : undefined,
    city: typeof search.city === "string" && search.city ? search.city : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: ShopsPage,
});

function ShopsPage() {
  const search = Route.useSearch();
  const shops = useQuery(searchShopsQuery(search));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="font-hand text-2xl text-terra-deep">khám phá</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Danh bạ shop vật nuôi</h1>
        <div className="mt-6">
          <SearchBar initial={search} />
        </div>

        {shops.isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-sand-deep/60" />
            ))}
          </div>
        ) : shops.data && shops.data.length > 0 ? (
          <>
            <p className="mt-8 text-sm text-ink-soft">Tìm thấy {shops.data.length} shop</p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shops.data.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-10 rounded-3xl bg-sand-deep/50 p-10 text-center ring-1 ring-border">
            <p className="font-display text-xl font-semibold">Chưa tìm thấy shop phù hợp</p>
            <p className="mt-2 text-sm text-ink-soft">
              Thử đổi từ khoá, danh mục hoặc khu vực khác nhé.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
