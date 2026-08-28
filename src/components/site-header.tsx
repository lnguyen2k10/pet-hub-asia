import { Link, useNavigate } from "@tanstack/react-router";

import { PawMark } from "@/components/paw-mark";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/shops", label: "Khám phá" },
  { to: "/uu-dai", label: "Ưu đãi" },
  { to: "/gioi-thieu", label: "Về 1Pet" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 sm:flex sm:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <PawMark />
            <span className="truncate font-display text-xl font-semibold leading-none">
              1Pet<span className="text-terra">.Asia</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "text-ink" }}
                className="hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            {user ? (
              <>
                <Link
                  to="/quan-ly"
                  className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline"
                >
                  Trang của tôi
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                  className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/dang-nhap"
                  className="hidden text-sm font-medium text-ink-soft hover:text-ink lg:inline"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/dang-nhap"
                  className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-background ring-2 ring-border transition-transform hover:-translate-y-0.5"
                >
                  Dành cho shop
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
