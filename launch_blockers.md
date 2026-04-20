# Launch Blockers

## Code Blockers
No open code blockers remain in the routed MVP flows.

## Resolved In This Pass
- admin user API mismatch
- admin testimonial query-string bug
- missing admin analytics client method
- missing AI helper backend endpoints
- missing wishlist POST backend route
- secure download bypass on product detail
- broken `/profile` redirects
- doc `section` vs `category` mismatch
- testimonial form missing `productId`
- admin order `items` vs `orderItems` mismatch
- public UI system drift
- hype-heavy public copy

## Remaining Release Gates
These are not code defects, but they must be completed before pressing the production launch button:
- validate live payment flow and Razorpay webhook in a production-like environment
- validate Google/GitHub OAuth callbacks against production URLs
- confirm production environment variables and secrets
- review production CMS/site-config content for older marketing phrasing

## Current Assessment
No unresolved code blockers. Remaining blockers are operational validation steps.
