import sqlite3
from datetime import date, timedelta

DB_NAME = "shapes.db"

def get_connection():
    """
    Create a new connection to the SQLite database.
    We use row_factory so that query results can be accessed like a dictionary
    (ex, row["name"]) instead of only by numeric index (row[0]).
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Create the 'shapes' table if it does not already exist.
    This function is called once when the server starts for the first time.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS shapes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            shape TEXT NOT NULL,
            color TEXT NOT NULL,
            timestamp TEXT NOT NULL
            )
        """)

    conn.commit()
    conn.close()
    print("[database] Table 'shapes' Ready.")

def get_all_shapes():
    """
    Retrieve all rows from the 'shapes' table ordered from newest to oldest.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM shapes ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
        
def create_shape(name, shape, color, timestamp):
    """
    Insert a new row into the 'shapes' table.
    Returns the newly inserted record (including its ID).
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO shapes (name, shape, color, timestamp) VALUES (?, ?, ?, ?)",
        (name, shape, color, timestamp)
    )
    conn.commit()

    new_id = cursor.lastrowid

    conn.close()

    return {
        "id": new_id,
        "name": name,
        "shape": shape,
        "color": color,
        "timestamp": timestamp
    }

def get_shape_by_id(shape_id):
    """
    Retrieve a single row by its ID.
    Return None if no matching record is found.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM shapes WHERE id = ?", (shape_id,))
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None

def update_shape(shape_id, name, shape, color, timestamp):
    """
    Update an existing record by its ID
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """ UPDATE shapes
            SET name = ?, shape = ?, color =?, timestamp = ?
            WHERE id =?""",
        (name, shape, color, timestamp, shape_id)
    )
    conn.commit()
    conn.close()
    return get_shape_by_id(shape_id)

def delete_shape(shape_id):
    """
    Delete a single row by its ID
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shapes WHERE id = ?", (shape_id,))
    conn.commit()
    conn.close()

def get_stats():
    """
    Returns aggregated statistics used by the Dashboard:
    - total count of all entries
    - count per shape type
    - quick stats: entries added today / this week / this month
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) AS total FROM shapes")
    total = cursor.fetchone()["total"]

    counts = {}
    for shape_type in ["Triangle", "Square", "Circle", "Other"]:
        cursor.execute("SELECT COUNT(*) AS count FROM shapes WHERE shape = ?", (shape_type,))
        counts[shape_type] = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) AS count FROM shapes WHERE date(timestamp) = date('now')")
    today_count = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) AS count FROM shapes WHERE date(timestamp) >= date('now', '-6 days')")
    week_count = cursor.fetchone()["count"]

    cursor.execute("""
        SELECT COUNT(*) AS count FROM shapes
        WHERE strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')
    """)
    month_count = cursor.fetchone()["count"]

    conn.close()

    return {
        "total": total,
        "counts": counts,
        "quick_stats": {
            "today": today_count,
            "this_week": week_count,
            "this_month": month_count
        }
    }

def get_daily_counts(days=14):
    """
    Returns a list of {date, count} for the last `days` days (default 14),
    including days with zero entries, so a line chart doesn't have gaps.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT date(timestamp) AS day, COUNT(*) AS count
        FROM shapes
        WHERE date(timestamp) >= date('now', ?)
        GROUP BY day
        ORDER BY day ASC
        """,
        (f"-{days - 1} days",)
    )
    rows = cursor.fetchall()
    conn.close()

    counts_by_day = {row["day"]: row["count"] for row in rows}

    result = []
    today = date.today()
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.isoformat()  # "YYYY-MM-DD"
        result.append({"date": day_str, "count": counts_by_day.get(day_str, 0)})

    return result

def get_latest_entries(limit=10):
    """
    Returns the most recent entries, but WITHOUT the name field.
    This is intentional: the Dashboard should give a privacy-friendly
    glance at activity, while the full details (including names) stay
    in the User Portal only.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, shape, color, timestamp FROM shapes ORDER BY id DESC LIMIT ?",
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]
