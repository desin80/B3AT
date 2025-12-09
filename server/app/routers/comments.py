from fastapi import APIRouter, HTTPException, Depends
import time
from ..database import get_db_connection
from ..models import CommentRequest
from ..utils import generate_signatures
from .auth import get_current_admin

router = APIRouter()


def ensure_sig(sig_str: str) -> str:
    if not sig_str:
        return ""
    try:
        parts = [x.strip() for x in sig_str.split(",") if x.strip()]
        _, final_sig = generate_signatures(parts)
        return final_sig
    except:
        return sig_str


@router.get("/api/comments")
def get_comments(atk_sig: str, def_sig: str, server: str = "global"):
    conn = get_db_connection()
    cursor = conn.cursor()

    final_atk = ensure_sig(atk_sig)
    final_def = ensure_sig(def_sig)

    cursor.execute(
        """
        SELECT * FROM comments 
        WHERE server = %s AND atk_sig = %s AND def_sig = %s 
        ORDER BY created_at DESC
    """,
        (server, final_atk, final_def),
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
        final_atk = ensure_sig(req.atk_sig)
        final_def = ensure_sig(req.def_sig)
        cursor.execute(
            """
            INSERT INTO comments (server, atk_sig, def_sig, username, content, parent_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        """,
            (
                req.server,
                final_atk,
                final_def,
                req.username,
                req.content,
                req.parent_id,
                now,
            ),
        )
        new_id = cursor.fetchone()["id"]

        conn.commit()
        return {"id": new_id, "message": "Comment added"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int, admin: str = Depends(get_current_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM comments WHERE id = %s OR parent_id = %s", (comment_id, comment_id)
    )
    conn.commit()
    conn.close()
    return {"message": "Deleted"}
