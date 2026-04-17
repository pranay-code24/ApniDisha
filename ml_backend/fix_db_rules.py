import psycopg2

DB_URL = "postgresql://neondb_owner:npg_lYTXmz0yh1Pc@ep-billowing-firefly-ai3mpvy5-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

try:
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;")
    conn.commit()
    
    print("Clean Fix: Strict rule of 'password_hash' has been successfully removed!")
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)