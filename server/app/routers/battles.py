from fastapi import APIRouter
from typing import Optional
from ..database import get_db_connection

router = APIRouter()


@router.get("/api/seasons")
def get_seasons(server: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if server and server != "all":
        cursor.execute(
            "SELECT DISTINCT season FROM arena_stats WHERE server = %s ORDER BY season DESC",
            (server,),
        )
    else:
        cursor.execute("SELECT DISTINCT season FROM arena_stats ORDER BY season DESC")

    rows = cursor.fetchall()
    conn.close()
    seasons = [row["season"] for row in rows]
    return seasons if seasons else [1]
