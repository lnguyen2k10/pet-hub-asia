import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { PawMark } from "@/components/paw-mark";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/shops", label: "Khám phá" },
  { to: "/uu-dai", label: "Ưu đãi" },
  { to: "/co-hoi-kinh-doanh", label: "Cơ hội kinh doanh" },
  { to: "/blog", label: "Blog" },
  { to: "/gioi-thieu", label: "Giới thiệu" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 sm:flex sm:justify-between">
            <Link to="/" className="flex min-w-0 items-center gap-2.5">
              <PawMark />
              <span className="truncate font-display text-xl font-semibold leading-none">
                1Pet<span className="text-terra">.Asia</span>
              </span>
            </Link>

            {/* Desktop nav */}
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
                    className="hidden text-sm font-medium text-ink-soft hover:text-ink md:inline"
                  >
                    Trang của tôi
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="hidden rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 md:inline-flex"
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
                    className="hidden rounded-full bg-ink px-4 py-2 text-sm font-semibold text-background ring-2 ring-border transition-transform hover:-translate-y-0.5 md:inline-flex"
                  >
                    Dành cho shop
                  </Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                id="mobile-menu-toggle"
                aria-label="Mở menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-xl bg-secondary md:hidden"
              >
                <span
                  className={`block h-0.5 w-5 rounded bg-ink transition-all duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
                />
                <span
                  className={`block h-0.5 w-5 rounded bg-ink transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
                />
                <span
                  className={`block h-0.5 w-5 rounded bg-ink transition-all duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" />

          {/* Drawer */}
          <nav
            className="absolute right-0 top-[61px] bottom-0 w-72 bg-background shadow-2xl ring-1 ring-border overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col p-5 gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  activeProps={{ className: "bg-terra/10 text-terra-deep font-semibold" }}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-sand-deep/60 transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-4 border-t border-border pt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link
                      to="/quan-ly"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-sand-deep/60 transition-colors"
                    >
                      Trang của tôi
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="rounded-xl px-4 py-3 text-left text-sm font-medium text-ink-soft hover:bg-sand-deep/60 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dang-nhap"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-sand-deep/60 transition-colors"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/dang-nhap"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-full bg-ink px-4 py-3 text-center text-sm font-semibold text-background"
                    >
                      Dành cho shop
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
