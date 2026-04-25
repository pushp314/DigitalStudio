# Devnity Backend Integration Guide

This document is for the frontend team integrating with the Go backend in `go-server/`.

## Backend Overview

The backend is responsible for:
- Auth and identity: email/password login, OAuth login, JWT issuance, session-backed OAuth state, authz for admin and Pro access.
- Product catalog: products, tags, filtering, moderation-aware listing, secure asset download delivery.
- Orders and payments: draft order creation, Razorpay order creation, payment verification, webhook-driven settlement, idempotent order finalization.
- Licenses and entitlements: one-time license issuance, Pro subscription activation and extension, secure ownership checks.
- Marketing: coupon validation, referral reward crediting, wishlist and AI-driven offer helpers.
- Content and configuration: site config, premium docs, testimonials, reviews, contact inquiries.
- Uploads and storage: controlled admin uploads to Cloudflare R2 with scope-specific validation.
- Observability: request IDs, structured request logs, persistent audit logs for critical backend events.

Key domains currently exposed:
- Auth
- Products
- Orders
- Payments
- Licenses
- Uploads
- Config
- Docs
- Reviews
- Testimonials
- AI
- Admin dashboards and management endpoints

## Environment Setup

### Required environment variables

Backend runtime uses `go-server/.env`.

Core:
- `APP_ENV=development`
- `PORT=8080`
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/bizcode?sslmode=disable`
- `JWT_SECRET=replace-with-a-long-random-value`
- `SESSION_SECRET=replace-with-a-long-random-value`
- `FRONTEND_URL=http://localhost:5173`
- `ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `COOKIE_SAMESITE=lax`

Operational safety:
- `ENABLE_SEEDER=false`
- `ENABLE_AUTOMIGRATE=false`
- `RATE_LIMIT_RPM=120`
- `AUTH_RATE_LIMIT_RPM=20`
- `PAYMENT_CREATE_RATE_LIMIT_RPM=15`
- `PAYMENT_VERIFY_RATE_LIMIT_RPM=20`
- `UPLOAD_RATE_LIMIT_RPM=30`
- `WEBHOOK_RATE_LIMIT_RPM=120`

AI:
- `AI_SERVICE_URL=http://localhost:8081`

Cloudflare R2:
- `R2_ACCOUNT_ID=your-cloudflare-account-id`
- `R2_ACCESS_KEY_ID=your-r2-access-key-id`
- `R2_SECRET_ACCESS_KEY=your-r2-secret-access-key`
- `R2_BUCKET_NAME=your-r2-bucket`
- `R2_PUBLIC_URL=https://your-public-bucket-url`

Razorpay:
- `RAZORPAY_KEY_ID=rzp_test_replace_me`
- `RAZORPAY_KEY_SECRET=replace_me`
- `RAZORPAY_WEBHOOK_SECRET=replace_me`

OAuth:
- `GOOGLE_CLIENT_ID=replace_me`
- `GOOGLE_CLIENT_SECRET=replace_me`
- `GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback`
- `GITHUB_CLIENT_ID=replace_me`
- `GITHUB_CLIENT_SECRET=replace_me`
- `GITHUB_REDIRECT_URL=http://localhost:8080/api/auth/github/callback`

### Local development setup

1. Start PostgreSQL.
2. Copy `go-server/.env.example` to `go-server/.env`.
3. Apply SQL migrations before starting the API.
4. Start the backend:

```bash
cd go-server
go mod download
go run main.go
```

5. Start the frontend separately from `ecom/`.

### Migration setup

Use versioned SQL migrations from `go-server/migrations/`.

Example using `golang-migrate`:

```bash
migrate -path go-server/migrations -database "$DATABASE_URL" up
```

Do not depend on runtime `AutoMigrate` for production or shared environments.

### Seeding rules

- Seeder is opt-in only via `ENABLE_SEEDER=true`.
- Seeder is blocked in production mode.
- Seeder is for local/dev bootstrap only.
- Seeder deletes and recreates some content-oriented records, so do not use it on any environment with real data.

### Must never be enabled in production

- `ENABLE_SEEDER=true`
- `ENABLE_AUTOMIGRATE=true`
- test Razorpay keys
- placeholder OAuth secrets
- wide-open `ALLOWED_ORIGINS=*` unless you intentionally disable credentials

## API Contract Guide

All API routes below are rooted at `/api`.

### Auth

`POST /auth/register`
- Auth: public
- Request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "strongpass",
  "referrerCode": "OPTIONALCODE"
}
```

- Response:

```json
{
  "token": "jwt",
  "user": {
    "id": 1,
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "role": "user",
    "subscriptionPlan": "free",
    "isPro": false
  }
}
```

- Edge cases:
  - email is normalized to lowercase
  - duplicate emails return `400`
  - invalid referrer code is ignored, not fatal

`POST /auth/login`
- Auth: public
- Request:

```json
{
  "email": "ada@example.com",
  "password": "strongpass"
}
```

- Response: same shape as register
- Failure cases:
  - `401` invalid credentials
  - `403` suspended account
  - `429` rate limited

`GET /auth/me`
- Auth: bearer token required
- Response: normalized current user object from backend
- Important:
  - frontend must treat this as the source of truth for role and subscription state
  - expired Pro state is normalized on response even if stale DB flags existed

`GET /auth/google/login`
`GET /auth/github/login`
- Auth: public
- Behavior: starts OAuth flow

`GET /auth/google/callback`
`GET /auth/github/callback`
- Auth: session state validated
- Behavior:
  - backend redirects to `${FRONTEND_URL}/auth/callback?token=...&user=...`
  - frontend must immediately persist the token, decode `user`, then remove query params from browser history

### Products

`GET /products`
- Auth: public
- Query params:
  - `keyword`
  - `category`
  - `priceMin`
  - `priceMax`
  - `productType`
  - `statusFlag`
  - `featured=true`
  - `includeAll=true` for admin-capable views only
  - `limit`
- Response: array of product objects
- Important:
  - public responses are moderation filtered
  - do not assume client filters define purchasability; backend recomputes order totals independently

`GET /products/:id`
- Auth: public
- Response: one product object

`GET /products/:id/download`
- Auth: bearer token required
- Response:

```json
{
  "downloadUrl": "https://...",
  "expiresIn": "15m"
}
```

- Important edge cases:
  - backend checks entitlement every time
  - response may be a short-lived presigned URL, a managed public URL, or a compatible external HTTPS URL
  - frontend should start download immediately and not cache download URLs
- Failure cases:
  - `403` if user is not entitled
  - `409` if product asset is not configured for managed delivery

`POST /products`
`PUT /products/:id`
`DELETE /products/:id`
- Auth: admin only
- Request body fields are based on product editor payload:
  - `title`
  - `slug`
  - `description`
  - `longDescription`
  - `price`
  - `category`
  - `productType`
  - `statusFlags`
  - `image`
  - `liveDemo`
  - `githubRepo`
  - `fileURL`
  - `version`
  - `requiresSubscription`
  - `videoUrl`
  - `courseOutline`
  - `duration`
  - `snippetLanguage`
  - `snippet`
  - `techStack`
  - `documentation`
  - `tags`
  - `previewImages`
  - `features`
  - `pages`

### Orders

`POST /orders`
- Auth: bearer token required
- Purpose: create a backend-priced draft order without opening Razorpay
- Request:

```json
{
  "items": [
    { "productId": 17, "quantity": 1 }
  ]
}
```

- Response:

```json
{
  "id": 42,
  "userId": 7,
  "subtotalPrice": 4999,
  "discountAmount": 0,
  "totalPrice": 4999,
  "currency": "INR",
  "status": "pending",
  "paymentStatus": "pending",
  "entitled": false,
  "orderItems": [
    { "productId": 17, "quantity": 1, "price": 4999 }
  ]
}
```

`GET /orders/myorders`
- Auth: bearer token required
- Response: array of user orders with `orderItems[].product`
- Important:
  - read endpoint is now read-only; it no longer mutates or self-heals entitlements on fetch
  - frontend should use this endpoint after payment verify to refresh ownership state

`GET /admin/orders`
`GET /admin/orders/:id`
- Auth: admin only

`PATCH /admin/orders/:id`
- Auth: admin only
- Allowed:
  - `status`: `pending`, `failed`, `refunded`, `paid`
  - `paymentStatus`: `pending`, `failed`, `refunded`, `paid`
  - `entitlementStatus`: `auto`, `granted`, `revoked`
- Important:
  - admin endpoint will reject unpaid-to-paid promotion unless the order was already settled by verified payment flow
  - use payment flow, not admin patching, to settle money

### Payments

`POST /payments/create-order`
- Auth: bearer token required
- Request:

```json
{
  "items": [
    { "productId": 17, "quantity": 1 }
  ],
  "couponCode": "SAVE20"
}
```

- Response:

```json
{
  "localOrderId": 42,
  "orderId": "order_RazorpayId",
  "amount": 499900,
  "currency": "INR",
  "keyId": "rzp_live_xxx",
  "paymentStatus": "pending"
}
```

- Important:
  - amount is returned in paise
  - backend computes totals from product DB state
  - coupon validation and reservation happen on backend
  - invalid or exhausted coupons return `400`

`POST /payments/verify`
- Auth: bearer token required
- Request:

```json
{
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature"
}
```

- Response:

```json
{
  "status": "captured",
  "paymentStatus": "paid",
  "entitled": true,
  "orderId": 42,
  "alreadySettled": false,
  "message": "Payment verified securely!"
}
```

- Important:
  - verify and webhook now use the same idempotent settlement logic
  - repeated verify calls on an already settled order are safe and return `alreadySettled: true`
  - frontend must still refetch order and license state after success
- Failure cases:
  - `403` invalid signature
  - `404` order not found
  - `400` payment not captured
  - `429` rate limited

`POST /webhooks/razorpay`
- Auth: Razorpay webhook signature only
- Frontend: never call directly

### Licenses

`GET /licenses/my`
- Auth: bearer token required
- Response: user license list with preloaded `product` and `order`

`POST /licenses/validate`
- Auth: public
- Request:

```json
{
  "licenseKey": "DS-...",
  "productId": 17
}
```

- Response:

```json
{
  "valid": true,
  "license": {
    "id": 1,
    "licenseKey": "DS-...",
    "status": "active"
  }
}
```

`POST /admin/licenses/issue`
- Auth: admin only
- Request:

```json
{
  "orderId": 42
}
```

- Important:
  - issuance is idempotent
  - safe for repair operations on already-paid orders

### Uploads

`POST /upload`
- Auth: admin only
- Content type: `multipart/form-data`
- Form fields:
  - `file` required
  - `scope` optional, defaults to `public_image`
- Allowed scopes:
  - `public_image`: `.jpg`, `.jpeg`, `.png`, `.webp`, max 10 MB
  - `private_asset`: `.zip`, `.pdf`, max 100 MB
- Response:

```json
{
  "filePath": "https://public-bucket/... or private/assets/...",
  "storageKey": "public/images/... or private/assets/...",
  "scope": "public_image",
  "contentType": "image/png",
  "size": 123456
}
```

- Integration rules:
  - current frontend image upload can keep omitting `scope`
  - use `scope=private_asset` for paid bundles or docs meant for secure delivery
  - treat `storageKey` as the canonical backend reference

### Config

`GET /config`
- Auth: public
- Response: public site config
- Important:
  - backend strips `aiSettings.apiKey`
  - this endpoint is safe for public bootstrapping

`GET /config/admin`
- Auth: admin only
- Response: full config including admin-only fields

`PUT /config`
- Auth: admin only
- Request body fields:
  - `heroTitle`
  - `heroSubtitle`
  - `heroImages`
  - `heroVisualEffect`
  - `announcements`
  - `showAnnouncement`
  - `supportEmail`
  - `features`
  - `memberPlans`
  - `faqs`
  - `socialProof`
  - `showcaseItems`
  - `contact`
  - `aiSettings`
  - `maintenanceMode`
  - `maintenanceMessage`
- Important:
  - if frontend sends blank `aiSettings.apiKey`, backend preserves the existing stored secret

### Docs

`GET /docs`
- Auth: public
- Query params:
  - `category`
  - `search`
- Response: list of docs with `content` stripped out

`GET /docs/:id`
- Auth: optional bearer token
- Behavior:
  - anonymous users can fetch premium docs but receive preview content only
  - admins and Pro users receive full content
- Response includes:
  - `hasAccess`
  - `locked`
  - `content`

`POST /docs`
`PUT /docs/:id`
`DELETE /docs/:id`
- Auth: admin only
- Request fields:
  - `title`
  - `description`
  - `content`
  - `previewContent`
  - `category`
  - `price`
  - `isPremium`
  - `icon`
  - `tableOfContents`
  - `tags`

### Admin endpoints worth knowing

`GET /admin/users`
`PATCH /admin/users/:id`
`POST /admin/users/:id/reset-password`
- Auth: admin only
- Important:
  - these calls are audit-logged

`GET /admin/marketing/coupons`
`POST /admin/marketing/coupons`
`DELETE /admin/marketing/coupons/:id`
- Auth: admin only
- Important:
  - delete endpoint deactivates coupon instead of hard deleting it

## Frontend Integration Rules

- Always send JWTs in the `Authorization: Bearer <token>` header.
- Do not rely on query-string tokens except:
  - OAuth callback processing on the frontend route
  - websocket handshake path where browser header control is limited
- Do not trust:
  - local cart totals
  - local coupon math
  - local ownership flags
  - local Pro status
- Always treat the backend as source of truth for:
  - payable amount
  - order settlement
  - entitlement
  - license existence
  - download eligibility
- After any successful payment verify, refetch:
  - `/api/orders/myorders`
  - `/api/auth/me`
  - `/api/licenses/my` if license-based UI is shown
- Cache guidance:
  - cache catalog and docs list briefly
  - refetch orders, entitlements, and auth state after any payment or account mutation
  - never cache download URLs

## Payment Flow

Safe frontend flow:

1. Call `POST /api/payments/create-order`.
2. Use returned `orderId`, `amount`, `currency`, and `keyId` to open Razorpay Checkout.
3. On Razorpay success callback, call `POST /api/payments/verify`.
4. Backend verifies signature, checks payment capture state, and runs canonical settlement.
5. Backend finalizes order, membership extension, partner reward credit, and license issuance exactly once.
6. Frontend refetches order, auth, and license state before showing durable success UI.

Success UI rules:
- Do not show “purchase successful” when Razorpay client callback fires.
- Show success only after `/api/payments/verify` returns success.
- If verify returns `alreadySettled: true`, treat it as success and refresh state.

## Error Handling Guide

Expired token:
- Backend response: `401`
- Frontend action:
  - clear local auth token
  - redirect to login
  - preserve intended destination when appropriate

Failed verify:
- Backend response: `400`, `403`, or `404`
- Frontend action:
  - show payment verification failed
  - do not grant ownership locally
  - offer retry or support link

Already settled order:
- Backend response: `200` with `alreadySettled: true`
- Frontend action:
  - treat as success
  - refetch `/api/orders/myorders`, `/api/auth/me`, `/api/licenses/my`

Missing license after payment:
- Backend action: settlement flow issues licenses transactionally
- Frontend action:
  - refetch `/api/licenses/my`
  - if still missing, fetch `/api/orders/myorders`
  - if order is paid but license is absent, raise support or admin repair flow

Upload rejection:
- Backend response: `400`
- Frontend action:
  - surface exact validation error
  - show accepted file types and size limits

Rate limit errors:
- Backend response: `429`
- Frontend action:
  - back off and retry later
  - respect `Retry-After` header when present

Maintenance mode:
- Backend response: `503` with `{ maintenance: true, message: "..." }`
- Frontend action:
  - show maintenance UI
  - avoid retry loops

## Production Safety Notes

- Never trust local cart prices or coupon values.
- Never assume Razorpay client success means backend settlement succeeded.
- Never unlock downloads or Pro UI until backend confirms settlement.
- Never expose backend secrets, Razorpay secrets, or R2 credentials to the frontend.
- Never enable runtime AutoMigrate or Seeder in production.
- Use `private_asset` uploads for paid bundles and secure docs whenever possible.
- Treat external product file URLs as compatibility fallback only, not the recommended production delivery model.
