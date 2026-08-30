import { Link } from "@tanstack/react-router";

import { DealDialog } from "@/components/deal-dialog";
import type { Deal } from "@/lib/queries";

type Props = {
  deal: Deal & { shops?: { name: string; slug: string } | null };
  index: number;
};

export function DealCard({ deal, index }: Props) {
  return <DealDialog deal={deal} index={index} shopName={deal.shops?.name} />;
}

export function DealShopLink({ deal }: Props) {
  return deal.shops ? (
    <Link
      to="/shop/$slug"
      params={{ slug: deal.shops.slug }}
      className="text-sm font-semibold text-terra-deep underline-offset-4 hover:underline"
    >
      Xem shop {deal.shops.name} →
    </Link>
  ) : null;
}
