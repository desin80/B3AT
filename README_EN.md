<div align="center">
  <img src="logo.png" alt="B3AT Logo" width="120" />

# B3AT - Blue Archive Arena Analysis Tool

<a href="./README.md">中文</a> | <strong>English</strong>

</div>

---

**B3AT** is an Arena (PVP) battle record and analysis tool designed for _Blue Archive_ players.

---

> ### Disclaimer
>
> This project currently does **NOT** include any data moderation or user authentication system. This means **anyone** can upload data or manually add battle records.
> If you plan to deploy this service in a public environment, please be aware of the risk of data pollution.
>
> **If you need the version with an admin system and the new database, please visit the [admin branch](https://github.com/desin80/B3AT/tree/admin)**

---

## Features

### 1. Battle Analysis

Provides multi-dimensional statistical data, including win rates, sample sizes, posterior means, and lower confidence bounds.
![Arena Analysis Screenshot](./screenshots/arena_main.png)

### 2. Filtering System

-   **Numeric Filtering**: Filter by minimum win rate and minimum match count.
-   **Lineup Filtering**: e.g., filter for matches where "The defender's backline position 2 must be a specific character".
    ![Filter System Screenshot](./screenshots/filter_panel.png)

### 3. Tactical Notes

A lightweight comment system that can be used without logging in.
![Comments System Screenshot](./screenshots/comments.png)

### 4. Data Management

-   **Batch Import**: Supports batch import of historical records in JSON format.
-   **Manual Entry**: Provides a manual entry panel where you can preset attacking/defending lineups and win/loss counts.
    ![Manual Entry Screenshot](./screenshots/settings_manual.png)

---

## Getting Started

### Prerequisites

-   Node.js (v18+)
-   Python (v3.11+)

### 1. Start Backend

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate environment
# Windows:
.\\venv\\Scripts\\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start service (runs at http://localhost:8000 by default)
python main.py
```

### 2. Start Frontend

```bash
cd client

# Install dependencies
npm install

# Start dev server (runs at http://localhost:5173 by default)
npm run dev
```

Open your browser and visit `http://localhost:5173` to start using.

---

## JSON Data Format

Files for batch upload must be in **JSON Array** format (even if containing only a single record, it must be wrapped in `[]`).

```json
[
    {
        "Server": "global",
        "Season": 9,
        "Tag": "tag_low_atk",
        "Win": true,
        "AttackingTeamIds": [10017, 10025, 20015, 20022, 10055, 20011],
        "DefendingTeamIds": [10010, 10033, 20008, 20009, 13008, 20025],
        "Time": "2023-10-27T14:30:00"
    },
    {
        "Server": "japan",
        "Season": 10,
        "Win": false,
        "AttackingTeamIds": [10017, 10025, 20015, 20022],
        "DefendingTeamIds": [13008, 10055, 20011, 20025],
        "Time": "2023-10-28T09:15:00"
    }
]
```

### Field Details

| Field                | Type       | Description                                                |
| -------------------- | ---------- | ---------------------------------------------------------- |
| **Win**              | Boolean    | `true` = attacker win, `false` = loss                      |
| **AttackingTeamIds** | Array<Int> | Student IDs of attacking team                              |
| **DefendingTeamIds** | Array<Int> | Student IDs of defending team                              |
| **Server**           | String     | Server name (`global`, `japan`), default `global`          |
| **Season**           | Integer    | Season number, default `9`                                 |
| **Tag**              | String     | Custom tag (e.g., strategy note)                           |
| **Time**             | String     | Battle time (ISO 8601), defaults to upload time if omitted |

---

**Credits**: Student data and avatar resources are from [SchaleDB](https://schaledb.com/).
