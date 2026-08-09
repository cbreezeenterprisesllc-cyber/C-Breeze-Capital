import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "..", "data");

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = join(DATA_DIR, "greenexpress.db");

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.run("PRAGMA journal_mode = WAL");
    _db.run("PRAGMA foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database) {
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

    CREATE TABLE IF NOT EXISTS driver_applications (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'OR',
      zip_code TEXT NOT NULL,
      drivers_license_number TEXT NOT NULL,
      drivers_license_state TEXT NOT NULL DEFAULT 'OR',
      drivers_license_expiry TEXT NOT NULL,
      vehicle_make TEXT NOT NULL,
      vehicle_model TEXT NOT NULL,
      vehicle_year INTEGER NOT NULL,
      vehicle_color TEXT NOT NULL,
      vehicle_plate TEXT NOT NULL,
      insurance_provider TEXT NOT NULL,
      insurance_policy_number TEXT NOT NULL,
      has_smartphone INTEGER DEFAULT 1,
      background_check_consent INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','approved','rejected','suspended')),
      notes TEXT DEFAULT '',
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL UNIQUE,
      tenant_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      drivers_license_number TEXT NOT NULL,
      drivers_license_state TEXT NOT NULL,
      vehicle_info TEXT DEFAULT '{}',
      insurance_info TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      is_available INTEGER DEFAULT 1,
      current_lat REAL DEFAULT 0,
      current_lng REAL DEFAULT 0,
      total_deliveries INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      joined_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES driver_applications(id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available);
    CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
  `);
  // Add new driver compliance fields to existing installations without destructive migrations.
  for (const statement of [
    "ALTER TABLE driver_applications ADD COLUMN insurance_coverage_limit TEXT DEFAULT ''",
    "ALTER TABLE driver_applications ADD COLUMN vehicle_registration TEXT DEFAULT ''",
    "ALTER TABLE driver_applications ADD COLUMN drug_policy_consent INTEGER DEFAULT 0",
    "ALTER TABLE driver_applications ADD COLUMN contractor_agreement_consent INTEGER DEFAULT 0",
    "ALTER TABLE driver_applications ADD COLUMN compliance_acknowledgment INTEGER DEFAULT 0",
  ]) {
    try { db.run(statement); } catch { /* column already exists */ }
  }
}