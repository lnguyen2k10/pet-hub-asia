import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

      <div className="flex items-center gap-2 rounded-2xl bg-sand-deep/60 px-4 py-2 sm:w-48">
        <span className="shrink-0 text-sm font-medium">Danh mục</span>
        <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="flex-1 border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 text-right text-sm font-semibold text-terra-deep shadow-none justify-end gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-sand-deep/60 px-4 py-2 sm:w-44">
        <span className="shrink-0 text-sm font-medium">Khu vực</span>
        <Select value={city || "all"} onValueChange={(v) => setCity(v === "all" ? "" : v)}>
          <SelectTrigger className="flex-1 border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 text-right text-sm font-semibold text-terra-deep shadow-none justify-end gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
