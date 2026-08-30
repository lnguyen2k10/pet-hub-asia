import { DealDialog } from "@/components/deal-dialog";
import type { Deal } from "@/lib/queries";

type Props = {
  deal: Deal & { shops?: { name: string; slug: string } | null };
  index: number;
};

export function DealCard({ deal, index }: Props) {
  return (
    <DealDialog
      deal={deal}
      index={index}
      shopName={deal.shops?.name}
      shopSlug={deal.shops?.slug}
    />
  );
}
