from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, Maze, AlgorithmRun, Experiment
from app.extensions import db
from sqlalchemy import func
from functools import wraps

admin_bp = Blueprint("admin", __name__)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


@admin_bp.route("/stats", methods=["GET"])
@admin_required
def system_stats():
    return jsonify({
        "users": User.query.count(),
        "mazes": Maze.query.count(),
        "public_mazes": Maze.query.filter_by(is_public=True).count(),
        "algorithm_runs": AlgorithmRun.query.count(),
        "experiments": Experiment.query.count(),
    })


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    page = request.args.get("page", 1, type=int)
    pagination = User.query.order_by(User.created_at.desc())\
        .paginate(page=page, per_page=50, error_out=False)
    return jsonify({
        "items": [u.to_dict() for u in pagination.items],
        "total": pagination.total,
    })


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})


@admin_bp.route("/mazes/<maze_id>", methods=["DELETE"])
@admin_required
def admin_delete_maze(maze_id):
    maze = Maze.query.get(maze_id)
    if not maze:
        return jsonify({"error": "Maze not found"}), 404
    db.session.delete(maze)
    db.session.commit()
    return jsonify({"message": "Maze deleted"})
