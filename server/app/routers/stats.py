# app/routers/stats.py
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional
import json
import time
from datetime import datetime
from ..database import get_db_connection
from ..models import ManualAddRequest, DeleteSummaryModel
from ..config import MAX_MANUAL_COUNT
from ..crud import recalculate_all_stats, update_specific_stat, get_filtered_summaries
from ..utils import wilson_lower_bound

router = APIRouter()


@router.get("/api/summaries")
def get_summaries(
    page: int = 1,
    limit: int = 20,
    server: str = "global",
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
    rows, total_count = get_filtered_summaries(
        page,
        limit,
        server,
        season,
        sort,
        min_win_rate,
        min_battles,
        atk_contains,
        def_contains,
        atk_slots,
        def_slots,
        ignore_specials,
        tag,
    )

    results = []

    def calc_wilson(w, n):
        if n == 0:
            return 0
        return wilson_lower_bound(w, n)

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
                "server": row["server"],
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

    return {
        "data": results,
        "total": total_count,
        "page": page,
        "totalPages": (total_count + limit - 1) // limit if limit > 0 else 0,
    }


@router.post("/api/manual_add")
def manual_add(req: ManualAddRequest):
    if req.season < 1:
        raise HTTPException(status_code=400, detail="Season must be a positive integer")

    if req.wins > MAX_MANUAL_COUNT or req.losses > MAX_MANUAL_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Wins and Losses must each be less than {MAX_MANUAL_COUNT}",
        )

    if req.wins < 0 or req.losses < 0:
        raise HTTPException(status_code=400, detail="Counts cannot be negative")

    if req.wins == 0 and req.losses == 0:
        raise HTTPException(
            status_code=400, detail="At least one win or loss is required"
        )

    conn = get_db_connection()
    cursor = conn.cursor()
    now = int(time.time())

    atk_sig = ",".join(map(str, sorted(req.atk_team)))
    def_sig = ",".join(map(str, sorted(req.def_team)))
    atk_json = json.dumps(req.atk_team)
    def_json = json.dumps(req.def_team)

    try:
        records_to_add = []
        for _ in range(req.wins):
            records_to_add.append(
                (
                    req.server,
                    req.season,
                    req.tag,
                    now,
                    1,
                    atk_sig,
                    def_sig,
                    atk_json,
                    def_json,
                )
            )
        for _ in range(req.losses):
            records_to_add.append(
                (
                    req.server,
                    req.season,
                    req.tag,
                    now,
                    0,
                    atk_sig,
                    def_sig,
                    atk_json,
                    def_json,
                )
            )

        if records_to_add:
            cursor.executemany(
                """
                INSERT INTO battles (server, season, tag, timestamp, is_win, atk_team_sig, def_team_sig, atk_team_json, def_team_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                records_to_add,
            )
            conn.commit()

        update_specific_stat(conn, req.server, req.atk_team, req.def_team, req.tag)

        return {
            "message": f"Added {len(records_to_add)} records to server '{req.server}'. Stats incrementally updated."
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/api/upload")
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
                server = row.get("Server", "global").lower()
                season = row.get("Season", 9)
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
                        server,
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
                        server, season, tag, timestamp, is_win, 
                        atk_team_sig, def_team_sig, 
                        atk_team_json, def_team_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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


@router.post("/api/summaries/delete")
def delete_summary(payload: DeleteSummaryModel):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "DELETE FROM battles WHERE server = ? AND atk_team_sig = ? AND def_team_sig = ?",
            (payload.server, payload.atk_sig, payload.def_sig),
        )
        deleted_count = cursor.rowcount
        cursor.execute(
            "DELETE FROM arena_stats WHERE server = ? AND atk_strict_sig = ? AND def_strict_sig = ?",
            (payload.server, payload.atk_sig, payload.def_sig),
        )
        conn.commit()
        return {
            "message": f"Deleted {deleted_count} battles records and associated stats for server {payload.server}"
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
