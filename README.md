<div align="center">
  <img src="logo.png" alt="B3AT Logo" width="250" />

# B3AT - Blue Archive Arena Analysis Tool

<strong>中文</strong> | <a href="./README_EN.md">English</a>

</div>

---

**B3AT** 是一个为《蔚蓝档案》(Blue Archive) 玩家制作的竞技场（PVP）战绩记录与分析工具

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

-   **批量导入**: 支持 JSON 格式的历史战绩批量导入。
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

> **致谢**: 学生数据与头像资源来自 [SchaleDB](https://schaledb.com/)。
