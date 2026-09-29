const fs = require("fs");
let c = fs.readFileSync("src/routes/admin.tsx", "utf8");

if (!c.includes("import React")) {
  c = c.replace('} from "@/lib/queries";', '} from "@/lib/queries";\nimport React from "react";');
}

c = c.replace(/plan\}\)/g, "plan: plan ?? null})");
fs.writeFileSync("src/routes/admin.tsx", c);
