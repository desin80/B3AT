import time
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from .config import DATABASE_URL

pool = ConnectionPool(
    conninfo=DATABASE_URL,
    min_size=4,
    max_size=20,
    kwargs={"autocommit": False, "row_factory": dict_row},
)


def get_db_connection():
    return pool.getconn()


def wait_db():
    for _ in range(5):
        try:
            with pool.connection() as conn:
                conn.execute("SELECT 1")
                break
        except Exception as e:
            print(f"Waiting for Database... {e}")
            time.sleep(2)


def init_db():
    wait_db()

    with pool.connection() as conn:
        conn.execute(
            """
        CREATE TABLE IF NOT EXISTS arena_stats (
            server TEXT NOT NULL DEFAULT 'global',
            season INTEGER,
            tag TEXT DEFAULT '',

            atk_team_sig TEXT,
            def_team_sig TEXT,

            atk_team_json JSONB,
            def_team_json JSONB,

            total_battles INTEGER,
            total_wins INTEGER,
            last_seen BIGINT,
            wilson_score REAL, 
            avg_win_rate REAL,

            PRIMARY KEY (server, season, tag, atk_team_sig, def_team_sig)
        );
        """
        )

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_season_server_total ON arena_stats(season, server, total_battles DESC);"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_season_server_time ON arena_stats(season, server, last_seen DESC);"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_season_server_wilson ON arena_stats(season, server, wilson_score DESC);"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_atk_json_gin ON arena_stats USING GIN (atk_team_json);"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_def_json_gin ON arena_stats USING GIN (def_team_json);"
        )

        conn.execute(
            """
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            server TEXT NOT NULL DEFAULT 'global',
            atk_sig TEXT NOT NULL,
            def_sig TEXT NOT NULL,
            username TEXT,
            content TEXT NOT NULL,
            parent_id INTEGER DEFAULT NULL,
            created_at BIGINT NOT NULL
        );
        """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_comments_sigs ON comments(server, atk_sig, def_sig);"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);"
        )

        conn.execute(
            """
        CREATE TABLE IF NOT EXISTS submissions (
            id SERIAL PRIMARY KEY,
            server TEXT NOT NULL,
            season INTEGER NOT NULL,
            tag TEXT,
            atk_team_json JSONB, -- JSONB
            def_team_json JSONB, -- JSONB
            wins INTEGER NOT NULL,
            losses INTEGER NOT NULL,
            note TEXT,
            image_path TEXT,
            status TEXT DEFAULT 'pending',
            created_at BIGINT NOT NULL
        );
        """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);"
        )

        conn.commit()

    print("Database initialized successfully.")
