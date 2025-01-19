import pandas as pd
import psycopg2
from psycopg2 import sql

# Database connection parameters
DB_PARAMS = {
    'dbname': 'twitterDB',
    'user': 'postgres',
    'password': 'root',
    'host': 'localhost',  # Change to your host if not localhost
    'port': 5432          # Default PostgreSQL port
}

# Path to your CSV file
CSV_FILE_PATH = 'twitter_dataset.csv'

# PostgreSQL table name
TABLE_NAME = 'tweets'

# Read the CSV file into a pandas DataFrame
df = pd.read_csv(CSV_FILE_PATH)

# Define the table creation SQL
create_table_query = f"""
CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
    tweet_id BIGINT PRIMARY KEY,
    entity TEXT,
    sentiment TEXT,
    tweet_content TEXT
);
"""

# Connect to the PostgreSQL database
try:
    conn = psycopg2.connect(**DB_PARAMS)
    conn.autocommit = True
    cursor = conn.cursor()

    # Create the table if it doesn't exist
    cursor.execute(create_table_query)

    # Insert DataFrame records one by one
    insert_query = sql.SQL(
        f"INSERT INTO {TABLE_NAME} (tweet_id, entity, sentiment, tweet_content) VALUES (%s, %s, %s, %s) "
        "ON CONFLICT (tweet_id) DO NOTHING"  # Prevent duplicate entries
    )

    for _, row in df.iterrows():
        cursor.execute(insert_query, (row['Tweet ID'], row['Entity'], row['Sentiment'], row['Tweet Content']))

    print("Data imported successfully into the PostgreSQL database.")

except Exception as e:
    print(f"Error: {e}")

finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
