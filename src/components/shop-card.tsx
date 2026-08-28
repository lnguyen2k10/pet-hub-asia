import { Link } from "@tanstack/react-router";

import { categoryLabel, shopInitials } from "@/lib/pet";
import type { Shop } from "@/lib/queries";

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link
      to="/shop/$slug"
      params={{ slug: shop.slug }}
      className="group block rounded-2xl bg-sand-deep/50 p-5 ring-1 ring-border transition-transform duration-300 hover:-translate-y-1.5"
    >
      <div className="flex items-center gap-3">
        {shop.logo_url ? (
          <img
            src={shop.logo_url}
            alt={shop.name}
            loading="lazy"
            className="size-14 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-background font-display text-lg font-semibold text-terra-deep ring-1 ring-border">
            {shopInitials(shop.name)}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-semibold">{shop.name}</h3>
          <p className="truncate text-sm text-ink-soft">
            {categoryLabel(shop.category)} · {shop.city}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm font-semibold">
          <span className="text-terra">★</span> {shop.rating}
          <span className="font-normal text-ink-soft">({shop.review_count})</span>
        </span>
        <span className="rounded-full bg-terra/15 px-2.5 py-1 text-xs font-medium text-terra-deep">
          {categoryLabel(shop.category)}
        </span>
      </div>
    </Link>
  );
}
