# backend/app.py
import json
import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import FRONTEND_ORIGINS, DATABASE_URL
from models import db

# Global buildings cache — loaded once at startup
BUILDINGS_DATA = {"buildings": [], "metadata": {}}


def load_buildings():
    global BUILDINGS_DATA
    data_path = os.path.join(os.path.dirname(__file__), "data", "buildings.json")
    if os.path.exists(data_path):
        with open(data_path) as f:
            BUILDINGS_DATA = json.load(f)
        print(f"Loaded {BUILDINGS_DATA['metadata']['count']} buildings")
    else:
        print("WARNING: data/buildings.json not found. Run scripts/fetch_data.py first.")


def _resolve_db_url():
    # On Render, use a persistent-disk path so the SQLite file survives restarts.
    # The disk should be mounted at /var/data in the Render service settings.
    if os.getenv("RENDER"):
        return "sqlite:////var/data/projects.db"
    return DATABASE_URL


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = _resolve_db_url()
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(app, origins=FRONTEND_ORIGINS)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    from routes.buildings import buildings_bp
    from routes.query import query_bp
    from routes.projects import projects_bp

    app.register_blueprint(buildings_bp)
    app.register_blueprint(query_bp)
    app.register_blueprint(projects_bp)

    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "buildings_loaded": len(BUILDINGS_DATA["buildings"]),
        })

    load_buildings()
    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)
