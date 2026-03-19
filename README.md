# FitQuest

A gamified fitness tracker where every workout earns XP, every streak builds momentum, and every milestone unlocks achievements. Built as a web-first app with a full gamification layer: levels, badges, streaks, and leaderboards.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Jotai |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| Auth | JWT (access token in memory + refresh token as httpOnly cookie) |
| Local dev | PostgreSQL natively on your machine |

## Project Structure

```
fitquest/
├── backend/
│   └── src/
│       ├── db/          # schema.sql, seed.sql, connection pool
│       ├── modules/     # auth, workouts, exercises, users, gamification
│       ├── middleware/  # auth, ownership, rate limiting
│       ├── utils/       # xp.calculator, level.calculator
│       └── types/       # shared TypeScript interfaces
├── frontend/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # workout logger, XP toast, exercise picker
│   ├── lib/             # API client, translations
│   └── store/           # Jotai atoms
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [PostgreSQL 18](https://www.postgresql.org/download/) installed locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/fitquest.git
cd fitquest
```

### 2. Set up the database

Create a database and user in pgAdmin or psql, then run the schema and seed:

```bash
psql postgresql://your-user:your-password@localhost:5432/fitquest -f backend/src/db/schema.sql
psql postgresql://your-user:your-password@localhost:5432/fitquest -f backend/src/db/seed.sql
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your DATABASE_URL and JWT_SECRET
```

### 4. Start the backend

```bash
cd backend
npm install
npm run dev   # runs on http://localhost:3001
```

### 5. Verify the API is running

```bash
curl http://localhost:3001/health
# { "status": "ok", "timestamp": "..." }
```

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev   # runs on http://localhost:3000
```

Open `http://localhost:3000` and register an account.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in all values before running locally.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string |
| `JWT_SECRET` | Long random string used to sign tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (default: `7d`) |
| `CORS_ORIGIN` | Allowed frontend origin (default: `http://localhost:3000`) |

## Gamification System

| Mechanic | Rule |
|---|---|
| XP per set | `base_xp + floor(weight_kg/20) x 2 + floor(reps/5) x 1` |
| Streak multiplier | +5% XP from day 3, +10% from day 7 |
| Level curve | `xp_needed = 100 x level^1.6` |
| Achievements | 14 badges across 4 categories (workouts, streaks, XP, variety) |

## Development Roadmap

- [x] M0 - Project setup, DB schema, seed data
- [x] M1 - Authentication (register, login, JWT)
- [x] M2 - Workout core (sessions, sets, exercises, German UI)
- [ ] M3 - Gamification (achievements, streaks, leaderboards)
- [ ] M4 - Statistics, dashboard, polish
- [ ] Phase 2 - Friends, leaderboards, social feed

## License

MIT
