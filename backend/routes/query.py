# backend/routes/query.py
import logging
from flask import Blueprint, request, jsonify
from llm import query_llm, apply_filters

logger = logging.getLogger(__name__)
query_bp = Blueprint("query", __name__)


@query_bp.route("/api/query", methods=["POST"])
def query_buildings():
    from app import BUILDINGS_DATA

    data = request.get_json()
    if not data or not data.get("query"):
        return jsonify({"error": "Missing 'query' field"}), 400

    user_query = data["query"].strip()
    if len(user_query) > 500:
        return jsonify({"error": "Query too long (max 500 chars)"}), 400

    filters, method, raw = query_llm(user_query)

    if filters is None:
        return jsonify({
            "filters": [],
            "matched_ids": [],
            "matched_count": 0,
            "method": "none",
            "raw_query": user_query,
            "error": (
                "Could not interpret your query. "
                "Try: 'show buildings over 100 feet', 'highlight commercial buildings', "
                "or 'show CC-X zoning'."
            ),
        })

    matched_ids = apply_filters(BUILDINGS_DATA["buildings"], filters)
    logger.info("Query: '%s' | method=%s | matches=%d", user_query, method, len(matched_ids))

    return jsonify({
        "filters": filters,
        "matched_ids": matched_ids,
        "matched_count": len(matched_ids),
        "method": method,
        "raw_query": user_query,
    })
