import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

import { CATEGORIES, CITIES } from "@/lib/pet";

type Props = {
  initial?: { q?: string; category?: string; city?: string };
};

export function SearchBar({ initial }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initial?.q ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [city, setCity] = useState(initial?.city ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const search: { q?: string; category?: string; city?: string } = {};
        if (q) search.q = q;
        if (category) search.category = category;
        if (city) search.city = city;
        navigate({ to: "/shops", search });
      }}
      className="flex flex-col gap-3 rounded-3xl bg-background p-3 shadow-lift ring-1 ring-border sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-sand-deep/60 px-4 py-3">
        <Search className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Từ khoá"
          placeholder="Tìm shop, món đồ, dịch vụ..."
          className="w-full bg-transparent text-sm font-medium placeholder:font-normal placeholder:text-ink-soft/70 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-sand-deep/60 px-4 py-3 sm:w-44">
        <span className="shrink-0 text-sm font-medium">Danh mục</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Danh mục"
          className="min-w-0 flex-1 bg-transparent text-right text-xs font-semibold text-terra-deep focus:outline-none"
        >
          <option value="">Tất cả</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-sand-deep/60 px-4 py-3 sm:w-40">
        <span className="shrink-0 text-sm font-medium">Khu vực</span>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="Khu vực"
          className="min-w-0 flex-1 bg-transparent text-right text-xs font-semibold text-terra-deep focus:outline-none"
        >
          <option value="">Tất cả</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="shrink-0 rounded-2xl bg-terra px-6 py-3 text-sm font-semibold text-primary-foreground ring-2 ring-terra/20 transition-transform hover:-translate-y-0.5 hover:bg-terra-deep"
      >
        Tìm kiếm
      </button>
    </form>
  );
}
