import sqlite3
from .config import DB_PATH


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript(
        """
    CREATE TABLE IF NOT EXISTS battles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server TEXT NOT NULL DEFAULT 'global',
        season INTEGER NOT NULL,
        tag TEXT DEFAULT '', 
        timestamp INTEGER NOT NULL,
        is_win INTEGER NOT NULL,
        atk_team_sig TEXT NOT NULL, 
        def_team_sig TEXT NOT NULL,
        atk_team_json TEXT NOT NULL,
        def_team_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_battles_season ON battles(season);
    CREATE INDEX IF NOT EXISTS idx_battles_server ON battles(server);

    CREATE TABLE IF NOT EXISTS battle_units (
        unit_id INTEGER NOT NULL,
        battle_id INTEGER NOT NULL,
        side INTEGER NOT NULL,
        PRIMARY KEY (unit_id, battle_id, side),
        FOREIGN KEY(battle_id) REFERENCES battles(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_bunits_battle_id ON battle_units(battle_id);
    """
    )

    cursor.executescript(
        """
    CREATE TABLE IF NOT EXISTS arena_stats (
        server TEXT NOT NULL DEFAULT 'global',
        season INTEGER,
        tag TEXT DEFAULT '',

        atk_strict_sig TEXT,
        def_strict_sig TEXT,

        atk_smart_sig TEXT,
        def_smart_sig TEXT,

        atk_team_json TEXT,
        def_team_json TEXT,

        total_battles INTEGER,
        total_wins INTEGER,
        last_seen INTEGER,
        wilson_score REAL, 
        avg_win_rate REAL,

        PRIMARY KEY (server, season, tag, atk_strict_sig, def_strict_sig)
    );

    CREATE INDEX IF NOT EXISTS idx_stats_season ON arena_stats(season);
    CREATE INDEX IF NOT EXISTS idx_stats_total ON arena_stats(total_battles);
    CREATE INDEX IF NOT EXISTS idx_wilson ON arena_stats(wilson_score);
    CREATE INDEX IF NOT EXISTS idx_smart_sig ON arena_stats(server,season, atk_smart_sig, def_smart_sig);
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
    CREATE INDEX IF NOT EXISTS idx_battles_atk_sig ON battles(atk_team_sig);
    CREATE INDEX IF NOT EXISTS idx_battles_def_sig ON battles(def_team_sig);
    CREATE INDEX IF NOT EXISTS idx_battles_matchup ON battles(atk_team_sig, def_team_sig);
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
