import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Setup Supabase (Service Role to bypass RLS)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Utility: Slugify Vietnamese text
function createSlug(str) {
  if (!str) return "";
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/[^a-z0-9 -]/g, ""); // remove invalid chars
  str = str.replace(/\s+/g, "-"); // collapse whitespace and replace by -
  str = str.replace(/-+/g, "-"); // collapse dashes
  return str.trim();
}

// 1. Identify dataset file
const files = fs.readdirSync(process.cwd());
const datasetFile = files.find((f) => f.startsWith("dataset_") && f.endsWith(".json"));
if (!datasetFile) {
  console.error("No dataset_...json file found in root directory.");
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(datasetFile, "utf-8"));
console.log(`Found ${rawData.length} items in ${datasetFile}`);

// 2. Strict Filtering
const corePetKeywords = ["pet", "thú cưng", "chó", "mèo", "thú y", "vet", "grooming", "thức ăn"];
const excludeKeywords = [
  "nhà hàng",
  "khách sạn",
  "quán ăn",
  "cafe",
  "cà phê",
  "trà sữa",
  "massage",
  "yoga",
  "nails",
  "gội đầu",
  "beauty",
  "phòng khám đa khoa",
  "nha khoa",
  "thẩm mỹ viện",
  "phẫu thuật thẩm mỹ",
  "bệnh viện đa khoa",
];

const validShops = [];
for (const item of rawData) {
  const title = (item.title || "").toLowerCase();
  const categories = (item.categories ? item.categories.join(" ") : "").toLowerCase();
  const categoryName = (item.categoryName || "").toLowerCase();
  const fullText = title + " " + categories + " " + categoryName;

  // A place is valid if it contains a core pet keyword (spa is too generic so it's not a core keyword)
  // OR if its category explicitly says "Cửa hàng vật nuôi" or "Bệnh viện thú y" or "Dịch vụ chăm sóc thú nuôi"
  const hasCoreKeyword = corePetKeywords.some((kw) => fullText.includes(kw));
  const hasExplicitCategory =
    categories.includes("vật nuôi") ||
    categories.includes("thú y") ||
    categories.includes("thú cưng") ||
    categories.includes("pet");

  const hasExclude = excludeKeywords.some((kw) => fullText.includes(kw));

  if ((hasCoreKeyword || hasExplicitCategory) && !hasExclude) {
    validShops.push(item);
  }
}
console.log(`After filtering, ${validShops.length} valid Pet-related shops remain.`);

// 3. Transform & Upload
async function processShops() {
  for (let i = 0; i < validShops.length; i++) {
    const item = validShops[i];

    // Determine exact category and cover image
    let category = "Pet Shop";
    let cover_url = "/images/cover_pet_shop.png"; // Make sure this matches your deployed static path

    const textToCategorize = (
      (item.title || "") +
      " " +
      (item.categories ? item.categories.join(" ") : "")
    ).toLowerCase();

    if (
      textToCategorize.includes("thú y") ||
      textToCategorize.includes("vet") ||
      textToCategorize.includes("bệnh viện") ||
      textToCategorize.includes("trạm")
    ) {
      category = "Phòng khám thú y";
      cover_url = "/images/cover_vet.png";
    } else if (
      textToCategorize.includes("spa") ||
      textToCategorize.includes("grooming") ||
      textToCategorize.includes("tỉa") ||
      textToCategorize.includes("tắm")
    ) {
      category = "Spa & Grooming";
      cover_url = "/images/cover_spa.png";
    }

    // Determine city
    let city = "Hồ Chí Minh";
    if (item.city) city = item.city;
    else if (item.address && item.address.includes("Hà Nội")) city = "Hà Nội";
    else if (item.address && item.address.includes("Đà Nẵng")) city = "Đà Nẵng";

    const baseSlug = createSlug(item.title);
    const uniqueSlug = baseSlug + "-" + Math.floor(1000 + Math.random() * 9000);

    const shopData = {
      name: item.title,
      slug: uniqueSlug,
      description: item.description || null,
      address: item.address,
      city: city,
      phone: item.phoneUnformatted || item.phone || null,
      website: item.website || null,
      category: category,
      cover_url: cover_url,
      // Default standard fields
      is_published: true,
      is_featured: false,
      rating: item.totalScore || 5.0,
      // Location data is important for searching
      // Note: your table schema doesn't have lat/lng currently, maybe add them later if needed.
    };

    // Insert into DB
    const { error } = await supabase.from("shops").insert([shopData]);
    if (error) {
      console.error(`Error inserting ${item.title}:`, error.message);
    } else {
      console.log(`[${i + 1}/${validShops.length}] Inserted: ${item.title} -> ${category}`);
    }
  }
  console.log("Done inserting all shops!");
}

processShops();
