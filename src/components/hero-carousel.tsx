import { useEffect, useState } from "react";

import { HERO_SLIDES } from "@/lib/pet";

export function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-b-[min(6vw,44px)] bg-sand-deep">
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i !== active}
        >
          <img
            src={slide.image}
            alt={slide.title}
            width={1920}
            height={1080}
            loading={i === 0 ? "eager" : "lazy"}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background/95 via-background/40 to-background/10" />
        </div>
      ))}

      <div className="paw-float pointer-events-none absolute right-10 top-16 hidden text-terra/30 sm:block">
        <svg viewBox="0 0 24 24" className="size-24 fill-current" aria-hidden="true">
          <circle cx="7" cy="7" r="2.6" />
          <circle cx="12" cy="5" r="2.6" />
          <circle cx="17" cy="7" r="2.6" />
          <ellipse cx="12" cy="15.5" rx="5.6" ry="4.6" />
        </svg>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-6xl px-5 pb-10">
          {(() => {
            const slide = HERO_SLIDES[active];
            if (!slide) return null;
            const [before, after] = slide.title.split(slide.highlight);
            return (
              <>
                <p className="mb-3 inline-block rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-terra-deep">
                  {slide.eyebrow}
                </p>
                <h1 className="max-w-[30ch] font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
                  {before}
                  <span className="text-terra">{slide.highlight}</span>
                  {after}
                </h1>
                <p className="mt-4 max-w-[48ch] text-base text-ink-soft sm:text-lg">
                  {slide.subtitle}
                </p>
              </>
            );
          })()}
        </div>
      </div>

      <div className="absolute left-1/2 top-24 z-10 flex -translate-x-1/2 gap-2 sm:top-12">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            onClick={() => setActive(i)}
            aria-label={`Ảnh ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-terra" : "w-2 bg-ink/20"}`}
          />
        ))}
      </div>
    </div>
  );
}
