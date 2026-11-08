import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/billing.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS centres (
    short_code TEXT PRIMARY KEY,
    centre_code TEXT,
    centre_name TEXT,
    principal TEXT,
    phone1 TEXT,
    phone2 TEXT,
    address TEXT,
    email TEXT,
    whatsapp TEXT,
    full_address TEXT,
    created_by TEXT,
    checked_by TEXT,
    sheet_type TEXT DEFAULT 'CENTRE & R CENTRE'
  );

  CREATE INDEX IF NOT EXISTS idx_centres_name ON centres(centre_name);
  CREATE INDEX IF NOT EXISTS idx_centres_code ON centres(centre_code);

  CREATE TABLE IF NOT EXISTS rate_charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone TEXT NOT NULL,
    category TEXT NOT NULL, -- 'indian' | 'western' | 'yoga'
    level_name TEXT NOT NULL,
    level_order INTEGER NOT NULL,
    exam_fee REAL NOT NULL DEFAULT 0,
    convocation_fee REAL NOT NULL DEFAULT 0
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_rates_unique ON rate_charts(zone, category, level_name);

  CREATE TABLE IF NOT EXISTS discount_slabs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    min_count INTEGER NOT NULL,
    max_count INTEGER,
    discount_percent REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT UNIQUE,
    bill_date TEXT,
    session TEXT,
    centre_short_code TEXT,
    centre_name TEXT,
    principal TEXT,
    address TEXT,
    phone TEXT,
    zone TEXT,
    category TEXT,
    total_old INTEGER DEFAULT 0,
    total_new INTEGER DEFAULT 0,
    total_examinees INTEGER DEFAULT 0,
    gross_fees REAL DEFAULT 0,
    slab_discount_percent REAL DEFAULT 0,
    seasonal_discount_percent REAL DEFAULT 0,
    total_discount_percent REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    fees_after_discount REAL DEFAULT 0,
    registration_fees REAL DEFAULT 0,
    convocation_fees REAL DEFAULT 0,
    examiner_fee_note TEXT,
    examiner_fee_amount REAL DEFAULT 0,
    total_payable REAL DEFAULT 0,
    is_joint INTEGER DEFAULT 0,
    joint_id TEXT,
    extra_less_percent REAL DEFAULT 0,
    joint_data TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    level_name TEXT NOT NULL,
    level_order INTEGER NOT NULL,
    exam_fee REAL NOT NULL DEFAULT 0,
    old_count INTEGER DEFAULT 0,
    new_count INTEGER DEFAULT 0,
    line_total REAL DEFAULT 0,
    convocation_fee REAL DEFAULT 0,
    convocation_total REAL DEFAULT 0,
    FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    display_name TEXT NOT NULL
  );
`);

// Seed default users if not already present
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, role, display_name)
  VALUES (?, ?, ?, ?)
`);
insertUser.run('admin', 'admin147', 'admin', 'Office Admin');
insertUser.run('helpline', 'help123', 'helpline', 'Kendra Helpline');

export default db;

