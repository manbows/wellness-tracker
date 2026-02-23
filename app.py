from flask import Flask, render_template, request, redirect, url_for, jsonify
from datetime import datetime
import sqlite3

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect("gratitude.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            grateful_1 TEXT NOT NULL,
            grateful_2 TEXT NOT NULL,
            grateful_3 TEXT NOT NULL,
            prayer_1 TEXT NOT NULL,
            prayer_2 TEXT NOT NULL,
            prayer_3 TEXT NOT NULL,
            score INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

def entry_exists_today():
    today = datetime.now().strftime("%d %b %Y")
    conn = sqlite3.connect("gratitude.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM entries WHERE date = ?", (today,))
    entry = cursor.fetchone()
    conn.close()
    if entry is None:
        return False, None
    return True, entry[1]

@app.route("/")
def index():
    conn = sqlite3.connect("gratitude.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entries ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    entries = []
    for row in rows:
        entries.append({
            "id": row[0],
            "name": row[1],
            "date": row[2],
            "grateful": [row[3], row[4], row[5]],
            "prayers": [row[6], row[7], row[8]],
            "score": row[9]
        })

    already_entered, name = entry_exists_today()
    return render_template("index.html", entries=entries, already_entered=already_entered, name=name)

@app.route("/add", methods=["POST"])
def add_entry():
    name = request.form.get("name", "").strip()[:50]
    if not name:
        return redirect(url_for("index"))

    grateful = [
        request.form.get("grateful_1", "").strip()[:150],
        request.form.get("grateful_2", "").strip()[:150],
        request.form.get("grateful_3", "").strip()[:150],
    ]

    prayers = [
        request.form.get("prayer_1", "").strip()[:150],
        request.form.get("prayer_2", "").strip()[:150],
        request.form.get("prayer_3", "").strip()[:150],
    ]

    try:
        score = int(request.form.get("score", 5))
        score = max(0, min(10, score))
    except ValueError:
        score = 5

    if all(grateful) and all(prayers):
        conn = sqlite3.connect("gratitude.db")
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO entries 
            (name, date, grateful_1, grateful_2, grateful_3, prayer_1, prayer_2, prayer_3, score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (name, datetime.now().strftime("%d %b %Y"), 
              grateful[0], grateful[1], grateful[2],
              prayers[0], prayers[1], prayers[2], 
              score))
        conn.commit()
        conn.close()

    return redirect(url_for("index"))

@app.route("/delete/<int:entry_id>", methods=["POST"])
def delete_entry(entry_id):
    conn = sqlite3.connect("gratitude.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM entries WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    return redirect(url_for("index"))

@app.route("/api/entries")
def api_entries():
    conn = sqlite3.connect("gratitude.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM entries ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    entries = []
    for row in rows:
        entries.append({
            "id": row[0],
            "name": row[1],
            "date": row[2],
            "grateful": [row[3], row[4], row[5]],
            "prayers": [row[6], row[7], row[8]],
            "score": row[9]
        })

    return jsonify(entries)

if __name__ == "__main__":
    app.run(debug=True)