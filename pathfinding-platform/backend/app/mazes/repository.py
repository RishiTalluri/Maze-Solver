from app.extensions import db
from app.models import Maze, Favorite
import json


class MazeRepository:

    @staticmethod
    def create(user_id, name, rows, cols, grid_data, terrain_data=None,
               description=None, is_public=False, difficulty=None, tags=None):
        maze = Maze(
            user_id=user_id,
            name=name,
            description=description,
            rows=rows,
            cols=cols,
            grid_data=json.dumps(grid_data),
            terrain_data=json.dumps(terrain_data) if terrain_data else None,
            is_public=is_public,
            difficulty=difficulty,
            tags=json.dumps(tags or []),
        )
        db.session.add(maze)
        db.session.commit()
        return maze

    @staticmethod
    def get_by_id(maze_id):
        return Maze.query.get(maze_id)

    @staticmethod
    def get_user_mazes(user_id, page=1, per_page=20):
        return Maze.query.filter_by(user_id=user_id)\
            .order_by(Maze.updated_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def get_public_mazes(page=1, per_page=20, search=None, difficulty=None):
        query = Maze.query.filter_by(is_public=True)
        if search:
            query = query.filter(Maze.name.ilike(f"%{search}%"))
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        return query.order_by(Maze.view_count.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    @staticmethod
    def update(maze, **kwargs):
        for key, value in kwargs.items():
            if key == "grid_data":
                setattr(maze, key, json.dumps(value))
            elif key == "terrain_data":
                setattr(maze, key, json.dumps(value) if value else None)
            elif key == "tags":
                setattr(maze, key, json.dumps(value))
            elif hasattr(maze, key):
                setattr(maze, key, value)
        db.session.commit()
        return maze

    @staticmethod
    def delete(maze):
        db.session.delete(maze)
        db.session.commit()

    @staticmethod
    def increment_views(maze):
        maze.view_count += 1
        db.session.commit()

    @staticmethod
    def duplicate(maze, user_id, new_name=None):
        new_maze = Maze(
            user_id=user_id,
            name=new_name or f"{maze.name} (copy)",
            description=maze.description,
            rows=maze.rows,
            cols=maze.cols,
            grid_data=maze.grid_data,
            terrain_data=maze.terrain_data,
            is_public=False,
            difficulty=maze.difficulty,
            tags=maze.tags,
        )
        db.session.add(new_maze)
        db.session.commit()
        return new_maze

    @staticmethod
    def is_favorited(user_id, maze_id):
        return Favorite.query.filter_by(user_id=user_id, maze_id=maze_id).first() is not None

    @staticmethod
    def add_favorite(user_id, maze_id):
        if not MazeRepository.is_favorited(user_id, maze_id):
            fav = Favorite(user_id=user_id, maze_id=maze_id)
            db.session.add(fav)
            db.session.commit()

    @staticmethod
    def remove_favorite(user_id, maze_id):
        fav = Favorite.query.filter_by(user_id=user_id, maze_id=maze_id).first()
        if fav:
            db.session.delete(fav)
            db.session.commit()

    @staticmethod
    def get_user_favorites(user_id, page=1, per_page=20):
        return Maze.query.join(Favorite, Maze.id == Favorite.maze_id)\
            .filter(Favorite.user_id == user_id)\
            .order_by(Favorite.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
