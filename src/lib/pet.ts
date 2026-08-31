import dealFood from "@/assets/deal-food.jpg";
import dealSpa from "@/assets/deal-spa.jpg";
import dealVet from "@/assets/deal-vet.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export const CATEGORIES = [
  { value: "pet-shop", label: "Pet shop" },
  { value: "grooming", label: "Spa & Grooming" },
  { value: "clinic", label: "Phòng khám thú y" },
  { value: "food", label: "Thức ăn" },
  { value: "accessory", label: "Phụ kiện" },
  { value: "hotel", label: "Khách sạn thú cưng" },
] as const;

export const CITIES = [
  "TP.HCM",
  "Hà Nội",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Nha Trang",
] as const;

export function categoryLabel(value: string | null | undefined) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Pet shop";
}

export const HERO_SLIDES = [
  {
    image: hero1,
    eyebrow: "Danh bạ shop vật nuôi số 1",
    title: "Tìm shop chó mèo yêu thương nhất quanh bạn",
    highlight: "yêu thương",
    subtitle:
      "Khám phá phòng khám, cửa hàng đồ dùng, spa và dịch vụ chăm sóc thú cưng được cộng đồng tin dùng trên toàn Việt Nam.",
  },
  {
    image: hero2,
    eyebrow: "Hơn 500 cửa hàng đã tham gia",
    title: "Mỗi bé cưng đều xứng đáng một shop tử tế",
    highlight: "tử tế",
    subtitle:
      "Đánh giá thật từ cộng đồng nuôi chó mèo, thông tin liên hệ rõ ràng, đặt lịch chỉ trong vài chạm.",
  },
  {
    image: hero3,
    eyebrow: "Ưu đãi mới mỗi tuần",
    title: "Săn ưu đãi chăm sóc thú cưng gần nhà bạn",
    highlight: "ưu đãi",
    subtitle:
      "Giảm giá spa, thức ăn tươi, tiêm phòng và phụ kiện từ các shop uy tín khắp Việt Nam.",
  },
] as const;

const DEAL_IMAGES = [dealFood, dealSpa, dealVet];

export function dealImage(index: number, url?: string | null) {
  return url ?? DEAL_IMAGES[index % DEAL_IMAGES.length];
}

export function shopInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function formatPrice(price: number | null | undefined, currency = "VND") {
  if (price == null) return "Liên hệ";
  if (currency === "VND") return `${new Intl.NumberFormat("vi-VN").format(price)}₫`;
  return `${new Intl.NumberFormat("vi-VN").format(price)} ${currency}`;
}
