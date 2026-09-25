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
  cover_url_2: string | null;
  cover_url_3: string | null;
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
    return ((data ?? []) as unknown) as Shop[];
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
      return ((data ?? []) as unknown) as Shop[];
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

export type PartnerListing = {
  id: string;
  company_name: string;
  logo_url: string | null;
  cover_url: string | null;
  listing_type: string;
  title: string;
  summary: string | null;
  description: string | null;
  category: string | null;
  city: string | null;
  investment_note: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website: string | null;
  is_featured: boolean;
};

const PARTNER_PUBLIC_COLUMNS =
  "id,company_name,logo_url,cover_url,listing_type,title,summary,description,category,city,investment_note,website,is_featured";
const PARTNER_CONTACT_COLUMNS = `${PARTNER_PUBLIC_COLUMNS},contact_name,contact_phone,contact_email`;

export const partnerListingsQuery = queryOptions({
  queryKey: ["partner_listings", "published"],
  queryFn: async (): Promise<PartnerListing[]> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const columns = sessionData.session ? PARTNER_CONTACT_COLUMNS : PARTNER_PUBLIC_COLUMNS;
    const { data, error } = await supabase
      .from("partner_listings")
      .select(columns)
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw error;
    return (data ?? []) as unknown as PartnerListing[];
  },
});

export type MyPartnerListing = PartnerListing & { is_published: boolean };

export const myPartnerListingsQuery = queryOptions({
  queryKey: ["partner_listings", "mine"],
  queryFn: async (): Promise<MyPartnerListing[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return [];
    const { data, error } = await supabase
      .from("partner_listings")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as MyPartnerListing[];
  },
});



export const allDealsQuery = queryOptions({
  queryKey: ["deals", "all"],
  queryFn: async (): Promise<(Deal & { shops: { name: string; slug: string } | null })[]> => {
    const { data, error } = await supabase
      .from("deals")
      .select("*, shops(name, slug)")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    return (data ?? []) as (Deal & { shops: { name: string; slug: string } | null })[];
  },
});

export type PartnerFilters = { q?: string; listing_type?: string; city?: string };

export function partnerListingsSearchQuery(filters: PartnerFilters) {
  return queryOptions({
    queryKey: ["partner_listings", "search", filters],
    queryFn: async (): Promise<PartnerListing[]> => {
      const { data: sessionData } = await supabase.auth.getSession();
      const columns = sessionData.session ? PARTNER_CONTACT_COLUMNS : PARTNER_PUBLIC_COLUMNS;
      let query = supabase.from("partner_listings").select(columns).eq("is_published", true);
      if (filters.q) query = query.ilike("title", `%${filters.q}%`);
      if (filters.listing_type) query = query.eq("listing_type", filters.listing_type);
      if (filters.city) query = query.eq("city", filters.city);
      const { data, error } = await query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as PartnerListing[];
    },
  });
}

export type MembershipSettings = {
  id: string;
  price_amount: number;
  currency: string;
  period_label: string;
  qr_image_url: string | null;
  bank_info: string | null;
  refund_note: string;
  instructions: string | null;
};

export type MembershipPlan = {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  currency: string;
  duration_days: number;
  period_label: string;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const membershipPlansQuery = queryOptions({
  queryKey: ["membership_plans" as any],
  queryFn: async (): Promise<MembershipPlan[]> => {
    const { data, error } = await supabase
      .from("membership_plans" as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as MembershipPlan[];
  },
});

export const allMembershipPlansQuery = queryOptions({
  queryKey: ["membership_plans" as any, "all"],
  queryFn: async (): Promise<MembershipPlan[]> => {
    const { data, error } = await supabase
      .from("membership_plans" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as MembershipPlan[];
  },
});

export const membershipSettingsQuery = queryOptions({
  queryKey: ["membership_settings"],
  queryFn: async (): Promise<MembershipSettings | null> => {
    const { data, error } = await supabase
      .from("membership_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as MembershipSettings | null;
  },
});

export type MembershipRequest = {
  id: string;
  user_id: string;
  shop_id: string | null;
  plan_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  amount: number;
  proof_url: string | null;
  note: string | null;
  status: string;
  admin_note: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export const myMembershipRequestsQuery = queryOptions({
  queryKey: ["membership_requests", "mine"],
  queryFn: async (): Promise<MembershipRequest[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await supabase
      .from("membership_requests")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as MembershipRequest[];
  },
});

export const allMembershipRequestsQuery = queryOptions({
  queryKey: ["membership_requests", "all"],
  queryFn: async (): Promise<MembershipRequest[]> => {
    const { data, error } = await supabase
      .from("membership_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as MembershipRequest[];
  },
});

export const isAdminQuery = queryOptions({
  queryKey: ["is_admin"],
  queryFn: async (): Promise<boolean> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;
    const { data, error } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (error) return false;
    return !!data;
  },
});

export type BlogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  category_id: string | null;
  author_name: string | null;
  read_minutes: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

export type BlogPostWithCategory = BlogPost & {
  blog_categories: { name: string; slug: string } | null;
};

export const blogCategoriesQuery = queryOptions({
  queryKey: ["blog_categories"],
  queryFn: async (): Promise<BlogCategory[]> => {
    const { data, error } = await supabase
      .from("blog_categories")
      .select("id,slug,name,description,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as BlogCategory[];
  },
});

export function blogPostsQuery(categorySlug?: string) {
  return queryOptions({
    queryKey: ["blog_posts", "list", categorySlug ?? "all"],
    queryFn: async (): Promise<BlogPostWithCategory[]> => {
      let query = supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("is_published", true);
      if (categorySlug) query = query.eq("blog_categories.slug", categorySlug);
      const { data, error } = await query
        .order("published_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      const rows = (data ?? []) as unknown as BlogPostWithCategory[];
      return categorySlug ? rows.filter((r) => r.blog_categories?.slug === categorySlug) : rows;
    },
  });
}

export function blogPostBySlugQuery(slug: string) {
  return queryOptions({
    queryKey: ["blog_post", slug],
    queryFn: async (): Promise<BlogPostWithCategory | null> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as BlogPostWithCategory | null;
    },
  });
}

export const allBlogPostsAdminQuery = queryOptions({
  queryKey: ["blog_posts", "admin"],
  queryFn: async (): Promise<BlogPostWithCategory[]> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, blog_categories(name, slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as BlogPostWithCategory[];
  },
});

export const allProfilesAdminQuery = queryOptions({
  queryKey: ["admin", "profiles"],
  queryFn: async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const allUserRolesAdminQuery = queryOptions({
  queryKey: ["admin", "user_roles"],
  queryFn: async () => {
    const { data, error } = await supabase.from("user_roles").select("*");
    if (error) throw error;
    return data ?? [];
  },
});

export const userRoleQuery = queryOptions({
  queryKey: ["user_role"],
  queryFn: async (): Promise<"admin" | "moderator" | null> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "moderator"])
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data?.role as "admin" | "moderator" | null;
  },
});



