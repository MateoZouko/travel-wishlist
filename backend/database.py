import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS destinations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            country VARCHAR(100) NOT NULL,
            notes TEXT,
            status VARCHAR(20) DEFAULT 'wishlist',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            capital VARCHAR(100),
            currency VARCHAR(10),
            flag_url TEXT
        );

        CREATE OR REPLACE FUNCTION delete_destination(p_id INT) RETURNS VOID AS $$
        BEGIN
            DELETE FROM destinations WHERE id = p_id;
        END;
        $$ LANGUAGE plpgsql;
    """)
    conn.commit()
    cur.close()
    conn.close()
