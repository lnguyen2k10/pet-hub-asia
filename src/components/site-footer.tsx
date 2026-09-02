import { Link } from "@tanstack/react-router";

import { PawMark } from "@/components/paw-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sand-deep/40">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <PawMark className="size-8" />
            <span className="font-display text-lg font-semibold">
              1Pet<span className="text-terra">.Asia</span>
            </span>
          </div>
          <p className="text-sm text-ink-soft">
            Danh bạ doanh nghiệp vật nuôi · Chó &amp; Mèo · Việt Nam
          </p>
          <div className="flex gap-5 text-sm font-medium text-ink-soft">
            <Link to="/dang-nhap" className="hover:text-ink">
              Đăng nhập
            </Link>
            <Link to="/quan-ly" className="hover:text-ink">
              Dành cho shop
            </Link>
            <Link to="/co-hoi-kinh-doanh" className="hover:text-ink">
              Cơ hội kinh doanh
            </Link>
            <Link to="/gioi-thieu" className="hover:text-ink">
              Liên hệ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
