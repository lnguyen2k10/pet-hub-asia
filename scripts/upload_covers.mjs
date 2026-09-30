import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Initialize Supabase client
const SUPABASE_URL = "https://smpgnkuqxobzgrkdpusr.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcGdua3VxeG9iemdya2RwdXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1ODc3MiwiZXhwIjoyMTA1ODM0NzcyfQ.uLjcR7uCh5_O3qM2Ioc1kq0TZoCj5s1LtFtFwsbadnc";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const mappings = [
  { slug: "pet-shop", file: "C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\c71f3184-ddbe-42f2-820f-e433a2f2cd1d\\banner_pet_shop_1790751815585.png" },
  { slug: "grooming", file: "C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\c71f3184-ddbe-42f2-820f-e433a2f2cd1d\\banner_grooming_1790751861924.png" },
  { slug: "clinic", file: "C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\c71f3184-ddbe-42f2-820f-e433a2f2cd1d\\banner_clinic_1790751874779.png" },
  { slug: "food", file: "C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\c71f3184-ddbe-42f2-820f-e433a2f2cd1d\\banner_food_1790751890419.png" },
  { slug: "accessory", file: "C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\c71f3184-ddbe-42f2-820f-e433a2f2cd1d\\banner_accessory_1790751903156.png" },
  { slug: "hotel", file: "C:\\Users\\Dell\\.gemini\\antigravity-ide\\brain\\c71f3184-ddbe-42f2-820f-e433a2f2cd1d\\banner_hotel_1790751921099.png" },
];

async function main() {
  const ONE_YEAR = 60 * 60 * 24 * 365;

  for (const { slug, file } of mappings) {
    console.log(`Processing ${slug}...`);
    const buffer = fs.readFileSync(file);
    const fileName = `admin/banners/${slug}_${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("shop-media")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error(`Failed to upload for ${slug}:`, uploadError);
      continue;
    }

    const { data: signData, error: signError } = await supabase.storage
      .from("shop-media")
      .createSignedUrl(fileName, ONE_YEAR);

    if (signError || !signData?.signedUrl) {
      console.error(`Failed to sign URL for ${slug}:`, signError);
      continue;
    }

    const url = signData.signedUrl;
    console.log(`Uploaded ${slug}, URL generated.`);

    // Now update all shops in this category
    const { data: updateData, error: updateError } = await supabase
      .from("shops")
      .update({ cover_url: url })
      .eq("category", slug);

    if (updateError) {
      console.error(`Failed to update shops for ${slug}:`, updateError);
    } else {
      console.log(`Updated shops for ${slug} successfully.`);
    }
  }

  console.log("Done.");
}

main().catch(console.error);
