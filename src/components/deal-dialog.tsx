import { useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dealImage } from "@/lib/pet";
import type { Deal } from "@/lib/queries";

type Props = {
  deal: Deal;
  index: number;
  shopName?: string;
  shopSlug?: string;
};

export function DealDialog({ deal, index, shopName, shopSlug }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-pointer rounded-2xl bg-card p-5 text-left ring-1 ring-border transition-transform duration-300 hover:-translate-y-1.5"
      >
        <img
          src={dealImage(index, deal.image_url)}
          alt={deal.title}
          loading="lazy"
          className="mb-4 aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-border"
        />
        {deal.discount_label ? (
          <span className="rounded-full bg-terra px-2.5 py-1 text-xs font-bold text-primary-foreground">
            {deal.discount_label}
          </span>
        ) : null}
        <h4 className="mt-2 font-display text-lg font-semibold">{deal.title}</h4>
        {deal.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{deal.description}</p>
        ) : null}
        <span className="mt-3 inline-block text-sm font-semibold text-terra-deep">
          Xem chi tiết →
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          <img
            src={dealImage(index, deal.image_url)}
            alt={deal.title}
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="p-6">
            <DialogHeader>
              {deal.discount_label ? (
                <span className="mb-2 inline-block w-fit rounded-full bg-terra px-3 py-1 text-xs font-bold text-primary-foreground">
                  {deal.discount_label}
                </span>
              ) : null}
              <DialogTitle className="font-display text-2xl">{deal.title}</DialogTitle>
              {shopName ? (
                <p className="text-sm font-medium text-terra-deep">{shopName}</p>
              ) : null}
              <DialogDescription className="whitespace-pre-line pt-2 text-base leading-relaxed">
                {deal.description ?? "Liên hệ shop để biết thêm chi tiết về ưu đãi này."}
              </DialogDescription>
            </DialogHeader>
            {deal.ends_at ? (
              <p className="mt-4 text-sm text-ink-soft">
                Hạn áp dụng: đến hết ngày{" "}
                {new Date(deal.ends_at).toLocaleDateString("vi-VN")}
              </p>
            ) : null}
            {shopSlug ? (
              <Link
                to="/shop/$slug"
                params={{ slug: shopSlug }}
                className="mt-5 block rounded-full bg-terra px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground"
              >
                Xem shop {shopName ?? ""} →
              </Link>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
