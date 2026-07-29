from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
from app.extensions import db
from app.models import User
from datetime import datetime, timezone


class AuthService:

    @staticmethod
    def register(username: str, email: str, password: str) -> dict:
        # Check duplicates
        if User.query.filter_by(email=email).first():
            raise ValueError("Email already registered")
        if User.query.filter_by(username=username).first():
            raise ValueError("Username already taken")

        user = User(
            username=username.strip(),
            email=email.lower().strip(),
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def login(email: str, password: str) -> dict:
        user = User.query.filter_by(email=email.lower().strip()).first()

        if not user or not check_password_hash(user.password_hash, password):
            raise ValueError("Invalid email or password")

        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict(),
        }

    @staticmethod
    def get_user_by_id(user_id: str) -> User:
        user = User.query.get(user_id)
        if not user:
            raise ValueError("User not found")
        return user

    @staticmethod
    def update_password(user_id: str, old_password: str, new_password: str):
        user = User.query.get(user_id)
        if not check_password_hash(user.password_hash, old_password):
            raise ValueError("Current password is incorrect")
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
