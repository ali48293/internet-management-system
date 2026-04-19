import sqlite3
import os

db_path = 'loopers.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.execute("PRAGMA table_info(loopers)")
columns = [row[1] for row in cursor.fetchall()]
print(f"Existing columns: {columns}")

if 'is_deleted' not in columns:
    print("Adding is_deleted column...")
    conn.execute("ALTER TABLE loopers ADD COLUMN is_deleted BOOLEAN DEFAULT 0")
    conn.commit()
    print("Updated database successfully.")
else:
    print("is_deleted column already exists.")

conn.close()
