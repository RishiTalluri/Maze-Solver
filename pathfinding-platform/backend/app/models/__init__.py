from app.extensions import db
from datetime import datetime, timezone
import uuid
import json


def generate_uuid():
    return str(uuid.uuid4())


def now():
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), default="user")  # 'user' or 'admin'
    avatar_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=now)
    last_login = db.Column(db.DateTime, nullable=True)

    # Relationships
    mazes = db.relationship("Maze", backref="owner", lazy="dynamic", cascade="all, delete-orphan")
    runs = db.relationship("AlgorithmRun", backref="user", lazy="dynamic")
    experiments = db.relationship("Experiment", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    favorites = db.relationship("Favorite", backref="user", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "avatar_url": self.avatar_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

    def to_public_dict(self):
        """Safe version — no email for public endpoints."""
        return {
            "id": self.id,
            "username": self.username,
            "avatar_url": self.avatar_url,
        }


# ─────────────────────────────────────────────
# MAZES
# ─────────────────────────────────────────────
class Maze(db.Model):
    __tablename__ = "mazes"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    rows = db.Column(db.Integer, nullable=False)
    cols = db.Column(db.Integer, nullable=False)
    grid_data = db.Column(db.Text, nullable=False)       # JSON string (SQLite has no JSONB)
    terrain_data = db.Column(db.Text, nullable=True)     # JSON string
    is_public = db.Column(db.Boolean, default=False)
    difficulty = db.Column(db.String(10), nullable=True)  # easy/medium/hard/expert
    tags = db.Column(db.Text, nullable=True)              # JSON array string
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=now)
    updated_at = db.Column(db.DateTime, default=now, onupdate=now)

    # Relationships
    runs = db.relationship("AlgorithmRun", backref="maze", lazy="dynamic", cascade="all, delete-orphan")
    experiments = db.relationship("Experiment", backref="maze", lazy="dynamic", cascade="all, delete-orphan")
    shared_links = db.relationship("SharedLink", backref="maze", lazy="dynamic", cascade="all, delete-orphan")
    favorites = db.relationship("Favorite", backref="maze", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_grid=True):
        d = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "rows": self.rows,
            "cols": self.cols,
            "is_public": self.is_public,
            "difficulty": self.difficulty,
            "tags": json.loads(self.tags) if self.tags else [],
            "view_count": self.view_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "owner": self.owner.to_public_dict() if self.owner else None,
        }
        if include_grid:
            d["grid_data"] = json.loads(self.grid_data)
            d["terrain_data"] = json.loads(self.terrain_data) if self.terrain_data else None
        return d


# ─────────────────────────────────────────────
# ALGORITHM RUNS
# ─────────────────────────────────────────────
class AlgorithmRun(db.Model):
    __tablename__ = "algorithm_runs"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    maze_id = db.Column(db.String(36), db.ForeignKey("mazes.id", ondelete="CASCADE"), nullable=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    experiment_id = db.Column(db.String(36), db.ForeignKey("experiments.id", ondelete="CASCADE"), nullable=True)
    algorithm = db.Column(db.String(50), nullable=False)
    path_length = db.Column(db.Integer, nullable=True)
    nodes_explored = db.Column(db.Integer, nullable=True)
    execution_time = db.Column(db.Float, nullable=True)   # milliseconds
    total_cost = db.Column(db.Float, nullable=True)
    path_data = db.Column(db.Text, nullable=True)         # JSON
    visited_data = db.Column(db.Text, nullable=True)      # JSON
    success = db.Column(db.Boolean, nullable=False, default=False)
    ran_at = db.Column(db.DateTime, default=now)

    def to_dict(self, include_viz=True):
        d = {
            "id": self.id,
            "maze_id": self.maze_id,
            "algorithm": self.algorithm,
            "path_length": self.path_length,
            "nodes_explored": self.nodes_explored,
            "execution_time": self.execution_time,
            "total_cost": self.total_cost,
            "success": self.success,
            "ran_at": self.ran_at.isoformat() if self.ran_at else None,
        }
        if include_viz:
            d["path_data"] = json.loads(self.path_data) if self.path_data else []
            d["visited_data"] = json.loads(self.visited_data) if self.visited_data else []
        return d


# ─────────────────────────────────────────────
# EXPERIMENTS
# ─────────────────────────────────────────────
class Experiment(db.Model):
    __tablename__ = "experiments"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    maze_id = db.Column(db.String(36), db.ForeignKey("mazes.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(100), nullable=True)
    algorithms = db.Column(db.Text, nullable=False)  # JSON array
    status = db.Column(db.String(20), default="completed")  # pending/running/completed/failed
    created_at = db.Column(db.DateTime, default=now)
    completed_at = db.Column(db.DateTime, nullable=True)

    runs = db.relationship("AlgorithmRun", backref="experiment", lazy="dynamic",
                           foreign_keys="AlgorithmRun.experiment_id")

    def to_dict(self, include_runs=False):
        d = {
            "id": self.id,
            "user_id": self.user_id,
            "maze_id": self.maze_id,
            "name": self.name,
            "algorithms": json.loads(self.algorithms) if self.algorithms else [],
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
        if include_runs:
            d["runs"] = [r.to_dict() for r in self.runs.all()]
        return d


# ─────────────────────────────────────────────
# SHARED LINKS
# ─────────────────────────────────────────────
class SharedLink(db.Model):
    __tablename__ = "shared_links"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    maze_id = db.Column(db.String(36), db.ForeignKey("mazes.id", ondelete="CASCADE"), nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=now)

    def to_dict(self):
        return {
            "id": self.id,
            "maze_id": self.maze_id,
            "token": self.token,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "view_count": self.view_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ─────────────────────────────────────────────
# FAVORITES (junction table)
# ─────────────────────────────────────────────
class Favorite(db.Model):
    __tablename__ = "favorites"

    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    maze_id = db.Column(db.String(36), db.ForeignKey("mazes.id", ondelete="CASCADE"), primary_key=True)
    created_at = db.Column(db.DateTime, default=now)
