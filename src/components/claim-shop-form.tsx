import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function ClaimShopForm({ shopId }: { shopId: string }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [proof, setProof] = useState("");

  const submitClaim = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Vui lòng đăng nhập");
      if (!phone || !email) throw new Error("Vui lòng nhập SĐT và Email");

      const { error } = await supabase.from("shop_claims" as any).insert([
        {
          shop_id: shopId,
          user_id: user.id,
          contact_phone: phone,
          contact_email: email,
          proof_message: proof,
        },
      ]);
      if (error) {
        if (error.code === "42P01") {
          // relation does not exist yet (migration not run)
          throw new Error("Tính năng đang được cập nhật, vui lòng thử lại sau.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu! Ban quản trị sẽ liên hệ sớm.");
      setIsOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (!isOpen) {
    return (
      <div className="mt-6 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
        <h4 className="font-semibold text-amber-900">Bạn là chủ Shop này?</h4>
        <p className="mt-1 text-sm text-amber-800">
          Nhận quyền quản lý để cập nhật thông tin, hình ảnh, đăng sản phẩm và ưu đãi miễn phí!
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="mt-4 w-full rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
        >
          Nhận quyền quản lý ngay
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-6 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
        <h4 className="font-semibold text-amber-900">Vui lòng đăng nhập</h4>
        <p className="mt-1 text-sm text-amber-800">
          Bạn cần có tài khoản để gửi yêu cầu nhận quản lý shop.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            to="/dang-nhap"
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Đăng nhập / Đăng ký
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200/50"
          >
            Hủy
          </button>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-terra/20";

  return (
    <div className="mt-6 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
      <h4 className="font-semibold text-amber-900">Yêu cầu quyền quản lý</h4>
      <p className="mt-1 text-sm text-amber-800 mb-4">
        Vui lòng cung cấp thông tin để BQT xác thực bạn là chủ sở hữu.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitClaim.mutate();
        }}
        className="space-y-3"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-amber-900">SĐT liên hệ</label>
          <input
            required
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ví dụ: 0901234567"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-amber-900">Email liên hệ</label>
          <input
            required
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@shop.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-amber-900">
            Ghi chú (Tùy chọn)
          </label>
          <textarea
            className={inputCls}
            rows={2}
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            placeholder="Link fanpage hoặc thông tin thêm để chứng minh..."
          />
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={submitClaim.isPending}
            className="flex-1 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
          >
            {submitClaim.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200/50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
