import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Shop = {
  id: string;
  owner_id: string | null;
  slug: string;
  name: string;
  category: string;
  city: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_published: boolean;
};

export type Deal = {
  id: string;
  shop_id: string;
  title: string;
  description: string | null;
  discount_label: string | null;
  image_url: string | null;
  ends_at: string | null;
  is_featured: boolean;
};

export type Product = {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  in_stock: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type SearchFilters = {
  q?: string;
  category?: string;
  city?: string;
};


export const featuredShopsQuery = queryOptions({
  queryKey: ["shops", "featured"],
  queryFn: async (): Promise<Shop[]> => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("rating", { ascending: false })
      .limit(6);
    if (error) throw error;
    return (data ?? []) as Shop[];
  },
});

export const featuredDealsQuery = queryOptions({
  queryKey: ["deals", "featured"],
  queryFn: async (): Promise<(Deal & { shops: { name: string; slug: string } | null })[]> => {
    const { data, error } = await supabase
      .from("deals")
      .select("*, shops(name, slug)")
      .eq("is_featured", true)
      .limit(6);
    if (error) throw error;
    return (data ?? []) as (Deal & { shops: { name: string; slug: string } | null })[];
  },
});

export function searchShopsQuery(filters: SearchFilters) {
  return queryOptions({
    queryKey: ["shops", "search", filters],
    queryFn: async (): Promise<Shop[]> => {
      let query = supabase.from("shops").select("*").eq("is_published", true);
      if (filters.q) query = query.ilike("name", `%${filters.q}%`);
      if (filters.category) query = query.eq("category", filters.category);
      if (filters.city) query = query.eq("city", filters.city);
      const { data, error } = await query.order("rating", { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []) as Shop[];
    },
  });
}

export function shopBySlugQuery(slug: string) {
  return queryOptions({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*, deals(*), products(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as (Shop & { deals: Deal[]; products: Product[] }) | null;
    },
  });
}

export const myShopQuery = queryOptions({
  queryKey: ["shop", "mine"],
  queryFn: async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data, error } = await supabase
      .from("shops")
      .select("*, deals(*), products(*)")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data as (Shop & { deals: Deal[]; products: Product[] }) | null;
  },
});
