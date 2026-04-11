# backend/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(100), nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    filters_json = db.Column(db.Text, nullable=False)  # JSON string
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "name": self.name,
            "filters": json.loads(self.filters_json),
            "created_at": self.created_at.isoformat() + "Z",
        }
