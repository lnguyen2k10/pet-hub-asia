const fs = require('fs');
const file = 'src/integrations/supabase/types.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix profiles Insert and Update
const profileFields = `          quota_deals?: number
          quota_products?: number
          quota_featured_slots?: number
          quota_partner_posts?: number
          quota_blog_posts?: number
          has_claimed_free_blog?: boolean`;

content = content.replace(/Insert: {\s+created_at\?: string\s+full_name\?: string \| null\s+id: string\s+updated_at\?: string\s+}/g, `Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
${profileFields}
        }`);

content = content.replace(/Update: {\s+created_at\?: string\s+full_name\?: string \| null\s+id\?: string\s+updated_at\?: string\s+}/g, `Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
${profileFields}
        }`);


// Fix shops Row, Insert, Update
const shopExtras = `          cover_url_2?: string | null
          cover_url_3?: string | null`;

content = content.replace(/(shops:\s*{\s*Row:\s*{[^}]+?slug:\s*string\s+updated_at:\s*string)/, `$1\n${shopExtras.replace(/\?/g, '')}`);
content = content.replace(/(Insert:\s*{[^}]+?slug:\s*string\s+updated_at\?:\s*string)/, `$1\n${shopExtras}`);
content = content.replace(/(Update:\s*{[^}]+?slug\?:\s*string\s+updated_at\?:\s*string)/, `$1\n${shopExtras}`);


// Fix incorrect indentation and ordering for email, website, fanpage, owner_id, phone
content = content.replace(/          email: string \| null\n            website: string \| null\n            fanpage: string \| null\n            owner_id: string \| null\n            phone: string \| null/g, 
  `          email: string | null\n          website: string | null\n          fanpage: string | null\n          owner_id: string | null\n          phone: string | null`);
content = content.replace(/          email\?: string \| null\n            website\?: string \| null\n            fanpage\?: string \| null\n            owner_id\?: string \| null\n            phone\?: string \| null/g, 
  `          email?: string | null\n          website?: string | null\n          fanpage?: string | null\n          owner_id?: string | null\n          phone?: string | null`);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed types.ts');
