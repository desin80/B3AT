import json
from .database import get_db_connection
from .utils import wilson_lower_bound, posterior_mean, generate_signatures


def batch_upsert_stats(conn, updates_list):
    """
    updates_list:
    {
        'server': str, 'season': int, 'tag': str,
        'atk_team': list, 'def_team': list,
        'wins_delta': int, 'losses_delta': int,
        'timestamp': int
    }
    """
    cursor = conn.cursor()
    count = 0

    for item in updates_list:
        server = item["server"]
        season = item["season"]
        tag = item["tag"]
        atk_team = item["atk_team"]
        def_team = item["def_team"]
        wins_delta = item["wins_delta"]
        losses_delta = item["losses_delta"]
        timestamp = item["timestamp"]

        total_delta = wins_delta + losses_delta
        if total_delta == 0:
            continue

        atk_strict, atk_smart = generate_signatures(atk_team)
        def_strict, def_smart = generate_signatures(def_team)

        cursor.execute(
            """
            SELECT total_battles, total_wins, last_seen 
            FROM arena_stats 
            WHERE server=? AND season=? AND tag=? 
              AND atk_strict_sig=? AND def_strict_sig=?
        """,
            (server, season, tag, atk_strict, def_strict),
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
                  AND atk_strict_sig=? AND def_strict_sig=?
            """,
                (server, season, tag, atk_strict, def_strict),
            )
        else:
            if new_wins < 0:
                new_wins = 0
            if new_wins > new_total:
                new_wins = new_total

            w_score = wilson_lower_bound(new_wins, new_total)
            p_mean = posterior_mean(new_wins, new_total)

            atk_json = json.dumps(atk_team)
            def_json = json.dumps(def_team)

            cursor.execute(
                """
                INSERT OR REPLACE INTO arena_stats (
                    server, season, tag,
                    atk_strict_sig, def_strict_sig,
                    atk_smart_sig, def_smart_sig,
                    atk_team_json, def_team_json,
                    total_battles, total_wins, last_seen,
                    wilson_score, avg_win_rate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    server,
                    season,
                    tag,
                    atk_strict,
                    def_strict,
                    atk_smart,
                    def_smart,
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
    ignore_specials=False,
    tag=None,
):
    conn = get_db_connection()
    cursor = conn.cursor()
    offset = (page - 1) * limit

    if ignore_specials:
        select_clause = """
            server, season, tag,
            atk_smart_sig as atk_sig, def_smart_sig as def_sig,
            MAX(atk_team_json) as atk_json, MAX(def_team_json) as def_json,
            SUM(total_battles) as total, SUM(total_wins) as wins,
            MAX(last_seen) as last_time
        """
        group_by_clause = "GROUP BY server, season, tag, atk_smart_sig, def_smart_sig"
    else:
        select_clause = """
            server, season, tag,
            atk_strict_sig as atk_sig, def_strict_sig as def_sig,
            atk_team_json as atk_json, def_team_json as def_json,
            total_battles as total, total_wins as wins,
            last_seen as last_time, wilson_score, avg_win_rate
        """
        group_by_clause = ""

    query = f"SELECT {select_clause} FROM arena_stats WHERE 1=1"
    params = []

    if server != "all":
        query += " AND server = ?"
        params.append(server)
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
    if sort == "newest":
        sort_key = "last_time" if ignore_specials else "last_seen"
    elif "win_rate" in sort:
        sort_key = get_field("win_rate", ignore_specials)
    elif sort == "composite":
        sort_key = (
            get_field("win_rate", ignore_specials)
            if ignore_specials
            else "wilson_score"
        )

    direction = "ASC" if "asc" in sort else "DESC"
    query += f" ORDER BY {sort_key} {direction} LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    count_sql = f"SELECT COUNT(*) FROM ({query.rsplit('ORDER BY', 1)[0]})"
    cursor.execute(count_sql, params[:-2])
    total_count = cursor.fetchone()[0]

    conn.close()
    return rows, total_count
