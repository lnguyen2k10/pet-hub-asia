const fs = require("fs");
let c = fs.readFileSync("src/routes/admin.tsx", "utf8");

c = c.replace(
  /durationDays,[\s\S]*?}: {[\s\S]*?req: MembershipRequest;[\s\S]*?status: "approved" \| "rejected";[\s\S]*?durationDays: number;[\s\S]*?}\) => {/,
  `durationDays,
      plan,
    }: {
      req: MembershipRequest;
      status: "approved" | "rejected";
      durationDays: number;
      plan?: MembershipPlan | null;
    }) => {`,
);

c = c.replace(
  /if \(status === "approved" && req\.shop_id\) {[\s\S]*?await supabase\.from\("shops"\)\.update\({ is_published: true }\)\.eq\("id", req\.shop_id\);[\s\S]*?}/,
  `if (status === "approved" && req.shop_id) {
        await supabase.from("shops").update({ is_published: true }).eq("id", req.shop_id);
      }
      if (status === "approved" && plan && req.user_id) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", req.user_id).single();
        if (profile) {
          await supabase.from("profiles").update({
            quota_deals: (profile.quota_deals || 0) + (plan.quota_deals || 0),
            quota_products: (profile.quota_products || 0) + (plan.quota_products || 0),
            quota_featured_slots: (profile.quota_featured_slots || 0) + (plan.quota_featured_slots || 0),
            quota_partner_posts: (profile.quota_partner_posts || 0) + (plan.quota_partner_posts || 0),
            quota_blog_posts: (profile.quota_blog_posts || 0) + (plan.quota_blog_posts || 0),
            membership_until: expires.toISOString(),
          }).eq("id", req.user_id);
        }
      }`,
);

fs.writeFileSync("src/routes/admin.tsx", c);
