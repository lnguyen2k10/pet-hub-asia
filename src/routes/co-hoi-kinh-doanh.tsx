import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { LISTING_TYPES, PartnerCard } from "@/components/partner-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CITIES } from "@/lib/pet";
import { partnerListingsSearchQuery } from "@/lib/queries";

const TITLE = "Cơ hội kinh doanh thú cưng — Tìm đại lý & nhà phân phối | 1Pet.Asia";
const DESC =
  "Danh sách công ty ngành thú cưng đang tìm đại lý, nhà phân phối, nhượng quyền và đối tác kinh doanh trên khắp Việt Nam.";

type PartnerSearch = { listing_type?: string; city?: string };

export const Route = createFileRoute("/co-hoi-kinh-doanh")({
  validateSearch: (search: Record<string, unknown>): PartnerSearch => {
    const result: PartnerSearch = {};
    if (typeof search["listing_type"] === "string" && search["listing_type"])
      result.listing_type = search["listing_type"];
    if (typeof search["city"] === "string" && search["city"]) result.city = search["city"];
    return result;
  },
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
  component: PartnersPage,
});

function PartnersPage() {
  const search = Route.useSearch();
  const listings = useQuery(partnerListingsSearchQuery(search));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="font-hand text-2xl text-terra-deep">cơ hội kinh doanh</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Doanh nghiệp tìm đại lý &amp; nhà phân phối</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Kết nối với các công ty ngành thú cưng đang mở rộng hệ thống đại lý, nhà phân phối và
          nhượng quyền.
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            to="/co-hoi-kinh-doanh"
            search={{}}
            className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-border ${
              search.listing_type ? "bg-sand-deep hover:bg-terra/15" : "bg-terra text-primary-foreground"
            }`}
          >
            Tất cả
          </Link>
          {Object.entries(LISTING_TYPES).map(([value, label]) => (
            <Link
              key={value}
              to="/co-hoi-kinh-doanh"
              search={search.city ? { listing_type: value, city: search.city } : { listing_type: value }}
              className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ring-border ${
                search.listing_type === value
                  ? "bg-terra text-primary-foreground"
                  : "bg-sand-deep hover:bg-terra/15"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2.5">
          {CITIES.map((city) => (
            <Link
              key={city}
              to="/co-hoi-kinh-doanh"
              search={
                search.city === city
                  ? search.listing_type
                    ? { listing_type: search.listing_type }
                    : {}
                  : search.listing_type
                    ? { listing_type: search.listing_type, city }
                    : { city }
              }
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-border ${
                search.city === city ? "bg-ink text-background" : "bg-card hover:bg-terra/10"
              }`}
            >
              {city}
            </Link>
          ))}
        </div>

        {listings.isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-sand-deep/60" />
            ))}
          </div>
        ) : listings.data && listings.data.length > 0 ? (
          <>
            <p className="mt-8 text-sm text-ink-soft">Tìm thấy {listings.data.length} cơ hội</p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.data.map((listing) => (
                <PartnerCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-12 rounded-3xl bg-sand-deep/60 p-10 text-center">
            <p className="font-hand text-2xl text-terra-deep">chưa có tin phù hợp</p>
            <p className="mt-2 text-sm text-ink-soft">
              Thử bỏ bớt bộ lọc, hoặc đăng tin tìm đối tác của doanh nghiệp bạn.
            </p>
            <Link
              to="/quan-ly"
              className="mt-5 inline-flex rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Đăng tin tìm đối tác
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
