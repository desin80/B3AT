<div align="center">
  <img src="logo.png" alt="B3AT Logo" width="250" />

# B3AT - Blue Archive Arena Analysis Tool

<a href="./README.md">中文</a> | <strong>English</strong>

</div>

---

**B3AT** is a PVP arena battle record and analysis tool designed for _Blue Archive_ players.

---

## Features

### 1. Battle Analysis

Provides multi-dimensional statistical data, including win rate, sample size, posterior mean, and Wilson lower bound. Supports **Ctrl + Click** to select multiple cards for batch operations (Admin only).
![Arena Analysis Screenshot](./screenshots/arena_main.png)

### 2. Filtering System

-   **Metric Filtering**: Filter by minimum win rate or minimum battles recorded.
-   **Composition Filtering**: Filter by specific students in specific slots (e.g., "Defender Position 4 must be Shun").
    ![Filter System Screenshot](./screenshots/filter_panel.png)

### 3. Submission & Review System

-   **Submit Request**: Normal users can submit battle records, optionally attaching **proof screenshots** and notes.
-   **Review Panel**: Admins can view pending requests in the backend, and approve or reject them.
    ![Review Panel Screenshot](./screenshots/review_panel.png)

### 4. Data Management

-   **Batch Import**: Supports bulk import of historical records via JSON (Admin only).
-   **Tactical Notes**: A lightweight comment system for recording RNG factors or strategy details without logging in.
    ![Manual Entry Screenshot](./screenshots/settings_manual.png)

---

## Getting Started

### Prerequisites

-   Node.js
-   Go
-   PostgreSQL

---

### 1. Backend Setup (Server)

In the server directory, besides installing dependencies, you need to create a .env file to configure the admin credentials.

```bash
cd server

# 1. Create a configuration file .env
# Copy the following content into server/.env:
# -------------------------
# PORT=8000
# FRONTEND_URL=http://localhost:5173
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/arena_db
# SECRET_KEY=change_this_to_a_complex_random_string
# ADMIN_USERNAME=sensei
# ADMIN_PASSWORD=arona
# -------------------------

# 2. Start the server
go run ./cmd/main.go
```

### 2. Frontend Setup (Client)

In the `client` directory, you also need to configure the API URL.

```bash
cd client

# 1. Install dependencies
npm install

# 2. Create configuration file .env
# Copy the following content into client/.env:
# -------------------------
# VITE_API_BASE_URL=http://localhost:8000/api
# -------------------------

# 3. Start development server
npm run dev
```

Open your browser and visit `http://localhost:5173`.
Visit `/login` directly to log in as an administrator.

---

## JSON Data Format

The batch upload file (Admin only) must be a **JSON array**. Each item matches the `/api/loadouts` payload.

```json
[
    {
        "server": "global",
        "season": 9,
        "tag": "",
        "atk_team": [10017, 10025, 20015, 20022, 10055, 20011],
        "def_team": [10010, 10033, 20008, 20009, 13008, 20025],
        "atk_loadout": [
            { "id": 10017, "star": 5, "weapon_star": 4 },
            { "id": 10025, "star": 3, "weapon_star": 0 }
        ],
        "def_loadout": [{ "id": 10010, "star": 5, "weapon_star": 5 }],
        "wins": 3,
        "losses": 1,
        "timestamp": 1735590000
    },
    {
        "server": "japan",
        "season": 10,
        "atk_team": [10017, 10025, 20015, 20022],
        "def_team": [13008, 10055, 20011, 20025],
        "wins": 0,
        "losses": 2
    }
]
```

### Field Description

| Field           | Type             | Description                                                      |
| :-------------- | :--------------- | :--------------------------------------------------------------- |
| **server**      | String           | Server region (e.g., `global`, `japan`). Default: `global`.      |
| **season**      | Integer          | Season number. Default: `9`.                                     |
| **tag**         | String           | Custom tag (optional).                                           |
| **atk_team**    | Array\<Int\>     | Attacker student IDs (required).                                 |
| **def_team**    | Array\<Int\>     | Defender student IDs (required).                                 |
| **atk_loadout** | Array\<Loadout\> | Optional; aligns with `atk_team` order.                          |
| **def_loadout** | Array\<Loadout\> | Optional; aligns with `def_team` order.                          |
| **wins**        | Integer          | Attack wins; must be >= 0.                                       |
| **losses**      | Integer          | Attack losses; must be >= 0 and `wins + losses > 0`.             |
| **timestamp**   | Integer          | Unix timestamp (seconds). Defaults to current time when omitted. |

#### Loadout Schema

| Field           | Type    | Description                                                  |
| :-------------- | :------ | :----------------------------------------------------------- |
| **id**          | Integer | Student ID; must exist in the corresponding team.            |
| **star**        | Integer | Star level; default 0.                                       |
| **weapon_star** | Integer | Unique weapon star; default 0. If > 0, `star` must also > 0. |

---

> **Credits**: Student data and resources provided by [SchaleDB](https://schaledb.com/).
