const fs = require('fs');
let c = fs.readFileSync('src/routes/co-hoi-kinh-doanh.tsx', 'utf8').replace(/\r\n/g, '\n');
c = c.replace(/import \{ CITIES \} from "@\/lib\/pet";\n/, '');
c = c.replace(
  /import \{ b2bListingsQuery \} from "@\/lib\/queries";/,
  'import { b2bListingsQuery, shopLocationsQuery } from "@/lib/queries";'
);
c = c.replace(
  /const listings = useQuery\(b2bListingsQuery\(\)\);/,
  `const listings = useQuery(b2bListingsQuery());\n  const locationsQ = useQuery(shopLocationsQuery);\n  const cities = locationsQ.data?.map(l => l.name) ?? [];`
);
c = c.replace(/CITIES\.map/g, 'cities.map');
fs.writeFileSync('src/routes/co-hoi-kinh-doanh.tsx', c);
console.log('done');
