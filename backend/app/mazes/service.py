from app.mazes.repository import MazeRepository
from app.models import SharedLink
from app.extensions import db
import secrets
from datetime import datetime, timezone, timedelta


class MazeService:

    @staticmethod
    def create_maze(user_id, data):
        name = data.get("name", "").strip()
        if not name:
            raise ValueError("Maze name is required")

        grid_data = data.get("grid_data")
        if not grid_data:
            raise ValueError("Grid data is required")

        rows = data.get("rows")
        cols = data.get("cols")
        if not rows or not cols:
            raise ValueError("rows and cols are required")

        return MazeRepository.create(
            user_id=user_id,
            name=name,
            rows=rows,
            cols=cols,
            grid_data=grid_data,
            terrain_data=data.get("terrain_data"),
            description=data.get("description"),
            is_public=data.get("is_public", False),
            difficulty=data.get("difficulty"),
            tags=data.get("tags", []),
        )

    @staticmethod
    def get_maze(maze_id, user_id=None, increment_views=False):
        maze = MazeRepository.get_by_id(maze_id)
        if not maze:
            raise ValueError("Maze not found")

        # Access check — must be owner or public
        if not maze.is_public and maze.user_id != user_id:
            raise PermissionError("You don't have access to this maze")

        if increment_views and maze.user_id != user_id:
            MazeRepository.increment_views(maze)

        return maze

    @staticmethod
    def update_maze(maze_id, user_id, data):
        maze = MazeRepository.get_by_id(maze_id)
        if not maze:
            raise ValueError("Maze not found")
        if maze.user_id != user_id:
            raise PermissionError("You can only edit your own mazes")

        allowed = ["name", "description", "grid_data", "terrain_data",
                   "is_public", "difficulty", "tags", "rows", "cols"]
        updates = {k: v for k, v in data.items() if k in allowed}
        return MazeRepository.update(maze, **updates)

    @staticmethod
    def delete_maze(maze_id, user_id, is_admin=False):
        maze = MazeRepository.get_by_id(maze_id)
        if not maze:
            raise ValueError("Maze not found")
        if not is_admin and maze.user_id != user_id:
            raise PermissionError("You can only delete your own mazes")
        MazeRepository.delete(maze)

    @staticmethod
    def duplicate_maze(maze_id, user_id):
        maze = MazeRepository.get_by_id(maze_id)
        if not maze:
            raise ValueError("Maze not found")
        if not maze.is_public and maze.user_id != user_id:
            raise PermissionError("You don't have access to this maze")
        return MazeRepository.duplicate(maze, user_id)

    @staticmethod
    def generate_share_link(maze_id, user_id, expires_in_days=None):
        maze = MazeRepository.get_by_id(maze_id)
        if not maze:
            raise ValueError("Maze not found")
        if maze.user_id != user_id:
            raise PermissionError("You can only share your own mazes")

        token = secrets.token_urlsafe(32)
        expires_at = None
        if expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

        link = SharedLink(
            maze_id=maze_id,
            created_by=user_id,
            token=token,
            expires_at=expires_at,
        )
        db.session.add(link)
        db.session.commit()
        return link

    @staticmethod
    def get_maze_by_token(token):
        link = SharedLink.query.filter_by(token=token).first()
        if not link:
            raise ValueError("Share link not found or expired")

        if link.expires_at and link.expires_at < datetime.now(timezone.utc):
            raise ValueError("Share link has expired")

        link.view_count += 1
        db.session.commit()
        return link.maze
