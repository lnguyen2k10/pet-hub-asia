const fs = require('fs');

// 1. Add hook to queries.ts
let q = fs.readFileSync('src/lib/queries.ts', 'utf8').replace(/\r\n/g, '\n');
q += `
export function useCategoryLabel(slug: string | null | undefined) {
  const { data } = useQuery(shopCategoriesQuery);
  return data?.find((c) => c.slug === slug)?.name ?? "Pet shop";
}
`;
if(!q.includes('useQuery')) {
  q = q.replace('import { queryOptions }', 'import { useQuery, queryOptions }');
}
fs.writeFileSync('src/lib/queries.ts', q);

// 2. update shop-card.tsx
let c = fs.readFileSync('src/components/shop-card.tsx', 'utf8').replace(/\r\n/g, '\n');
c = c.replace(/import \{ categoryLabel, shopInitials \} from "\@\/lib\/pet";/, 'import { shopInitials } from "@/lib/pet";\nimport { useCategoryLabel } from "@/lib/queries";');
c = c.replace(/export function ShopCard\(\{ shop \}: \{ shop: Shop \}\) \{/, 'export function ShopCard({ shop }: { shop: Shop }) {\n  const catLabel = useCategoryLabel(shop.category);');
c = c.replace(/\{categoryLabel\(shop\.category\)\}/g, '{catLabel}');
fs.writeFileSync('src/components/shop-card.tsx', c);

// 3. update shop-hero-carousel.tsx
let h = fs.readFileSync('src/components/shop-hero-carousel.tsx', 'utf8').replace(/\r\n/g, '\n');
h = h.replace(/import \{ HERO_SLIDES, categoryLabel, dealImage \} from "\@\/lib\/pet";/, 'import { HERO_SLIDES, dealImage } from "@/lib/pet";\nimport { useCategoryLabel } from "@/lib/queries";');
h = h.replace(/export function ShopHeroCarousel\(\{ shop, slides = HERO_SLIDES \}: \{ shop: Shop; slides\?: readonly any\[\] \}\) \{/, 'export function ShopHeroCarousel({ shop, slides = HERO_SLIDES }: { shop: Shop; slides?: readonly any[] }) {\n  const catLabel = useCategoryLabel(shop.category);');
h = h.replace(/const baseEyebrow = \`\$\{categoryLabel\(shop\.category\)\} · \$\{shop\.city\}\`;/, 'const baseEyebrow = `${catLabel} · ${shop.city}`;');
fs.writeFileSync('src/components/shop-hero-carousel.tsx', h);

// 4. update shop.$slug.tsx
let s = fs.readFileSync('src/routes/shop.$slug.tsx', 'utf8').replace(/\r\n/g, '\n');
s = s.replace(/import \{ categoryLabel, shopInitials \} from "\@\/lib\/pet";/, 'import { shopInitials } from "@/lib/pet";\nimport { useCategoryLabel } from "@/lib/queries";');
s = s.replace(/function ShopPage\(\) \{/, 'function ShopPage() {\n  const catLabel = useCategoryLabel(shop?.category);');
s = s.replace(/\{categoryLabel\(shop\.category\)\}/g, '{catLabel}');
fs.writeFileSync('src/routes/shop.$slug.tsx', s);

console.log('done');
