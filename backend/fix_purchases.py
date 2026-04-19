import sqlite3

db_path = 'loopers.db'
conn = sqlite3.connect(db_path)

print("Migrating purchases table to remove NOT NULL on package_id...")

conn.executescript("""
PRAGMA foreign_keys = OFF;

-- Rename old table
ALTER TABLE purchases RENAME TO purchases_old;

-- Create new table with package_id nullable
CREATE TABLE purchases (
    id INTEGER PRIMARY KEY,
    looper_id INTEGER NOT NULL REFERENCES loopers(id),
    package_id INTEGER REFERENCES packages(id),
    package_name TEXT,
    snapshot_price REAL NOT NULL,
    created_at DATETIME DEFAULT (datetime('now'))
);

-- Copy data across
INSERT INTO purchases (id, looper_id, package_id, package_name, snapshot_price, created_at)
SELECT id, looper_id, package_id, package_name, snapshot_price, created_at
FROM purchases_old;

-- Drop old table
DROP TABLE purchases_old;

PRAGMA foreign_keys = ON;
""")

conn.commit()
conn.close()
print("Done! packages.package_id is now nullable.")
