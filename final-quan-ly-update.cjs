const fs = require('fs');
let content = fs.readFileSync('src/routes/quan-ly.tsx', 'utf8');

const str1 = `  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: CATEGORIES[0].value as string,
    city: CITIES[0] as string,`;

const rep1 = `  const qc = useQueryClient();
  const categoriesQ = useQuery(shopCategoriesQuery);
  const locationsQ = useQuery(shopLocationsQuery);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: shop?.category ?? "",
    city: shop?.city ?? "",`;

const str2 = `{CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}`;

const rep2 = `{categoriesQ.data?.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}`;

const str3 = `{CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}`;

const rep3 = `{locationsQ.data?.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}`;

// normalize \r\n to \n for both target and content before replacing
content = content.replace(/\r\n/g, '\n');
content = content.replace(str1.replace(/\r\n/g, '\n'), rep1);
content = content.replace(str2.replace(/\r\n/g, '\n'), rep2);
content = content.replace(str3.replace(/\r\n/g, '\n'), rep3);

fs.writeFileSync('src/routes/quan-ly.tsx', content, 'utf8');
console.log('done');
