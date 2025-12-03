import sqlite3
import json
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math
from datetime import datetime
import time

app = FastAPI()


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    print(f"{request.method} {request.url.path} - {process_time:.4f}s")
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "../arena.db"


def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def wilson_lower_bound(wins, n, z=1.96):
    if n == 0:
        return 0.0
    phat = wins / n
    numerator = (
        phat
        + z * z / (2 * n)
        - z * math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)
    )
    denominator = 1 + z * z / n
    return numerator / denominator


def posterior_mean(wins, n, alpha=1, beta=1):
    return (wins + alpha) / (n + alpha + beta)


def generate_signatures(team_list):
    ids = [str(i) for i in team_list]
    strict_sig = ",".join(ids)
    if len(ids) >= 6:
        strikers = ids[:4]
        specials = sorted(ids[4:])
        smart_sig = ",".join(strikers + specials)
    else:
        smart_sig = strict_sig
    return strict_sig, smart_sig


def recalculate_all_stats(conn):
    cursor = conn.cursor()
    cursor.execute("DELETE FROM arena_stats")

    cursor.execute(
        """
        SELECT 
            season, 
            tag, 
            atk_team_json, 
            def_team_json, 
            COUNT(*), 
            SUM(is_win), 
            MAX(timestamp)
        FROM battles
        GROUP BY season, tag, atk_team_json, def_team_json
    """
    )
    rows = cursor.fetchall()

    insert_list = []
    for row in rows:
        season, tag, atk_json, def_json, total, wins, last_seen = row

        try:
            atk_team = json.loads(atk_json)
            def_team = json.loads(def_json)
        except:
            continue

        atk_strict, atk_smart = generate_signatures(atk_team)
        def_strict, def_smart = generate_signatures(def_team)

        w_score = wilson_lower_bound(wins, total)
        p_mean = posterior_mean(wins, total)

        insert_list.append(
            (
                season,
                tag,
                atk_strict,
                def_strict,
                atk_smart,
                def_smart,
                atk_json,
                def_json,
                total,
                wins,
                last_seen,
                w_score,
                p_mean,
            )
        )

    cursor.executemany(
        """
    INSERT INTO arena_stats (
        season, 
        tag,
        atk_strict_sig, def_strict_sig, 
        atk_smart_sig, def_smart_sig,
        atk_team_json, def_team_json, 
        total_battles, total_wins, last_seen, 
        wilson_score, avg_win_rate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
        insert_list,
    )

    conn.commit()
    return len(insert_list)


def update_specific_stat(conn, atk_team_list, def_team_list, tag=""):
    cursor = conn.cursor()

    atk_strict, atk_smart = generate_signatures(atk_team_list)
    def_strict, def_smart = generate_signatures(def_team_list)

    atk_json = json.dumps(atk_team_list)
    def_json = json.dumps(def_team_list)

    atk_sig_fast = ",".join(map(str, sorted(atk_team_list)))
    def_sig_fast = ",".join(map(str, sorted(def_team_list)))

    cursor.execute(
        """
        SELECT 
            season,
            COUNT(*) as total, 
            SUM(is_win) as wins, 
            MAX(timestamp) as last_seen
        FROM battles
        WHERE atk_team_sig = ? AND def_team_sig = ? 
          AND atk_team_json = ? AND def_team_json = ?
          AND tag = ? 
        GROUP BY season
    """,
        (atk_sig_fast, def_sig_fast, atk_json, def_json, tag),
    )

    rows = cursor.fetchall()
    if not rows:
        return 0

    updated_count = 0
    for row in rows:
        season = row["season"]
        total = row["total"]
        wins = row["wins"]
        last_seen = row["last_seen"]

        w_score = wilson_lower_bound(wins, total)
        p_mean = posterior_mean(wins, total)

        cursor.execute(
            """
            INSERT OR REPLACE INTO arena_stats (
                season, 
                tag,
                atk_strict_sig, def_strict_sig, 
                atk_smart_sig, def_smart_sig,
                atk_team_json, def_team_json, 
                total_battles, total_wins, last_seen, 
                wilson_score, avg_win_rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                season,
                tag,
                atk_strict,
                def_strict,
                atk_smart,
                def_smart,
                atk_json,
                def_json,
                total,
                wins,
                last_seen,
                w_score,
                p_mean,
            ),
        )
        updated_count += 1

    conn.commit()
    return updated_count


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript(
        """
    CREATE TABLE IF NOT EXISTS battles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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

        PRIMARY KEY (season, tag, atk_strict_sig, def_strict_sig)
    );

    CREATE INDEX IF NOT EXISTS idx_stats_season ON arena_stats(season);
    CREATE INDEX IF NOT EXISTS idx_stats_total ON arena_stats(total_battles);
    CREATE INDEX IF NOT EXISTS idx_wilson ON arena_stats(wilson_score);
    CREATE INDEX IF NOT EXISTS idx_smart_sig ON arena_stats(season, atk_smart_sig, def_smart_sig);
    """
    )

    cursor.executescript(
        """
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        atk_sig TEXT NOT NULL,
        def_sig TEXT NOT NULL,
        username TEXT,
        content TEXT NOT NULL,
        parent_id INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_comments_sigs ON comments(atk_sig, def_sig);
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

    conn.commit()
    conn.close()
    print("Database initialized successfully.")


init_db()


class BattleRecord(BaseModel):
    id: int
    season: int
    tag: str = ""
    timestamp: int
    is_win: bool
    attackteam: List[int]
    defendteam: List[int]


class DeleteSummaryModel(BaseModel):
    atk_sig: str
    def_sig: str


@app.get("/")
def read_root():
    return {"status": "Server is running"}


@app.get("/api/battles")
def get_battles(
    page: int = 1,
    limit: int = 20,
    season: Optional[int] = None,
    unit_id: Optional[int] = None,
    tag: Optional[str] = None,
):
    conn = get_db_connection()
    cursor = conn.cursor()
    offset = (page - 1) * limit

    query = "SELECT * FROM battles WHERE 1=1"
    params = []

    if season:
        query += " AND season = ?"
        params.append(season)

    if tag is not None:
        query += " AND tag = ?"
        params.append(tag)

    if unit_id:
        query += """ AND id IN (
            SELECT battle_id FROM battle_units WHERE unit_id = ?
        )"""
        params.append(unit_id)

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    results = []
    for row in rows:
        results.append(
            {
                "id": row["id"],
                "season": row["season"],
                "tag": row["tag"],  # 返回 tag
                "timestamp": row["timestamp"],
                "win": bool(row["is_win"]),
                "attackteam": json.loads(row["atk_team_json"]),
                "defendteam": json.loads(row["def_team_json"]),
            }
        )

    conn.close()
    return results


@app.get("/api/summaries")
def get_summaries(
    page: int = 1,
    limit: int = 20,
    season: Optional[int] = None,
    sort: str = "default",
    min_win_rate: Optional[float] = None,
    min_battles: Optional[int] = None,
    atk_contains: Optional[str] = None,
    def_contains: Optional[str] = None,
    atk_slots: Optional[str] = None,
    def_slots: Optional[str] = None,
    ignore_specials: bool = False,
    tag: Optional[str] = None,
):
    conn = get_db_connection()
    cursor = conn.cursor()
    offset = (page - 1) * limit

    if ignore_specials:
        select_clause = """
            season,
            tag,
            atk_smart_sig as atk_sig, 
            def_smart_sig as def_sig,
            MAX(atk_team_json) as atk_json,
            MAX(def_team_json) as def_json,
            SUM(total_battles) as total,
            SUM(total_wins) as wins,
            MAX(last_seen) as last_time
        """
        group_by_clause = "GROUP BY season, tag, atk_smart_sig, def_smart_sig"
    else:
        select_clause = """
            season,
            tag,
            atk_strict_sig as atk_sig,
            def_strict_sig as def_sig,
            atk_team_json as atk_json,
            def_team_json as def_json,
            total_battles as total,
            total_wins as wins,
            last_seen as last_time,
            wilson_score, 
            avg_win_rate
        """
        group_by_clause = ""

    query = f"SELECT {select_clause} FROM arena_stats WHERE 1=1"
    params = []

    if season:
        query += " AND season = ?"
        params.append(season)

    if tag is not None:
        query += " AND tag = ?"
        params.append(tag)

    if atk_contains:
        for i in atk_contains.split(","):
            if i.strip():
                query += " AND atk_team_json LIKE ?"
                params.append(f"%{i.strip()}%")
    if def_contains:
        for i in def_contains.split(","):
            if i.strip():
                query += " AND def_team_json LIKE ?"
                params.append(f"%{i.strip()}%")

    if atk_slots:
        for s in atk_slots.split(","):
            if ":" in s:
                idx, uid = s.split(":")
                query += f" AND json_extract(atk_team_json, '$[{idx.strip()}]') = ?"
                params.append(int(uid.strip()))
    if def_slots:
        for s in def_slots.split(","):
            if ":" in s:
                idx, uid = s.split(":")
                query += f" AND json_extract(def_team_json, '$[{idx.strip()}]') = ?"
                params.append(int(uid.strip()))

    if group_by_clause:
        query += f" {group_by_clause}"

    having_clauses = []

    def get_field(name, is_agg):
        if is_agg:
            if name == "total":
                return "SUM(total_battles)"
            if name == "win_rate":
                return "(CAST(SUM(total_wins) AS REAL) / SUM(total_battles))"
        else:
            if name == "total":
                return "total_battles"
            if name == "win_rate":
                return "(CAST(total_wins AS REAL) / total_battles)"
        return ""

    if min_battles is not None:
        f = get_field("total", ignore_specials)
        clause = f"{f} >= ?"
        if ignore_specials:
            having_clauses.append(clause)
        else:
            query += f" AND {clause}"
        params.append(min_battles)

    if min_win_rate is not None:
        f = get_field("win_rate", ignore_specials)
        clause = f"{f} >= ?"
        if ignore_specials:
            having_clauses.append(clause)
        else:
            query += f" AND {clause}"
        params.append(min_win_rate)

    if having_clauses:
        query += " HAVING " + " AND ".join(having_clauses)

    sort_key = "total" if ignore_specials else "total_battles"
    if sort == "default" or sort == "total_asc":
        pass
    elif sort == "newest":
        sort_key = "last_time" if ignore_specials else "last_seen"
    elif "win_rate" in sort:
        sort_key = get_field("win_rate", ignore_specials)
    elif sort == "composite":
        if ignore_specials:
            sort_key = get_field("win_rate", ignore_specials)
        else:
            sort_key = "wilson_score"

    direction = "ASC" if "asc" in sort else "DESC"
    query += f" ORDER BY {sort_key} {direction} LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    query_for_count = f"SELECT COUNT(*) FROM ({query.rsplit('ORDER BY', 1)[0]})"
    cursor.execute(query_for_count, params[:-2])
    total_count = cursor.fetchone()[0]

    results = []

    def calc_wilson(w, n):
        if n == 0:
            return 0
        z = 1.96
        phat = w / n
        return (
            phat
            + z * z / (2 * n)
            - z * math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)
        ) / (1 + z * z / n)

    for row in rows:
        total = row["total"]
        wins = row["wins"]

        if ignore_specials:
            wilson = calc_wilson(wins, total)
            avg_wr = (wins + 1) / (total + 2)
        else:
            wilson = row["wilson_score"]
            avg_wr = row["avg_win_rate"]

        results.append(
            {
                "season": row["season"],
                "tag": row["tag"],
                "attackingTeam": json.loads(row["atk_json"]),
                "defendingTeam": json.loads(row["def_json"]),
                "total": total,
                "wins": wins,
                "losses": total - wins,
                "winRate": wins / total if total > 0 else 0,
                "wilsonScore": wilson,
                "avgWinRate": avg_wr,
                "lastSeen": row["last_time"],
                "atk_sig": row["atk_sig"],
                "def_sig": row["def_sig"],
            }
        )

    conn.close()
    return {
        "data": results,
        "total": total_count,
        "page": page,
        "totalPages": (total_count + limit - 1) // limit if limit > 0 else 0,
    }


class ManualAddRequest(BaseModel):
    season: int
    tag: str = ""
    atk_team: List[int]
    def_team: List[int]
    wins: int
    losses: int


@app.post("/api/manual_add")
def manual_add(req: ManualAddRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    import time

    now = int(time.time())

    atk_sig = ",".join(map(str, sorted(req.atk_team)))
    def_sig = ",".join(map(str, sorted(req.def_team)))
    atk_json = json.dumps(req.atk_team)
    def_json = json.dumps(req.def_team)

    try:
        records_to_add = []
        for _ in range(req.wins):
            records_to_add.append(
                (req.season, req.tag, now, 1, atk_sig, def_sig, atk_json, def_json)
            )
        for _ in range(req.losses):
            records_to_add.append(
                (req.season, req.tag, now, 0, atk_sig, def_sig, atk_json, def_json)
            )

        if records_to_add:
            cursor.executemany(
                """
                INSERT INTO battles (season, tag, timestamp, is_win, atk_team_sig, def_team_sig, atk_team_json, def_team_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
                records_to_add,
            )
            conn.commit()

        update_specific_stat(conn, req.atk_team, req.def_team, req.tag)

        return {
            "message": f"Added {len(records_to_add)} records. Stats incrementally updated."
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/upload")
async def upload_json(file: UploadFile = File(...)):
    try:
        content = await file.read()
        data = json.loads(content)
        if not isinstance(data, list):
            raise HTTPException(
                status_code=400, detail="JSON must be a list of records"
            )

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            insert_list = []
            for row in data:
                season = row.get("Season", 1)
                is_win = 1 if row.get("Win") else 0
                tag = row.get("Tag", "")

                atk_team = row.get("AttackingTeamIds", [])
                def_team = row.get("DefendingTeamIds", [])

                if not atk_team or not def_team:
                    continue

                time_str = row.get("Time")
                if time_str:
                    try:
                        dt = datetime.fromisoformat(time_str)
                        timestamp = int(dt.timestamp())
                    except ValueError:
                        timestamp = int(time.time())
                else:
                    timestamp = int(time.time())

                atk_sig = ",".join(map(str, sorted(atk_team)))
                def_sig = ",".join(map(str, sorted(def_team)))
                atk_json = json.dumps(atk_team)
                def_json = json.dumps(def_team)

                insert_list.append(
                    (
                        season,
                        tag,
                        timestamp,
                        is_win,
                        atk_sig,
                        def_sig,
                        atk_json,
                        def_json,
                    )
                )

            if insert_list:
                cursor.executemany(
                    """
                    INSERT INTO battles (
                        season, tag, timestamp, is_win, 
                        atk_team_sig, def_team_sig, 
                        atk_team_json, def_team_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    insert_list,
                )

                conn.commit()
                stats_count = recalculate_all_stats(conn)

                return {
                    "message": f"Successfully imported {len(insert_list)} battles.",
                    "stats_updated": stats_count,
                }
            else:
                return {"message": "No valid data found to import."}

        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            conn.close()

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CommentRequest(BaseModel):
    atk_sig: str
    def_sig: str
    username: str = "Sensei"
    content: str
    parent_id: Optional[int] = None


@app.get("/api/comments")
def get_comments(atk_sig: str, def_sig: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM comments 
        WHERE atk_sig = ? AND def_sig = ? 
        ORDER BY created_at DESC
    """,
        (atk_sig, def_sig),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/comments")
def add_comment(req: CommentRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        import time

        now = int(time.time())
        cursor.execute(
            """
            INSERT INTO comments (atk_sig, def_sig, username, content, parent_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """,
            (req.atk_sig, req.def_sig, req.username, req.content, req.parent_id, now),
        )
        conn.commit()
        return {"id": cursor.lastrowid, "message": "Comment added"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/summaries/delete")
def delete_summary(payload: DeleteSummaryModel):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM battles WHERE atk_team_sig = ? AND def_team_sig = ?",
            (payload.atk_sig, payload.def_sig),
        )
        deleted_count = cursor.rowcount
        cursor.execute(
            "DELETE FROM arena_stats WHERE atk_team_sig = ? AND def_team_sig = ?",
            (payload.atk_sig, payload.def_sig),
        )
        conn.commit()
        return {"message": f"Deleted {deleted_count} records"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM comments WHERE id = ? OR parent_id = ?", (comment_id, comment_id)
    )
    conn.commit()
    conn.close()
    return {"message": "Deleted"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
