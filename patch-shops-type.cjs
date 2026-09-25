const fs = require('fs');
const file = 'src/integrations/supabase/types.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/owner_id: string \| null\s*\n\s*phone: string \| null/g, 'email: string | null\n            website: string | null\n            fanpage: string | null\n            owner_id: string | null\n            phone: string | null');
content = content.replace(/owner_id\?: string \| null\s*\n\s*phone\?: string \| null/g, 'email?: string | null\n            website?: string | null\n            fanpage?: string | null\n            owner_id?: string | null\n            phone?: string | null');

fs.writeFileSync(file, content, 'utf8');
