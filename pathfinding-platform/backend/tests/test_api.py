"""
Run with: python -m pytest tests/ -v
"""
import pytest
import json
import os
os.environ["FLASK_ENV"] = "testing"

from app import create_app
from app.extensions import db as _db


@pytest.fixture
def app():
    app = create_app()
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Register + login, return JWT headers."""
    client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
    })
    res = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    token = res.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ─── AUTH TESTS ───────────────────────────────────────────────────────────────

class TestAuth:

    def test_register_success(self, client):
        res = client.post("/api/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "password123",
        })
        assert res.status_code == 201
        data = res.get_json()
        assert data["user"]["username"] == "newuser"
        assert "password_hash" not in data["user"]

    def test_register_duplicate_email(self, client):
        payload = {"username": "user_one", "email": "dup@test.com", "password": "pass123"}
        client.post("/api/auth/register", json=payload)
        res = client.post("/api/auth/register", json={
            "username": "user_two", "email": "dup@test.com", "password": "pass123"
        })
        assert res.status_code == 400
        assert "Email" in res.get_json()["error"]

    def test_register_short_password(self, client):
        res = client.post("/api/auth/register", json={
            "username": "u1", "email": "x@y.com", "password": "123"
        })
        assert res.status_code == 400

    def test_login_success(self, client):
        client.post("/api/auth/register", json={
            "username": "loginuser", "email": "login@test.com", "password": "pass123"
        })
        res = client.post("/api/auth/login", json={
            "email": "login@test.com", "password": "pass123"
        })
        assert res.status_code == 200
        data = res.get_json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={
            "username": "u1", "email": "u@test.com", "password": "correct"
        })
        res = client.post("/api/auth/login", json={
            "email": "u@test.com", "password": "wrong"
        })
        assert res.status_code == 401

    def test_get_me_requires_auth(self, client):
        res = client.get("/api/auth/me")
        assert res.status_code == 401

    def test_get_me_with_token(self, client, auth_headers):
        res = client.get("/api/auth/me", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["user"]["email"] == "test@example.com"


# ─── MAZE TESTS ───────────────────────────────────────────────────────────────

SAMPLE_GRID = [[0, 0, 0], [0, 1, 0], [0, 0, 0]]


class TestMazes:

    def test_create_maze(self, client, auth_headers):
        res = client.post("/api/mazes", json={
            "name": "Test Maze",
            "rows": 3, "cols": 3,
            "grid_data": SAMPLE_GRID,
        }, headers=auth_headers)
        assert res.status_code == 201
        data = res.get_json()
        assert data["name"] == "Test Maze"
        assert "id" in data

    def test_create_maze_requires_auth(self, client):
        res = client.post("/api/mazes", json={
            "name": "Test", "rows": 3, "cols": 3, "grid_data": SAMPLE_GRID
        })
        assert res.status_code == 401

    def test_get_my_mazes(self, client, auth_headers):
        client.post("/api/mazes", json={
            "name": "Maze 1", "rows": 3, "cols": 3, "grid_data": SAMPLE_GRID
        }, headers=auth_headers)
        res = client.get("/api/mazes/mine", headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["total"] == 1

    def test_update_maze(self, client, auth_headers):
        create_res = client.post("/api/mazes", json={
            "name": "Old Name", "rows": 3, "cols": 3, "grid_data": SAMPLE_GRID
        }, headers=auth_headers)
        maze_id = create_res.get_json()["id"]

        res = client.put(f"/api/mazes/{maze_id}", json={"name": "New Name"},
                         headers=auth_headers)
        assert res.status_code == 200
        assert res.get_json()["name"] == "New Name"

    def test_delete_maze(self, client, auth_headers):
        create_res = client.post("/api/mazes", json={
            "name": "Delete Me", "rows": 3, "cols": 3, "grid_data": SAMPLE_GRID
        }, headers=auth_headers)
        maze_id = create_res.get_json()["id"]

        res = client.delete(f"/api/mazes/{maze_id}", headers=auth_headers)
        assert res.status_code == 200

        # Should be gone
        get_res = client.get(f"/api/mazes/{maze_id}", headers=auth_headers)
        assert get_res.status_code in [403, 404]

    def test_duplicate_maze(self, client, auth_headers):
        create_res = client.post("/api/mazes", json={
            "name": "Original", "rows": 3, "cols": 3, "grid_data": SAMPLE_GRID
        }, headers=auth_headers)
        maze_id = create_res.get_json()["id"]

        res = client.post(f"/api/mazes/{maze_id}/duplicate", headers=auth_headers)
        assert res.status_code == 201
        assert "copy" in res.get_json()["name"]


# ─── ALGORITHM TESTS ──────────────────────────────────────────────────────────

GRID_WITH_PATH = [
    [2, 0, 0],
    [1, 1, 0],
    [0, 0, 3],
]


class TestAlgorithms:

    def test_solve_bfs(self, client):
        res = client.post("/api/solve", json={
            "grid": GRID_WITH_PATH,
            "start": [0, 0],
            "goals": [[2, 2]],
            "algorithms": ["bfs"],
        })
        assert res.status_code == 200
        data = res.get_json()
        assert data["bfs"]["success"] is True
        assert data["bfs"]["path_length"] > 0

    def test_solve_all_algorithms(self, client):
        res = client.post("/api/solve", json={
            "grid": GRID_WITH_PATH,
            "start": [0, 0],
            "goals": [[2, 2]],
            "algorithms": ["bfs", "dfs", "astar", "dijkstra", "gbfs"],
        })
        assert res.status_code == 200
        data = res.get_json()
        for algo in ["bfs", "dfs", "astar", "dijkstra", "gbfs"]:
            assert algo in data
            assert data[algo]["success"] is True

    def test_no_path_returns_failure(self, client):
        blocked_grid = [
            [2, 1, 3],
            [1, 1, 1],
            [0, 0, 0],
        ]
        res = client.post("/api/solve", json={
            "grid": blocked_grid,
            "start": [0, 0],
            "goals": [[0, 2]],
            "algorithms": ["bfs"],
        })
        assert res.status_code == 200
        assert res.get_json()["bfs"]["success"] is False

    def test_bfs_finds_shortest_path(self, client):
        """BFS should always find the shortest path."""
        res = client.post("/api/solve", json={
            "grid": GRID_WITH_PATH,
            "start": [0, 0],
            "goals": [[2, 2]],
            "algorithms": ["bfs", "astar"],
        })
        data = res.get_json()
        # Both BFS and A* are optimal — should have equal path lengths
        assert data["bfs"]["path_length"] == data["astar"]["path_length"]

    def test_unknown_algorithm_rejected(self, client):
        res = client.post("/api/solve", json={
            "grid": GRID_WITH_PATH,
            "start": [0, 0],
            "goals": [[2, 2]],
            "algorithms": ["fake_algo"],
        })
        assert res.status_code == 400

    def test_missing_start_rejected(self, client):
        res = client.post("/api/solve", json={
            "grid": GRID_WITH_PATH,
            "goals": [[2, 2]],
            "algorithms": ["bfs"],
        })
        assert res.status_code == 400

    def test_list_algorithms(self, client):
        res = client.get("/api/algorithms")
        assert res.status_code == 200
        algos = res.get_json()["algorithms"]
        keys = [a["key"] for a in algos]
        assert "bfs" in keys
        assert "dijkstra" in keys
