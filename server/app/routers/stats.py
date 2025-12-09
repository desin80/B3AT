from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import Optional
import json
import time
from datetime import datetime
from ..database import get_db_connection
from ..models import ManualAddRequest, DeleteSummaryModel, BatchDeleteRequest
from ..config import MAX_MANUAL_COUNT
from ..crud import get_filtered_summaries, batch_upsert_stats
from ..utils import wilson_lower_bound
from .auth import get_current_admin

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
        raise HTTPException(status_code=400, detail="Season must be positive")
    if req.wins < 0 or req.losses < 0:
        raise HTTPException(status_code=400, detail="Counts cannot be negative")
    if req.wins == 0 and req.losses == 0:
        raise HTTPException(status_code=400, detail="Action required")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        now = int(time.time())

        atk_json = json.dumps(req.atk_team)
        def_json = json.dumps(req.def_team)

        cursor.execute(
            """
            INSERT INTO submissions (
                server, season, tag, atk_team_json, def_team_json, 
                wins, losses, note, image_path, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                req.server,
                req.season,
                req.tag,
                atk_json,
                def_json,
                req.wins,
                req.losses,
                "Admin Manual Entry",
                None,
                "approved",
                now,
            ),
        )

        update_item = {
            "server": req.server,
            "season": req.season,
            "tag": req.tag,
            "atk_team": req.atk_team,
            "def_team": req.def_team,
            "wins_delta": req.wins,
            "losses_delta": req.losses,
            "timestamp": now,
        }

        batch_upsert_stats(conn, [update_item])

        return {"message": "Stats updated and recorded in history."}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/api/upload")
async def upload_json(
    file: UploadFile = File(...),
    default_server: str = Form("global"),
    default_season: int = Form(9),
):
    try:
        content = await file.read()
        data = json.loads(content)
        if not isinstance(data, list):
            raise HTTPException(
                status_code=400, detail="JSON must be a list of records"
            )

        aggregation = {}

        for row in data:
            server = row.get("Server", default_server).lower()
            season = row.get("Season", default_season)
            tag = row.get("Tag", "")

            atk_team = row.get("AttackingTeamIds", [])
            def_team = row.get("DefendingTeamIds", [])

            if not atk_team or not def_team:
                continue

            is_win = 1 if row.get("Win") else 0

            time_str = row.get("Time")
            if time_str:
                try:
                    dt = datetime.fromisoformat(time_str)
                    timestamp = int(dt.timestamp())
                except ValueError:
                    timestamp = int(time.time())
            else:
                timestamp = int(time.time())

            atk_key = tuple(atk_team)
            def_key = tuple(def_team)

            key = (server, season, tag, atk_key, def_key)

            if key not in aggregation:
                aggregation[key] = {
                    "wins": 0,
                    "losses": 0,
                    "ts": 0,
                    "atk": atk_team,
                    "def": def_team,
                }

            agg = aggregation[key]
            if is_win:
                agg["wins"] += 1
            else:
                agg["losses"] += 1

            if timestamp > agg["ts"]:
                agg["ts"] = timestamp

        updates_list = []
        for (server, season, tag, _, _), val in aggregation.items():
            updates_list.append(
                {
                    "server": server,
                    "season": season,
                    "tag": tag,
                    "atk_team": val["atk"],
                    "def_team": val["def"],
                    "wins_delta": val["wins"],
                    "losses_delta": val["losses"],
                    "timestamp": val["ts"],
                }
            )

        conn = get_db_connection()
        try:
            if updates_list:
                count = batch_upsert_stats(conn, updates_list)
                return {
                    "message": f"Successfully processed {len(data)} records, updated/created {count} summaries."
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
def delete_summary(
    payload: DeleteSummaryModel, admin: str = Depends(get_current_admin)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            DELETE FROM arena_stats 
            WHERE server = ? 
              AND season = ? 
              AND tag = ? 
              AND atk_strict_sig = ? 
              AND def_strict_sig = ?
            """,
            (
                payload.server,
                payload.season,
                payload.tag,
                payload.atk_sig,
                payload.def_sig,
            ),
        )
        deleted_count = cursor.rowcount
        conn.commit()
        return {"message": f"Deleted {deleted_count} summary."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/api/summaries/batch_delete")
def batch_delete_summaries(
    payload: BatchDeleteRequest, admin: str = Depends(get_current_admin)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        deleted_count = 0

        for item in payload.items:
            cursor.execute(
                """
                DELETE FROM arena_stats 
                WHERE server = ? 
                  AND season = ? 
                  AND tag = ? 
                  AND atk_strict_sig = ? 
                  AND def_strict_sig = ?
                """,
                (item.server, item.season, item.tag, item.atk_sig, item.def_sig),
            )
            deleted_count += cursor.rowcount

        conn.commit()
        return {
            "message": f"Successfully processed batch delete. Removed {deleted_count} items."
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
