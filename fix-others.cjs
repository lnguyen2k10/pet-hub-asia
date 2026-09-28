const fs = require('fs');

// 1. search-bar.tsx
let p = 'src/components/search-bar.tsx';
let c = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

c = c.replace(
  `import { CATEGORIES, CITIES } from "@/lib/pet";`,
  `import { useQuery } from "@tanstack/react-query";\nimport { shopCategoriesQuery, shopLocationsQuery } from "@/lib/queries";`
);
c = c.replace(
  `  const [category, setCategory] = useState(initial?.category ?? "");\n  const [city, setCity] = useState(initial?.city ?? "");`,
  `  const [category, setCategory] = useState(initial?.category ?? "");\n  const [city, setCity] = useState(initial?.city ?? "");\n\n  const categoriesQ = useQuery(shopCategoriesQuery);\n  const locationsQ = useQuery(shopLocationsQuery);\n  const categories = categoriesQ.data ?? [];\n  const locations = locationsQ.data ?? [];`
);
c = c.replace(
  `            {CATEGORIES.map((c) => (\n              <SelectItem key={c.value} value={c.value}>\n                {c.label}\n              </SelectItem>\n            ))}`,
  `            {categories.map((c) => (\n              <SelectItem key={c.slug} value={c.slug}>\n                {c.name}\n              </SelectItem>\n            ))}`
);
c = c.replace(
  `            {CITIES.map((c) => (\n              <SelectItem key={c} value={c}>\n                {c}\n              </SelectItem>\n            ))}`,
  `            {locations.map((c) => (\n              <SelectItem key={c.slug} value={c.name}>\n                {c.name}\n              </SelectItem>\n            ))}`
);
fs.writeFileSync(p, c, 'utf8');

// 2. index.tsx
p = 'src/routes/index.tsx';
c = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

c = c.replace(
  `import { CATEGORIES } from "@/lib/pet";\n`,
  ``
);
c = c.replace(
  `import { blogPostsQuery, featuredDealsQuery, featuredShopsQuery, partnerListingsQuery } from "@/lib/queries";`,
  `import { blogPostsQuery, featuredDealsQuery, featuredShopsQuery, partnerListingsQuery, shopCategoriesQuery } from "@/lib/queries";`
);
c = c.replace(
  `  const latestPosts = useQuery(blogPostsQuery());`,
  `  const latestPosts = useQuery(blogPostsQuery());\n  const categoriesQ = useQuery(shopCategoriesQuery);\n  const categories = categoriesQ.data ?? [];`
);
c = c.replace(
  `            {CATEGORIES.map((c) => (\n              <Link\n                key={c.value}\n                to="/shops"\n                search={{ category: c.value }}\n                className="rounded-full bg-sand-deep px-4 py-2 text-sm font-medium ring-1 ring-border hover:bg-terra/15"\n              >\n                {c.label}\n              </Link>\n            ))}`,
  `            {categories.map((c) => (\n              <Link\n                key={c.slug}\n                to="/shops"\n                search={{ category: c.slug }}\n                className="rounded-full bg-sand-deep px-4 py-2 text-sm font-medium ring-1 ring-border hover:bg-terra/15"\n              >\n                {c.name}\n              </Link>\n            ))}`
);
fs.writeFileSync(p, c, 'utf8');
console.log('done');
