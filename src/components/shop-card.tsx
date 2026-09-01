import { Link } from "@tanstack/react-router";

import { categoryLabel, shopInitials } from "@/lib/pet";
import type { Shop } from "@/lib/queries";

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link
      to="/shop/$slug"
      params={{ slug: shop.slug }}
      className="group block overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-transform duration-300 hover:-translate-y-1.5"
    >
      <div className="relative">
        {shop.cover_url ? (
          <img
            src={shop.cover_url}
            alt={`Ảnh bìa ${shop.name}`}
            loading="lazy"
            className="aspect-[16/7] w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid aspect-[16/7] w-full place-items-center bg-terra/15 font-hand text-3xl text-terra-deep">
            1Pet.Asia
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-terra-deep">
          {categoryLabel(shop.category)}
        </span>

        <div className="absolute -bottom-7 left-5">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              loading="lazy"
              className="size-16 rounded-full object-cover ring-4 ring-card"
            />
          ) : (
            <span className="grid size-16 place-items-center rounded-full bg-sand-deep font-display text-lg font-semibold text-terra-deep ring-4 ring-card">
              {shopInitials(shop.name)}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-10">
        <h3 className="truncate font-display text-lg font-semibold">{shop.name}</h3>
        <p className="truncate text-sm text-ink-soft">{shop.city}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-sm font-semibold">
            <span className="text-terra">★</span> {shop.rating}
            <span className="font-normal text-ink-soft">({shop.review_count})</span>
          </span>
          <span className="text-sm font-semibold text-terra-deep">Xem shop →</span>
        </div>
      </div>
    </Link>
  );
}
