const fs = require('fs');
const file = 'src/routes/quan-ly.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/phone: "",\s*\n\s*description: "",/g, 'phone: "",\n    email: "",\n    website: "",\n    fanpage: "",\n    description: "",');
content = content.replace(/phone: shop\.phone \?\? "",\s*\n\s*description: shop\.description \?\? "",/g, 'phone: shop.phone ?? "",\n      email: shop.email ?? "",\n      website: shop.website ?? "",\n      fanpage: shop.fanpage ?? "",\n      description: shop.description ?? "",');
content = content.replace(/phone: phone \|\| null,\s*\n\s*description: form\.description \|\| null,/g, 'phone: phone || null,\n        email: form.email || null,\n        website: form.website || null,\n        fanpage: form.fanpage || null,\n        description: form.description || null,');
content = content.replace(/<Field label="Điện thoại">([\s\S]*?)<\/Field>/g, `<Field label="Điện thoại">$1</Field>
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
        <Field label="Website">
          <input
            className={inputCls}
            placeholder="https://..."
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
        </Field>
        <Field label="Fanpage">
          <input
            className={inputCls}
            placeholder="https://facebook.com/..."
            value={form.fanpage}
            onChange={(e) => setForm((f) => ({ ...f, fanpage: e.target.value }))}
          />
        </Field>`);

fs.writeFileSync(file, content, 'utf8');
