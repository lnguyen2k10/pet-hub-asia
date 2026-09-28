const fs = require('fs');
let code = fs.readFileSync('src/components/admin-shops.tsx', 'utf8');

if (!code.includes('const deleteShop')) {
  // Add state and mutations
  const mutations = `
  const [editingShop, setEditingShop] = React.useState<any>(null);
  const [editForm, setEditForm] = React.useState<any>({});
  const qc = useQueryClient();

  const updateShop = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('shops').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã cập nhật thông tin shop.');
      setEditingShop(null);
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteShop = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shops').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Đã xóa shop.');
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  `;
  
  if (!code.includes('import React')) {
      code = 'import React from \"react\";\n' + code;
  }
  
  if (!code.includes('useQueryClient')) {
      code = code.replace('useQuery } from', 'useQuery, useQueryClient } from');
  }

  code = code.replace(/const \{ data: shops, isLoading \} = useQuery\(\{/, mutations + '\n  const { data: shops, isLoading } = useQuery({');
  
  const editModal = `
      {editingShop && (
        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4\">
          <div className=\"w-full max-w-md rounded-2xl bg-white p-6 shadow-xl\">
            <h3 className=\"text-lg font-semibold\">Chỉnh sửa Shop</h3>
            <div className=\"mt-4 space-y-4\">
              <label className=\"block\">
                <span className=\"text-sm font-medium\">Tên Shop</span>
                <input
                  className=\"mt-1 w-full rounded-lg border p-2 text-sm\"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </label>
              <label className=\"block\">
                <span className=\"text-sm font-medium\">Slug</span>
                <input
                  className=\"mt-1 w-full rounded-lg border p-2 text-sm\"
                  value={editForm.slug || ''}
                  onChange={e => setEditForm({ ...editForm, slug: e.target.value })}
                />
              </label>
              <label className=\"block\">
                <span className=\"text-sm font-medium\">Số điện thoại</span>
                <input
                  className=\"mt-1 w-full rounded-lg border p-2 text-sm\"
                  value={editForm.phone || ''}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </label>
              <div className=\"mt-6 flex justify-end gap-2\">
                <button
                  onClick={() => setEditingShop(null)}
                  className=\"rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-100\"
                >
                  Hủy
                </button>
                <button
                  onClick={() => updateShop.mutate({ id: editingShop.id, data: editForm })}
                  disabled={updateShop.isPending}
                  className=\"rounded-lg bg-terra px-4 py-2 text-sm font-medium text-white disabled:opacity-50\"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  `;
  
  code = code.replace('return (', editModal + '\n  return (');
  
  const actionButtons = `
                  <button
                    onClick={() => {
                      setEditingShop(shop);
                      setEditForm({ name: shop.name, slug: shop.slug, phone: shop.phone });
                    }}
                    className=\"ml-2 rounded-full bg-sand-deep px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:bg-sand\"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Xóa shop này vĩnh viễn?')) {
                        deleteShop.mutate(shop.id);
                      }
                    }}
                    className=\"ml-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-100\"
                  >
                    🗑️ Xóa
                  </button>
  `;
  
  code = code.replace(/<\/td>\s*<\/tr>/g, actionButtons + '\n              </td>\n            </tr>');
  
  fs.writeFileSync('src/components/admin-shops.tsx', code);
  console.log('AdminShops updated');
}
