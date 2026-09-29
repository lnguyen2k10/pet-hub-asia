const fs = require("fs");
let code = fs.readFileSync("src/routes/shop.$slug.tsx", "utf8");

// Update head function for SEO
code = code.replace(
  /head:\s*\(\{\s*params,\s*loaderData\s*\}\)\s*=>\s*\{([\s\S]*?)return\s*\{([\s\S]*?)\};\s*\}/,
  (match, body, retBody) => {
    return `head: ({ params, loaderData }) => {${body}
    const url = \`https://www.1pet.asia/shop/\${params.slug}\`;
    
    // JSON-LD Schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "PetStore",
      "name": name,
      "image": cover ? [cover] : [],
      "description": desc,
      "url": url,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": loaderData?.city || "Vietnam",
        "addressCountry": "VN"
      }
    };
    
    return {
      links: [
        { rel: "canonical", href: url }
      ],
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:url", content: url },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(cover
          ? [
              { property: "og:image", content: cover },
              { name: "twitter:image", content: cover },
            ]
          : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(schema)
        }
      ]
    };
  }`;
  },
);

// Replace h2 with h1 for shop name
code = code.replace(
  '<h2 className="font-display text-2xl font-semibold">{shop.name}</h2>',
  '<h1 className="font-display text-2xl font-semibold">{shop.name}</h1>',
);

fs.writeFileSync("src/routes/shop.$slug.tsx", code);
