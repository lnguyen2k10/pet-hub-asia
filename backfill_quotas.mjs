import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const url = "https://smpgnkuqxobzgrkdpusr.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcGdua3VxeG9iemdya2RwdXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1ODc3MiwiZXhwIjoyMTA1ODM0NzcyfQ.uLjcR7uCh5_O3qM2Ioc1kq0TZoCj5s1LtFtFwsbadnc";

const supabase = createClient(url, key);

async function backfill() {
  console.log("Fetching plans...");
  const { data: plans } = await supabase.from("membership_plans").select("*");
  const planMap = {};
  for (const p of plans || []) planMap[p.id] = p;

  console.log("Fetching approved requests...");
  const { data: requests } = await supabase
    .from("membership_requests")
    .select("*")
    .eq("status", "approved");

  console.log(`Found ${requests?.length || 0} approved requests`);

  for (const req of requests || []) {
    const plan = planMap[req.plan_id];
    if (!plan || !req.user_id) continue;

    console.log(`Updating profile for user ${req.user_id} with plan ${plan.name}`);
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user_id)
      .single();

    if (profile) {
      const updateData = {
        quota_deals: Math.max(profile.quota_deals || 0, plan.quota_deals || 0),
        quota_products: Math.max(profile.quota_products || 0, plan.quota_products || 0),
        quota_featured_slots: Math.max(
          profile.quota_featured_slots || 0,
          plan.quota_featured_slots || 0,
        ),
        quota_partner_posts: Math.max(
          profile.quota_partner_posts || 0,
          plan.quota_partner_posts || 0,
        ),
        quota_blog_posts: Math.max(profile.quota_blog_posts || 0, plan.quota_blog_posts || 0),
      };

      const { error } = await supabase.from("profiles").update(updateData).eq("id", req.user_id);
      if (error) console.error("Error updating", req.user_id, error);
      else console.log("Success updating", req.user_id);
    }
  }
}

backfill();
