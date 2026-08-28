import { Link, createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const TITLE = "Về 1Pet.Asia — Danh bạ doanh nghiệp vật nuôi";
const DESC =
  "1Pet.Asia kết nối người nuôi chó mèo với các shop, spa và phòng khám thú y uy tín. Mỗi shop có trang landing riêng, tự chỉnh sửa nội dung.";

export const Route = createFileRoute("/gioi-thieu")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="font-hand text-2xl text-terra-deep">xin chào</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Về 1Pet.Asia</h1>
        <div className="mt-6 space-y-4 text-base text-ink-soft">
          <p>
            1Pet.Asia là danh bạ doanh nghiệp trong lĩnh vực vật nuôi — tập trung vào chó và mèo.
            Người nuôi thú cưng tìm được shop, spa, phòng khám và dịch vụ phù hợp theo từ khoá,
            danh mục và khu vực.
          </p>
          <p>
            Mỗi doanh nghiệp có một trang landing page riêng trên 1Pet.Asia: ảnh bìa, giới thiệu,
            thông tin liên hệ và danh sách ưu đãi. Chủ shop đăng nhập bằng tài khoản riêng và tự
            chỉnh sửa toàn bộ nội dung trang của mình.
          </p>
          <p>
            Bạn đang sở hữu một shop thú cưng? Tạo tài khoản và dựng trang của bạn chỉ trong vài
            phút.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/dang-nhap"
            className="rounded-full bg-terra px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-terra-deep"
          >
            Đăng ký shop miễn phí
          </Link>
          <Link
            to="/shops"
            className="rounded-full bg-sand-deep px-6 py-3 text-sm font-semibold ring-1 ring-border"
          >
            Khám phá danh bạ
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
