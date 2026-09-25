const fs = require('fs');
const file = 'src/lib/queries.ts';
let content = fs.readFileSync(file, 'utf8');

const publicQueries = [
  'featuredShopsQuery',
  'featuredDealsQuery',
  'searchShopsQuery',
  'shopBySlugQuery',
  'partnerListingsQuery',
  'allDealsQuery',
  'blogCategoriesQuery',
  'blogPostsQuery',
  'blogPostBySlugQuery'
];

content = content.replace(/(queryOptions\(\{[\s\S]*?queryKey:\s*\[.*?\][^]*?)(queryFn:)/g, (match, p1, p2) => {
  if (match.includes('staleTime')) return match; // already has staleTime
  return `${p1}staleTime: 5 * 60 * 1000,\n    ${p2}`;
});

fs.writeFileSync(file, content, 'utf8');
