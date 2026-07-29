from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.mazes.service import MazeService
from app.mazes.repository import MazeRepository

mazes_bp = Blueprint("mazes", __name__)


def paginated_response(pagination, items):
    return jsonify({
        "items": items,
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": pagination.per_page,
    })


# ── Public maze browser ──────────────────────────────────────────────────────

@mazes_bp.route("", methods=["GET"])
def list_public_mazes():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("q", "")
    difficulty = request.args.get("difficulty", "")
    pagination = MazeRepository.get_public_mazes(
        page=page, per_page=per_page,
        search=search or None,
        difficulty=difficulty or None,
    )
    return paginated_response(pagination, [m.to_dict(include_grid=False) for m in pagination.items])


# ── My mazes ─────────────────────────────────────────────────────────────────

@mazes_bp.route("/mine", methods=["GET"])
@jwt_required()
def my_mazes():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    pagination = MazeRepository.get_user_mazes(user_id, page=page)
    return paginated_response(pagination, [m.to_dict(include_grid=False) for m in pagination.items])


@mazes_bp.route("", methods=["POST"])
@jwt_required()
def create_maze():
    user_id = get_jwt_identity()
    data = request.get_json()
    try:
        maze = MazeService.create_maze(user_id, data)
        return jsonify(maze.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@mazes_bp.route("/<maze_id>", methods=["GET"])
def get_maze(maze_id):
    # Optional auth — logged-in users can see their private mazes
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
    except Exception:
        pass

    try:
        maze = MazeService.get_maze(maze_id, user_id=user_id, increment_views=True)
        return jsonify(maze.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@mazes_bp.route("/<maze_id>", methods=["PUT"])
@jwt_required()
def update_maze(maze_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    try:
        maze = MazeService.update_maze(maze_id, user_id, data)
        return jsonify(maze.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@mazes_bp.route("/<maze_id>", methods=["DELETE"])
@jwt_required()
def delete_maze(maze_id):
    user_id = get_jwt_identity()
    try:
        MazeService.delete_maze(maze_id, user_id)
        return jsonify({"message": "Maze deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403


@mazes_bp.route("/<maze_id>/duplicate", methods=["POST"])
@jwt_required()
def duplicate_maze(maze_id):
    user_id = get_jwt_identity()
    try:
        maze = MazeService.duplicate_maze(maze_id, user_id)
        return jsonify(maze.to_dict()), 201
    except (ValueError, PermissionError) as e:
        return jsonify({"error": str(e)}), 400


# ── Sharing ──────────────────────────────────────────────────────────────────

@mazes_bp.route("/<maze_id>/share", methods=["POST"])
@jwt_required()
def share_maze(maze_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    try:
        link = MazeService.generate_share_link(maze_id, user_id, data.get("expires_in_days"))
        return jsonify(link.to_dict()), 201
    except (ValueError, PermissionError) as e:
        return jsonify({"error": str(e)}), 400


@mazes_bp.route("/shared/<token>", methods=["GET"])
def get_shared_maze(token):
    try:
        maze = MazeService.get_maze_by_token(token)
        return jsonify(maze.to_dict())
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


# ── Favorites ────────────────────────────────────────────────────────────────

@mazes_bp.route("/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    pagination = MazeRepository.get_user_favorites(user_id, page=page)
    return paginated_response(pagination, [m.to_dict(include_grid=False) for m in pagination.items])


@mazes_bp.route("/<maze_id>/favorite", methods=["POST"])
@jwt_required()
def add_favorite(maze_id):
    user_id = get_jwt_identity()
    MazeRepository.add_favorite(user_id, maze_id)
    return jsonify({"message": "Added to favorites"}), 200


@mazes_bp.route("/<maze_id>/favorite", methods=["DELETE"])
@jwt_required()
def remove_favorite(maze_id):
    user_id = get_jwt_identity()
    MazeRepository.remove_favorite(user_id, maze_id)
    return jsonify({"message": "Removed from favorites"}), 200
