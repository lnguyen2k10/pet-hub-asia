import { Link } from "@tanstack/react-router";

import { dealImage } from "@/lib/pet";
import type { Deal } from "@/lib/queries";

type Props = {
  deal: Deal & { shops?: { name: string; slug: string } | null };
  index: number;
};

export function DealCard({ deal, index }: Props) {
  const body = (
    <>
      <img
        src={dealImage(index, deal.image_url)}
        alt={deal.title}
        loading="lazy"
        width={1024}
        height={768}
        className="mb-4 aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-border"
      />
      <div className="flex items-center justify-between gap-2">
        {deal.discount_label ? (
          <span className="rounded-full bg-terra px-2.5 py-1 text-xs font-bold text-primary-foreground">
            {deal.discount_label}
          </span>
        ) : (
          <span />
        )}
        {deal.shops ? (
          <span className="truncate text-sm font-semibold">{deal.shops.name}</span>
        ) : null}
      </div>
      <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{deal.title}</h3>
      {deal.description ? <p className="mt-1 text-sm text-ink-soft">{deal.description}</p> : null}
    </>
  );

  const className =
    "block rounded-2xl bg-card p-5 ring-1 ring-border transition-transform duration-300 hover:-translate-y-1.5";

  return deal.shops ? (
    <Link to="/shop/$slug" params={{ slug: deal.shops.slug }} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
