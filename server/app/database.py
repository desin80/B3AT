import sqlite3
from .config import DB_PATH


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA cache_size=-64000;")
    conn.execute("PRAGMA mmap_size=268435456;")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript(
        """
    CREATE TABLE IF NOT EXISTS arena_stats (
        server TEXT NOT NULL DEFAULT 'global',
        season INTEGER,
        tag TEXT DEFAULT '',

        atk_team_sig TEXT,
        def_team_sig TEXT,

        atk_team_json TEXT,
        def_team_json TEXT,

        total_battles INTEGER,
        total_wins INTEGER,
        last_seen INTEGER,
        wilson_score REAL, 
        avg_win_rate REAL,

        PRIMARY KEY (server, season, tag, atk_team_sig, def_team_sig)
    );

    CREATE INDEX IF NOT EXISTS idx_season_server_total ON arena_stats(season, server, total_battles DESC);
    CREATE INDEX IF NOT EXISTS idx_season_server_time ON arena_stats(season, server, last_seen DESC);
    CREATE INDEX IF NOT EXISTS idx_season_server_wilson ON arena_stats(season, server, wilson_score DESC);
    CREATE INDEX IF NOT EXISTS idx_main_winrate ON arena_stats(season, server, avg_win_rate DESC);
    CREATE INDEX IF NOT EXISTS idx_main_time ON arena_stats(season, server, last_seen DESC);
    """
    )

    cursor.executescript(
        """
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server TEXT NOT NULL DEFAULT 'global',
        atk_sig TEXT NOT NULL,
        def_sig TEXT NOT NULL,
        username TEXT,
        content TEXT NOT NULL,
        parent_id INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_comments_sigs ON comments(server, atk_sig, def_sig);
    CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
    """
    )

    cursor.executescript(
        """
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server TEXT NOT NULL,
        season INTEGER NOT NULL,
        tag TEXT,
        atk_team_json TEXT NOT NULL,
        def_team_json TEXT NOT NULL,
        wins INTEGER NOT NULL,
        losses INTEGER NOT NULL,
        note TEXT,
        image_path TEXT,
        status TEXT DEFAULT 'pending', -- pending, approved, rejected
        created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    """
    )

    conn.commit()
    conn.close()
    print("Database initialized successfully.")
