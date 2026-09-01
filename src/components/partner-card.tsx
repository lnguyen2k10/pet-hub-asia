import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { shopInitials } from "@/lib/pet";
import type { PartnerListing } from "@/lib/queries";

export const LISTING_TYPES: Record<string, string> = {
  tim_dai_ly: "Tìm đại lý",
  tim_nha_phan_phoi: "Tìm nhà phân phối",
  nhuong_quyen: "Nhượng quyền",
  hop_tac: "Hợp tác kinh doanh",
};

export function listingTypeLabel(value: string | null | undefined) {
  return (value && LISTING_TYPES[value]) || "Cơ hội hợp tác";
}

export function PartnerCard({ listing }: { listing: PartnerListing }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-card text-left ring-1 ring-border transition-transform duration-300 hover:-translate-y-1.5"
      >
        {listing.cover_url ? (
          <img
            src={listing.cover_url}
            alt={listing.company_name}
            loading="lazy"
            className="aspect-[16/7] w-full object-cover"
          />
        ) : (
          <div className="grid aspect-[16/7] w-full place-items-center bg-terra/15 font-hand text-3xl text-terra-deep">
            Cơ hội kinh doanh
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-3">
            {listing.logo_url ? (
              <img
                src={listing.logo_url}
                alt={listing.company_name}
                loading="lazy"
                className="size-10 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <span className="grid size-10 place-items-center rounded-full bg-sand-deep text-sm font-semibold text-terra-deep">
                {shopInitials(listing.company_name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{listing.company_name}</p>
              <p className="truncate text-xs text-ink-soft">
                {[listing.category, listing.city].filter(Boolean).join(" · ") || "Toàn quốc"}
              </p>
            </div>
          </div>

          <span className="mt-4 w-fit rounded-full bg-terra/15 px-2.5 py-1 text-xs font-semibold text-terra-deep">
            {listingTypeLabel(listing.listing_type)}
          </span>
          <h3 className="mt-2 line-clamp-2 font-display text-lg font-semibold">{listing.title}</h3>
          {listing.summary ? (
            <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{listing.summary}</p>
          ) : null}
          <span className="mt-4 text-sm font-semibold text-terra-deep">Xem chi tiết →</span>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto p-0">
          {listing.cover_url ? (
            <img
              src={listing.cover_url}
              alt={listing.company_name}
              className="aspect-[16/8] w-full object-cover"
            />
          ) : null}
          <div className="p-6">
            <DialogHeader>
              <span className="mb-2 w-fit rounded-full bg-terra/15 px-3 py-1 text-xs font-semibold text-terra-deep">
                {listingTypeLabel(listing.listing_type)}
              </span>
              <DialogTitle className="font-display text-2xl">{listing.title}</DialogTitle>
            </DialogHeader>

            <p className="mt-1 text-sm font-semibold">{listing.company_name}</p>
            <p className="text-sm text-ink-soft">
              {[listing.category, listing.city].filter(Boolean).join(" · ") || "Toàn quốc"}
            </p>

            {listing.description || listing.summary ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {listing.description ?? listing.summary}
              </p>
            ) : null}

            {listing.investment_note ? (
              <p className="mt-4 rounded-xl bg-sand-deep/70 p-3 text-sm">
                <span className="font-semibold">Mức đầu tư: </span>
                {listing.investment_note}
              </p>
            ) : null}

            <div className="mt-5 space-y-1 text-sm">
              {listing.contact_name ? (
                <p>
                  <span className="text-ink-soft">Liên hệ: </span>
                  {listing.contact_name}
                </p>
              ) : null}
              {listing.contact_email ? (
                <p>
                  <span className="text-ink-soft">Email: </span>
                  <a className="text-terra-deep" href={`mailto:${listing.contact_email}`}>
                    {listing.contact_email}
                  </a>
                </p>
              ) : null}
              {listing.website ? (
                <p>
                  <span className="text-ink-soft">Website: </span>
                  <a
                    className="text-terra-deep"
                    href={listing.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {listing.website}
                  </a>
                </p>
              ) : null}
            </div>

            {listing.contact_phone ? (
              <a
                href={`tel:${listing.contact_phone}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-terra px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Gọi {listing.contact_phone}
              </a>
            ) : null}

            {!listing.contact_phone && !listing.contact_email && !listing.contact_name ? (
              <a
                href="/dang-nhap"
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-terra px-5 py-3 text-sm font-semibold text-primary-foreground"
              >
                Đăng nhập để xem thông tin liên hệ
              </a>
            ) : null}

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
