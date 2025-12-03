<div align="center">
  <img src="logo.png" alt="B3AT Logo" width="120" />

# B3AT - Blue Archive Arena Analysis Tool

<a href="./README.md">中文</a> | <strong>English</strong>

</div>

---

**B3AT** is an Arena (PVP) battle record and analysis tool designed for _Blue Archive_ players.

---

## Features

### 1. Battle Analysis

Provides multi-dimensional statistical data, including win rates, sample sizes, posterior means, and lower confidence bounds.
![Arena Analysis Screenshot](./screenshots/arena_main.png)

### 2. Filtering System

-   **Numeric Filtering**: Filter by minimum win rate and minimum match count.
-   **Lineup Filtering**: E.g., Filter for specific matches where "The defender's backline position 2 must be a specific character".
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
.\venv\Scripts\activate
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

> **Credits**: Student data and avatar resources are from [SchaleDB](https://schaledb.com/).
