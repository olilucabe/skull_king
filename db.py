import os
import sqlite3

from flask import g

DATABASE = os.path.join(os.path.dirname(__file__), 'skull_king.db')
SCHEMA = os.path.join(os.path.dirname(__file__), 'schema.sql')

# Shared palette of player colors. Index determines the default color
# assigned to the Nth player (by registration order).
PLAYER_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#b91c1c', '#1d4ed8', '#15803d',
]


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA foreign_keys = ON')
    return g.db


def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    with open(SCHEMA, 'r', encoding='utf-8') as f:
        db.executescript(f.read())
    _migrate(db)
    db.commit()


def _migrate(db):
    """Apply incremental schema changes to databases created before this version."""
    columns = [row['name'] for row in db.execute('PRAGMA table_info(players)').fetchall()]
    if 'color' not in columns:
        db.execute("ALTER TABLE players ADD COLUMN color TEXT NOT NULL DEFAULT '#2563eb'")
        for idx, row in enumerate(db.execute('SELECT id FROM players ORDER BY id').fetchall()):
            db.execute(
                'UPDATE players SET color = ? WHERE id = ?',
                (PLAYER_COLORS[idx % len(PLAYER_COLORS)], row['id']),
            )


def init_app(app):
    app.teardown_appcontext(close_db)
