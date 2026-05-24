# Allo Inventory — Take-Home Exercise

Live URL: https://project-krypti.vercel.app

## Local Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Set environment variables in `.env.local`:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `REDIS_URL` — Upstash Redis connection string (rediss://)
   - `RESERVATION_TTL_MINUTES` — reservation window (default: 10)
4. Run migrations: `npx prisma migrate dev`
5. Seed database: visit `/api/seed` in browser after `npm run dev`
6. Start dev server: `npm run dev`

## How Expiry Works

Reservations expire after `RESERVATION_TTL_MINUTES` (10 min in production). Expiry is handled lazily — when a confirm request comes in, the API checks `expiresAt < now` and returns 410 if expired, releasing the stock automatically. A Vercel Cron job at `/api/cron/expire-reservations` running every minute handles background cleanup of stale reservations.

## Concurrency

The reservation endpoint uses a Redis distributed lock (SET NX PX) scoped per product+warehouse. Only one request can check-and-increment stock at a time. The lock is released atomically via a Lua script. Stock increment and reservation creation happen inside a Prisma transaction.

## Trade-offs

- 503 on lock contention instead of queuing — a production system would retry with backoff
- No UI polling — stock counts require a manual Refresh after another user reserves
- Cron job granularity is 1 minute — expired reservations may show as reserved for up to 60 seconds
- Seed endpoint (`/api/seed`) is public — would be protected in production