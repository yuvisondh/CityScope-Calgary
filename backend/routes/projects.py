# backend/routes/projects.py
import json
from flask import Blueprint, request, jsonify
from models import db, Project

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("/api/projects", methods=["GET"])
def list_projects():
    username = request.args.get("username", "").strip()
    if not username:
        return jsonify({"error": "Missing 'username' parameter"}), 400

    projects = (
        Project.query.filter_by(username=username)
        .order_by(Project.created_at.desc())
        .all()
    )
    return jsonify({"projects": [p.to_dict() for p in projects]})


@projects_bp.route("/api/projects", methods=["POST"])
def create_project():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    name = (data.get("name") or "").strip()
    filters = data.get("filters")

    if not username or not name:
        return jsonify({"error": "Missing 'username' or 'name'"}), 400
    if not isinstance(filters, list):
        return jsonify({"error": "'filters' must be an array"}), 400

    project = Project(
        username=username,
        name=name,
        filters_json=json.dumps(filters),
    )
    db.session.add(project)
    db.session.commit()
    return jsonify({"id": project.id, "message": "Project saved"}), 201


@projects_bp.route("/api/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"})
