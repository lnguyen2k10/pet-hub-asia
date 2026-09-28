const fs = require('fs');

const adminPath = 'src/routes/admin.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');

if (!adminContent.includes('shopCategoriesQuery')) {
  adminContent = adminContent.replace(
    /userRoleQuery,\s*type MembershipPlan/s,
    `userRoleQuery,
  shopCategoriesQuery,
  shopLocationsQuery,
  type MembershipPlan`
  );
}

if (!adminContent.includes('id: "locations"')) {
  adminContent = adminContent.replace(
    /\{\s*id:\s*"users",\s*label:\s*"Phân quyền & User",\s*show:\s*isAdmin\s*\}/s,
    `{ id: "locations", label: "Địa điểm & Danh mục", show: isAdmin },
    { id: "users", label: "Phân quyền & User", show: isAdmin }`
  );
}

if (!adminContent.includes('activeTab === "locations"')) {
  adminContent = adminContent.replace(
    /\{\s*activeTab\s*===\s*"users"\s*&&\s*isAdmin\s*&&\s*\(\s*<div>/s,
    `{activeTab === "locations" && isAdmin && (
            <div>
              <h1 className="mb-2 text-3xl sm:text-4xl">Địa điểm & Danh mục</h1>
              <p className="mb-6 text-ink-soft">Quản lý danh mục và địa điểm cho các Shop</p>
              <CategoryLocationManager />
            </div>
          )}
          {activeTab === "users" && isAdmin && (
            <div>`
  );
}

fs.writeFileSync(adminPath, adminContent, 'utf8');
