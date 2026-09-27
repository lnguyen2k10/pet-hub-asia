import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

env.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Delete the duplicate Premium plan
  const { error: delError } = await supabase.from('membership_plans').delete().eq('id', 'a453f618-5ab0-4a9f-8d65-4e567765a358');
  if (delError) console.error("Error deleting duplicate:", delError);
  else console.log("Deleted duplicate premium plan.");

  // Insert the free blog plan
  const { error: insError } = await supabase.from('membership_plans').upsert({
    id: 'f8b50f75-31f0-4fa8-a477-8d003b0c9657',
    name: 'Quà tặng (Đăng ký sớm)',
    description: 'Tặng 1 bài đăng Blog miễn phí trên hệ thống 1Pet.Asia',
    price_amount: 0,
    currency: 'VND',
    duration_days: 3650,
    period_label: 'không giới hạn',
    features: ['1 bài đăng Blog PR chất lượng', 'Miễn phí cho khách đăng ký sớm'],
    is_active: true,
    is_featured: false,
    sort_order: 4,
    max_deals: 0,
    max_products: 0,
    featured_slots: 0,
    max_partner_posts: 0,
    max_blog_posts: 1
  });
  
  if (insError) console.error("Error inserting gift plan:", insError);
  else console.log("Inserted gift plan.");
}

run();
