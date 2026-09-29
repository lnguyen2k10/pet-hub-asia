import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

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
        <div className="text-center">
          <p className="font-hand text-2xl text-terra-deep">Dành cho chủ doanh nghiệp</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl text-ink">
            Đưa thương hiệu thú cưng của bạn <br className="hidden sm:block" /> vươn xa cùng 1Pet.Asia
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-soft leading-relaxed">
            1Pet.Asia không chỉ là một danh bạ, mà là cầu nối trực tiếp giữa doanh nghiệp của bạn và hàng ngàn người nuôi thú cưng đang tìm kiếm dịch vụ uy tín mỗi ngày. 
            Hãy để chúng tôi giúp bạn xây dựng hình ảnh chuyên nghiệp và tăng doanh thu.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div className="rounded-3xl bg-sand p-8 ring-1 ring-border transition-shadow hover:shadow-md bg-gradient-to-br from-sand to-white">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-terra-deep/10 text-terra-deep">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Landing Page Chuyên Nghiệp</h3>
            <p className="mt-2 text-ink-soft">
              Sở hữu ngay một trang hiển thị riêng biệt mang đậm dấu ấn thương hiệu. Tự do cập nhật ảnh bìa, logo, thông tin dịch vụ và địa chỉ mà không cần biết lập trình.
            </p>
          </div>

          <div className="rounded-3xl bg-sand p-8 ring-1 ring-border transition-shadow hover:shadow-md bg-gradient-to-br from-sand to-white">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-terra-deep/10 text-terra-deep">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Tiếp Cận Đúng Khách Hàng</h3>
            <p className="mt-2 text-ink-soft">
              Hệ thống tìm kiếm thông minh theo khu vực và danh mục giúp người nuôi chó mèo xung quanh dễ dàng tìm thấy Spa, Phòng khám hay Pet Shop của bạn.
            </p>
          </div>

          <div className="rounded-3xl bg-sand p-8 ring-1 ring-border transition-shadow hover:shadow-md bg-gradient-to-br from-sand to-white">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-terra-deep/10 text-terra-deep">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Thúc Đẩy Doanh Số Dễ Dàng</h3>
            <p className="mt-2 text-ink-soft">
              Tạo và quản lý các chương trình Ưu đãi (Deals) hấp dẫn. Thu hút khách hàng mới và giữ chân khách hàng cũ chỉ với vài cú click chuột.
            </p>
          </div>

          <div className="rounded-3xl bg-sand p-8 ring-1 ring-border transition-shadow hover:shadow-md bg-gradient-to-br from-sand to-white">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-terra-deep/10 text-terra-deep">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Chủ Động Quản Trị Mọi Thứ</h3>
            <p className="mt-2 text-ink-soft">
              Hệ thống bảng điều khiển (Admin Dashboard) mạnh mẽ giúp bạn theo dõi thông tin, duyệt yêu cầu quyền sở hữu và nắm bắt hiệu quả kinh doanh nhanh chóng.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/dang-nhap"
            className="rounded-full bg-terra px-8 py-4 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-terra-deep"
          >
            Bắt đầu tạo Shop ngay
          </Link>
          <Link
            to="/shops"
            className="rounded-full bg-sand-deep px-8 py-4 text-base font-bold text-ink transition-transform hover:scale-105 ring-1 ring-border"
          >
            Tham quan danh bạ
          </Link>
        </div>
        
        {/* Contact Form Section */}
        <section className="mt-16 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Liên hệ với chúng tôi</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Bạn có câu hỏi hoặc cần hỗ trợ? Hãy gửi tin nhắn cho đội ngũ quản trị, chúng tôi sẽ phản hồi sớm nhất.
            </p>
          </div>
          <ContactForm />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.message.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Gửi thất bại");
      toast.success("Đã gửi tin nhắn thành công!");
      setForm({ name: "", contact: "", message: "" });
    } catch (err) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">Họ tên</span>
          <input
            type="text"
            className="w-full rounded-xl border-none bg-sand px-4 py-3 text-sm ring-1 ring-inset ring-border focus:bg-background focus:ring-2 focus:ring-terra"
            placeholder="Tên của bạn"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">SĐT / Email</span>
          <input
            type="text"
            className="w-full rounded-xl border-none bg-sand px-4 py-3 text-sm ring-1 ring-inset ring-border focus:bg-background focus:ring-2 focus:ring-terra"
            placeholder="090123... hoặc email@..."
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Tin nhắn</span>
        <textarea
          rows={4}
          className="w-full rounded-xl border-none bg-sand px-4 py-3 text-sm ring-1 ring-inset ring-border focus:bg-background focus:ring-2 focus:ring-terra"
          placeholder="Nội dung cần hỗ trợ..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-background hover:bg-ink/90 disabled:opacity-70"
      >
        {loading ? "Đang gửi..." : "Gửi tin nhắn"}
      </button>
    </form>
  );
}
