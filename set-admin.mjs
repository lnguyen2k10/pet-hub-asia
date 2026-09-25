import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8').split('\n').filter(l => l.includes('=')).reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  acc[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

const supabaseUrl = env['VITE_SUPABASE_URL'] || env['SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("Fetching users...");
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }

  const users = usersData.users;
  if (users.length === 0) {
    console.log("No users found in the system. Please register an account first.");
    return;
  }

  console.log(`Found ${users.length} user(s):`);
  users.forEach(u => console.log(`- ${u.email} (ID: ${u.id}, Confirmed: ${!!u.email_confirmed_at})`));

  console.log("\nSetting all existing users as Admin and Auto-Confirming emails...");
  for (const u of users) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: u.id, role: 'admin' }, { onConflict: 'user_id,role' });
      
    if (roleError) {
      console.error(`Failed to set admin for ${u.email}:`, roleError);
    } else {
      console.log(`✅ User ${u.email} is now an ADMIN.`);
    }

    if (!u.email_confirmed_at) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(u.id, {
        email_confirm: true
      });
      if (updateError) {
        console.error(`Failed to auto-confirm ${u.email}:`, updateError);
      } else {
        console.log(`✅ Auto-confirmed email for ${u.email}.`);
      }
    }
  }
}

run();
