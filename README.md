<div align="center">
  <img src="logo.png" alt="B3AT Logo" width="250" />

# B3AT - Blue Archive Arena Analysis Tool

<strong>中文</strong> | <a href="./README_EN.md">English</a>

</div>

---

**B3AT** 是一个为《蔚蓝档案》(Blue Archive) 玩家制作的竞技场（PVP）战绩记录与分析工具。

---

> ### 关于权限与安全
>
> 本分支已集成管理系统。
>
> -   **普通用户**：可以浏览数据、使用筛选器，手动录入战绩时需要**提交审核**（支持上传截图证明），无法直接修改数据库。
> -   **管理员**：登录后拥有最高权限，包括审核用户提交的请求、直接导入/删除数据、批量管理等。
>
> 默认情况下，系统运行在单用户管理员模式，账号密码在环境变量中配置。

---

## 核心功能 (Features)

### 1. 战局分析 (Battle Analysis)

提供多维度的统计数据，包含胜率、样本数、后验均值与 Wilson 置信下界。支持 **Ctrl + 单击** 多选卡片进行批量操作（仅限管理员）。
![Arena Analysis Screenshot](./screenshots/arena_main.png)

### 2. 筛选系统 (Filtering)

-   **数值筛选**: 按最低胜率、最小场次筛选。
-   **阵容筛选**: 支持指定攻守方特定位置的角色（例如：筛选“防守方 4 号位是瞬”的对局）。
    ![Filter System Screenshot](./screenshots/filter_panel.png)

### 3. 数据审核系统 (Submission & Review)

-   **提交请求**: 普通用户可以提交战绩，支持附带证明截图和备注说明。
-   **审核面板**: 管理员在后台查看待办请求，批准入库或拒绝。
    ![Review Panel Screenshot](./screenshots/review_panel.png)

### 4. 数据管理 (Data Management)

-   **批量导入**: 支持 JSON 格式的历史战绩批量导入（仅限管理员）。
-   **战术笔记**: 轻量级的评论系统，记录 RNG 因素或作业细节。
    ![Manual Entry Screenshot](./screenshots/settings_manual.png)

---

## 快速开始 (Getting Started)

### 前置要求

-   Node.js (v18+)
-   Python (v3.11+)

### 1. 后端配置与启动 (Server)

在 `server` 目录下，除了安装依赖，你需要创建一个 `.env` 配置文件来设置管理员账号。

```bash
cd server

# 1. 创建虚拟环境并激活
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 创建配置文件 .env
# 复制以下内容到 server/.env 文件中:
# -------------------------
# API_PORT=8000
# FRONTEND_URL=http://localhost:5173
# SECRET_KEY=请修改为一个复杂的随机字符串
# ADMIN_USERNAME=sensei
# ADMIN_PASSWORD=arona
# -------------------------

# 4. 启动服务
python main.py
```

### 2. 前端配置与启动 (Client)

在 `client` 目录下，同样需要配置 API 地址。

```bash
cd client

# 1. 安装依赖
npm install

# 2. 创建配置文件 .env
# 复制以下内容到 client/.env 文件中:
# -------------------------
# VITE_API_BASE_URL=http://localhost:8000/api
# -------------------------

# 3. 启动开发服务器
npm run dev
```

打开浏览器访问 `http://localhost:5173`。
直接访问 `/login` 进行管理员登录（默认账号：`sensei` / `arona`）。

---

## JSON 数据示例 (Data Format)

批量上传（仅管理员可用）的文件必须为 **JSON 数组** 格式。

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

### 字段详细说明

| 字段名 (Field)       | 类型 (Type)  | 说明 (Description)                             |
| :------------------- | :----------- | :--------------------------------------------- |
| **Win**              | Boolean      | `true` 为进攻胜利，`false` 为失败              |
| **AttackingTeamIds** | Array\<Int\> | 进攻方学生 ID 列表                             |
| **DefendingTeamIds** | Array\<Int\> | 防守方学生 ID 列表                             |
| **Server**           | String       | 服务器 (如 `global`, `japan`)，默认为 `global` |
| **Season**           | Integer      | 赛季编号，默认为 `9`                           |
| **Tag**              | String       | 自定义标签 (如压攻)                            |
| **Time**             | String       | 战斗时间 (ISO 8601 格式)，不填则默认为上传时间 |

---

> **致谢**: 学生数据与头像资源来自 [SchaleDB](https://schaledb.com/)。
