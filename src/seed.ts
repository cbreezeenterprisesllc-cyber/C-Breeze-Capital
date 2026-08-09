import { Database } from "bun:sqlite";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "data", "greenexpress.db");
const db = new Database(DB_PATH);
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

// Initialize schema (mirrors src/lib/db.ts)
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT DEFAULT '',
    primary_color TEXT DEFAULT '#059669',
    secondary_color TEXT DEFAULT '#065f46',
    store_name TEXT NOT NULL,
    delivery_zone TEXT DEFAULT '{}',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer', 'merchant', 'admin')),
    tenant_id TEXT,
    phone TEXT DEFAULT '',
    age_verified INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    category_id TEXT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price REAL NOT NULL,
    unit TEXT DEFAULT 'g',
    thc_content TEXT DEFAULT '',
    cbd_content TEXT DEFAULT '',
    strain_type TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    stock INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    requires_age_verification INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending','confirmed','preparing','in_transit','delivered','cancelled')),
    total REAL NOT NULL,
    delivery_fee REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    delivery_address TEXT NOT NULL,
    delivery_notes TEXT DEFAULT '',
    driver_id TEXT,
    estimated_delivery_at TEXT,
    delivered_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (driver_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
  CREATE TABLE IF NOT EXISTS white_label_config (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    domain TEXT DEFAULT '',
    custom_css TEXT DEFAULT '',
    favicon_url TEXT DEFAULT '',
    about_text TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    social_links TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );
  CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
`);

function uid() {
  return crypto.randomUUID();
}

function hashPassword(password: string): string {
  // Simple bcrypt-compatible hash for seed data
  const { createHash, randomBytes } = crypto;
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return `$2b$10$${salt}$${hash}`;
}

console.log("Seeding database...\n");

// --- TENANTS (Dispensaries) ---
const tenants = [
  { id: uid(), name: "GreenLeaf Dispensary", slug: "greenleaf-pdx", store_name: "GreenLeaf Dispensary", city: "Portland, OR", zone: '{"portland": true}' },
  { id: uid(), name: "Cascade Cannabis Co.", slug: "cascade-cannabis", store_name: "Cascade Cannabis Co.", city: "Portland, OR", zone: '{"portland": true}' },
  { id: uid(), name: "Rose City Remedies", slug: "rose-city", store_name: "Rose City Remedies", city: "Portland, OR", zone: '{"portland": true}' },
  { id: uid(), name: "SoCal Green", slug: "socal-green-la", store_name: "SoCal Green", city: "Los Angeles, CA", zone: '{"los-angeles": true}' },
  { id: uid(), name: "Highland Herb Co.", slug: "highland-herb-denver", store_name: "Highland Herb Co.", city: "Denver, CO", zone: '{"denver": true}' },
  { id: uid(), name: "Great Lakes Ganja", slug: "great-lakes-annarbor", store_name: "Great Lakes Ganja", city: "Ann Arbor, MI", zone: '{"ann-arbor": true}' },
  { id: uid(), name: "Vegas Oasis", slug: "vegas-oasis", store_name: "Vegas Oasis", city: "Las Vegas, NV", zone: '{"las-vegas": true}' },
  { id: uid(), name: "Bay State Buds", slug: "bay-state-boston", store_name: "Bay State Buds", city: "Boston, MA", zone: '{"boston": true}' },
  { id: uid(), name: "Desert Drip Dispensary", slug: "desert-drip-phoenix", store_name: "Desert Drip Dispensary", city: "Phoenix, AZ", zone: '{"phoenix": true}' },
  { id: uid(), name: "Emerald City Cannabis", slug: "emerald-city-seattle", store_name: "Emerald City Cannabis", city: "Seattle, WA", zone: '{"seattle": true}' },
];

const insertTenant = db.prepare(
  "INSERT OR IGNORE INTO tenants (id, name, slug, store_name, delivery_zone, is_active) VALUES (?, ?, ?, ?, ?, 1)"
);
for (const t of tenants) insertTenant.run(t.id, t.name, t.slug, t.store_name, t.zone);
console.log(`  ✓ ${tenants.length} dispensaries seeded`);

// --- USERS ---
const users = [
  { id: uid(), email: "alex@greenleaf.com", password: "password123", name: "Alex Green", role: "merchant", tenant_id: tenants[0].id },
  { id: uid(), email: "maya@cascade.com", password: "password123", name: "Maya Rivers", role: "merchant", tenant_id: tenants[1].id },
  { id: uid(), email: "jordan@rosecity.com", password: "password123", name: "Jordan Smith", role: "merchant", tenant_id: tenants[2].id },
  { id: uid(), email: "carlos@socalgreen.com", password: "password123", name: "Carlos Mendez", role: "merchant", tenant_id: tenants[3].id },
  { id: uid(), email: "emma@highlandherb.com", password: "password123", name: "Emma Walker", role: "merchant", tenant_id: tenants[4].id },
  { id: uid(), email: "nate@greatlakesganja.com", password: "password123", name: "Nate Thompson", role: "merchant", tenant_id: tenants[5].id },
  { id: uid(), email: "tina@vegasoasis.com", password: "password123", name: "Tina Reyes", role: "merchant", tenant_id: tenants[6].id },
  { id: uid(), email: "brian@baystatebuds.com", password: "password123", name: "Brian Chen", role: "merchant", tenant_id: tenants[7].id },
  { id: uid(), email: "sarah@desertdrip.com", password: "password123", name: "Sarah Khan", role: "merchant", tenant_id: tenants[8].id },
  { id: uid(), email: "marcus@emeraldcity.com", password: "password123", name: "Marcus Johnson", role: "merchant", tenant_id: tenants[9].id },
  { id: uid(), email: "sam@example.com", password: "password123", name: "Sam Taylor", role: "customer", tenant_id: null, age_verified: 1 },
  { id: uid(), email: "priya@example.com", password: "password123", name: "Priya Patel", role: "customer", tenant_id: null, age_verified: 1 },
  { id: uid(), email: "admin@greenexpress.io", password: "admin123", name: "Platform Admin", role: "admin", tenant_id: null },
  { id: uid(), email: "driver@greenleaf.com", password: "password123", name: "Dan Driver", role: "customer", tenant_id: tenants[0].id },
];

const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (id, email, password_hash, name, role, tenant_id, age_verified) VALUES (?, ?, ?, ?, ?, ?, ?)"
);
for (const u of users) {
  const hash = hashPassword(u.password);
  insertUser.run(u.id, u.email, hash, u.name, u.role, u.tenant_id, (u as any).age_verified || 0);
}
console.log(`  ✓ ${users.length} users seeded`);

// --- CATEGORIES ---
const categoryDefs = [
  { tenant_id: tenants[0].id, name: "Flower", sort: 1 },
  { tenant_id: tenants[0].id, name: "Edibles", sort: 2 },
  { tenant_id: tenants[0].id, name: "Vapes", sort: 3 },
  { tenant_id: tenants[0].id, name: "Pre-Rolls", sort: 4 },
  { tenant_id: tenants[1].id, name: "Flower", sort: 1 },
  { tenant_id: tenants[1].id, name: "Concentrates", sort: 2 },
  { tenant_id: tenants[1].id, name: "Tinctures", sort: 3 },
  { tenant_id: tenants[2].id, name: "Flower", sort: 1 },
  { tenant_id: tenants[2].id, name: "Edibles", sort: 2 },
  { tenant_id: tenants[2].id, name: "Topicals", sort: 3 },
];

const categories = categoryDefs.map((c) => ({
  id: uid(),
  ...c,
}));

const insertCategory = db.prepare(
  "INSERT OR IGNORE INTO categories (id, tenant_id, name, sort_order, is_active) VALUES (?, ?, ?, ?, 1)"
);
for (const c of categories) insertCategory.run(c.id, c.tenant_id, c.name, c.sort);
console.log(`  ✓ ${categories.length} categories seeded`);

// --- PRODUCTS ---
const productDefs = [
  // GreenLeaf Dispensary — Flower
  { tenant: tenants[0], cat: categories[0], name: "Blue Dream", price: 45.00, thc: "22%", cbd: "0.1%", strain: "Sativa", stock: 50, unit: "3.5g" },
  { tenant: tenants[0], cat: categories[0], name: "OG Kush", price: 50.00, thc: "24%", cbd: "0.05%", strain: "Hybrid", stock: 35, unit: "3.5g" },
  { tenant: tenants[0], cat: categories[0], name: "Granddaddy Purple", price: 55.00, thc: "20%", cbd: "0.2%", strain: "Indica", stock: 40, unit: "3.5g" },
  // GreenLeaf — Edibles
  { tenant: tenants[0], cat: categories[1], name: "THC Gummies 10-pack", price: 25.00, thc: "100mg", cbd: "0mg", strain: "Hybrid", stock: 100, unit: "pack" },
  { tenant: tenants[0], cat: categories[1], name: "Chocolate Bar", price: 30.00, thc: "200mg", cbd: "0mg", strain: "Indica", stock: 60, unit: "bar" },
  // GreenLeaf — Vapes
  { tenant: tenants[0], cat: categories[2], name: "Strawberry Cough Cartridge", price: 40.00, thc: "85%", cbd: "0%", strain: "Sativa", stock: 75, unit: "1g" },
  { tenant: tenants[0], cat: categories[2], name: "Northern Lights Cartridge", price: 42.00, thc: "82%", cbd: "0%", strain: "Indica", stock: 45, unit: "1g" },
  // GreenLeaf — Pre-Rolls
  { tenant: tenants[0], cat: categories[3], name: "Sour Diesel Pre-Roll (3pk)", price: 20.00, thc: "23%", cbd: "0.1%", strain: "Sativa", stock: 80, unit: "3-pack" },
  { tenant: tenants[0], cat: categories[3], name: "Wedding Cake Pre-Roll", price: 12.00, thc: "25%", cbd: "0.05%", strain: "Hybrid", stock: 90, unit: "each" },

  // Cascade Cannabis — Flower
  { tenant: tenants[1], cat: categories[4], name: "Super Silver Haze", price: 48.00, thc: "21%", cbd: "0.1%", strain: "Sativa", stock: 55, unit: "3.5g" },
  { tenant: tenants[1], cat: categories[4], name: "Gelato #33", price: 52.00, thc: "23%", cbd: "0.1%", strain: "Hybrid", stock: 30, unit: "3.5g" },
  // Cascade — Concentrates
  { tenant: tenants[1], cat: categories[5], name: "Live Resin Sugar", price: 60.00, thc: "78%", cbd: "0%", strain: "Hybrid", stock: 25, unit: "1g" },
  { tenant: tenants[1], cat: categories[5], name: "THC Diamonds", price: 75.00, thc: "92%", cbd: "0%", strain: "Sativa", stock: 15, unit: "1g" },
  // Cascade — Tinctures
  { tenant: tenants[1], cat: categories[6], name: "CBD Relief Tincture", price: 45.00, thc: "5mg/ml", cbd: "25mg/ml", strain: "Hybrid", stock: 40, unit: "30ml" },
  { tenant: tenants[1], cat: categories[6], name: "Sleep Tincture", price: 50.00, thc: "10mg/ml", cbd: "10mg/ml", strain: "Indica", stock: 35, unit: "30ml" },

  // Rose City — Flower
  { tenant: tenants[2], cat: categories[7], name: "Pineapple Express", price: 44.00, thc: "20%", cbd: "0.1%", strain: "Sativa", stock: 60, unit: "3.5g" },
  { tenant: tenants[2], cat: categories[7], name: "Purple Punch", price: 48.00, thc: "22%", cbd: "0.2%", strain: "Indica", stock: 45, unit: "3.5g" },
  // Rose City — Edibles
  { tenant: tenants[2], cat: categories[8], name: "Cannabis-Infused Honey", price: 35.00, thc: "150mg", cbd: "0mg", strain: "Hybrid", stock: 70, unit: "jar" },
  { tenant: tenants[2], cat: categories[8], name: "Mint Chocolate Bites", price: 28.00, thc: "50mg", cbd: "0mg", strain: "Hybrid", stock: 55, unit: "pack" },
  // Rose City — Topicals
  { tenant: tenants[2], cat: categories[9], name: "CBD Muscle Balm", price: 40.00, thc: "0%", cbd: "500mg", strain: "Hybrid", stock: 30, unit: "jar" },
  { tenant: tenants[2], cat: categories[9], name: "Relief Patch (4-pack)", price: 22.00, thc: "0%", cbd: "100mg", strain: "Hybrid", stock: 50, unit: "pack" },
];

const products: { id: string; name: string }[] = [];
const insertProduct = db.prepare(
  `INSERT OR IGNORE INTO products (id, tenant_id, category_id, name, description, price, unit, thc_content, cbd_content, strain_type, stock, is_active)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
);
for (const p of productDefs) {
  const id = uid();
  const desc = `Premium ${p.strain} — ${p.thc} THC / ${p.cbd} CBD`;
  insertProduct.run(id, p.tenant.id, p.cat.id, p.name, desc, p.price, p.unit, p.thc, p.cbd, p.strain, p.stock);
  products.push({ id, name: p.name });
}
console.log(`  ✓ ${productDefs.length} products seeded`);

// --- SAMPLE ORDERS ---
const customerId = users[3].id; // Sam Taylor
const driverId = users[6].id; // Dan Driver

const sampleOrders = [
  { status: "delivered", total: 70.00, fee: 5.00, tax: 7.00, addr: "123 Main St, Portland, OR 97201", note: "Leave at front desk" },
  { status: "in_transit", total: 45.00, fee: 5.00, tax: 4.50, addr: "456 Oak Ave, Portland, OR 97202", note: "Ring doorbell" },
  { status: "preparing", total: 55.00, fee: 5.00, tax: 5.50, addr: "789 Pine Rd, Portland, OR 97203", note: "" },
  { status: "confirmed", total: 30.00, fee: 5.00, tax: 3.00, addr: "321 Elm St, Portland, OR 97201", note: "Call when arriving" },
];

const insertOrder = db.prepare(
  `INSERT OR IGNORE INTO orders (id, tenant_id, customer_id, status, total, delivery_fee, tax, delivery_address, delivery_notes, driver_id, estimated_delivery_at, delivered_at, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertOrderItem = db.prepare(
  "INSERT OR IGNORE INTO order_items (id, order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)"
);

for (let i = 0; i < sampleOrders.length; i++) {
  const o = sampleOrders[i];
  const orderId = uid();
  const created = new Date(Date.now() - (4 - i) * 86400000).toISOString();
  const estimated = new Date(Date.now() + 3600000).toISOString();
  const delivered = o.status === "delivered" ? new Date(Date.now() - (4 - i) * 86400000 + 5400000).toISOString() : null;

  insertOrder.run(orderId, tenants[0].id, customerId, o.status, o.total, o.fee, o.tax, o.addr, o.note,
    o.status === "delivered" || o.status === "in_transit" ? driverId : null,
    estimated, delivered, created);

  // Add items
  const itemProduct = products[i % products.length];
  insertOrderItem.run(uid(), orderId, itemProduct.id, itemProduct.name, 1, o.total - o.fee - o.tax);

  console.log(`  ✓ Sample order "${o.status}" created ($${o.total})`);
}

console.log("\n✨ Seeding complete!");
console.log(`   ${tenants.length} tenants, ${users.length} users, ${categories.length} categories, ${productDefs.length} products, ${sampleOrders.length} orders\n`);

console.log("📋 Login credentials:");
console.log("   Merchant: alex@greenleaf.com / password123 (GreenLeaf Dispensary)");
console.log("   Merchant: maya@cascade.com / password123 (Cascade Cannabis Co.)");
console.log("   Merchant: jordan@rosecity.com / password123 (Rose City Remedies)");
console.log("   Customer: sam@example.com / password123");
console.log("   Admin:    admin@greenexpress.io / admin123");