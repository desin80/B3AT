<div align="center">
  <img src="logo.png" alt="B3AT Logo" width="250" />

# B3AT - Blue Archive Arena Analysis Tool

<strong>中文</strong> | <a href="./README_EN.md">English</a>

</div>

---

**B3AT** 是一个为《蔚蓝档案》(Blue Archive) 玩家制作的竞技场（PVP）战绩记录与分析工具

---

> ### 重要提醒
>
> 本项目目前**未包含**任何数据审核或用户权限管理系统。这意味着**任何人**都可以上传数据或手动录入战绩。
> 如果您计划在公共网络环境部署此服务，请务必注意数据污染风险。

---

## 核心功能 (Features)

### 1. 战局分析 (Battle Analysis)

提供多维度的统计数据，包含胜率、样本数、后验均值与置信下界。
![Arena Analysis Screenshot](./screenshots/arena_main.png)

### 2. 筛选系统 (Filtering)

-   **数值筛选**: 按最低胜率、最小场次筛选。
-   **阵容筛选**: 例：筛选“防守方后排 2 号位必须是某角色”的特定对局。
    ![Filter System Screenshot](./screenshots/filter_panel.png)

### 3. 战术笔记 (Tactical Notes)

轻量级的评论系统，无需登录即可使用。
![Comments System Screenshot](./screenshots/comments.png)

### 4. 数据导入 (Data Management)

-   **批量导入**: 支持 JSON 格式的历史战绩批量导入，示例见末尾。
-   **手动录入**: 提供手动录入面板，您可以预设攻守阵容，胜负场次。
    ![Manual Entry Screenshot](./screenshots/settings_manual.png)

---

## 快速开始 (Getting Started)

### 前置要求

-   Node.js (v18+)
-   Python (v3.11+)

### 1. 启动后端

```bash
cd server

# 创建虚拟环境
python -m venv venv

# 激活环境
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务 (默认运行在 http://localhost:8000)
python main.py
```

### 2. 启动前端

```bash
cd client

# 安装依赖
npm install

# 启动开发服务器 (默认运行在 http://localhost:5173)
npm run dev
```

打开浏览器访问 `http://localhost:5173` 即可开始使用

---

## JSON 数据示例 (Data Format)

批量上传的文件必须为 **JSON 数组** 格式（即使只有一条数据，也需要包裹在 `[]` 中）。

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
