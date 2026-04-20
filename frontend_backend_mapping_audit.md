# Frontend ↔ Backend Mapping Audit

## Result
The routed frontend now maps correctly to the active backend API surface for launch-critical flows.

## Fixed Mappings

| Flow | Frontend entry | Backend contract | Fix applied |
| --- | --- | --- | --- |
| Admin users | `userService`, `UserList` | `/api/admin/users`, `/api/admin/users/:id/reset-password` | Repointed admin user actions to the admin namespace and wired real reset-password calls |
| Admin testimonials | `testimonialService.adminList` | `/api/admin/testimonials` | Fixed malformed query-string construction |
| Admin overview metrics | `Dashboard.jsx` | `/api/admin/intelligence/metrics` | Added `analyticsService.getAnalyticsData()` and standardized admin overview to that route |
| Admin AI helpers | `ProductEdit.jsx`, `DocEdit.jsx` | `/api/ai/generate-description`, `/api/ai/suggest-tags`, `/api/ai/recommend-pricing` | Added missing backend endpoints and handlers |
| Wishlist deals | `Wishlist.jsx` | `POST /api/marketing/wishlist-deals` | Added backend POST route to match frontend body payload |
| Secure downloads | `ProductHeader.jsx` | `GET /api/products/:id/download` | Replaced direct file links with authenticated download flow |
| Account redirects | checkout, docs, auth callback, template CTA, mobile nav | `/account` route | Removed broken `/profile` navigations that fell into the public-profile dynamic route |
| Identity request moderation | `IdentityManager.jsx` | `GET /api/admin/github-requests`, `PATCH /api/admin/github-requests/:id` | Fixed request shape normalization and method mismatch |
| Docs admin save | `DocEdit.jsx` | `category` field | Replaced stale `section` field with `category` |
| Testimonials submission | `TestimonialForm.jsx` | `{ productId, content, rating }` | Added purchased-product selection when the form is used outside a product page |
| Membership checkout | `PricingPlan.jsx`, `SubscriptionCheckout.jsx`, `TemplateGrid.jsx` | membership product + plan metadata | Normalized checkout plan data so billing cycle/features come from either config plan data or product fallback |
| Admin orders | `OrderList.jsx` | `orderItems`, `entitlementStatus` | Fixed item rendering and updated grant/revoke controls to match backend expectations |

## Verified Routed Flows
- Auth: login, register, OAuth callback, session fetch
- Public catalog: home, templates list, product detail, reviews
- Checkout: cart, coupon validation, Razorpay order creation, payment verification
- Membership: pricing selection, subscription checkout
- Docs: list, detail, access gating, doc AI assistant
- Social proof: testimonials list and create flow
- Contact: public submit and admin reply flow
- Admin: products, docs, orders, users, coupons, testimonials, showcase, contact, site config, identity requests

## Low-Risk Legacy Areas
- `ecom/src/pages/admin/Analytics.jsx` is not a routed page in `App.jsx`. Its service dependency was normalized so it no longer calls dead endpoints, but it is not part of the launch-critical admin flow.
- Notification endpoints exist in the backend, but there is no dedicated routed end-user notifications page in the public app.

## Conclusion
All launch-critical routed pages now hit the correct backend routes, use the correct HTTP methods, and align with the active backend namespaces.
