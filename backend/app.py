from flask import Flask, jsonify, request
from flask_cors import CORS
from database import (
    init_db,
    get_all_shapes,
    create_shape,
    get_shape_by_id,
    update_shape,
    delete_shape,
    get_stats,
    get_daily_counts,
    get_latest_entries
)
from auth import login, is_valid_token, logout

app = Flask(__name__)
CORS(app)

init_db()

ALLOWED_SHAPES = ["Triangle", "Square", "Circle", "Other"]


def require_auth():
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid Authorization header."}), 401

    token = auth_header.replace("Bearer ", "")

    if not is_valid_token(token):
        return jsonify({"error": "Invalid or expired session. Please log in again."}), 401

    return None


@app.route("/")
def home():
    return jsonify({"message": "RUNNING!"})


@app.route("/api/shapes", methods=["GET"])
def get_shapes():
    shapes = get_all_shapes()
    return jsonify(shapes)


@app.route("/api/shapes", methods=["POST"])
def add_shape():
    auth_error = require_auth()
    if auth_error:
        return auth_error

    data = request.get_json()
    errors = []

    name = data.get("name", "").strip()
    shape = data.get("shape", "")
    color = data.get("color", "")
    timestamp = data.get("timestamp", "")

    if not name:
        errors.append("Name is required!")
    if shape not in ALLOWED_SHAPES:
        errors.append(f"Shape must be one of: {', '.join(ALLOWED_SHAPES)}.")
    if not color:
        errors.append("Color is required!")
    if not timestamp:
        errors.append("Timestamp is required!")
    if errors:
        return jsonify({"errors": errors}), 400

    new_shape = create_shape(name, shape, color, timestamp)
    return jsonify(new_shape), 201


@app.route("/api/shapes/<int:shape_id>", methods=["PUT"])
def edit_shape(shape_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error

    existing = get_shape_by_id(shape_id)
    if not existing:
        return jsonify({"error": "Not Found"}), 404

    data = request.get_json()
    errors = []

    name = data.get("name", "").strip()
    shape = data.get("shape", "")
    color = data.get("color", "")
    timestamp = data.get("timestamp", "")

    if not name:
        errors.append("Name is required!")
    if shape not in ALLOWED_SHAPES:
        errors.append(f"Shape must be one of: {', '.join(ALLOWED_SHAPES)}.")
    if not color:
        errors.append("Color is required!")
    if not timestamp:
        errors.append("Timestamp is required!")
    if errors:
        return jsonify({"errors": errors}), 400

    updated = update_shape(shape_id, name, shape, color, timestamp)
    return jsonify(updated)


@app.route("/api/shapes/<int:shape_id>", methods=["DELETE"])
def remove_shape(shape_id):
    auth_error = require_auth()
    if auth_error:
        return auth_error

    existing = get_shape_by_id(shape_id)
    if not existing:
        return jsonify({"error": "Not Found"}), 404

    delete_shape(shape_id)
    return jsonify({"message": "Shape deleted successfully", "id": shape_id})


@app.route("/api/stats", methods=["GET"])
def stats():
    return jsonify(get_stats())


@app.route("/api/stats/daily", methods=["GET"])
def daily_stats():
    return jsonify(get_daily_counts(days=14))


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json()
    password = data.get("password", "")
    token = login(password)
    if not token:
        return jsonify({"error": "Incorrect password."}), 401

    return jsonify({"token": token})


@app.route("/api/logout", methods=["POST"])
def api_logout():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    logout(token)
    return jsonify({"message": "Logged out."})

@app.route("/api/shapes/latest", methods=["GET"])
def latest_shapes():
    entries = get_latest_entries(limit=10)
    return jsonify(entries)

if __name__ == "__main__":
    app.run(debug=True, port=3221)