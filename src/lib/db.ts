import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve the data directory robustly regardless of how deeply this module is
// bundled. At serve time process.cwd() is the project root, so prefer a CWD
// "data" dir that actually holds greenexpress.db (the populated source one).
// The naive module-relative path (join(__dirname, "..", "..", "data")) lands on
// dist/data/greenexpress.db when this file is bundled under dist/server/assets/,
// which is a stale empty copy and made the SSR /dispensaries listing empty.
let DATA_DIR: string;
function resolveDataDir(): string {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    const cwdDir = join(process.cwd(), "data");
    if (existsSync(join(cwdDir, "greenexpress.db"))) return cwdDir;
  }
  return join(__dirname, "..", "..", "data");
}
DATA_DIR = resolveDataDir();

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
      hours TEXT DEFAULT '{}',
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
      id_document_type TEXT,
      id_last_four TEXT,
      id_dob TEXT,
      id_name TEXT,
      signature TEXT,
      verified_by TEXT,
      verified_at TEXT,
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

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      store_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      last_message_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (store_id) REFERENCES tenants(id)
    );

    CREATE TABLE IF NOT EXISTS conversation_participants (
      conversation_id TEXT NOT NULL,
      participant_type TEXT NOT NULL
        CHECK(participant_type IN ('customer','merchant','driver','support')),
      participant_id TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      joined_at TEXT DEFAULT (datetime('now')),
      last_read_at TEXT,
      PRIMARY KEY (conversation_id, participant_type, participant_id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_type TEXT NOT NULL
        CHECK(sender_type IN ('customer','merchant','driver','support')),
      sender_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      read_at TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(is_available);
    CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
    CREATE INDEX IF NOT EXISTS idx_conversations_order ON conversations(order_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);
    CREATE INDEX IF NOT EXISTS idx_participants_lookup ON conversation_participants(participant_type, participant_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
  `);
  // Add new driver compliance fields to existing installations without destructive migrations.
  for (const statement of [
    "ALTER TABLE driver_applications ADD COLUMN insurance_coverage_limit TEXT DEFAULT ''",
    "ALTER TABLE driver_applications ADD COLUMN vehicle_registration TEXT DEFAULT ''",
    "ALTER TABLE driver_applications ADD COLUMN drug_policy_consent INTEGER DEFAULT 0",
    "ALTER TABLE driver_applications ADD COLUMN contractor_agreement_consent INTEGER DEFAULT 0",
    "ALTER TABLE driver_applications ADD COLUMN compliance_acknowledgment INTEGER DEFAULT 0",
    // Store hours: JSON object per day, e.g. {"monday":{"open":"09:00","close":"21:00","closed":false,"allDay":false},...}
    "ALTER TABLE tenants ADD COLUMN hours TEXT DEFAULT '{}'",
    // Delivery ID verification + signature capture columns
    "ALTER TABLE orders ADD COLUMN id_document_type TEXT",
    "ALTER TABLE orders ADD COLUMN id_last_four TEXT",
    "ALTER TABLE orders ADD COLUMN id_dob TEXT",
    "ALTER TABLE orders ADD COLUMN id_name TEXT",
    "ALTER TABLE orders ADD COLUMN signature TEXT",
    "ALTER TABLE orders ADD COLUMN verified_by TEXT",
    "ALTER TABLE orders ADD COLUMN verified_at TEXT",
    // Driver identity verification (start-of-delivery selfie) + reference selfie on file
    "ALTER TABLE users ADD COLUMN reference_selfie TEXT",
    "ALTER TABLE orders ADD COLUMN start_selfie TEXT",
    "ALTER TABLE orders ADD COLUMN started_at TEXT",
    // Real dispatch: dispensary coordinates + driver location (proximity dispatch)
    "ALTER TABLE tenants ADD COLUMN lat REAL",
    "ALTER TABLE tenants ADD COLUMN lng REAL",
    "ALTER TABLE users ADD COLUMN current_lat REAL",
    "ALTER TABLE users ADD COLUMN current_lng REAL",
    // Tips at checkout — tip_amount is the portion the courier keeps 100% of.
    // orders.total is the grand total (subtotal + delivery_fee + tax + tip_amount).
    "ALTER TABLE orders ADD COLUMN tip_amount REAL DEFAULT 0",
    // Pickup / curbside fulfillment — fulfillment_type: delivery|pickup|curbside.
    // pickup_vehicle is the customer's car description for curbside; pickup_notes
    // is optional parking / instruction text. delivery_fee is waived for these.
    "ALTER TABLE orders ADD COLUMN fulfillment_type TEXT DEFAULT 'delivery'",
    "ALTER TABLE orders ADD COLUMN pickup_vehicle TEXT DEFAULT ''",
    "ALTER TABLE orders ADD COLUMN pickup_notes TEXT DEFAULT ''",
    // Scheduled delivery/pickup — scheduled_delivery_at (ISO) is the start of the
    // customer-chosen window; NULL means "as soon as possible" (immediate).
    "ALTER TABLE orders ADD COLUMN scheduled_delivery_at TEXT",
    // Per-tenant scheduling config — JSON: { enabled, windowMinutes, leadMinutes, daysAhead }.
    "ALTER TABLE tenants ADD COLUMN delivery_config TEXT DEFAULT '{}'",
    // Driver performance scoring — on_time (1 on time / 0 late / NULL unscored) per delivered order.
    "ALTER TABLE orders ADD COLUMN on_time INTEGER",
    // Customer ratings for drivers (1–5) at delivery completion. One rating per order.
    "CREATE TABLE IF NOT EXISTS order_ratings (" +
      "id TEXT PRIMARY KEY, order_id TEXT NOT NULL UNIQUE, rated_type TEXT NOT NULL DEFAULT 'driver', " +
      "rated_id TEXT NOT NULL, rating INTEGER NOT NULL, comment TEXT DEFAULT '', " +
      "created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (order_id) REFERENCES orders(id))",
    // ── Merchant / marketing layer (Phase 1, tech-layer pivot) ─────────────
    // Promotions: merchant-created deals/coupons surfaced on the retailer's storefront.
    "CREATE TABLE IF NOT EXISTS promotions (" +
      "id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '', " +
      "code TEXT DEFAULT '', discount_type TEXT NOT NULL DEFAULT 'percent', discount_value REAL DEFAULT 0, " +
      "starts_at TEXT, ends_at TEXT, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), " +
      "FOREIGN KEY (tenant_id) REFERENCES tenants(id))",
    // Leads: customer inquiries captured on the retailer's storefront, delivered to the merchant dashboard.
    "CREATE TABLE IF NOT EXISTS leads (" +
      "id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT DEFAULT '', email TEXT DEFAULT '', " +
      "phone TEXT DEFAULT '', message TEXT DEFAULT '', source TEXT DEFAULT 'storefront', status TEXT DEFAULT 'new', " +
      "created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (tenant_id) REFERENCES tenants(id))",
    // Customer tags/segments (basic CRM). Identified by tenant + customer email (retailer owns the customer).
    "CREATE TABLE IF NOT EXISTS customer_tags (" +
      "id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, customer_email TEXT NOT NULL, tag TEXT NOT NULL, " +
      "created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (tenant_id) REFERENCES tenants(id))",
    // Merchant notes on a customer record (retailer-facing CRM).
    "CREATE TABLE IF NOT EXISTS customer_notes (" +
      "id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, customer_email TEXT NOT NULL, note TEXT NOT NULL, " +
      "created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (tenant_id) REFERENCES tenants(id))",
    // Loyalty program config per tenant (points per dollar). GreenExpress stores points but is NOT the seller,
    // payment intermediary, or distributor — the retailer issues/fulfills rewards.
    "CREATE TABLE IF NOT EXISTS loyalty_programs (" +
      "id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL UNIQUE, name TEXT DEFAULT 'Rewards', points_per_dollar REAL DEFAULT 1, " +
      "is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (tenant_id) REFERENCES tenants(id))",
    // Loyalty member points ledger per tenant (retailer-facing).
    "CREATE TABLE IF NOT EXISTS loyalty_members (" +
      "id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, customer_email TEXT NOT NULL, points INTEGER DEFAULT 0, " +
      "updated_at TEXT DEFAULT (datetime('now')), UNIQUE(tenant_id, customer_email), " +
      "FOREIGN KEY (tenant_id) REFERENCES tenants(id))",
    // ── Merchant intake (call-free outreach) ────────────────────────────────
    // Dispensary applications expressing interest in GreenExpress. The applicant
    // must explicitly opt in to be contacted by email. Status is managed by the
    // GreenExpress team (new → reviewed → onboarded / not-interested).
    "CREATE TABLE IF NOT EXISTS merchant_applications (" +
      "id TEXT PRIMARY KEY, dispensary_name TEXT NOT NULL, city TEXT DEFAULT '', state TEXT DEFAULT '', " +
      "website TEXT DEFAULT '', contact_name TEXT DEFAULT '', contact_email TEXT NOT NULL, " +
      "message TEXT DEFAULT '', opted_in INTEGER DEFAULT 0, status TEXT DEFAULT 'new', " +
      "created_at TEXT DEFAULT (datetime('now')), reviewed_at TEXT, reviewed_by TEXT DEFAULT '')",
    // Email outbox: auto-response confirmation emails queued when an application
    // is received. GreenExpress sends via the monitored business inbox (no SMTP/
    // API key is available in this environment), so rows start 'pending' and the
    // team marks them 'sent' after delivering via the monitored inbox.
    "CREATE TABLE IF NOT EXISTS outbound_emails (" +
      "id TEXT PRIMARY KEY, application_id TEXT NOT NULL, to_email TEXT NOT NULL, " +
      "subject TEXT NOT NULL, body TEXT NOT NULL, purpose TEXT DEFAULT 'applicant_confirmation', " +
      "status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')), sent_at TEXT, " +
      "FOREIGN KEY (application_id) REFERENCES merchant_applications(id))",
  ]) {
    try { db.run(statement); } catch { /* column already exists */ }
  }
}