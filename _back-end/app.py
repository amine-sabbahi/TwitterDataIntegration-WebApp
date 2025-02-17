from flask import Flask, render_template, jsonify
from bson import json_util
import json
from pymongo import MongoClient
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
client = MongoClient('mongodb://localhost:27017/')
db = client.twitter_db
collection = db.twitter_collection

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data')
def get_data():
    data = list(collection.find())
    # Convert ObjectId to string
    for item in data:
        item['_id'] = str(item['_id'])
    # Serialize data to JSON
    return json.dumps(data, default=json_util.default)

@app.route('/project_architecture')
def project_architecture():
    return render_template('project_architecture.html')

if __name__ == '__main__':
    app.run(debug=True)
