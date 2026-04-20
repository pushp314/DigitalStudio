## Backend Audit Fix Plan

### Scope
- Backend root: `go-server/`
- Priority: revenue protection, payment correctness, entitlement correctness, auth hardening, upload safety, DB integrity, observability, frontend contract clarity.

### Current Issues Found

#### 1. Payment settlement is not canonical or idempotent
- Risk: Critical
- Files:
  - `go-server/handlers/razorpay.go`
  - `go-server/handlers/commerce_helpers.go`
  - `go-server/models/order.go`
- Findings:
  - `/api/payments/verify` and `/api/webhooks/razorpay` both mutate order state independently.
  - Verify path marks orders paid, issues licenses, credits partner rewards, and mutates membership directly.
  - Webhook path separately marks orders paid and also issues licenses and partner rewards.
  - No canonical settlement service exists.
  - No transaction wraps payment finalization, entitlement grant, coupon settlement, license issuance, and referral crediting.
  - No row locking or idempotency gate protects duplicate settlement.
- Fix strategy:
  - Introduce a single order settlement service used by both verify and webhook flows.
  - Lock the order row in a DB transaction.
  - Safely no-op if the order is already settled.
  - Persist payment metadata in one place and track settlement source/event.

#### 2. Coupon usage is race-prone and consumed too early
- Risk: Critical
- Files:
  - `go-server/handlers/razorpay.go`
  - `go-server/handlers/marketing.go`
  - `go-server/models/coupon.go`
- Findings:
  - Coupon usage is incremented during payment order creation, not after successful settlement.
  - Coupon validation trusts `totalAmount` from request flow and uses `c.GetFloat64("totalAmount")`, which is never reliably set by middleware.
  - No row lock or atomic usage enforcement prevents oversubscription under concurrency.
- Fix strategy:
  - Move coupon reservation/consumption into canonical settlement transaction.
  - Recompute subtotal on backend from product prices.
  - Lock coupon row before final usage increment.
  - Record applied coupon on the order so verify/webhook do not depend on client-provided totals.

#### 3. License issuance can double-run and is mixed into handlers/read paths
- Risk: Critical
- Files:
  - `go-server/handlers/commerce_helpers.go`
  - `go-server/handlers/order.go`
  - `go-server/handlers/order_admin.go`
  - `go-server/handlers/license.go`
  - `go-server/models/license.go`
- Findings:
  - License issuance is triggered from verify, webhook, admin update, and even `MyOrders`.
  - Issuance is outside a transaction and relies on check-then-create.
  - Unique index exists, but code can still race and turn success into noisy failures.
  - Membership handling is mixed into license helper in a partial way.
- Fix strategy:
  - Move license issuance into settlement service.
  - Use transactional existence checks with row-locked order and unique constraint handling.
  - Keep read paths read-only.
  - Expose explicit license endpoints for frontend contract clarity.

#### 4. Referral/partner rewards can be double-credited
- Risk: Critical
- Files:
  - `go-server/handlers/razorpay.go`
  - `go-server/models/user.go`
- Findings:
  - Reward crediting runs in both verify and webhook flows.
  - No durable record exists for whether a given order already credited a referrer.
  - Credits are applied directly to user balance with no audit trail.
- Fix strategy:
  - Add settlement/audit tables or order-level markers to ensure reward settlement is one-time.
  - Credit referrer only inside canonical settlement transaction.
  - Log referral reward events with order/user/referrer context.

#### 5. Order creation and payment order creation do not preserve pricing integrity
- Risk: High
- Files:
  - `go-server/handlers/order.go`
  - `go-server/handlers/razorpay.go`
  - `go-server/models/order.go`
  - `go-server/models/product.go`
- Findings:
  - Draft order creation and payment order creation duplicate pricing logic.
  - Orders do not store subtotal, discount amount, coupon code, currency, or settled timestamp.
  - Status strings are loose and inconsistent.
- Fix strategy:
  - Centralize order pricing and draft creation logic in service layer.
  - Expand order schema for subtotal, discount, coupon metadata, payment currency, settlement metadata, and timestamps.
  - Normalize statuses via constants.

#### 6. JWT/auth handling is too weak and middleware has side effects
- Risk: Critical
- Files:
  - `go-server/middleware/auth.go`
  - `go-server/handlers/helpers.go`
  - `go-server/handlers/oauth.go`
  - `go-server/main.go`
- Findings:
  - Auth middleware accepts token from query string for any endpoint.
  - JWTs use loose `MapClaims` without issuer/audience/subject checks.
  - Middleware mutates subscription state on request.
  - Token validation errors are generic and not structured.
  - OAuth redirect sends token via query string to frontend callback.
- Fix strategy:
  - Move to typed JWT claims and strict claim validation.
  - Allow query-token fallback only for isolated websocket auth path.
  - Remove subscription mutation from middleware.
  - Keep auth middleware limited to authentication and context attachment.
  - Document OAuth token transfer behavior and keep contract explicit.

#### 7. Rate limiting is too weak for auth/payment/upload
- Risk: High
- Files:
  - `go-server/middleware/ratelimit.go`
  - `go-server/main.go`
- Findings:
  - Current limiter is in-memory, per-IP only, not concurrency-safe at entry mutation level, and only applied to public auth/product routes.
  - No endpoint-specific tightening for login, register, verify, webhook, or upload.
- Fix strategy:
  - Replace with a keyed limiter that supports route-specific configuration and proper locking.
  - Apply stricter limits to auth, payment verify, webhooks, and upload endpoints.

#### 8. Upload flow is unsafe
- Risk: Critical
- Files:
  - `go-server/handlers/upload.go`
  - `go-server/services/r2.go`
  - `go-server/handlers/product.go`
- Findings:
  - No content-type allowlist.
  - No file size limit.
  - Original filename is appended directly to object key.
  - Public/private asset usage is not separated.
  - Download code assumes `file_url` can always be converted into a private object key.
- Fix strategy:
  - Add upload policy with scope allowlist, size limits, MIME sniffing, filename sanitization, and generated storage keys.
  - Store private paid assets under dedicated prefix and return safe URL/key metadata.
  - Restrict secure download route to internally managed private assets only.

#### 9. DB integrity is incomplete for financial flows
- Risk: Critical
- Files:
  - `go-server/models/order.go`
  - `go-server/models/license.go`
  - `go-server/models/coupon.go`
  - `go-server/models/user.go`
  - `go-server/migrations/*.sql`
  - `go-server/config/database.go`
- Findings:
  - AutoMigrate still exists as a runtime option.
  - Missing settlement columns and audit tables for idempotency.
  - Missing indexes for common lookup paths on orders/payments/licenses/coupons.
  - Some migration coverage is incomplete; newer migrations lack paired down migrations.
  - No migration notes for safe rollout.
- Fix strategy:
  - Add versioned migration for order/payment/license/reward integrity.
  - Keep production mode migration-only; do not rely on AutoMigrate in prod.
  - Add indexes/unique constraints needed for settlement and entitlement paths.
  - Add migration notes and rollback guidance.

#### 10. Seeder and startup behavior are unsafe for production if misconfigured
- Risk: High
- Files:
  - `go-server/main.go`
  - `go-server/seeder/seeder.go`
- Findings:
  - Seeder is wired into startup and deletes config/docs when enabled.
  - This is too dangerous for production-like environments.
- Fix strategy:
  - Keep seeding explicitly opt-in and make startup logs/warnings clearer.
  - Document seeding rules and production prohibitions in README.

#### 11. Observability and auditability are insufficient
- Risk: High
- Files:
  - `go-server/middleware/logging.go`
  - `go-server/handlers/razorpay.go`
  - `go-server/handlers/order_admin.go`
  - `go-server/handlers/upload.go`
- Findings:
  - Logs lack request IDs and stable event names for payment/order/license/reward/admin actions.
  - Critical settlement and entitlement actions are not traceable end-to-end.
  - Admin updates are not audit-logged.
- Fix strategy:
  - Add request ID middleware and structured logger helpers.
  - Emit event logs for payment creation, verification, webhook receipt, settlement, license issuance, referral credit, admin order mutation, and uploads.

#### 12. Frontend/backend contract is incomplete and partially mismatched
- Risk: High
- Files:
  - `go-server/main.go`
  - `go-server/handlers/license.go`
  - `go-server/README.md`
  - `README.md`
- Findings:
  - Frontend service expects `/api/licenses/my` and `/api/licenses/validate`, but these routes are not registered.
  - Error contracts for payment verify/already-settled/download failures are not documented.
  - Root README is outdated and not frontend-integration-safe.
- Fix strategy:
  - Register missing license endpoints.
  - Preserve existing payload shapes where possible and document any additive changes.
  - Rewrite root README for frontend integration and production-safe flow.

### Files Likely Impacted
- Core app wiring:
  - `go-server/main.go`
  - `go-server/config/database.go`
- Middleware:
  - `go-server/middleware/auth.go`
  - `go-server/middleware/logging.go`
  - `go-server/middleware/ratelimit.go`
  - `go-server/middleware/maintenance.go`
- Handlers:
  - `go-server/handlers/helpers.go`
  - `go-server/handlers/auth.go`
  - `go-server/handlers/oauth.go`
  - `go-server/handlers/order.go`
  - `go-server/handlers/order_admin.go`
  - `go-server/handlers/razorpay.go`
  - `go-server/handlers/license.go`
  - `go-server/handlers/upload.go`
  - `go-server/handlers/product.go`
  - `go-server/handlers/marketing.go`
- Services to introduce/refactor:
  - `go-server/services/order_service.go`
  - `go-server/services/payment_service.go`
  - `go-server/services/license_service.go`
  - `go-server/services/upload_service.go`
  - `go-server/services/logger.go`
- Models:
  - `go-server/models/order.go`
  - `go-server/models/license.go`
  - `go-server/models/coupon.go`
  - `go-server/models/user.go`
  - additional audit/idempotency model files as needed
- DB migrations:
  - new migration(s) under `go-server/migrations/`
- Documentation:
  - `README.md`
  - `backend_fix_summary.md`
  - `migration_notes.md`
  - `backend_validation_checklist.md`

### Order Of Execution

#### Phase A: Payment and entitlement safety
1. Introduce canonical settlement service.
2. Add missing order/coupon/reward schema needed for idempotent settlement.
3. Refactor payment order creation to persist pricing inputs safely.
4. Route verify and webhook through the same settlement transaction.
5. Make settlement idempotent and traceable.
6. Move license issuance and membership/referral grants into settlement flow.

#### Phase B: Auth and security
1. Replace loose JWT parsing with typed claims and strict validation.
2. Remove query-token fallback from general auth middleware.
3. Add isolated websocket token extraction path.
4. Remove subscription mutation side effects from middleware.
5. Apply tighter rate limiting on auth/payment/upload endpoints.

#### Phase C: Upload and storage hardening
1. Add upload validation policy and storage key generator.
2. Enforce file type and size restrictions.
3. Separate public assets from private paid assets.
4. Harden secure download path to private managed objects only.

#### Phase D: DB integrity and migrations
1. Add indexes/constraints/audit tables through versioned migrations.
2. Preserve compatibility with existing frontend payloads where possible.
3. Keep AutoMigrate off for production guidance and document safe rollout.

#### Phase E: Logging and observability
1. Add request IDs and structured event logging.
2. Add settlement/admin/upload audit events.
3. Improve error context for traceability without leaking secrets.

#### Phase F: Documentation and validation
1. Rewrite root `README.md` for frontend integration.
2. Write `backend_fix_summary.md`.
3. Write `migration_notes.md`.
4. Write `backend_validation_checklist.md`.
5. Run tests and targeted validation commands.
