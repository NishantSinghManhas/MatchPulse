# MatchPulse 🏏

MatchPulse is a premium, real-time cricket live score tracking dashboard built with the **MERN Stack** (MongoDB, Express, React, Node.js) and **Socket.io**. It is designed with a modern, glassmorphic dark theme and features a customizable **Live Cricket Match Simulation Engine** with a dedicated administrator control cockpit.

---

## ⚡ Features

1. **Premium Aesthetic**: Ditch the crowded tables of Cricbuzz! MatchPulse uses a dark-themed visual system with electric neon gradients, smooth micro-animations, and clean typographic hierarchies (using Inter & Outfit fonts).
2. **Real-time Live Scores**: Driven by WebSockets (Socket.io) to stream score updates, ball-by-ball actions, strike rotations, bowler changes, and commentaries instantly.
3. **Live Match Simulation Engine**: Background simulator calculating realistic cricket ball outcomes (runs, wickets, boundaries, wide/no balls) and generating dynamic textual commentaries.
4. **Sandbox Simulator Cockpit**: Admin dashboard on each match allowing users to start/pause auto-simulation or manually inject custom ball events (like pushing a WICKET or a SIX) to test state updates instantly.
5. **Interactive Full Scorecards**: High-performance batting and bowling statistics tables updating dynamically for both innings.
6. **Creator Panel**: Complete match initialization engine supporting custom team rosters, venue details, overs limits, and starting toss options.
7. **Database Resilience**: Connects to MongoDB, but falls back gracefully to a file-based storage database (`matches_db.json`) if a local MongoDB instance is not running. Works out of the box!

---

## 🏗️ Architecture

```
MatchPulse/
├── backend/                  # Node.js + Express + Socket.io Server
│   ├── config/               # Database connect & config
│   ├── models/               # Mongoose Schema Definitions
│   ├── routes/               # Express matches controllers & seeding
│   ├── services/             # DB fallback service & Live Match Simulator
│   ├── package.json          # Backend Dependencies
│   └── server.js             # Express app entry point
│
└── frontend/                 # React + Vite + Custom CSS Web Client
    ├── src/
    │   ├── components/       # UI (MatchList, MatchDetail, AdminPanel)
    │   ├── App.jsx           # Views routing, Ticker, Socket wrapper
    │   ├── index.css         # Premium global style sheet
    │   └── main.jsx          # Vite React mounting point
    ├── package.json          # Frontend Dependencies
    └── index.html            # Vite HTML template
```

---

## 🚀 Getting Started

Ensure you have [Node.js](https://nodejs.org) installed on your system.

### Option A: One-Click Launch (Windows)

Right-click on the script file:
1. Run `start_matchpulse.ps1` with PowerShell.
2. The script will automatically launch the backend and frontend dev servers in separate console windows.
3. Open your browser and navigate to: **`http://localhost:5173`**

### Option B: Manual Execution

#### 1. Start the Backend
```bash
cd backend
npm run dev
```
*Runs on port 5000. It will automatically seed the database with mock matches if empty.*

#### 2. Start the Frontend
```bash
cd frontend
npm run dev
```
*Runs on port 5173.*

---

## 🛠️ Sandbox Admin Control Guide

1. Navigate to the dashboard at `http://localhost:5173`.
2. Click on the **ICC Men's T20 World Cup Final (Live)** match or create a new match in the **Create Match** tab.
3. Open the **Simulator Cockpit** tab inside the Match Details section.
4. Select the speed (e.g. 1.5 seconds turbo pace) and click **Start Auto-Simulation**.
5. Alternatively, pause the simulation and use the **Manual Ball Event Injection** buttons (e.g., dot, single, FOUR, WICKET).
6. Observe the scoreboard, batting strikes, bowling cards, and commentary feed updating in real time!
