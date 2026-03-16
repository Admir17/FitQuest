# Contributing to FitQuest

## Branch naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/auth-endpoints` |
| Bug fix | `fix/short-description` | `fix/streak-reset-cron` |
| Milestone | `milestone/M1-auth` | `milestone/M2-workouts` |

## Commit convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add POST /auth/register endpoint
fix: correct XP calculation for time-based sets
docs: update README setup steps
chore: upgrade express to 4.19.2
```

## Code style

- All code and comments in **English**
- TypeScript strict mode — no `any`
- One module per domain (`auth`, `workouts`, `gamification`, ...)
- Controllers handle HTTP, services handle business logic, no DB queries in controllers

## Environment files

Never commit `.env` files. Use `.env.example` as the template.
