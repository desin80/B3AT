from fastapi import APIRouter, HTTPException
import time
from ..database import get_db_connection
from ..models import CommentRequest
from ..utils import normalize_to_smart_sig

router = APIRouter()


@router.get("/api/comments")
def get_comments(atk_sig: str, def_sig: str, server: str = "global"):
    conn = get_db_connection()
    cursor = conn.cursor()

    smart_atk = normalize_to_smart_sig(atk_sig)
    smart_def = normalize_to_smart_sig(def_sig)

    cursor.execute(
        """
        SELECT * FROM comments 
        WHERE server = ? AND atk_sig = ? AND def_sig = ? 
        ORDER BY created_at DESC
    """,
        (server, smart_atk, smart_def),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


@router.post("/api/comments")
def add_comment(req: CommentRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        now = int(time.time())
        smart_atk = normalize_to_smart_sig(req.atk_sig)
        smart_def = normalize_to_smart_sig(req.def_sig)
        cursor.execute(
            """
            INSERT INTO comments (server, atk_sig, def_sig, username, content, parent_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
            (
                req.server,
                smart_atk,
                smart_def,
                req.username,
                req.content,
                req.parent_id,
                now,
            ),
        )
        conn.commit()
        return {"id": cursor.lastrowid, "message": "Comment added"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM comments WHERE id = ? OR parent_id = ?", (comment_id, comment_id)
    )
    conn.commit()
    conn.close()
    return {"message": "Deleted"}
