import json
from .database import get_db_connection
from .utils import wilson_lower_bound, posterior_mean, generate_signatures


def batch_upsert_stats(conn, updates_list):
    cursor = conn.cursor()
    count = 0

    for item in updates_list:
        server = item["server"]
        season = item["season"]
        tag = item["tag"]

        atk_sorted_list, atk_sig = generate_signatures(item["atk_team"])
        def_sorted_list, def_sig = generate_signatures(item["def_team"])

        wins_delta = item["wins_delta"]
        losses_delta = item["losses_delta"]
        timestamp = item["timestamp"]

        total_delta = wins_delta + losses_delta
        if total_delta == 0:
            continue

        cursor.execute(
            """
            SELECT total_battles, total_wins, last_seen 
            FROM arena_stats 
            WHERE server=? AND season=? AND tag=? 
              AND atk_team_sig=? AND def_team_sig=?
        """,
            (server, season, tag, atk_sig, def_sig),
        )

        row = cursor.fetchone()

        if row:
            current_total = row["total_battles"]
            current_wins = row["total_wins"]
            current_last_seen = row["last_seen"]

            new_total = current_total + total_delta
            new_wins = current_wins + wins_delta
            new_last_seen = (
                max(current_last_seen, timestamp)
                if total_delta > 0
                else current_last_seen
            )
        else:
            new_total = total_delta
            new_wins = wins_delta
            new_last_seen = timestamp

        if new_total <= 0:
            cursor.execute(
                """
                DELETE FROM arena_stats
                WHERE server=? AND season=? AND tag=?
                  AND atk_team_sig=? AND def_team_sig=?
            """,
                (server, season, tag, atk_sig, def_sig),
            )
        else:
            if new_wins < 0:
                new_wins = 0
            if new_wins > new_total:
                new_wins = new_total

            w_score = wilson_lower_bound(new_wins, new_total)
            p_mean = posterior_mean(new_wins, new_total)

            atk_json = json.dumps(atk_sorted_list)
            def_json = json.dumps(def_sorted_list)

            cursor.execute(
                """
                INSERT OR REPLACE INTO arena_stats (
                    server, season, tag,
                    atk_team_sig, def_team_sig,
                    atk_team_json, def_team_json,
                    total_battles, total_wins, last_seen,
                    wilson_score, avg_win_rate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    server,
                    season,
                    tag,
                    atk_sig,
                    def_sig,
                    atk_json,
                    def_json,
                    new_total,
                    new_wins,
                    new_last_seen,
                    w_score,
                    p_mean,
                ),
            )

        count += 1

    conn.commit()
    return count


def get_filtered_summaries(
    page=1,
    limit=20,
    server="global",
    season=None,
    sort="default",
    min_win_rate=None,
    min_battles=None,
    atk_contains=None,
    def_contains=None,
    atk_slots=None,
    def_slots=None,
    tag=None,
):
    conn = get_db_connection()
    cursor = conn.cursor()
    offset = (page - 1) * limit

    where_clauses = ["1=1"]
    params = []

    if server != "all":
        where_clauses.append("server = ?")
        params.append(server)

    if season:
        where_clauses.append("season = ?")
        params.append(season)

    if tag is not None:
        where_clauses.append("tag = ?")
        params.append(tag)

    if atk_contains:
        for i in atk_contains.split(","):
            if i.strip():
                where_clauses.append("atk_team_json LIKE ?")
                params.append(f"%{i.strip()}%")
    if def_contains:
        for i in def_contains.split(","):
            if i.strip():
                where_clauses.append("def_team_json LIKE ?")
                params.append(f"%{i.strip()}%")

    if atk_slots:
        for s in atk_slots.split(","):
            if ":" in s:
                idx, uid = s.split(":")
                where_clauses.append(
                    f"json_extract(atk_team_json, '$[{idx.strip()}]') = ?"
                )
                params.append(int(uid.strip()))
    if def_slots:
        for s in def_slots.split(","):
            if ":" in s:
                idx, uid = s.split(":")
                where_clauses.append(
                    f"json_extract(def_team_json, '$[{idx.strip()}]') = ?"
                )
                params.append(int(uid.strip()))

    if min_battles is not None:
        where_clauses.append("total_battles >= ?")
        params.append(min_battles)

    if min_win_rate is not None:

        where_clauses.append("(CAST(total_wins AS REAL) / total_battles) >= ?")
        params.append(min_win_rate)

    where_str = " AND ".join(where_clauses)

    count_sql = f"SELECT COUNT(*) FROM arena_stats WHERE {where_str}"
    cursor.execute(count_sql, params)
    total_count = cursor.fetchone()[0]

    select_clause = """
        server, season, tag,
        atk_team_sig as atk_sig, def_team_sig as def_sig,
        atk_team_json as atk_json, def_team_json as def_json,
        total_battles as total, total_wins as wins,
        last_seen as last_time, wilson_score, avg_win_rate
    """

    sort_key = "total_battles"
    if sort == "newest":
        sort_key = "last_seen"
    elif "win_rate" in sort:
        sort_key = "avg_win_rate"
    elif sort == "composite":
        sort_key = "wilson_score"

    direction = "ASC" if "asc" in sort else "DESC"

    query = f"""
        SELECT {select_clause} 
        FROM arena_stats 
        WHERE {where_str} 
        ORDER BY {sort_key} {direction} 
        LIMIT ? OFFSET ?
    """

    final_params = params + [limit, offset]

    cursor.execute(query, final_params)
    rows = cursor.fetchall()

    conn.close()
    return rows, total_count
