from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from app.auth.service import AuthService

auth_bp = Blueprint("auth", __name__)


def bad_request(message):
    return jsonify({"error": message}), 400


def server_error(message):
    return jsonify({"error": message}), 500


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = (data or {}).get("username", "").strip()
    email = (data or {}).get("email", "").strip()
    password = (data or {}).get("password", "")

    if not username or not email or not password:
        return bad_request("username, email, and password are required")
    if len(password) < 6:
        return bad_request("Password must be at least 6 characters")
    if len(username) < 3:
        return bad_request("Username must be at least 3 characters")

    try:
        user = AuthService.register(username, email, password)
        return jsonify({"message": "Account created successfully", "user": user.to_dict()}), 201
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return server_error("Registration failed")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = (data or {}).get("email", "")
    password = (data or {}).get("password", "")

    if not email or not password:
        return bad_request("Email and password are required")

    try:
        result = AuthService.login(email, password)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401
    except Exception:
        return server_error("Login failed")


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    try:
        user = AuthService.get_user_by_id(user_id)
        return jsonify({"user": user.to_dict()}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    new_token = create_access_token(identity=user_id)
    return jsonify({"access_token": new_token}), 200


@auth_bp.route("/password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    data = request.get_json()
    old_password = (data or {}).get("old_password", "")
    new_password = (data or {}).get("new_password", "")

    if not old_password or not new_password:
        return bad_request("old_password and new_password are required")
    if len(new_password) < 6:
        return bad_request("New password must be at least 6 characters")

    try:
        AuthService.update_password(user_id, old_password, new_password)
        return jsonify({"message": "Password updated successfully"}), 200
    except ValueError as e:
        return bad_request(str(e))
