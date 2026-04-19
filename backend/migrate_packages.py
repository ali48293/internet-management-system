import sqlite3
import os

db_path = 'loopers.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.execute("PRAGMA table_info(purchases)")
columns = [row[1] for row in cursor.fetchall()]

if 'package_name' not in columns:
    print("Adding package_name column to purchases...")
    conn.execute("ALTER TABLE purchases ADD COLUMN package_name TEXT")
    conn.commit()

# Populate package_name from packages table join
print("Migrating package names...")
cursor = conn.execute("""
    SELECT p.id, pkg.name 
    FROM purchases p 
    JOIN packages pkg ON p.package_id = pkg.id
    WHERE p.package_name IS NULL
""")
rows = cursor.fetchall()
print(f"Found {len(rows)} records to migrate.")

for row in rows:
    conn.execute("UPDATE purchases SET package_name = ? WHERE id = ?", (row[1], row[0]))

conn.commit()
print("Migration completed.")
conn.close()
