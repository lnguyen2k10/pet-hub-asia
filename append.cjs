const fs = require('fs');

const queriesAppend = `
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

fs.appendFileSync('src/lib/queries.ts', queriesAppend, 'utf8');

const adminAppend = `
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
      const { error } = await supabase.from("shop_categories").insert({ name: catName, slug: catSlug, sort_order: catSort });
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
      const { error } = await supabase.from("shop_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xóa danh mục");
      void qc.invalidateQueries({ queryKey: ["shop_categories"] });
    }
  });

  const addLocation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("shop_locations").insert({ name: locName, slug: locSlug, sort_order: locSort });
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
      const { error } = await supabase.from("shop_locations").delete().eq("id", id);
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

fs.appendFileSync('src/routes/admin.tsx', adminAppend, 'utf8');
