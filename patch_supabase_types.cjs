const fs = require('fs');
const file = 'src/integrations/supabase/types.ts';
let content = fs.readFileSync(file, 'utf8');

const regexes = [
  /(profiles:\s*\{\s*Row:\s*\{[\s\S]*?)(\s*\})/,
  /(profiles:\s*\{\s*Row:\s*\{[\s\S]*?Insert:\s*\{[\s\S]*?)(\s*\})/,
  /(profiles:\s*\{\s*Row:\s*\{[\s\S]*?Insert:\s*\{[\s\S]*?Update:\s*\{[\s\S]*?)(\s*\})/
];

content = content.replace(regexes[0], '$1\n          membership_until?: string | null$2');
content = content.replace(regexes[1], '$1\n          membership_until?: string | null$2');
content = content.replace(regexes[2], '$1\n          membership_until?: string | null$2');

fs.writeFileSync(file, content);
