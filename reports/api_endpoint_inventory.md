# API Endpoint Inventory

## Scope
Audit based on `go-server/main.go`, current routed frontend usage in `ecom/src`, and the fixes applied in this pass.

## Launch Summary
- Backend routing is internally consistent for the routed MVP.
- Frontend consumers are now aligned to the active backend namespaces.
- Two missing launch-critical backend endpoints were added during this pass:
  - `POST /api/ai/generate-description`
  - `POST /api/ai/suggest-tags`
  - `POST /api/ai/recommend-pricing`
  - `POST /api/marketing/wishlist-deals`
- Secure asset delivery is now enforced through `GET /api/products/:id/download`.

## Inventory By Domain

| Domain | Endpoints | Auth | Frontend status |
| --- | --- | --- | --- |
| Health / Ops | `GET /healthz`, `GET /readyz`, `GET /metrics` | Public | Server-only, healthy |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Mixed | Mapped in auth flow |
| OAuth | `GET /api/auth/google/login`, `GET /api/auth/google/callback`, `GET /api/auth/github/login`, `GET /api/auth/github/callback`, `GET /api/auth/github/connect` | Mixed | Mapped in login / callback flow |
| Products | `GET /api/products`, `GET /api/products/:id`, `GET /api/products/owned`, `GET /api/products/:id/share`, `GET /api/products/:id/download`, admin CRUD | Mixed | Mapped in home, listing, detail, admin, downloads |
| Reviews | `POST /api/products/:id/review`, `GET /api/products/:id/reviews`, `GET /api/products/:id/review-eligibility`, admin review moderation | Mixed | Mapped in product detail + admin |
| Orders | `POST /api/orders`, `GET /api/orders/myorders`, admin order list/detail/update | Auth / admin | Mapped in checkout, account, admin |
| Payments | `POST /api/payments/create-order`, `POST /api/payments/verify`, `POST /api/webhooks/razorpay` | Auth / webhook | Mapped in checkout and membership checkout |
| Licenses | `GET /api/licenses/my`, `POST /api/licenses/validate`, `POST /api/admin/licenses/issue` | Mixed | Mapped in account/admin |
| Profile | `GET /api/profile/:id`, `GET /api/users/:id/profile`, `GET /api/profile`, `PUT /api/profile`, `POST /api/profile/upload-avatar`, GitHub request endpoints | Mixed | Mapped in account, profile, chat username bootstrap, admin identity |
| Config | `GET /api/config`, `GET /api/config/admin`, `PUT /api/config` | Mixed | Mapped in public shell and admin settings |
| Docs | `GET /api/docs`, `GET /api/docs/:id`, admin docs CRUD | Mixed | Mapped in docs listing/viewer and admin docs editor |
| AI | `POST /api/ai/generate-description`, `POST /api/ai/suggest-tags`, `POST /api/ai/recommend-pricing`, `GET /api/ai/recommend`, `POST /api/ai/roadmap`, `POST /api/ai/docsummary`, `POST /api/ai/doc-universal`, `POST /api/ai/chat` | Auth / pro for protected routes | Mapped in admin editors, templates AI modal, docs assistant |
| Chat | `GET /api/chat/ws`, `GET /api/chat/history`, message CRUD, pin, report | Auth | Mapped in `/chat` |
| Analytics | `GET /api/analytics/metrics`, `GET /api/admin/intelligence/metrics` | Admin | Routed admin surface uses `/api/admin/intelligence/metrics` |
| Testimonials | `GET /api/testimonials`, `POST /api/testimonials`, admin moderation CRUD | Mixed | Mapped in testimonials page + admin |
| Marketing | `GET /api/marketing/validate`, `GET/POST /api/marketing/wishlist-deals`, `POST /api/marketing/personalized-offers`, admin coupon CRUD | Mixed | Coupon and wishlist flows mapped; coupon CRUD mapped |
| Showcase | `POST /api/showcase`, admin showcase moderation | Mixed | Admin + public contribution flow mapped |
| Contact | `POST /api/contact`, `GET /api/my-inquiries`, admin inquiry list/reply | Mixed | Contact page + admin inbox mapped |
| Notifications | `GET /api/notifications`, `POST /api/notifications/broadcast` | Auth / admin | Backend present; no dedicated end-user inbox page in routed public UI |

## Route Notes
- `/api/admin/users` is the correct admin user namespace. Frontend admin user actions now point there.
- `/api/admin/github-requests` is the correct identity-request namespace. The admin identity tool now uses `PATCH`, matching the server.
- `/api/admin/intelligence/metrics` is the canonical admin analytics endpoint used by the live admin dashboard.
- `/api/marketing/wishlist-deals` now supports both `GET` and `POST`; the frontend uses `POST` with JSON body.

## Non-Launch-Path Legacy
- `ecom/src/pages/admin/Analytics.jsx` is not used by the routed admin shell. The client analytics service was normalized so it no longer points at nonexistent backend URLs.

## Status
Code-level API inventory is launch-ready for the routed MVP. Remaining release checks are operational: live secrets, callback URLs, payment webhook validation, and environment smoke tests.
