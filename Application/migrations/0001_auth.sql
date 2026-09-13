CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  google_sub TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  google_sub TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id),
  action TEXT NOT NULL,
  target_id TEXT,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  lesson_name TEXT NOT NULL,
  subject TEXT NOT NULL CHECK(subject IN ('Biology', 'Physics', 'Chemistry')),
  topics TEXT NOT NULL,
  actual_price INTEGER NOT NULL CHECK(actual_price > 0),
  discounted_price INTEGER NOT NULL CHECK(discounted_price > 0 AND discounted_price <= actual_price),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'live', 'archived')),
  created_by TEXT NOT NULL REFERENCES admins(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
