from fastapi import APIRouter
from typing import Optional
import json
from ..database import get_db_connection

router = APIRouter()


@router.get("/api/battles")
def get_battles(
    page: int = 1,
    limit: int = 20,
    server: str = "global",
    season: Optional[int] = None,
    unit_id: Optional[int] = None,
    tag: Optional[str] = None,
):
    conn = get_db_connection()
    cursor = conn.cursor()
    offset = (page - 1) * limit

    query = "SELECT * FROM battles WHERE 1=1"
    params = [server]

    if server != "all":
        query += " AND server = ?"
        params.append(server)

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
                "server": row["server"],
                "season": row["season"],
                "tag": row["tag"],
                "timestamp": row["timestamp"],
                "win": bool(row["is_win"]),
                "attackteam": json.loads(row["atk_team_json"]),
                "defendteam": json.loads(row["def_team_json"]),
            }
        )

    conn.close()
    return results


@router.get("/api/seasons")
def get_seasons(server: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if server and server != "all":
        cursor.execute(
            "SELECT DISTINCT season FROM battles WHERE server = ? ORDER BY season DESC",
            (server,),
        )
    else:
        cursor.execute("SELECT DISTINCT season FROM battles ORDER BY season DESC")

    rows = cursor.fetchall()
    conn.close()
    seasons = [row[0] for row in rows]
    return seasons if seasons else [1]
