const fs = require('fs');
let c = fs.readFileSync('src/components/claim-shop-form.tsx', 'utf8');
c = c.replace(/import \{ supabase \} from "@\/lib\/supabase";/, 'import { supabase } from "@/integrations/supabase/client";');
c = c.replace(/import \{ useAuth \} from "@\/lib\/auth";/, 'import { useAuth } from "@/hooks/use-auth";');
fs.writeFileSync('src/components/claim-shop-form.tsx', c, 'utf8');
console.log('done');
