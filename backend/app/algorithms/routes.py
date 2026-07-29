from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.algorithms.runner import run_all, ALGORITHMS
from app.models import AlgorithmRun
from app.extensions import db
import json

algorithms_bp = Blueprint('algorithms', __name__)


@algorithms_bp.route('/solve', methods=['POST'])
def solve():
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        pass

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    grid = data.get('grid')
    start = data.get('start')
    goals = data.get('goals', [])
    algorithms = data.get('algorithms', [])
    terrain_data = data.get('terrain_data')
    # Custom terrain cost map from frontend {grass: 1, sand: 3, ...}
    terrain_costs = data.get('terrain_costs')
    maze_id = data.get('maze_id')

    if not grid or not start or not goals:
        return jsonify({'error': 'grid, start, and goals are required'}), 400
    if not algorithms:
        return jsonify({'error': 'At least one algorithm is required'}), 400

    unknown = [a for a in algorithms if a not in ALGORITHMS]
    if unknown:
        return jsonify({'error': f'Unknown algorithms: {unknown}'}), 400

    results = run_all(algorithms, grid, start, goals, terrain_data, terrain_costs)

    if user_id:
        for algo, result in results.items():
            if 'error' not in result:
                run = AlgorithmRun(
                    maze_id=maze_id,
                    user_id=user_id,
                    algorithm=algo,
                    path_length=result.get('path_length'),
                    nodes_explored=result.get('nodes_explored'),
                    execution_time=result.get('execution_time'),
                    total_cost=result.get('total_cost'),
                    path_data=json.dumps(result.get('path', [])),
                    visited_data=json.dumps(result.get('visited', [])),
                    success=result.get('success', False),
                )
                db.session.add(run)
        db.session.commit()

    return jsonify(results), 200


@algorithms_bp.route('/algorithms', methods=['GET'])
def list_algorithms():
    return jsonify({
        'algorithms': [
            {'key': 'bfs',               'name': 'Breadth-First Search',    'optimal': True,  'weighted': False},
            {'key': 'dfs',               'name': 'Depth-First Search',      'optimal': False, 'weighted': False},
            {'key': 'astar',             'name': 'A* Search',               'optimal': True,  'weighted': True },
            {'key': 'dijkstra',          'name': "Dijkstra's Algorithm",    'optimal': True,  'weighted': True },
            {'key': 'gbfs',              'name': 'Greedy Best-First Search', 'optimal': False, 'weighted': False},
            {'key': 'bidirectional_bfs', 'name': 'Bidirectional BFS',       'optimal': True,  'weighted': False},
        ]
    })
