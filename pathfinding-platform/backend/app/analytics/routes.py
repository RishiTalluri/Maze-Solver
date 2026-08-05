from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import AlgorithmRun, Maze, Experiment, User
from app.extensions import db
from sqlalchemy import func

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    """Personal dashboard summary stats."""
    user_id = get_jwt_identity()

    total_mazes = Maze.query.filter_by(user_id=user_id).count()
    total_experiments = Experiment.query.filter_by(user_id=user_id).count()
    total_runs = AlgorithmRun.query.filter_by(user_id=user_id).count()

    # Successful runs
    successful_runs = AlgorithmRun.query.filter_by(user_id=user_id, success=True).count()
    success_rate = round((successful_runs / total_runs * 100), 1) if total_runs > 0 else 0

    # Average stats across all runs
    avg_stats = db.session.query(
        func.avg(AlgorithmRun.execution_time).label("avg_time"),
        func.avg(AlgorithmRun.nodes_explored).label("avg_nodes"),
        func.avg(AlgorithmRun.path_length).label("avg_path"),
    ).filter_by(user_id=user_id, success=True).first()

    # Most used algorithm
    algo_counts = db.session.query(
        AlgorithmRun.algorithm,
        func.count(AlgorithmRun.id).label("count")
    ).filter_by(user_id=user_id).group_by(AlgorithmRun.algorithm)\
     .order_by(func.count(AlgorithmRun.id).desc()).all()

    # Recent runs
    recent_runs = AlgorithmRun.query.filter_by(user_id=user_id)\
        .order_by(AlgorithmRun.ran_at.desc()).limit(10).all()

    return jsonify({
        "summary": {
            "total_mazes": total_mazes,
            "total_experiments": total_experiments,
            "total_runs": total_runs,
            "success_rate": success_rate,
        },
        "averages": {
            "execution_time": round(avg_stats.avg_time or 0, 2),
            "nodes_explored": round(avg_stats.avg_nodes or 0, 1),
            "path_length": round(avg_stats.avg_path or 0, 1),
        },
        "algorithm_usage": [
            {"algorithm": a, "count": c} for a, c in algo_counts
        ],
        "recent_runs": [r.to_dict(include_viz=False) for r in recent_runs],
    })


@analytics_bp.route("/algorithms", methods=["GET"])
@jwt_required()
def algorithm_performance():
    """Per-algorithm performance stats for charts."""
    user_id = get_jwt_identity()

    stats = db.session.query(
        AlgorithmRun.algorithm,
        func.count(AlgorithmRun.id).label("total_runs"),
        func.avg(AlgorithmRun.execution_time).label("avg_time"),
        func.avg(AlgorithmRun.nodes_explored).label("avg_nodes"),
        func.avg(AlgorithmRun.path_length).label("avg_path"),
        func.sum(db.case((AlgorithmRun.success == True, 1), else_=0)).label("successes"),
    ).filter_by(user_id=user_id)\
     .group_by(AlgorithmRun.algorithm).all()

    return jsonify({
        "data": [
            {
                "algorithm": s.algorithm,
                "total_runs": s.total_runs,
                "avg_execution_time": round(s.avg_time or 0, 2),
                "avg_nodes_explored": round(s.avg_nodes or 0, 1),
                "avg_path_length": round(s.avg_path or 0, 1),
                "success_rate": round((s.successes / s.total_runs * 100), 1) if s.total_runs else 0,
            }
            for s in stats
        ]
    })


@analytics_bp.route("/mazes", methods=["GET"])
@jwt_required()
def maze_stats():
    """Maze-level statistics."""
    user_id = get_jwt_identity()

    difficulty_dist = db.session.query(
        Maze.difficulty,
        func.count(Maze.id).label("count")
    ).filter_by(user_id=user_id).group_by(Maze.difficulty).all()

    size_stats = db.session.query(
        func.avg(Maze.rows * Maze.cols).label("avg_cells"),
        func.max(Maze.rows * Maze.cols).label("max_cells"),
        func.min(Maze.rows * Maze.cols).label("min_cells"),
    ).filter_by(user_id=user_id).first()

    return jsonify({
        "difficulty_distribution": [
            {"difficulty": d or "unset", "count": c}
            for d, c in difficulty_dist
        ],
        "size_stats": {
            "avg_cells": round(size_stats.avg_cells or 0, 0),
            "max_cells": size_stats.max_cells or 0,
            "min_cells": size_stats.min_cells or 0,
        }
    })


@analytics_bp.route("/global", methods=["GET"])
def global_stats():
    """
    Platform-wide stats: per-algorithm performance aggregated across every
    user (not just the caller), plus how many distinct users have contributed
    runs. Intentionally NOT behind @jwt_required() — it's a public "how is
    everyone using this" view, not personal data (no usernames/emails in the
    response).
    """
    total_users = User.query.count()
    total_runs = AlgorithmRun.query.count()
    contributing_users = db.session.query(
        func.count(func.distinct(AlgorithmRun.user_id))
    ).filter(AlgorithmRun.user_id.isnot(None)).scalar() or 0

    stats = db.session.query(
        AlgorithmRun.algorithm,
        func.count(AlgorithmRun.id).label("total_runs"),
        func.count(func.distinct(AlgorithmRun.user_id)).label("distinct_users"),
        func.avg(AlgorithmRun.execution_time).label("avg_time"),
        func.avg(AlgorithmRun.nodes_explored).label("avg_nodes"),
        func.avg(AlgorithmRun.path_length).label("avg_path"),
        func.sum(db.case((AlgorithmRun.success == True, 1), else_=0)).label("successes"),
    ).group_by(AlgorithmRun.algorithm).order_by(func.count(AlgorithmRun.id).desc()).all()

    return jsonify({
        "total_users": total_users,
        "contributing_users": contributing_users,
        "total_runs": total_runs,
        "algorithms": [
            {
                "algorithm": s.algorithm,
                "total_runs": s.total_runs,
                "distinct_users": s.distinct_users,
                "avg_execution_time": round(s.avg_time or 0, 2),
                "avg_nodes_explored": round(s.avg_nodes or 0, 1),
                "avg_path_length": round(s.avg_path or 0, 1),
                "success_rate": round((s.successes / s.total_runs * 100), 1) if s.total_runs else 0,
            }
            for s in stats
        ],
    })
