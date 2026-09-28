const fs = require('fs');

const p = 'src/routes/quan-ly.tsx';
let content = fs.readFileSync(p, 'utf8');

// 1. Add imports
content = content.replace(
  `import { userRoleQuery, userShopsQuery, userDealsQuery, myB2BListingsQuery, type ShopWithDeals } from "@/lib/queries";`,
  `import { userRoleQuery, userShopsQuery, userDealsQuery, myB2BListingsQuery, shopCategoriesQuery, shopLocationsQuery, type ShopWithDeals } from "@/lib/queries";`
);

// Remove CATEGORIES and CITIES from pet.ts import
content = content.replace(
  `import { CATEGORIES, CITIES, formatPrice, slugify } from "@/lib/pet";`,
  `import { formatPrice, slugify } from "@/lib/pet";`
);

// 2. ShopForm Updates
content = content.replace(
  /function ShopForm\(\{ shop, userId \}: \{ shop: ShopWithDeals \| null; userId: string \}\) \{\n  const qc = useQueryClient\(\);\n  const \[form, setForm\] = useState\(\{([\s\S]*?)category: CATEGORIES\[0\].value as string,\n    city: CITIES\[0\] as string,/g,
  `function ShopForm({ shop, userId }: { shop: ShopWithDeals | null; userId: string }) {
  const qc = useQueryClient();
  const categoriesQ = useQuery(shopCategoriesQuery);
  const locationsQ = useQuery(shopLocationsQuery);

  const [form, setForm] = useState({$1category: shop?.category ?? "",
    city: shop?.city ?? "",`
);

content = content.replace(
  /setForm\(prev => \(\{ ...prev, slug: slugify\(e.target.value\) \}\)\);\n              \}\}\n            \/>/,
  `setForm(prev => ({ ...prev, slug: slugify(e.target.value) }));
              }}
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">`
);

const shopFormEffect = `  useEffect(() => {
    if (shop) return;
    if (!form.category && categoriesQ.data?.length) {
      setForm(f => ({ ...f, category: categoriesQ.data[0].slug }));
    }
    if (!form.city && locationsQ.data?.length) {
      setForm(f => ({ ...f, city: locationsQ.data[0].name }));
    }
  }, [shop, categoriesQ.data, locationsQ.data, form.category, form.city]);

  const save = useMutation({`;
content = content.replace(/  const save = useMutation\(\{/, shopFormEffect);


// ShopForm Selects
content = content.replace(
  /\{CATEGORIES.map\(\(c\) => \(\n              <option key=\{c.value\} value=\{c.value\}>\n                \{c.label\}\n              <\/option>\n            \)\)\}/g,
  `{categoriesQ.data?.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}`
);
content = content.replace(
  /\{CITIES.map\(\(c\) => \(\n              <option key=\{c\} value=\{c\}>\n                \{c\}\n              <\/option>\n            \)\)\}/g,
  `{locationsQ.data?.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}`
);


// 3. B2BListingForm emptyListing Update
content = content.replace(
  /const emptyListing = \{([\s\S]*?)city: CITIES\[0\] as string,/g,
  `const emptyListing = {$1city: "",`
);

// B2BListingForm Edit Mode Update
content = content.replace(
  /city: l.city \?\? \(CITIES\[0\] as string\),/g,
  `city: l.city ?? "",`
);

// B2BListingForm Component Update
content = content.replace(
  /function B2BListingForm\(\{ userId \}: \{ userId: string \}\) \{([\s\S]*?)const qc = useQueryClient\(\);/g,
  `function B2BListingForm({ userId }: { userId: string }) {$1const qc = useQueryClient();
  const locationsQ = useQuery(shopLocationsQuery);`
);

const b2bFormEffect = `  useEffect(() => {
    if (listingToEdit) return;
    if (!form.city && locationsQ.data?.length) {
      setForm(f => ({ ...f, city: locationsQ.data[0].name }));
    }
  }, [listingToEdit, locationsQ.data, form.city]);

  const save = useMutation({`;
content = content.replace(/  const save = useMutation\(\{/g, (match, offset, str) => {
  // Only replace the second occurrence (which is inside B2BListingForm)
  if (offset > content.indexOf('function B2BListingForm')) {
    return b2bFormEffect;
  }
  return match;
});

// B2BListingForm Select Update
content = content.replace(
  /\{CITIES.map\(\(c\) => \(\n                <option key=\{c\} value=\{c\}>\n                  \{c\}\n                <\/option>\n              \)\)\}/g,
  `{locationsQ.data?.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}`
);

fs.writeFileSync(p, content, 'utf8');
console.log('quan-ly.tsx updated successfully');
