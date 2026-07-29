from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Experiment, AlgorithmRun, Maze
from app.algorithms.runner import run_all, ALGORITHMS
from app.extensions import db
from datetime import datetime, timezone
import json
import csv
import io

experiments_bp = Blueprint("experiments", __name__)


@experiments_bp.route("", methods=["GET"])
@jwt_required()
def list_experiments():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    pagination = Experiment.query.filter_by(user_id=user_id)\
        .order_by(Experiment.created_at.desc())\
        .paginate(page=page, per_page=20, error_out=False)

    return jsonify({
        "items": [e.to_dict() for e in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    })


@experiments_bp.route("", methods=["POST"])
@jwt_required()
def create_experiment():
    """Create an experiment — runs all selected algorithms against the maze and stores results."""
    user_id = get_jwt_identity()
    data = request.get_json()

    maze_id = data.get("maze_id")
    algorithms = data.get("algorithms", [])
    name = data.get("name", "Untitled Experiment")

    if not maze_id or not algorithms:
        return jsonify({"error": "maze_id and algorithms are required"}), 400

    unknown = [a for a in algorithms if a not in ALGORITHMS]
    if unknown:
        return jsonify({"error": f"Unknown algorithms: {unknown}"}), 400

    maze = Maze.query.get(maze_id)
    if not maze:
        return jsonify({"error": "Maze not found"}), 404
    if not maze.is_public and maze.user_id != user_id:
        return jsonify({"error": "Access denied"}), 403

    # Parse maze data
    grid = json.loads(maze.grid_data)
    terrain_data = json.loads(maze.terrain_data) if maze.terrain_data else None

    # Find start and end nodes from grid
    start = None
    goals = []
    for r, row in enumerate(grid):
        for c, cell in enumerate(row):
            if cell == 2:
                start = [r, c]
            elif cell == 3:
                goals.append([r, c])

    if not start or not goals:
        return jsonify({"error": "Maze must have a start node and at least one goal node"}), 400

    # Create experiment record
    experiment = Experiment(
        user_id=user_id,
        maze_id=maze_id,
        name=name,
        algorithms=json.dumps(algorithms),
        status="running",
    )
    db.session.add(experiment)
    db.session.flush()  # get the ID before commit

    # Run algorithms
    results = run_all(algorithms, grid, start, goals, terrain_data)

    # Save each run
    runs = []
    for algo, result in results.items():
        if "error" not in result:
            run = AlgorithmRun(
                maze_id=maze_id,
                user_id=user_id,
                experiment_id=experiment.id,
                algorithm=algo,
                path_length=result.get("path_length"),
                nodes_explored=result.get("nodes_explored"),
                execution_time=result.get("execution_time"),
                total_cost=result.get("total_cost"),
                path_data=json.dumps(result.get("path", [])),
                visited_data=json.dumps(result.get("visited", [])),
                success=result.get("success", False),
            )
            db.session.add(run)
            runs.append(run)

    experiment.status = "completed"
    experiment.completed_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "experiment": experiment.to_dict(),
        "runs": [r.to_dict() for r in runs],
        "raw_results": results,  # includes visualization data
    }), 201


@experiments_bp.route("/<exp_id>", methods=["GET"])
@jwt_required()
def get_experiment(exp_id):
    user_id = get_jwt_identity()
    exp = Experiment.query.get(exp_id)
    if not exp:
        return jsonify({"error": "Experiment not found"}), 404
    if exp.user_id != user_id:
        return jsonify({"error": "Access denied"}), 403

    return jsonify(exp.to_dict(include_runs=True))


@experiments_bp.route("/<exp_id>", methods=["DELETE"])
@jwt_required()
def delete_experiment(exp_id):
    user_id = get_jwt_identity()
    exp = Experiment.query.get(exp_id)
    if not exp:
        return jsonify({"error": "Experiment not found"}), 404
    if exp.user_id != user_id:
        return jsonify({"error": "Access denied"}), 403
    db.session.delete(exp)
    db.session.commit()
    return jsonify({"message": "Experiment deleted"})


@experiments_bp.route("/<exp_id>/export", methods=["GET"])
@jwt_required()
def export_experiment(exp_id):
    """Export experiment results as CSV."""
    user_id = get_jwt_identity()
    exp = Experiment.query.get(exp_id)
    if not exp or exp.user_id != user_id:
        return jsonify({"error": "Not found"}), 404

    runs = AlgorithmRun.query.filter_by(experiment_id=exp_id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Algorithm", "Success", "Path Length", "Nodes Explored",
                     "Execution Time (ms)", "Total Cost"])
    for run in runs:
        writer.writerow([
            run.algorithm,
            run.success,
            run.path_length,
            run.nodes_explored,
            run.execution_time,
            run.total_cost,
        ])

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = f"attachment; filename=experiment_{exp_id}.csv"
    response.headers["Content-Type"] = "text/csv"
    return response
