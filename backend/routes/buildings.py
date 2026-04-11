# backend/routes/buildings.py
from flask import Blueprint, jsonify

buildings_bp = Blueprint("buildings", __name__)


@buildings_bp.route("/api/buildings")
def get_buildings():
    from app import BUILDINGS_DATA
    return jsonify(BUILDINGS_DATA)
