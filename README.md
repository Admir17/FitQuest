# FitQuest 🏋️

A gamified fitness tracker where every workout earns XP, every streak builds momentum, and every milestone unlocks achievements. Built as a web-first app with a full gamification layer — levels, badges, streaks, and leaderboards.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Jotai |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| Cache / Jobs | Redis, BullMQ |
| Auth | JWT (access token in memory + refresh token as httpOnly cookie) |
| Local dev | Docker Compose |

---

## Project Structure

```
fitquest/
├── backend/
│   └── src/
│       ├── db/          # schema.sql, seed.sql, connection pool
│       ├── modules/     # auth, workouts, exercises, users, gamification
│       ├── middleware/  # auth, ownership, rate limiting
│       ├── jobs/        # streak reset cron, achievement triggers
│       ├── utils/       # xp.calculator, level.calculator
│       └── types/       # shared TypeScript interfaces
├── frontend/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # workout logger, XP bar, achievement cards
│   ├── lib/             # API client
│   └── store/           # Jotai atoms
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) (for PostgreSQL + Redis)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/fitquest.git
cd fitquest
```

### 2. Start the database and Redis

```bash
# Copy and fill in your env file first
cp backend/.env.example backend/.env

# Then start services — schema and seed run automatically on first start
docker-compose up -d
```

### 3. Start the backend

```bash
cd backend
npm install
npm run dev   # runs on http://localhost:3001
```

### 4. Verify the API is running

```bash
curl http://localhost:3001/health
# → { "status": "ok", "timestamp": "..." }
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev   # runs on http://localhost:3000
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in all values before running locally.

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Password for the local PostgreSQL container |
| `DATABASE_URL` | Full PostgreSQL connection string |
| `JWT_SECRET` | Long random string used to sign tokens — keep this secret |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (default: `7d`) |
| `CORS_ORIGIN` | Allowed frontend origin (default: `http://localhost:3000`) |

---

## Gamification System

| Mechanic | Rule |
|---|---|
| XP per set | `base_xp + floor(weight_kg/20)×2 + floor(reps/5)×1` |
| Streak multiplier | +5% XP from day 3, +10% from day 7 |
| Level curve | `xp_needed = 100 × level^1.6` |
| Achievements | 14 badges across 4 categories (workouts, streaks, XP, variety) |
| Streak reset | Nightly cron job resets streaks for inactive users |

---

## Development Roadmap

- [x] M0 — Project setup, DB schema, seed data
- [ ] M1 — Authentication (register, login, JWT)
- [ ] M2 — Workout core (sessions, sets, exercises, templates)
- [ ] M3 — Gamification (XP, levels, achievements, streaks)
- [ ] M4 — Statistics, dashboard, polish
- [ ] Phase 2 — Friends, leaderboards, social feed

---

## License

MIT
