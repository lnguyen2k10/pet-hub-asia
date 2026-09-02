import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DealCard } from "@/components/deal-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { allDealsQuery } from "@/lib/queries";

const TITLE = "Ưu đãi thú cưng đang diễn ra — 1Pet.Asia";
const DESC =
  "Tổng hợp ưu đãi spa, thức ăn, tiêm phòng và phụ kiện cho chó mèo từ các shop trên 1Pet.Asia.";

export const Route = createFileRoute("/uu-dai")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  const deals = useQuery(allDealsQuery);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="font-hand text-2xl text-terra-deep">đừng bỏ lỡ</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Tất cả ưu đãi</h1>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deals.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-sand-deep/60" />
              ))
            : deals.data?.map((deal, i) => <DealCard key={deal.id} deal={deal} index={i} />)}
        </div>
        {!deals.isLoading && (deals.data?.length ?? 0) === 0 ? (
          <div className="mt-10 rounded-3xl bg-sand-deep/60 p-10 text-center">
            <p className="font-hand text-2xl text-terra-deep">chưa có ưu đãi nào</p>
            <p className="mt-2 text-sm text-ink-soft">Quay lại sau nhé, các shop đang chuẩn bị.</p>
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
