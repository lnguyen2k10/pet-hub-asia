import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/pet";
import type { Product } from "@/lib/queries";

export function ProductDialog({ product, shopName }: { product: Product; shopName?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full cursor-pointer overflow-hidden rounded-2xl bg-card text-left ring-1 ring-border transition-transform duration-300 hover:-translate-y-1.5"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="grid aspect-square w-full place-items-center bg-sand-deep/60 font-hand text-3xl text-terra-deep">
            1Pet
          </div>
        )}
        <div className="p-4">
          <h4 className="line-clamp-2 font-display text-base font-semibold">{product.name}</h4>
          <p className="mt-1 text-sm font-bold text-terra-deep">
            {formatPrice(product.price, product.currency)}
          </p>
          {!product.in_stock ? (
            <span className="mt-2 inline-block rounded-full bg-sand-deep px-2.5 py-0.5 text-xs font-medium text-ink-soft">
              Tạm hết hàng
            </span>
          ) : null}
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="aspect-[16/10] w-full object-cover"
            />
          ) : null}
          <div className="p-6">
            <DialogHeader>
              {product.category ? (
                <span className="mb-2 inline-block w-fit rounded-full bg-sand-deep px-3 py-1 text-xs font-semibold text-terra-deep">
                  {product.category}
                </span>
              ) : null}
              <DialogTitle className="font-display text-2xl">{product.name}</DialogTitle>
              {shopName ? <p className="text-sm font-medium text-terra-deep">{shopName}</p> : null}
              <DialogDescription className="whitespace-pre-line pt-2 text-base leading-relaxed">
                {product.description ?? "Liên hệ shop để biết thêm chi tiết về sản phẩm này."}
              </DialogDescription>
            </DialogHeader>
            <p className="mt-4 font-display text-xl font-semibold text-terra-deep">
              {formatPrice(product.price, product.currency)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {product.in_stock ? "Còn hàng" : "Tạm hết hàng"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
