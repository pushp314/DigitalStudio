# Feature Checklist Audit

Date: 2026-04-18  
Scope: current workspace code in `go-server`, `ecom/src`, and `ai-service`. No application code was changed as part of this review.

## Executive Summary

The marketplace is **substantially implemented**, but it is **not yet fully free of mock or placeholder behavior**. The strongest production-ready areas are authentication, OAuth, Razorpay payment verification, the API-backed catalogue route, premium-doc CRUD, and the base admin/product flows. The biggest remaining gaps are:

- the public home/detail experience still falls back to local mock product data
- product preview visuals are still mostly static, even though the backend model already supports richer dynamic media
- order history and analytics do not restrict themselves to paid orders
- reviews are not purchase-gated
- subscriptions and licenses are not fully implemented
- admin coverage is missing operational areas such as orders, review moderation, role/plan management, payment/AI settings, and product media management

The codebase also contains a mix of:

- **operational mock data** that can still affect real runtime behavior
- **decorative placeholder content** used for marketing sections
- **legitimate test fixtures**

## 1. Feature Checklist

Status legend: `Implemented`, `Partial`, `Missing`

| Feature | Status | Evidence | Audit Notes |
| --- | --- | --- | --- |
| Email/password auth | Implemented | `go-server/main.go:77-82`<br>`go-server/handlers/auth.go:18-45`<br>`go-server/handlers/auth.go:52-79`<br>`ecom/src/context/AuthContext.jsx:44-62`<br>`ecom/src/pages/Auth/Login.jsx:14-27` | Registration and login both call `respondAuthSuccess`, so the intended flow is token issuance immediately after signup/login. Frontend stores the token, then fetches `/auth/me`. Error handling is present for invalid payloads and invalid credentials. |
| Google/GitHub OAuth | Implemented | `go-server/main.go:124-128`<br>`go-server/handlers/oauth.go:40-47`<br>`go-server/handlers/oauth.go:49-80`<br>`go-server/handlers/oauth.go:83-143`<br>`go-server/handlers/oauth.go:145-172`<br>`ecom/src/pages/Auth/Login.jsx:25-27`<br>`ecom/src/pages/Auth/OAuthCallback.jsx:24-38` | State validation, provider callback handling, account linking, token-based redirect, and frontend session completion are all present. |
| Role/admin route protection | Implemented | `go-server/middleware/auth.go:15-104`<br>`ecom/src/App.jsx:90-97` | JWT auth, `ProMiddleware`, and `AdminMiddleware` exist. Frontend protects `/profile` and admin routes. |
| Product catalogue listing | Partial | `go-server/main.go:84-90`<br>`go-server/handlers/product.go:12-40`<br>`ecom/src/pages/Templates.jsx:22-28`<br>`ecom/src/components/TemplateGrid.jsx:10-18` | `/templates` is API-backed, but `TemplateGrid` still falls back to local mock data when no `items` prop is passed. That means the public home page is not purely dynamic yet. |
| Product search/filter | Partial | `go-server/handlers/product.go:13-32`<br>`ecom/src/services/productService.js:3-11`<br>`ecom/src/pages/Templates.jsx:17-68` | Backend supports `keyword`, `category`, `priceMin`, and `priceMax`. Frontend only sends `keyword`; category/type filtering is client-side after fetch. Frontend also offers `mobile` and `tool` types that do not exist in the backend enum. |
| Product detail page | Partial | `go-server/handlers/product.go:43-52`<br>`ecom/src/pages/TemplatesDetails.jsx:20-29`<br>`ecom/src/components/TemplateDetails.jsx:65-115` | The page fetches from the API first, but falls back to `ecom/src/data/templates.js` on failure. The detail UI expects `features` and `pages`, but those are only present in mock data, not in the backend `Product` API contract. |
| Cart | Implemented | `ecom/src/hooks/useLocalStorageState.js:3-40`<br>`ecom/src/context/CartContext.jsx:7-36`<br>`ecom/src/pages/Cart.jsx` | Local cart storage and cross-tab synchronization are present. This is operational, but cart state is frontend-only rather than server-persisted. |
| Wishlist | Implemented | `ecom/src/hooks/useLocalStorageState.js:24-38`<br>`ecom/src/context/WishlistContext.jsx:7-31` | Wishlist storage is local and cross-tab synchronized. No backend persistence is present. |
| Razorpay checkout | Implemented | `go-server/main.go:149-154`<br>`go-server/handlers/razorpay.go:23-97`<br>`go-server/handlers/razorpay.go:105-162`<br>`go-server/handlers/razorpay.go:164-221`<br>`ecom/src/pages/Checkout.jsx:45-109` | Backend creates a local pending order, creates a Razorpay order, verifies signature, verifies captured payment, and marks the order as paid. Frontend handles SDK loading, checkout, and verification errors. |
| Order history / downloads | Partial | `go-server/handlers/order.go:71-89`<br>`ecom/src/pages/Profile.jsx:22-35`<br>`ecom/src/pages/Profile.jsx:123-177` | Orders are loaded and downloads are correctly gated behind `entitled && fileURL`, but `MyOrders` returns **all** orders for the user, not paid-only orders. The profile tab is called “My Products” yet shows pending orders too. |
| Reviews | Partial | `go-server/main.go:145-147`<br>`go-server/handlers/review.go:16-61`<br>`ecom/src/components/ProductReviews.jsx:30-45`<br>`ecom/src/components/ProductReviews.jsx:93-132` | Create/list flows are wired and duplicate reviews are blocked per user/product. However, there is no purchase verification or moderation workflow. The UI says “after purchase,” but the backend only requires authentication. |
| Premium docs | Partial | `go-server/main.go:112-119`<br>`go-server/handlers/doc.go:12-57`<br>`go-server/handlers/doc.go:72-147`<br>`go-server/handlers/doc.go:149-159`<br>`ecom/src/pages/Docs.jsx`<br>`ecom/src/pages/DocViewer.jsx:15-35`<br>`ecom/src/components/admin/DocsManager.jsx:7-146` | Listing, preview-locking, detail view, and admin CRUD are present. Access is currently plan-based (`admin` or `pro`) rather than order/license-based. Backend supports TOC/tags, but the admin UI does not expose them. |
| AI recommendations / summaries | Partial | `go-server/main.go:131-135`<br>`go-server/handlers/ai.go:13-51`<br>`go-server/handlers/ai_docs.go:16-54`<br>`ai-service/main.go:33-104`<br>`ecom/src/components/ui/AIRecommendationModal.jsx:13-27` | Recommendation and doc-summary endpoints both exist, and the AI service proxy is implemented. Only recommendations are wired into the frontend. I found no frontend caller for `/ai/docsummary`. |
| Site configuration | Partial | `go-server/main.go:106-110`<br>`go-server/handlers/config.go:11-29`<br>`go-server/handlers/config.go:32-69`<br>`ecom/src/context/ConfigContext.jsx:7-40`<br>`ecom/src/components/admin/SiteConfigForm.jsx:8-50` | Runtime config is fetched from the API, but the backend auto-creates placeholder values on first boot. Backend supports a `features` map, yet the admin form edits only hero/announcement/support email. Frontend route gating still comes from env flags in `ecom/src/config/features.js:10-18`, not site config. |
| Cloudflare R2 uploads | Partial | `go-server/main.go:122`<br>`go-server/handlers/upload.go:10-25`<br>`go-server/services/r2.go:20-59`<br>`ecom/src/pages/Admin/ProductEdit.jsx:89-106` | Uploads to R2 are implemented and used by admin product edit for the downloadable product file. Product hero images and preview galleries are still manual URL text fields, not media uploads. |
| Analytics dashboard | Partial | `go-server/main.go:137-143`<br>`go-server/handlers/analytics.go:11-33`<br>`ecom/src/pages/GodMode/Analytics.jsx`<br>`ecom/src/pages/Admin/Dashboard.jsx:100-113` | Sales and top-products endpoints exist, and the admin analytics page uses React Query. The backend aggregates all order items without filtering paid orders, and “top products” is just `LIMIT 5` with no ranking. The legacy admin dashboard still hard-codes `$0` total revenue. |
| Admin product CRUD | Partial | `go-server/main.go:84-90`<br>`ecom/src/pages/Admin/ProductEdit.jsx:8-25`<br>`ecom/src/pages/Admin/ProductEdit.jsx:111-130`<br>`ecom/src/pages/Admin/ProductEdit.jsx:181-242` | Product create/edit/delete is wired. The form covers core fields plus `previewImages`, `liveDemo`, `githubRepo`, and `requiresSubscription`, but does not expose `videoUrl`, `snippet`, `courseOutline`, `duration`, `moderationStatus`, or richer media controls. |
| Admin docs CRUD | Implemented (basic) | `go-server/main.go:112-119`<br>`go-server/handlers/doc.go:72-147`<br>`ecom/src/components/admin/DocsManager.jsx:25-146` | Base doc CRUD is present and operational. It is basic rather than complete because TOC/tags/access-rule editing are missing from the admin UI. |
| Admin users / role-plan management | Partial | `go-server/main.go:100-104`<br>`ecom/src/components/admin/UserList.jsx:7-65` | User listing exists, but it is read-only. There is no admin flow to edit role, plan, suspension state, or entitlement overrides. |
| Testimonials moderation | Partial | `go-server/main.go:156-167`<br>`go-server/handlers/testimonial.go:16-106`<br>`go-server/models/testimonial.go:7-15`<br>`ecom/src/components/admin/TestimonialManager.jsx:14-52`<br>`go-server/migrations/000001_init.up.sql:105-133` | Current workspace includes user submission and admin approve/reject/delete flows. However, the SQL migration file defines `reviews`, then `licenses`, then `posts` with **no testimonials table**, so this feature is not safe on migration-only environments unless AutoMigrate is enabled. |
| Subscription lifecycle | Missing | `ecom/src/config/features.js:10-18`<br>`ecom/src/pages/Profile.jsx:180-189`<br>`go-server/middleware/auth.go:77-91` | The app recognizes plans and gates Pro features, but there is no backend subscription purchase/change/cancel flow. Profile plan cards are presentational only. |
| Licenses | Missing | `go-server/models/license.go:13-22`<br>`go-server/migrations/000001_init.up.sql:114-121` | The model expects a user/product/order/license-key entitlement table, but the SQL migration creates a different blog-style `licenses` table (`name`, `slug`, `description`). No license issuance, lookup, or admin UI exists. |

## 2. Residual Mock / Placeholder Data

| Source | Classification | Current Use | Replacement Plan |
| --- | --- | --- | --- |
| `ecom/src/data/templates.js:1-116` | Operational mock | Hard-coded product catalogue with local `features`, `pages`, and `example.com` preview/purchase URLs. Used as the fallback data contract for public product UI. | Remove the fallback entirely for production routes. If the UI needs `features` and `pages`, add them to the backend product contract as JSONB fields or normalized child tables such as `product_features` and `product_pages`. |
| `ecom/src/components/TemplateGrid.jsx:10-18` + `ecom/src/pages/Home.jsx:11-15` | Operational mock | Home page calls `<TemplateGrid limit={3} />` with no `items`, so the featured section renders mock `templates.js` data instead of API data. | Replace with a dedicated API-backed “featured products” query. Examples: `GET /products?featured=true&limit=3` or `GET /products?statusFlag=featured`. |
| `ecom/src/pages/TemplatesDetails.jsx:24-26` | Operational mock | Product detail silently falls back to local template data if API fetch fails. This masks real API/data issues and keeps old mock fields alive. | Show a proper error state instead of fallback data. If graceful offline support is needed, cache API responses in React Query rather than loading a separate mock catalogue. |
| `ecom/src/components/TemplateCarousel.jsx:3-259` | Operational mock | The “Preview Layouts” carousel is entirely static and is not connected to any product field. | Replace with a dynamic gallery driven by `previewImages`, `videoUrl`, and `liveDemo`. A lightweight version can render screenshots first and optionally open an embedded live preview. |
| `ecom/src/components/TemplateDetails.jsx:65-115` | Operational mock | The detail page still expects `features` and `pages`, which only exist in `templates.js`. It also hard-codes `License: Standard` at `132-135`. | Either remove these sections until the backend owns the data, or add dynamic product metadata fields and render them from the API. License text should be based on a real entitlement/license model, not a hard-coded string. |
| `go-server/seeder/seeder.go:12-105` | Operational mock / dev seed | When `ENABLE_SEEDER=true`, the backend seeds an admin user and three demo products with Unsplash images. | Keep only for local/staging use. Gate it by environment, make the seed dataset clearly non-production, or replace it with explicit factory scripts used only in development. |
| `go-server/handlers/config.go:13-26` | Operational placeholder | First boot auto-creates site config with `Welcome to DigitalStudio`, `Welcome!`, and `support@example.com`. | Seed site config from deployment-specific env or an admin onboarding screen. At minimum, replace `support@example.com` with a required config input. |
| `ecom/src/context/ConfigContext.jsx:8-19` | Decorative placeholder / boot fallback | Frontend boots with default hero copy and feature flags until `/config` resolves. | Keep only as a temporary loading fallback, or swap to a skeleton/loading state so placeholder marketing text never flashes in production. |
| `ecom/src/components/FAQSection.jsx:61-92` | Decorative placeholder | Hard-coded FAQ entries with mismatched questions and answers. | Move FAQs into site configuration or a `faqs` table so admins can manage them. |
| `ecom/src/components/FeaturedHeader.jsx:4-11` + `ecom/src/components/ProductHeader.jsx:46-53` + `ecom/src/components/ProductHeader.jsx:182-196` | Decorative placeholder | Hard-coded avatar stacks and social proof (“4.9/5”, “Loved by 1000+ creators”). | Replace with real review aggregates and optionally featured customer avatars/testimonials fetched from approved reviews/testimonials. |
| `ecom/src/components/ResponsiveShowcase.jsx:4-10` | Decorative placeholder | Entire “William Thompson” showcase is a mock site preview unrelated to marketplace products. | Replace with real featured product previews or a rotating gallery of actual marketplace assets. |
| `ecom/src/components/ContactSection.jsx:26-125` | Decorative placeholder | Contact email/address/phone are static and the form button is `type="button"`, so submission is inert. | Pull contact details from site config and either wire the form to a backend/contact provider or remove the inert form. |
| `go-server/handlers/auth_test.go`, `go-server/handlers/contracts_test.go`, `go-server/handlers/test_helpers_test.go` | Test fixture | These files are test-only helpers/fixtures. | Keep as-is; they are not a production problem. |

## 3. Images and Preview Links

### Current Field Coverage

| Field | Backend Model | Persisted by Product API/Admin UI | Rendered in Public UI | Notes |
| --- | --- | --- | --- | --- |
| `image` | Yes: `go-server/models/product.go:41` | Yes: `go-server/handlers/product.go:64-74`, `88-106`, `149-157`; admin text field at `ecom/src/pages/Admin/ProductEdit.jsx:181-183` | Yes: cards/detail/cart/checkout/profile all use it | This is the most consistently dynamic media field today. |
| `liveDemo` / `previewUrl` | Yes: `go-server/models/product.go:42`, derived to `PreviewURL` at `go-server/handlers/product.go:205-207` | Yes: request + admin UI at `go-server/handlers/product.go:65`, `98`, `150` and `ecom/src/pages/Admin/ProductEdit.jsx:231-237` | Yes: `ecom/src/components/ProductHeader.jsx:134-146`, `ecom/src/components/TemplateDetails.jsx:31-41` | `ProductHeader` defaults `previewUrl` to `#` at `37-42`, so the Preview button can become a dead link instead of being hidden. |
| `previewImages[]` | Yes: `go-server/models/product.go:52` | Yes: `go-server/handlers/product.go:73`, `105`, `157`; admin comma-separated field at `ecom/src/pages/Admin/ProductEdit.jsx:240-242` | No | Frontend normalizes it at `ecom/src/utils/normalizers.js:74-80` but no public component renders it. |
| `fileURL` | Yes: `go-server/models/product.go:44` | Yes: upload flow + admin field at `ecom/src/pages/Admin/ProductEdit.jsx:185-202` | Yes: download link in profile at `ecom/src/pages/Profile.jsx:158-166` | This is the only product asset currently uploaded through the R2 flow. |
| `githubRepo` | Yes: `go-server/models/product.go:43` | Yes | Yes: `ecom/src/components/TemplateDetails.jsx:36-41` | Dynamic and straightforward. |
| `videoUrl` | Yes: `go-server/models/product.go:49` and migration `go-server/migrations/000001_init.up.sql:31-45` | No current request/admin field | No | The schema is ready, but the create/update handlers and admin UI do not expose it yet. |
| `snippetLanguage` / `snippet` | Yes: `go-server/models/product.go:53-54` | No current request/admin field | No | Good fit for API, component-library, and code-snippet products, but currently unused. |
| `courseOutline` / `duration` | Yes: `go-server/models/product.go:50-51` | No current request/admin field | No | Useful for docs/course-style products, but not wired today. |

### What Is Dynamic Today

- **Primary product images** are dynamic in the API-backed catalogue and in most transactional UI (`TemplateGrid`, cart, checkout, profile downloads).
- **Live demo / preview links** are dynamic when `liveDemo` is present.
- **Download URLs** are dynamic and tied to the backend upload flow.

### What Is Still Static or Underused

- The **home page featured grid** still comes from local mock products, so those images are not API-driven there.
- The **detail-page preview carousel** is fully static and unrelated to the selected product.
- `previewImages` is stored and normalized but never displayed.
- `videoUrl`, `snippetLanguage`, `snippet`, `courseOutline`, and `duration` exist in the schema but are not exposed through admin/product write flows.

### Recommended Product Media Model

The cheapest path is to **use the fields that already exist** before adding new ones:

1. Use `image` as the required thumbnail.
2. Render `previewImages[]` as the detail-page screenshot gallery.
3. Render `liveDemo` as the external preview/demo link.
4. Add `videoUrl`, `snippetLanguage`, `snippet`, `courseOutline`, and `duration` to the product create/update request and admin form.

If the team wants a cleaner long-term structure, use something closer to:

```json
{
  "image": "thumbnail.jpg",
  "previewImages": [
    {
      "url": "screen-1.jpg",
      "alt": "Dashboard view",
      "caption": "Orders dashboard",
      "device": "desktop",
      "sortOrder": 1
    }
  ],
  "liveDemo": "https://demo.example.com",
  "videoUrl": "https://cdn.example.com/demo.mp4",
  "snippetLanguage": "tsx",
  "snippet": "export function Button() { ... }"
}
```

That can live in:

- the existing JSONB array fields if you want to move fast
- a `product_media` table if you want captions, ordering, alt text, and media-type specific validation

### Recommended Visuals Per Product

- **All products**: primary thumbnail, screenshot gallery, live demo link, tech stack chips, updated-at/version badge.
- **Full-stack/templates**: desktop/mobile screenshots, short walkthrough video, architecture diagram thumbnail, “included pages” list, deployment preview.
- **API products**: OpenAPI/Swagger screenshot, sample request/response snippet, authentication method badge, rate-limit or environment notes.
- **Component libraries / snippets / UI kits**: live code snippet, component gallery, dark/light mode previews, supported framework/version badges.
- **Docs / learning products**: cover image, course outline, duration, lesson preview clip, TOC snapshot.

### UI Fixes to Make Immediately

- Hide the Preview button when `liveDemo` is absent instead of defaulting to `#` (`ecom/src/components/ProductHeader.jsx:37-42`, `134-146`).
- Replace `TemplateCarousel` with a product-driven gallery using `previewImages`.
- Stop using local `features/pages` arrays unless those fields are owned by the backend.
- Add upload controls for hero image and gallery images so admins do not have to paste raw URLs.

## 4. Additional Admin Panel Requirements

Based on the current implementation and the verified gaps, the admin surface should be expanded in these areas:

### Product and Media Management

- Add upload support for `image` and `previewImages` using the existing `/upload` endpoint, not only for `fileURL`.
- Support gallery ordering, captions, alt text, media type, and preview validation.
- Expose currently unused product fields: `videoUrl`, `snippetLanguage`, `snippet`, `courseOutline`, `duration`, `moderationStatus`, `statusFlags`, and tags.
- Allow admins to mark featured/trending/bestseller items without hand-editing comma-separated flags.

### Orders, Payments, and Entitlements

- Add an admin order view with filters for `paid`, `pending`, `failed`, and `refunded`.
- Show purchased products, Razorpay IDs, payment status, and download entitlement state.
- Add manual entitlement grant/revoke if a payment or order needs support intervention.
- Add payment provider settings/health checks: Razorpay key presence, webhook status, recent payment failures.

### Reviews and Testimonials

- Add review moderation, hide/delete/report handling, and “verified purchase” status.
- Keep testimonial approval/rejection, but back it with a real migration and include product context if testimonials are meant to be product-scoped.

### Users, Roles, Plans, and Licenses

- Add edit actions for role and `subscriptionPlan`, not just read-only listing.
- Add subscription status metadata if subscriptions will be real products.
- Implement a real license/entitlement model and expose license issuance, expiry, and lookup.

### Site and Content Management

- Move FAQs, social proof blocks, contact details, and marketing testimonials into admin-managed content.
- Extend `SiteConfigForm` to manage the backend `features` map (`go-server/handlers/config.go:38-62`) or remove that API field if env flags remain the source of truth.
- Add admin controls for AI provider settings and health if AI is a platform feature rather than a hidden service.

### Docs Administration

- Expose TOC and tag editing because the backend already supports both (`go-server/handlers/doc.go:68-69`, `124-129`).
- Support doc access rules beyond a simple premium toggle if docs will be sold per product or bundled into plans.

## 5. Priority Fixes

Recommended order of work:

1. Remove the mock catalogue fallback from `Home`, `TemplateGrid`, and `TemplatesDetails`.
2. Replace `TemplateCarousel` with a real `previewImages`/`videoUrl` gallery.
3. Either add `features` and `pages` to the backend product contract or remove those sections from the public detail page.
4. Filter order history and analytics to paid orders only.
5. Enforce verified-purchase checks for reviews.
6. Expand admin product media controls so images and preview assets are uploaded, not pasted.
7. Unify feature toggles between frontend env flags and backend site config.
8. Fix the testimonials schema gap by adding a real SQL migration.
9. Either implement subscription/license flows or keep those features hidden until they are real.
10. Wire `/ai/docsummary` into an admin docs workflow or remove the unused endpoint from the active surface.

## 6. Bottom Line

This repository is **close to a real marketplace**, but it still mixes production data paths with a few important mock-era fallbacks. The most visible issues are in the public product experience:

- home-page featured products still use local mock data
- detail-page preview visuals are static
- some detail-page metadata (`features`, `pages`, license label) is not backed by the real API

The backend already has enough schema to make the product experience much more dynamic. The fastest win is to make the frontend fully trust the API, then extend the admin product form to manage all of the media fields the schema already supports.
