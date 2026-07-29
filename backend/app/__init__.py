from flask import Flask
from flask_cors import CORS
from app.config import get_config
from app.extensions import db, jwt, migrate


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())

    # Extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Import models so Flask-Migrate can detect them
    from app.models import User, Maze, AlgorithmRun, Experiment, SharedLink, Favorite

    # Register blueprints
    from app.auth.routes import auth_bp
    from app.mazes.routes import mazes_bp
    from app.algorithms.routes import algorithms_bp
    from app.experiments.routes import experiments_bp
    from app.analytics.routes import analytics_bp
    from app.admin.routes import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(mazes_bp, url_prefix="/api/mazes")
    app.register_blueprint(algorithms_bp, url_prefix="/api")
    app.register_blueprint(experiments_bp, url_prefix="/api/experiments")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return {"error": "Token has expired", "code": "TOKEN_EXPIRED"}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {"error": "Invalid token", "code": "INVALID_TOKEN"}, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {"error": "Authorization token is required", "code": "MISSING_TOKEN"}, 401

    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "Pathfinding Platform API"}

    return app
