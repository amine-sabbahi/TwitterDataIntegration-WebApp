from kafka import KafkaConsumer
import json
import logging
from pymongo import MongoClient
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, udf
from pyspark.ml import PipelineModel
from pyspark.sql.types import ArrayType, FloatType, StringType
from pyspark.ml.linalg import DenseVector
import psycopg2
from psycopg2.extras import RealDictCursor
import os

os.environ['PYSPARK_SUBMIT_ARGS'] = '--packages org.apache.spark:spark-streaming-kafka-0-10_2.12:3.2.0,org.apache.spark:spark-sql-kafka-0-10_2.12:3.2.0 pyspark-shell'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

kafka_server = 'kafka:9092'
mongo_host = 'host.docker.internal'
postgres_params = {
    'dbname': 'twitterDB',
    'user': 'postgres',
    'password': 'root',
    'host': 'host.docker.internal',
    'port': 5432
}

# Initialize Spark session
spark = SparkSession.builder \
    .appName("KafkaStreamWithMLPredictions") \
    .getOrCreate()

# Load pre-trained Logistic Regression model
lr_model_path = "/app/data_consumer/lr_model"
lr_model = PipelineModel.load(lr_model_path)

# Connect to MongoDB
mongo_client = MongoClient(f'mongodb://{mongo_host}:27017')
db = mongo_client['twitter_db']
collection = db['twitter_collection']

# Track last processed PostgreSQL ID
last_processed_id = 0

# UDF to convert DenseVector to list and calculate max probability
def dense_vector_to_list(vector):
    probabilities = vector.toArray().tolist()
    max_probability = max(probabilities)
    return probabilities, max_probability

convert_udf = udf(dense_vector_to_list, ArrayType(FloatType()))

# Dictionary to map numeric labels to sentiment text
label_to_sentiment = {0: "Neutral", 1: "Positive", 2: "Negative", 3: "Irrelevant"}
sentiment_mapping_udf = udf(lambda x: label_to_sentiment[x], StringType())

def process_kafka_data(df):
    """Process Kafka data"""
    # Add label column for sentiment
    df = df.withColumn('label', when(col('Sentiment') == 'Positive', 1)
                               .when(col('Sentiment') == 'Negative', 2)
                               .when(col('Sentiment') == 'Neutral', 0)
                               .when(col('Sentiment') == 'Irrelevant', 3))

    # Make predictions using the model
    predictions = lr_model.transform(df)
    
    # Process predictions
    predictions = predictions.withColumn('Confidence', convert_udf(predictions['probability']))
    predictions = predictions.withColumn('Accuracy', predictions['Confidence'][1] * 100)
    predictions = predictions.withColumn('Predicted_Sentiment', sentiment_mapping_udf(predictions['prediction']))

    # Select final columns
    return predictions.select(
        col('Tweet ID').alias('Tweet_ID'),
        col('Entity'),
        col('Tweet Content').alias('Tweet_Content'),
        col('Predicted_Sentiment'),
        col('Accuracy')
    )

def process_postgres_data(df):
    """Process PostgreSQL data"""
    # First, rename the columns to match the expected format
    df = df.withColumn('Tweet content', col('tweet_content'))
    
    # Add label column for sentiment
    df = df.withColumn('label', when(col('sentiment') == 'Positive', 1)
                               .when(col('sentiment') == 'Negative', 2)
                               .when(col('sentiment') == 'Neutral', 0)
                               .when(col('sentiment') == 'Irrelevant', 3))

    # Make predictions using the model
    predictions = lr_model.transform(df)
    
    # Process predictions
    predictions = predictions.withColumn('Confidence', convert_udf(predictions['probability']))
    predictions = predictions.withColumn('Accuracy', predictions['Confidence'][1] * 100)
    predictions = predictions.withColumn('Predicted_Sentiment', sentiment_mapping_udf(predictions['prediction']))

    # Select final columns with correct names
    return predictions.select(
        col('tweet_id').alias('Tweet_ID'),
        col('entity').alias('Entity'),
        col('tweet_content').alias('Tweet_Content'),
        col('Predicted_Sentiment'),
        col('Accuracy')
    )

def fetch_postgres_data():
    """
    Fetch new rows of data from PostgreSQL and return as a list of dictionaries.
    Uses last_processed_id to keep track of processed rows.
    """
    global last_processed_id
    try:
        conn = psycopg2.connect(**postgres_params)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Fetch the next batch of unprocessed rows
        query = """
            SELECT * FROM tweets 
            WHERE tweet_id > %s 
            ORDER BY tweet_id 
            LIMIT 10;
        """
        cursor.execute(query, (last_processed_id,))
        rows = cursor.fetchall()
        
        if rows:
            # Update last_processed_id to the highest tweet_id in this batch
            last_processed_id = max(row['tweet_id'] for row in rows)
            logger.info(f"Fetched {len(rows)} rows from PostgreSQL. Last processed ID: {last_processed_id}")
        else:
            logger.info("No new data available from PostgreSQL")
        
        return rows
    except Exception as e:
        logger.error(f"Error fetching data from PostgreSQL: {e}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Define Kafka consumer
consumer = KafkaConsumer(
    'twitter_data',
    bootstrap_servers=kafka_server,
    auto_offset_reset='earliest',
    api_version=(0, 11, 5),
    enable_auto_commit=True,
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

# Process Kafka messages and PostgreSQL data alternately
for message in consumer:
    try:
        # Process Kafka message
        data = message.value
        logger.info(f"Received Kafka message: {data}")
        
        # Adjust Kafka data column names
        if 'Tweet Content' in data:
            data['Tweet content'] = data.pop('Tweet Content')

        kafka_df = spark.createDataFrame([data])
        predicted_kafka_data = process_kafka_data(kafka_df)

        # Store Kafka predictions
        kafka_predictions = [row.asDict() for row in predicted_kafka_data.collect()]
        if kafka_predictions:
            collection.insert_many(kafka_predictions)
            logger.info("Predicted Kafka data stored in MongoDB")

        # Process PostgreSQL data
        postgres_rows = fetch_postgres_data()
        if postgres_rows:
            # Process all fetched rows
            postgres_df = spark.createDataFrame(postgres_rows)
            predicted_postgres_data = process_postgres_data(postgres_df)

            # Store PostgreSQL predictions
            postgres_predictions = [row.asDict() for row in predicted_postgres_data.collect()]
            if postgres_predictions:
                collection.insert_many(postgres_predictions)
                logger.info(f"Predicted {len(postgres_predictions)} PostgreSQL rows stored in MongoDB")

    except Exception as e:
        logger.error(f"Error processing message: {e}")

# Cleanup
spark.stop()