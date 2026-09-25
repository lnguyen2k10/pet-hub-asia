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
  console.log("Checking storage buckets...");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error("Error listing buckets:", bucketsError);
    return;
  }

  const bucketName = 'shop-media';
  const exists = buckets.find(b => b.name === bucketName);

  if (exists) {
    console.log(`Bucket '${bucketName}' already exists. Making it public if not...`);
    await supabase.storage.updateBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880 // 5MB
    });
  } else {
    console.log(`Creating bucket '${bucketName}'...`);
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880
    });
    if (createError) {
      console.error(`Failed to create bucket:`, createError);
      return;
    }
    console.log(`✅ Bucket '${bucketName}' created successfully.`);
  }

  console.log("Done.");
}

run();
