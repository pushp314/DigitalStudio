# DigitalStudio Go API

This is the Go/Gin backend replacement for DigitalStudio.

## Features
- Framework: Gin
- Database: PostgreSQL (via GORM)
- Storage: Cloudflare R2 (S3 compatible)
- Authentication: JWT

## Setup

1. Copy `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
2. Start your PostgreSQL database and make sure `DATABASE_URL` is properly set.
3. Apply the SQL migrations from `migrations/` with your preferred runner (for example `golang-migrate`).
4. Install dependencies and run:
   ```bash
   go mod download
   go run main.go
   ```

`ENABLE_AUTOMIGRATE` is disabled by default. Keep it off in production and use committed SQL migrations instead.

## Endpoints Overview

- `POST /api/auth/register` (Public)
- `POST /api/auth/login` (Public)
- `GET /api/auth/me` (Protected)
- `GET /api/products` (Public)
- `GET /api/products/:id` (Public)
- `POST/PUT/DELETE /api/products` (Admin Protected)
- `GET /api/orders/myorders` (Protected)
- `POST /api/orders` (Protected)
- `GET /healthz` / `GET /readyz` (Health & readiness)
- `GET /metrics` (Prometheus)
- `GET /api/config` (Public)
- `PUT /api/config` (Admin Protected)
- `GET /api/docs` (Public)
- `GET /api/docs/:id` (Public)
- `POST/PUT/DELETE /api/docs` (Admin Protected)
- `POST /api/upload` (Admin Protected)
- `POST /api/payments/create-order` and `POST /api/payments/verify` (Protected)

The admin seeder is disabled by default. Opt in locally with `ENABLE_SEEDER=true`.
