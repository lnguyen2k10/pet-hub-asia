import { useEffect, useState } from "react";

import { HERO_SLIDES, categoryLabel, dealImage } from "@/lib/pet";
import type { Deal, Shop } from "@/lib/queries";

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
};

function buildSlides(shop: Shop & { deals: Deal[] }): Slide[] {
  const base: Slide = {
    image: shop.cover_url ?? HERO_SLIDES[0].image,
    eyebrow: `${categoryLabel(shop.category)} · ${shop.city}`,
    title: shop.hero_title ?? shop.name,
    subtitle:
      shop.hero_subtitle ??
      shop.description?.split("\n")[0] ??
      `Chào mừng bạn đến với ${shop.name} — chăm sóc thú cưng tận tâm tại ${shop.city}.`,
  };

  const dealSlides: Slide[] = shop.deals.slice(0, 2).map((deal, i) => ({
    image: dealImage(i + 1, deal.image_url) ?? HERO_SLIDES[0].image,
    eyebrow: deal.discount_label ?? "Ưu đãi tại shop",
    title: deal.title,
    subtitle:
      deal.description ??
      `Ưu đãi hấp dẫn từ ${shop.name} dành cho bé cưng của bạn.`,
  }));

  const fallback: Slide[] = HERO_SLIDES.map((s) => ({
    image: s.image,
    eyebrow: `${shop.name} · ${s.eyebrow}`,
    title: s.title,
    subtitle: s.subtitle,
  }));

  const slides = [base, ...dealSlides];
  let i = 1;
  while (slides.length < 3) {
    const f = fallback[i % fallback.length];
    if (f) slides.push(f);
    i += 1;
  }
  return slides.slice(0, 3);
}

export function ShopHeroCarousel({ shop }: { shop: Shop & { deals: Deal[] } }) {
  const [active, setActive] = useState(0);
  const slides = buildSlides(shop);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  const slide = slides[active];

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-3xl ring-1 ring-border sm:h-[600px]">
      {slides.map((s, i) => (
        <div
          key={`${s.title}-${i}`}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i !== active}
        >
          <img
            src={s.image}
            alt={s.title}
            width={1920}
            height={1080}
            loading={i === 0 ? "eager" : "lazy"}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink/85 via-ink/35 to-transparent" />
        </div>
      ))}

      <div className="paw-float pointer-events-none absolute right-10 top-14 hidden text-background/25 sm:block">
        <svg viewBox="0 0 24 24" className="size-24 fill-current" aria-hidden="true">
          <circle cx="7" cy="7" r="2.6" />
          <circle cx="12" cy="5" r="2.6" />
          <circle cx="17" cy="7" r="2.6" />
          <ellipse cx="12" cy="15.5" rx="5.6" ry="4.6" />
        </svg>
      </div>

      {slide ? (
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <p className="mb-3 inline-block rounded-full bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-terra-deep">
            {slide.eyebrow}
          </p>
          <h1 className="max-w-[26ch] font-display text-3xl font-semibold leading-[1.05] text-background sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-4 max-w-[48ch] text-base text-background/85 sm:text-lg">
            {slide.subtitle}
          </p>
        </div>
      ) : null}

      <div className="absolute left-1/2 top-8 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
          <button
            key={`${s.title}-${i}`}
            onClick={() => setActive(i)}
            aria-label={`Ảnh ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-background" : "w-2 bg-background/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
