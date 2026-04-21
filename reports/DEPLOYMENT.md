# Deployment Readiness

## Environment
- Backend: copy `go-server/.env.example` and populate production secrets through your secret manager, not committed files.
- Frontend: copy `ecom/.env.example` and point `VITE_API_URL` at the deployed API.
- AI service: copy `ai-service/.env.example` and configure `OLLAMA_URL` plus service `PORT`.

## Database and Storage
- Apply the SQL files in `go-server/migrations/` before deploying application code.
- Disable `ENABLE_AUTOMIGRATE` and `ENABLE_SEEDER` in production.
- Verify PostgreSQL connectivity, R2 bucket credentials, and public asset URLs before rollout.
- Confirm automated backups and restore drills for PostgreSQL and object storage.

## Rollout Checklist
- Run CI (`go test`, `go build`, `npm run lint`, `npm run build`) on the release commit.
- Deploy the AI service before enabling API routes that depend on `AI_SERVICE_URL`.
- Confirm `/healthz`, `/readyz`, and `/metrics` from the backend after deployment.
- Smoke test register, login, OAuth, product browse, upload, docs preview, and Razorpay verify flows in staging.
- Promote the same container images and env shape from staging to production to preserve parity.

## Security
- Restrict `ALLOWED_ORIGINS` to trusted frontend origins.
- Use strong random values for `JWT_SECRET`, `SESSION_SECRET`, OAuth credentials, and Razorpay keys.
- Keep session cookies `HttpOnly` and `Secure`, and set `COOKIE_SAMESITE=None` only when a cross-site OAuth deployment requires it.
- Monitor rate-limited public routes and verify structured logs are flowing to your log aggregation system.
