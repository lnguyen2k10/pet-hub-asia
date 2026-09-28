const fs = require('fs');
let code = fs.readFileSync('src/routes/admin.tsx', 'utf8');

code = code.replace('{ id: "users", label: "Phân quyền & User", show: isAdmin },', '{ id: "users", label: "Phân quyền & User", show: isAdmin },\n    { id: "promo_codes", label: "Mã quà tặng", show: isAdmin },');

code = code.replace('<UserManager />\n            </div>\n          )}\n        </div>\n      </main>', '<UserManager />\n            </div>\n          )}\n          {activeTab === "promo_codes" && isAdmin && (\n            <div>\n              <h1 className="mb-6 text-3xl sm:text-4xl">Quản lý mã quà tặng</h1>\n              <AdminPromoCodes />\n            </div>\n          )}\n        </div>\n      </main>');

const componentCode = `
// ─── Admin Promo Codes ────────────────────────────────────────────────────────
function AdminPromoCodes() {
  const [form, setForm] = useState({
    code: '', description: '', quota_deals: 0, quota_products: 0, quota_featured_slots: 0, quota_partner_posts: 0, quota_blog_posts: 0, max_uses: 1
  });
  
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['admin_promo_codes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const generateCode = () => {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    setForm({ ...form, code: 'GIFT-' + randomStr });
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('promo_codes').insert({ ...form, code: form.code.toUpperCase() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã tạo mã quà tặng');
      setForm({
        code: '', description: '', quota_deals: 0, quota_products: 0, quota_featured_slots: 0, quota_partner_posts: 0, quota_blog_posts: 0, max_uses: 1
      });
      qc.invalidateQueries({ queryKey: ['admin_promo_codes'] });
    }
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xóa mã');
      qc.invalidateQueries({ queryKey: ['admin_promo_codes'] });
    }
  });

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-background p-6 ring-1 ring-border">
        <h2 className="text-xl font-bold mb-4">Tạo mã mới</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Mã quà tặng (VD: TANGBLOG2026)</span>
            <div className="flex gap-2 mt-1">
              <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="flex-1 rounded-xl border border-border px-3 py-2 outline-none focus:border-terra uppercase" />
              <button onClick={generateCode} className="rounded-xl bg-sand-deep/40 px-4 text-sm font-semibold hover:bg-sand-deep">Tự động tạo</button>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Mô tả (Nội bộ)</span>
            <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1 block w-full rounded-xl border border-border px-3 py-2 outline-none focus:border-terra" />
          </label>
          
          <label className="block"><span className="text-sm font-medium">Quota Ưu đãi</span><input type="number" value={form.quota_deals} onChange={e => setForm({...form, quota_deals: Number(e.target.value)})} className="mt-1 block w-full rounded-xl border border-border px-3 py-2" /></label>
          <label className="block"><span className="text-sm font-medium">Quota Bài Blog</span><input type="number" value={form.quota_blog_posts} onChange={e => setForm({...form, quota_blog_posts: Number(e.target.value)})} className="mt-1 block w-full rounded-xl border border-border px-3 py-2" /></label>
          <label className="block"><span className="text-sm font-medium">Quota SP (-1=Vô hạn)</span><input type="number" value={form.quota_products} onChange={e => setForm({...form, quota_products: Number(e.target.value)})} className="mt-1 block w-full rounded-xl border border-border px-3 py-2" /></label>
          <label className="block"><span className="text-sm font-medium">Quota Cơ hội KD</span><input type="number" value={form.quota_partner_posts} onChange={e => setForm({...form, quota_partner_posts: Number(e.target.value)})} className="mt-1 block w-full rounded-xl border border-border px-3 py-2" /></label>
          <label className="block"><span className="text-sm font-medium">Quota Đẩy SP</span><input type="number" value={form.quota_featured_slots} onChange={e => setForm({...form, quota_featured_slots: Number(e.target.value)})} className="mt-1 block w-full rounded-xl border border-border px-3 py-2" /></label>
          <label className="block"><span className="text-sm font-medium">Số lượt dùng tối đa</span><input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: Number(e.target.value)})} className="mt-1 block w-full rounded-xl border border-border px-3 py-2" /></label>
        </div>
        <button disabled={!form.code || createMut.isPending} onClick={() => createMut.mutate()} className="mt-4 rounded-xl bg-terra px-6 py-2 text-sm font-semibold text-white">Tạo mã</button>
      </div>

      <div className="rounded-3xl bg-background ring-1 ring-border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-deep/40"><tr><th className="p-4">Mã</th><th className="p-4">Quota tặng</th><th className="p-4">Đã dùng</th><th className="p-4">Xóa</th></tr></thead>
          <tbody className="divide-y divide-border">
            {q.data?.map(p => (
              <tr key={p.id}>
                <td className="p-4 font-mono font-bold text-terra">{p.code}</td>
                <td className="p-4 text-xs space-y-1">
                  {p.quota_blog_posts > 0 && <div>Blog: +{p.quota_blog_posts}</div>}
                  {p.quota_deals > 0 && <div>Ưu đãi: +{p.quota_deals}</div>}
                  {p.quota_products !== 0 && <div>SP: {p.quota_products === -1 ? 'Vô hạn' : '+' + p.quota_products}</div>}
                  {p.quota_partner_posts > 0 && <div>Cơ hội KD: +{p.quota_partner_posts}</div>}
                  {p.quota_featured_slots > 0 && <div>Đẩy SP: +{p.quota_featured_slots}</div>}
                </td>
                <td className="p-4">{p.uses_count} / {p.max_uses}</td>
                <td className="p-4"><button onClick={() => { if(confirm('Xóa mã này?')) delMut.mutate(p.id) }} className="text-rose-600 font-medium hover:underline">Xóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;

code = code + '\n' + componentCode;
fs.writeFileSync('src/routes/admin.tsx', code);
