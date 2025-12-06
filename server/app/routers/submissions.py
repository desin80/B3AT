from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
import json
import time
import shutil
from pathlib import Path
from ..database import get_db_connection
from ..routers.auth import get_current_admin
from ..crud import update_specific_stat

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/api/submissions")
async def create_submission(
    server: str = Form(...),
    season: int = Form(...),
    tag: str = Form(""),
    atk_team: str = Form(...),
    def_team: str = Form(...),
    wins: int = Form(...),
    losses: int = Form(...),
    note: str = Form(""),
    image: Optional[UploadFile] = File(None),
):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        image_path = None
        if image:
            filename = f"{int(time.time())}_{image.filename}"
            file_location = UPLOAD_DIR / filename
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_path = f"/uploads/{filename}"

        cursor.execute(
            """
            INSERT INTO submissions (
                server, season, tag, atk_team_json, def_team_json, 
                wins, losses, note, image_path, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                server,
                season,
                tag,
                atk_team,
                def_team,
                wins,
                losses,
                note,
                image_path,
                int(time.time()),
            ),
        )

        conn.commit()
        return {"message": "Submission received. Waiting for admin approval."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/api/submissions")
def get_pending_submissions(admin: str = Depends(get_current_admin)):
    conn = get_db_connection()
    conn.row_factory = None
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM submissions WHERE status = 'pending' ORDER BY created_at DESC"
    )
    columns = [column[0] for column in cursor.description]
    results = [dict(zip(columns, row)) for row in cursor.fetchall()]

    for r in results:
        r["atk_team"] = json.loads(r["atk_team_json"])
        r["def_team"] = json.loads(r["def_team_json"])

    conn.close()
    return results


@router.post("/api/submissions/{sub_id}/approve")
def approve_submission(sub_id: int, admin: str = Depends(get_current_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM submissions WHERE id = ?", (sub_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Submission not found")

        data = dict(row)
        if data["status"] != "pending":
            raise HTTPException(status_code=400, detail="Submission already processed")

        now = int(time.time())
        atk_team = json.loads(data["atk_team_json"])
        def_team = json.loads(data["def_team_json"])

        clean_atk = [x for x in atk_team if x > 0]
        clean_def = [x for x in def_team if x > 0]
        atk_sig = ",".join(map(str, sorted(clean_atk)))
        def_sig = ",".join(map(str, sorted(clean_def)))

        records = []
        for _ in range(data["wins"]):
            records.append(
                (
                    data["server"],
                    data["season"],
                    data["tag"],
                    now,
                    1,
                    atk_sig,
                    def_sig,
                    data["atk_team_json"],
                    data["def_team_json"],
                )
            )
        for _ in range(data["losses"]):
            records.append(
                (
                    data["server"],
                    data["season"],
                    data["tag"],
                    now,
                    0,
                    atk_sig,
                    def_sig,
                    data["atk_team_json"],
                    data["def_team_json"],
                )
            )

        if records:
            cursor.executemany(
                """
                INSERT INTO battles (server, season, tag, timestamp, is_win, atk_team_sig, def_team_sig, atk_team_json, def_team_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                records,
            )

        update_specific_stat(conn, data["server"], atk_team, def_team, data["tag"])

        cursor.execute(
            "UPDATE submissions SET status = 'approved' WHERE id = ?", (sub_id,)
        )

        conn.commit()
        return {"message": "Approved and merged"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/api/submissions/{sub_id}/reject")
def reject_submission(sub_id: int, admin: str = Depends(get_current_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE submissions SET status = 'rejected' WHERE id = ?", (sub_id,))
    conn.commit()
    conn.close()
    return {"message": "Rejected"}
