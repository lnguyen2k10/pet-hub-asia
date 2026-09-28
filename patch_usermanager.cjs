const fs = require('fs');
let content = fs.readFileSync('src/routes/admin.tsx', 'utf8');

const userManagerRegex = /function UserManager\(\) \{[\s\S]*?\}\n\n\n\/\/ ─── Category & Location Manager/m;
const match = content.match(userManagerRegex);

if (!match) {
  console.error("UserManager not found");
  process.exit(1);
}

const newUserManager = `function UserManager() {
  const qc = useQueryClient();
  const profilesQ = useQuery(allProfilesAdminQuery);
  const rolesQ = useQuery(allUserRolesAdminQuery);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const setRole = useMutation({
    mutationFn: async ({ userId, newRole, oldRole }: { userId: string; newRole: string | null; oldRole: string | null }) => {
      if (oldRole) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", oldRole as any);
        if (error) throw error;
      }
      if (newRole) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã cập nhật quyền.");
      void qc.invalidateQueries({ queryKey: ["admin", "user_roles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Thất bại."),
  });

  const consumeBlogQuota = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error: fetchErr } = await supabase.from("profiles").select("quota_blog_posts").eq("id", userId).single();
      if (fetchErr) throw fetchErr;
      const current = data.quota_blog_posts || 0;
      if (current <= 0) throw new Error("Thành viên không còn quota blog.");
      
      const { error } = await supabase.from("profiles").update({ quota_blog_posts: current - 1 }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xác nhận đăng Blog (trừ 1 quota).");
      void qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Thất bại."),
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("profiles").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật hồ sơ thành viên.");
      setEditingUserId(null);
      void qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Cập nhật thất bại."),
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã xoá hồ sơ thành viên.");
      void qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Xoá thất bại."),
  });

  const profiles = profilesQ.data ?? [];
  const rolesMap = new Map((rolesQ.data ?? []).map((r) => [r.user_id, r.role]));

  return (
    <section className="mt-8 rounded-3xl bg-background p-6 ring-1 ring-border">
      <h2 className="mb-4 text-xl font-semibold">Tài khoản thành viên ({profiles.length})</h2>
      {profilesQ.isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-sand-deep/60" />
      ) : profiles.length === 0 ? (
        <p className="text-sm text-ink-soft">Chưa có thành viên nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 font-semibold">Thành viên</th>
                <th className="py-3 font-semibold">Ngày đăng ký</th>
                <th className="py-3 font-semibold">Quota Blog</th>
                <th className="py-3 font-semibold">Vai trò hiện tại</th>
                <th className="py-3 text-right font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const currentRole = rolesMap.get(p.id) || null;
                const isAdmin = currentRole === "admin";
                const isMod = currentRole === "moderator";
                const isEditing = editingUserId === p.id;
                
                return (
                  <React.Fragment key={p.id}>
                    <tr className="border-b border-border/50">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{p.full_name || "Chưa có tên"}</p>
                        <p className="text-xs text-ink-soft opacity-60">{p.id.slice(0, 8)}...</p>
                      </td>
                      <td className="py-3 pr-4 text-ink-soft">
                        {new Date(p.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 pr-4">
                        {(p.quota_blog_posts ?? 0) > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-terra">{p.quota_blog_posts} bài</span>
                            <button
                              type="button"
                              disabled={consumeBlogQuota.isPending}
                              onClick={() => {
                                if (confirm(\`Xác nhận đã đăng bài cho \${p.full_name || "thành viên này"} và trừ 1 quota?\`)) {
                                  consumeBlogQuota.mutate(p.id);
                                }
                              }}
                              className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                            >
                              ✓ Đã đăng
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-soft">0 bài</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {isAdmin ? (
                          <span className="rounded-full bg-terra/10 px-2.5 py-1 text-xs font-semibold text-terra">Admin</span>
                        ) : isMod ? (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Moderator</span>
                        ) : (
                          <span className="text-xs text-ink-soft">Thành viên</span>
                        )}
                      </td>
                      <td className="py-3 text-right flex items-center justify-end gap-2">
                        <select
                          className="rounded-xl border border-border bg-transparent px-2 py-1 text-xs outline-none"
                          value={currentRole || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRole.mutate({ userId: p.id, newRole: val || null, oldRole: currentRole });
                          }}
                        >
                          <option value="">Thành viên thường</option>
                          <option value="moderator">Moderator (Duyệt bài/đơn)</option>
                          <option value="admin">Super Admin</option>
                        </select>
                        <button 
                          onClick={() => {
                            if (isEditing) setEditingUserId(null);
                            else {
                              setEditingUserId(p.id);
                              setEditForm({
                                full_name: p.full_name || "",
                                quota_deals: p.quota_deals || 0,
                                quota_products: p.quota_products || 0,
                                quota_featured_slots: p.quota_featured_slots || 0,
                                quota_partner_posts: p.quota_partner_posts || 0,
                                quota_blog_posts: p.quota_blog_posts || 0,
                                membership_until: p.membership_until ? p.membership_until.slice(0,10) : "",
                              });
                            }
                          }}
                          className="rounded bg-sand-deep/40 px-3 py-1 text-xs font-semibold hover:bg-sand-deep/60"
                        >
                          {isEditing ? "Đóng" : "Sửa"}
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(\`Bạn có chắc muốn xoá hồ sơ thành viên \${p.full_name}?\`)) {
                              deleteProfile.mutate(p.id);
                            }
                          }}
                          className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-200"
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr>
                        <td colSpan={5} className="bg-sand-deep/10 px-4 py-4 border-b border-border">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">Họ và tên</span>
                              <input 
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra" 
                                value={editForm.full_name} 
                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} 
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">Hạn thành viên</span>
                              <input 
                                type="date"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra" 
                                value={editForm.membership_until} 
                                onChange={(e) => setEditForm({ ...editForm, membership_until: e.target.value })} 
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">Quota Ưu đãi</span>
                              <input 
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra" 
                                value={editForm.quota_deals} 
                                onChange={(e) => setEditForm({ ...editForm, quota_deals: Number(e.target.value) })} 
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">Quota Sản phẩm</span>
                              <input 
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra" 
                                value={editForm.quota_products} 
                                onChange={(e) => setEditForm({ ...editForm, quota_products: Number(e.target.value) })} 
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">Quota Đẩy SP</span>
                              <input 
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra" 
                                value={editForm.quota_featured_slots} 
                                onChange={(e) => setEditForm({ ...editForm, quota_featured_slots: Number(e.target.value) })} 
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">Quota Cơ hội KD</span>
                              <input 
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra" 
                                value={editForm.quota_partner_posts} 
                                onChange={(e) => setEditForm({ ...editForm, quota_partner_posts: Number(e.target.value) })} 
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs font-medium text-ink-soft">Quota Bài Blog</span>
                              <input 
                                type="number"
                                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-terra" 
                                value={editForm.quota_blog_posts} 
                                onChange={(e) => setEditForm({ ...editForm, quota_blog_posts: Number(e.target.value) })} 
                              />
                            </label>
                            <div className="flex items-end pb-1">
                              <button
                                disabled={updateProfile.isPending}
                                onClick={() => updateProfile.mutate({ id: p.id, data: editForm })}
                                className="w-full rounded-xl bg-terra px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-terra-deep disabled:opacity-60"
                              >
                                Lưu thay đổi
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


// ─── Category & Location Manager`;

content = content.replace(userManagerRegex, newUserManager);
fs.writeFileSync('src/routes/admin.tsx', content);
