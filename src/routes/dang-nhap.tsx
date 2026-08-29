import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PawMark } from "@/components/paw-mark";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Đăng nhập dành cho shop — 1Pet.Asia";
const DESC =
  "Đăng nhập hoặc tạo tài khoản shop trên 1Pet.Asia để quản lý landing page và ưu đãi của bạn.";

export const Route = createFileRoute("/dang-nhap")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/quan-ly" });
  }, [loading, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/quan-ly` },
        });
        if (error) throw error;
        toast.success("Tạo tài khoản thành công! Kiểm tra email nếu cần xác nhận.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Chào mừng bạn quay lại!");
      }
      navigate({ to: "/quan-ly" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra, thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-14">
        <div className="rounded-3xl bg-card p-7 ring-1 ring-border">
          <div className="flex items-center gap-2.5">
            <PawMark />
            <span className="font-display text-xl font-semibold">
              1Pet<span className="text-terra">.Asia</span>
            </span>
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">
            {mode === "signin" ? "Đăng nhập cho shop" : "Tạo tài khoản shop"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Quản lý landing page và ưu đãi của cửa hàng bạn.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-terra"
                placeholder="shop@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-terra"
                placeholder="Ít nhất 6 ký tự"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-terra px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Đang xử lý..." : mode === "signin" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-sm text-ink-soft hover:text-ink"
          >
            {mode === "signin" ? "Chưa có tài khoản? Đăng ký shop mới" : "Đã có tài khoản? Đăng nhập"}
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
