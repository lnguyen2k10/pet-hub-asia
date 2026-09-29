import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function AdminShopClaims() {
  const qc = useQueryClient();

  const { data: claims, isLoading } = useQuery({
    queryKey: ["admin-shop-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_claims" as any)
        .select(
          `
          id,
          status,
          contact_phone,
          contact_email,
          proof_message,
          created_at,
          user_id,
          shops ( name, slug )
        `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch profiles manually to bypass missing foreign key issue
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

      return data.map((c: any) => ({
        ...c,
        profiles: profileMap.get(c.user_id) || { full_name: "Không rõ", email: "" },
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("shop_claims" as any)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === "approved" ? "Đã phê duyệt!" : "Đã từ chối!");
      qc.invalidateQueries({ queryKey: ["admin-shop-claims"] });
      qc.invalidateQueries({ queryKey: ["admin-shops"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-sand-deep/60" />;
  }

  return (
    <div className="overflow-x-auto rounded-3xl ring-1 ring-border bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-sand-deep/40 text-ink-soft">
          <tr>
            <th className="px-6 py-4 font-semibold">Tên Shop</th>
            <th className="px-6 py-4 font-semibold">Người yêu cầu</th>
            <th className="px-6 py-4 font-semibold">Thông tin liên hệ</th>
            <th className="px-6 py-4 font-semibold">Ghi chú (Chứng minh)</th>
            <th className="px-6 py-4 font-semibold">Trạng thái</th>
            <th className="px-6 py-4 font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {claims?.map((claim: any) => (
            <tr key={claim.id} className="transition-colors hover:bg-sand-deep/10">
              <td className="px-6 py-4 font-medium text-ink">
                <a
                  href={`/shop/${claim.shops?.slug}`}
                  target="_blank"
                  className="hover:underline hover:text-terra-deep"
                >
                  {claim.shops?.name}
                </a>
              </td>
              <td className="px-6 py-4">
                <p className="font-semibold text-ink">{claim.profiles?.full_name}</p>
                <p className="text-xs text-ink-soft">{claim.profiles?.email}</p>
              </td>
              <td className="px-6 py-4 text-ink-soft">
                <p>SĐT: {claim.contact_phone}</p>
                <p>Email: {claim.contact_email}</p>
              </td>
              <td className="px-6 py-4 text-ink-soft max-w-xs break-words">
                {claim.proof_message || "-"}
              </td>
              <td className="px-6 py-4">
                {claim.status === "pending" && (
                  <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    Chờ duyệt
                  </span>
                )}
                {claim.status === "approved" && (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    Đã duyệt
                  </span>
                )}
                {claim.status === "rejected" && (
                  <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                    Từ chối
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {claim.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus.mutate({ id: claim.id, status: "approved" })}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => updateStatus.mutate({ id: claim.id, status: "rejected" })}
                      className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                    >
                      Từ chối
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          {(!claims || claims.length === 0) && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-ink-soft">
                Chưa có yêu cầu nhận shop nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
