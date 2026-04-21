# Data Contract Audit

## Result
The routed MVP data contracts are now aligned across frontend state, backend handlers, and persisted field names.

## Contract Fixes Applied

| Area | Backend / DB expectation | Previous mismatch | Fix applied |
| --- | --- | --- | --- |
| Identity requests | Mixed-case payloads such as `ID`, `User`, `CreatedAt`; update via `PATCH` | Frontend assumed lowercase-only fields and used `PUT` | Added response normalizer in `IdentityManager.jsx` and switched to `PATCH` |
| Admin orders | `orderItems`, `paymentStatus`, `entitlementStatus` | UI read `items` and exposed actions that did not match backend behavior | Bound drawer to `orderItems` and updated actions to grant/revoke access via `entitlementStatus` |
| Docs editor | `category`, `previewContent`, `tableOfContents`, `isPremium` | Frontend wrote `section` instead of `category` | Updated doc editor form to persist the correct field |
| Testimonials | `productId`, `content`, `rating` | Generic form lacked required `productId` | Added purchased-product lookup and explicit product selection |
| Product downloads | JSON response with `downloadUrl` from secure endpoint | UI linked directly to `fileURL` | Switched to `/api/products/:id/download` and validated `downloadUrl` |
| Membership checkout | Checkout UI needs `name`, `period`, `price`, `features` | Pricing page sometimes passed a raw product instead of a full plan object | Added resolver that merges selected product data with configured plan metadata |
| Wishlist deals | Handler expects auth + JSON body | Frontend used POST but backend only exposed GET | Added POST route; frontend body now matches the handler |
| Admin AI helpers | Description/tags/pricing request bodies | Frontend called routes the backend did not expose | Added backend routes and handlers; kept response shapes tolerant with fallbacks |
| Profile/account routing | Account page is `/account`; profile is dynamic | Some success flows redirected to `/profile` | Updated redirects and navigation to `/account` |

## Verified Backend Preview Contract
- `GET /api/docs/:id` now cleanly supports gated docs:
  - `locked: true`
  - `hasAccess: false`
  - truncated `content` or `previewContent`
- The docs viewer now respects that contract and renders a preview state plus upgrade CTA instead of assuming full access.

## Safety Notes
- `normalizeProduct`, `normalizeDoc`, `normalizeOrder`, and the new admin identity normalization reduce server/client casing drift.
- Coupon validation, payment verification, avatar upload, and secure download flows now all use the server’s actual response shapes.

## Remaining Caveat
- Content-managed text stored in site config or admin-created docs can still contain legacy wording if the production database has older values. The code now supports clean copy; final production content still needs an editorial review in the live admin CMS.
