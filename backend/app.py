# backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from config import FRONTEND_URL

app = Flask(__name__)
CORS(app, origins=[FRONTEND_URL])

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
