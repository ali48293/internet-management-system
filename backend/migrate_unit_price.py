import sqlite3
import os

db_path = '/home/dev/Desktop/internet/backend/loopers.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE purchases ADD COLUMN unit_price FLOAT")
        conn.commit()
        print("Successfully added unit_price column to purchases table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column unit_price already exists.")
        else:
            print(f"An error occurred: {e}")
    finally:
        conn.close()
else:
    print(f"Database not found at {db_path}")
