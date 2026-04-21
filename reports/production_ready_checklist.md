# Production Ready Checklist

## Application
- [x] Frontend builds successfully with `npm run build`
- [x] Go backend tests pass with `go test ./...`
- [x] Routed frontend flows use valid backend namespaces
- [x] Docs gating contract is respected by the frontend
- [x] Checkout and membership flows use current payment endpoints
- [x] Secure product downloads use authenticated URLs
- [x] Public UI aligns to the locked enterprise-minimal system
- [x] Public launch copy is simplified and professional

## Locked Routes
- [x] `/chat` not visually redesigned
- [x]  profile route not visually redesigned
- [x] `/account` not visually redesigned
- [x] `/admin` not visually redesigned
- [x] Locked routes only received bug/API/state fixes

## Data / Contracts
- [x] Admin identity request payload normalization added
- [x] Admin order item rendering corrected
- [x] Doc `category` field aligned
- [x] Testimonial submission requires a valid purchased product
- [x] Membership checkout normalizes plan metadata safely

## Release Operations
- [ ] Production secrets loaded and verified
- [ ] `ALLOWED_ORIGINS` configured for production domains
- [ ] `SESSION_SECRET` configured securely
- [ ] OAuth redirect URIs verified in provider dashboards
- [ ] Razorpay live keys configured
- [ ] Razorpay webhook secret configured and tested
- [ ] Object storage / download credentials verified
- [ ] AI service credentials verified if AI features are enabled

## Smoke Tests
- [ ] New user registration
- [ ] Email/password login
- [ ] OAuth login
- [ ] Paid checkout
- [ ] Membership checkout
- [ ] Secure download after purchase
- [ ] Locked doc preview vs full-access behavior
- [ ] Contact form submit + admin reply
- [ ] Admin coupon creation and validation

## Observability
- [x] `/healthz` present
- [x] `/readyz` present
- [x] `/metrics` present
- [ ] Production alerting configured
- [ ] Backup / restore plan confirmed
