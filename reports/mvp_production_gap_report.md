# MVP Production Gap Report

## Code Status
The routed MVP no longer has unresolved code-level blockers in API mapping, checkout wiring, docs access, or public design consistency.

## Remaining Release-Gate Gaps

### 1. Production Environment Validation
These cannot be completed from the local code audit alone:
- live Razorpay keys and webhook secret validation
- live OAuth callback URL validation for Google and GitHub
- production `ALLOWED_ORIGINS`, `SESSION_SECRET`, cookie settings, and storage credentials
- AI service URL / credentials if AI features are enabled in production

### 2. Manual Smoke Tests
Recommended before launch:
- register/login/logout
- OAuth login
- paid checkout + verification
- membership checkout + entitlement extension
- secure product download after purchase
- locked doc preview vs full-access behavior
- contact form submit + admin reply

### 3. Content Operations
- review live site-config hero copy, announcements, FAQs, and membership plan copy
- review seeded or admin-authored docs for clarity and category accuracy
- confirm product images and preview assets are valid production URLs

### 4. Observability And Ops
Already present in code:
- `/healthz`
- `/readyz`
- `/metrics`

Still external to the repo:
- alert routing
- dashboarding
- backup / restore runbooks
- incident escalation workflow

## Non-Blocking Technical Notes
- A legacy admin analytics screen is not part of the routed admin shell; the service layer has been normalized so it no longer depends on dead endpoints.
- Notification endpoints exist, but there is no separate routed end-user notifications page in the public app.

## Recommendation
Ship the current codebase after environment validation and manual smoke tests are completed in a production-like environment.
