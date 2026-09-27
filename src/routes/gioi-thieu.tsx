import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "react-hot-toast";

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
