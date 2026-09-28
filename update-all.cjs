const fs = require('fs');

// 1. Update src/lib/queries.ts
const queriesPath = 'src/lib/queries.ts';
let queriesContent = fs.readFileSync(queriesPath, 'utf8');
if (!queriesContent.includes('shopCategoriesQuery')) {
  queriesContent += `
export const shopCategoriesQuery = queryOptions({
  queryKey: ["shop_categories"],
  staleTime: 5 * 60 * 1000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("shop_categories" as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as { id: string; name: string; slug: string; sort_order: number }[];
  },
});

export const shopLocationsQuery = queryOptions({
  queryKey: ["shop_locations"],
  staleTime: 5 * 60 * 1000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("shop_locations" as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as { id: string; name: string; slug: string; sort_order: number }[];
  },
});
`;
  fs.writeFileSync(queriesPath, queriesContent, 'utf8');
}

// 2. Update src/components/search-bar.tsx
const searchBarPath = 'src/components/search-bar.tsx';
let searchBarContent = fs.readFileSync(searchBarPath, 'utf8');
searchBarContent = searchBarContent.replace(
  `import { CATEGORIES, CITIES } from "@/lib/pet";`,
  `import { useQuery } from "@tanstack/react-query";\nimport { shopCategoriesQuery, shopLocationsQuery } from "@/lib/queries";`
);
searchBarContent = searchBarContent.replace(
  `  const [category, setCategory] = useState(initial?.category ?? "");\n  const [city, setCity] = useState(initial?.city ?? "");`,
  `  const [category, setCategory] = useState(initial?.category ?? "");\n  const [city, setCity] = useState(initial?.city ?? "");\n\n  const categoriesQ = useQuery(shopCategoriesQuery);\n  const locationsQ = useQuery(shopLocationsQuery);\n  const categories = categoriesQ.data ?? [];\n  const locations = locationsQ.data ?? [];`
);
searchBarContent = searchBarContent.replace(
  `            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}`,
  `            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}`
);
searchBarContent = searchBarContent.replace(
  `            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}`,
  `            {locations.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}`
);
fs.writeFileSync(searchBarPath, searchBarContent, 'utf8');

// 3. Update src/routes/index.tsx
const indexPath = 'src/routes/index.tsx';
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(
  `import { blogPostsQuery, featuredDealsQuery, featuredShopsQuery, partnerListingsQuery } from "@/lib/queries";`,
  `import { blogPostsQuery, featuredDealsQuery, featuredShopsQuery, partnerListingsQuery, shopCategoriesQuery } from "@/lib/queries";`
);
indexContent = indexContent.replace(
  `  const latestPosts = useQuery(blogPostsQuery());`,
  `  const latestPosts = useQuery(blogPostsQuery());\n  const categoriesQ = useQuery(shopCategoriesQuery);\n  const categories = categoriesQ.data ?? [];`
);
indexContent = indexContent.replace(
  `            {CATEGORIES.map((c) => (
              <Link
                key={c.value}
                to="/shops"
                search={{ category: c.value }}
                className="rounded-full bg-sand-deep px-4 py-2 text-sm font-medium ring-1 ring-border hover:bg-terra/15"
              >
                {c.label}
              </Link>
            ))}`,
  `            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/shops"
                search={{ category: c.slug }}
                className="rounded-full bg-sand-deep px-4 py-2 text-sm font-medium ring-1 ring-border hover:bg-terra/15"
              >
                {c.name}
              </Link>
            ))}`
);
fs.writeFileSync(indexPath, indexContent, 'utf8');

// 4. Update src/routes/admin.tsx
const adminPath = 'src/routes/admin.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');
adminContent = adminContent.replace(
  `  userRoleQuery,
  type MembershipPlan,
  type MembershipRequest,
  type MembershipSettings,
} from "@/lib/queries";`,
  `  userRoleQuery,
  shopCategoriesQuery,
  shopLocationsQuery,
  type MembershipPlan,
  type MembershipRequest,
  type MembershipSettings,
} from "@/lib/queries";`
);
adminContent = adminContent.replace(
  `    { id: "settings", label: "Cài đặt thanh toán", show: isAdmin },
    { id: "users", label: "Phân quyền & User", show: isAdmin },
  ].filter(t => t.show);`,
  `    { id: "settings", label: "Cài đặt thanh toán", show: isAdmin },
    { id: "locations", label: "Địa điểm & Danh mục", show: isAdmin },
    { id: "users", label: "Phân quyền & User", show: isAdmin },
  ].filter(t => t.show);`
);
adminContent = adminContent.replace(
  `          {activeTab === "settings" && isAdmin && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">Cài đặt thanh toán</h1>
              <BankSettingsForm userId={user.id} />
            </div>
          )}
          {activeTab === "users" && isAdmin && (
            <div>`,
  `          {activeTab === "settings" && isAdmin && (
            <div>
              <h1 className="mb-6 text-3xl sm:text-4xl">Cài đặt thanh toán</h1>
              <BankSettingsForm userId={user.id} />
            </div>
          )}
          {activeTab === "locations" && isAdmin && (
            <div>
              <h1 className="mb-2 text-3xl sm:text-4xl">Địa điểm & Danh mục</h1>
              <p className="mb-6 text-ink-soft">Quản lý danh mục và địa điểm cho các Shop</p>
              <CategoryLocationManager />
            </div>
          )}
          {activeTab === "users" && isAdmin && (
            <div>`
);

if (!adminContent.includes('CategoryLocationManager')) {
  console.log("Could not find where to insert CategoryLocationManager tab");
}

if (!adminContent.includes('function CategoryLocationManager')) {
  adminContent += `

// ─── Category & Location Manager ─────────────────────────────────────────────────────────────
function CategoryLocationManager() {
  const qc = useQueryClient();
  const categoriesQ = useQuery(shopCategoriesQuery);
  const locationsQ = useQuery(shopLocationsQuery);

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catSort, setCatSort] = useState(0);

  const [locName, setLocName] = useState("");
  const [locSlug, setLocSlug] = useState("");
  const [locSort, setLocSort] = useState(0);

  const addCategory = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shop_categories" as any).insert({ name: catName, slug: catSlug, sort_order: catSort });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thêm danh mục thành công");
      setCatName(""); setCatSlug(""); setCatSort(0);
      void qc.invalidateQueries({ queryKey: ["shop_categories"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shop_categories" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa danh mục");
      void qc.invalidateQueries({ queryKey: ["shop_categories"] });
    }
  });

  const addLocation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shop_locations" as any).insert({ name: locName, slug: locSlug, sort_order: locSort });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thêm địa điểm thành công");
      setLocName(""); setLocSlug(""); setLocSort(0);
      void qc.invalidateQueries({ queryKey: ["shop_locations"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shop_locations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa địa điểm");
      void qc.invalidateQueries({ queryKey: ["shop_locations"] });
    }
  });

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-background p-6 ring-1 ring-border">
        <h2 className="mb-4 text-xl font-semibold">Danh mục (Categories)</h2>
        <div className="mb-6 grid gap-3 sm:grid-cols-4 items-end">
          <div>
            <label className="text-xs font-medium text-ink-soft">Tên danh mục</label>
            <input value={catName} onChange={e => setCatName(e.target.value)} className={inputCls} placeholder="VD: Pet shop" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Slug (URL)</label>
            <input value={catSlug} onChange={e => setCatSlug(e.target.value)} className={inputCls} placeholder="VD: pet-shop" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Thứ tự hiển thị</label>
            <input type="number" value={catSort} onChange={e => setCatSort(Number(e.target.value))} className={inputCls} />
          </div>
          <button disabled={!catName || !catSlug || addCategory.isPending} onClick={() => addCategory.mutate()} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50">
            Thêm mới
          </button>
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {categoriesQ.data?.map(c => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold">{c.name} <span className="text-xs text-ink-soft">({c.slug})</span></p>
                <p className="text-xs text-ink-soft">Thứ tự: {c.sort_order}</p>
              </div>
              <button onClick={() => { if(confirm("Xóa danh mục?")) deleteCategory.mutate(c.id); }} className="text-sm font-semibold text-red-600">Xóa</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-background p-6 ring-1 ring-border">
        <h2 className="mb-4 text-xl font-semibold">Địa điểm (Locations)</h2>
        <div className="mb-6 grid gap-3 sm:grid-cols-4 items-end">
          <div>
            <label className="text-xs font-medium text-ink-soft">Tên địa điểm</label>
            <input value={locName} onChange={e => setLocName(e.target.value)} className={inputCls} placeholder="VD: TP.HCM" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Slug (URL)</label>
            <input value={locSlug} onChange={e => setLocSlug(e.target.value)} className={inputCls} placeholder="VD: tp-hcm" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft">Thứ tự hiển thị</label>
            <input type="number" value={locSort} onChange={e => setLocSort(Number(e.target.value))} className={inputCls} />
          </div>
          <button disabled={!locName || !locSlug || addLocation.isPending} onClick={() => addLocation.mutate()} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50">
            Thêm mới
          </button>
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {locationsQ.data?.map(l => (
            <li key={l.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold">{l.name} <span className="text-xs text-ink-soft">({l.slug})</span></p>
                <p className="text-xs text-ink-soft">Thứ tự: {l.sort_order}</p>
              </div>
              <button onClick={() => { if(confirm("Xóa địa điểm?")) deleteLocation.mutate(l.id); }} className="text-sm font-semibold text-red-600">Xóa</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
`;
}
fs.writeFileSync(adminPath, adminContent, 'utf8');

console.log('Update complete!');
