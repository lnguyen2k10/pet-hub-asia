import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { DealCard } from "@/components/deal-card";
import { HeroCarousel } from "@/components/hero-carousel";
import { PartnerCard } from "@/components/partner-card";
import { SearchBar } from "@/components/search-bar";
import { ShopCard } from "@/components/shop-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CATEGORIES } from "@/lib/pet";
import { featuredDealsQuery, featuredShopsQuery, partnerListingsQuery } from "@/lib/queries";


const TITLE = "1Pet.Asia — Danh bạ shop chó mèo & dịch vụ thú cưng";
const DESC =
  "Tìm pet shop, spa grooming, phòng khám thú y và ưu đãi cho chó mèo khắp Việt Nam. Mỗi shop có trang riêng, chủ shop tự chỉnh sửa nội dung.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Home,
});

function Home() {
  const shops = useQuery(featuredShopsQuery);
  const deals = useQuery(featuredDealsQuery);
  const partners = useQuery(partnerListingsQuery);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative">
        <HeroCarousel />

        <div className="relative z-20 mx-auto -mt-16 max-w-4xl px-5">
          <SearchBar />
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              to="/shops"
              className="rounded-full bg-terra px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Tất cả
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.value}
                to="/shops"
                search={{ category: c.value }}
                className="rounded-full bg-sand-deep px-4 py-2 text-sm font-medium ring-1 ring-border hover:bg-terra/15"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-hand text-2xl text-terra-deep">được yêu thích</p>
              <h2 className="mt-1 text-3xl leading-tight sm:text-4xl">Shop nổi bật</h2>
            </div>
            <Link to="/shops" className="text-sm font-semibold text-terra-deep hover:text-terra">
              Xem tất cả shop →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shops.isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-sand-deep/60" />
                ))
              : shops.data?.map((shop) => <ShopCard key={shop.id} shop={shop} />)}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="rounded-3xl bg-terra/10 p-6 ring-1 ring-border sm:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-hand text-2xl text-terra-deep">đừng bỏ lỡ</p>
                <h2 className="mt-1 text-3xl leading-tight sm:text-4xl">Ưu đãi nổi bật</h2>
              </div>
              <Link to="/uu-dai" className="text-sm font-semibold text-terra-deep hover:text-terra">
                Xem tất cả ưu đãi →
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {deals.isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-72 animate-pulse rounded-2xl bg-background/60" />
                  ))
                : deals.data
                    ?.slice(0, 3)
                    .map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-hand text-2xl text-terra-deep">cơ hội kinh doanh</p>
              <h2 className="mt-1 text-3xl leading-tight sm:text-4xl">
                Doanh nghiệp tìm đại lý & nhà phân phối
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-soft">
                Các công ty trong ngành thú cưng đang tìm đối tác kinh doanh, đại lý, nhà phân phối
                và nhượng quyền trên khắp Việt Nam.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partners.isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl bg-sand-deep/60" />
                ))
              : partners.data
                  ?.slice(0, 6)
                  .map((listing) => <PartnerCard key={listing.id} listing={listing} />)}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
