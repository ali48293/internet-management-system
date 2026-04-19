import sqlite3
import os

db_path = 'loopers.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.execute("PRAGMA table_info(users)")
columns = [row[1] for row in cursor.fetchall()]
print(f"Existing columns in users: {columns}")

if 'last_active_at' not in columns:
    print("Adding last_active_at column to users...")
    conn.execute("ALTER TABLE users ADD COLUMN last_active_at DATETIME")
    conn.commit()

if 'looper_id' not in columns:
    print("Adding looper_id column to users...")
    conn.execute("ALTER TABLE users ADD COLUMN looper_id INTEGER")
    conn.commit()

print("Updated users table successfully.")
conn.close()
