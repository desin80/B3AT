## External Login & Loadout Ingest

### 1) Login to get JWT

-   **Endpoint**: `POST /api/token`
-   **Form fields**: `username`, `password`
-   **Response (example)**:
    ```json
    {
        "access_token": "<JWT_TOKEN>",
        "role": "admin", // or "user"
        "token_type": "bearer"
    }
    ```
-   Use `Authorization: Bearer <JWT_TOKEN>` for subsequent requests.

### 2) Add battle record with loadout

-   **Endpoint**: `POST /api/loadouts`
-   **Auth**: Bearer token (role: `admin` or `user`)
-   **Body (JSON)**:
    ```json
    {
        "server": "global",
        "season": 9,
        "tag": "",
        "atk_team": [10017, 10025, 20015, 20022, 10055, 20011],
        "def_team": [10010, 10033, 20008, 20009, 13008, 20025],
        "atk_loadout": [
            { "id": 10017, "star": 5, "weapon_star": 4 },
            { "id": 10025, "star": 5, "weapon_star": 4 }
        ],
        "def_loadout": [{ "id": 10010, "star": 5, "weapon_star": 5 }],
        "wins": 3,
        "losses": 1,
        "timestamp": 1735590000
    }
    ```
-   **Rules**:
    -   `wins + losses > 0`
    -   If `weapon_star > 0`, then `star > 0`
    -   Teams required (length 1–6). Missing loadout slots default to 0.
-   **Response**: `200 OK` with `{"message": "Loadout added"}` (errors return `detail`).

### Flow

1. Call `/api/token` to get `access_token`
2. Call `/api/loadouts` with `Authorization: Bearer <token>` and the JSON above.
