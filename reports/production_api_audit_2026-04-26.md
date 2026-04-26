# Production API Audit - 2026-04-26

Repository checked: `pushp314/bizcode` at commit `a710aa8c9a541a697689db89a47673080a600b52`.

Local checkout note: the working directory remote is `pushp314/DigitalStudio`, but both remotes resolve to the same HEAD commit.

## Executive Result

Status after this pass: production-readiness is materially improved and verified by backend tests, frontend lint, and frontend production build.

Critical fixes applied:

- Added `/health` and `/ready` aliases alongside `/healthz` and `/readyz`.
- Added HTTP server timeouts and production metrics protection through `METRICS_BEARER_TOKEN`.
- Added `/api/licenses/validate` as a backward-compatible alias for `/api/licenses/verify`.
- Fixed frontend `PUT /admin/reviews/:id` mismatch to `PATCH /admin/reviews/:id`.
- Fixed upload scope and upload response contract drift for chat, support chat, and avatars.
- Removed hardcoded `localhost:8080` from AI streaming and hardcoded same-origin `/api` from realtime ticket exchange.
- Replaced request-path `AutoMigrate` calls with versioned schema coverage.
- Added `000007_production_schema_completion` migration for missing production tables/columns.
- Hardened JWT parsing with required issuer and expiration.
- Restricted websocket origins to same-host or `ALLOWED_ORIGINS`.
- Added OAuth request timeouts and removed production localhost redirect fallbacks.
- Replaced panic-prone contact inquiry binding with typed validation.
- Hardened profile username validation and fixed public-profile showcase mapping.
- Fixed admin order search against the actual `users` table instead of nonexistent `orders.customer_email`.
- Removed provider-specific AI configuration leakage from public error responses.

## Backend Route Inventory

Legend: `Public` means no auth middleware. `Auth` means `AuthMiddleware`. `Admin` means `AuthMiddleware + AdminMiddleware`. `Pro` means `AuthMiddleware + ProMiddleware` or group auth plus route pro check.

| Method | Path | Handler | Auth | Role | Request | Response | Status |
|---|---|---|---|---|---|---|---|
| GET | `/` | inline status | Public | - | - | `{status,service,version}` | OK |
| GET | `/sitemap.xml` | `ServeSitemap` | Public | - | - | XML | OK |
| GET | `/health` | `Healthz` | Public | - | - | JSON health | Added |
| GET | `/ready` | `Readyz` | Public | - | - | JSON readiness | Added |
| GET | `/healthz` | `Healthz` | Public | - | - | JSON health | OK |
| GET | `/readyz` | `Readyz` | Public | - | - | JSON readiness | OK |
| GET | `/metrics` | Prometheus | Token in prod | Ops | `Authorization: Bearer` if configured | Prometheus text | Hardened |
| POST | `/api/auth/register` | `Register` | Public + rate limit | - | `{name,email,password,referrerCode?}` | `{token,refreshToken,user}` | OK |
| POST | `/api/auth/login` | `Login` | Public + rate limit | - | `{email,password}` | `{token,refreshToken,user}` | OK |
| POST | `/api/auth/refresh` | `RefreshToken` | Public | - | `{refreshToken}` | `{token,refreshToken,user}` | OK |
| GET | `/api/auth/me` | `Me` | Auth | User | - | user JSON | OK |
| GET | `/api/auth/google/login` | `GoogleLogin` | Public | - | - | redirect | OK |
| GET | `/api/auth/google/callback` | `GoogleCallback` | Public | - | `code,state` | redirect/session | Hardened |
| GET | `/api/auth/github/login` | `GithubLogin` | Public | - | - | redirect | OK |
| GET | `/api/auth/github/callback` | `GithubCallback` | Public | - | `code,state` | redirect/session | Hardened |
| GET | `/api/auth/github/connect` | `GithubConnect` | OAuth query-token auth | User | `token` query | redirect | OK |
| GET | `/api/products` | `ListProducts` | Public | - | filters/page query | `[]Product` | OK |
| GET | `/api/products/slug/:slug` | `GetProductBySlug` | Public | - | slug | Product | OK |
| GET | `/api/products/:id` | `GetProduct` | Public | - | id | Product | OK |
| GET | `/api/products/owned` | `GetOwnedProducts` | Auth | User | - | `[]Product` | OK |
| GET | `/api/products/:id/share` | `ServeProductSEO` | Public | - | id | HTML/SEO | OK |
| GET | `/api/products/:id/download` | `DownloadSecureAsset` | Auth | Owner/Pro/Admin | id | `{downloadUrl,expiresIn,filename?}` | OK |
| POST | `/api/products` | `CreateProduct` | Auth | Author/Admin | product body | Product | OK |
| PUT | `/api/products/:id` | `UpdateProduct` | Auth | Owner/Admin | product body | Product | OK |
| DELETE | `/api/products/:id` | `DeleteProduct` | Auth | Owner/Admin | id | `{message}` | OK |
| POST | `/api/products/:id/review` | `CreateReview` | Auth | Purchaser | `{rating,comment}` | Review | OK |
| GET | `/api/products/:id/reviews` | `GetReviews` | Public | - | id | `[]Review` | OK |
| GET | `/api/products/:id/review-eligibility` | `GetReviewEligibility` | Auth | User | id | `{hasPurchased,alreadyReviewed,canReview}` | OK |
| GET | `/api/categories` | `GetCategories` | Public | - | - | `[]ProductCategory` | OK |
| GET | `/api/categories/:slug` | `GetCategoryBySlug` | Public | - | slug | ProductCategory | OK |
| POST | `/api/orders` | `CreateOrder` | Auth | User | `{items:[{productId,quantity}]}` | Order | OK |
| GET | `/api/orders/myorders` | `MyOrders` | Auth | User | - | `[]Order` | OK |
| GET | `/api/admin/orders` | `AdminListOrders` | Admin | Admin | `status,page,limit,search` | `[]Order` + total header | Fixed search |
| GET | `/api/admin/orders/:id` | `AdminGetOrder` | Admin | Admin | id | Order | OK |
| PATCH | `/api/admin/orders/:id` | `AdminUpdateOrder` | Admin | Admin | status fields | Order | OK |
| POST | `/api/admin/orders/:id/refund` | `AdminRefundOrder` | Admin | Admin | id | refund result | Hardened error |
| GET | `/api/admin/users` | `ListUsers` | Admin | Admin | pagination/search | `[]User` + total header | OK |
| PATCH | `/api/admin/users/:id` | `UpdateUser` | Admin | Admin | allowed user fields | User | OK |
| POST | `/api/admin/users/:id/reset-password` | `ResetUserPassword` | Admin | Admin | `{password}` | `{message}` | OK |
| GET | `/api/admin/github-requests` | `GetAllGithubRequests` | Admin | Admin | - | requests | OK |
| PATCH | `/api/admin/github-requests/:id` | `ResolveGithubRequest` | Admin | Admin | `{status}` | request | OK |
| GET | `/api/admin/categories` | `GetCategories` | Admin | Admin | - | categories | OK |
| POST | `/api/admin/categories` | `CreateCategory` | Admin | Admin | category body | category | OK |
| PUT | `/api/admin/categories/:id` | `UpdateCategory` | Admin | Admin | category body | category | OK |
| DELETE | `/api/admin/categories/:id` | `DeleteCategory` | Admin | Admin | id | `{message}` | OK |
| POST | `/api/admin/intents/service` | `CreateServiceIntent` | Admin | Admin | intent body | intent | OK |
| PUT | `/api/admin/intents/service/:id` | `UpdateServiceIntent` | Admin | Admin | intent body | intent | OK |
| POST | `/api/admin/intents/expert` | `CreateExpertIntent` | Admin | Admin | intent body | intent | OK |
| PUT | `/api/admin/intents/expert/:id` | `UpdateExpertIntent` | Admin | Admin | intent body | intent | OK |
| GET | `/api/intents/service` | `GetServiceIntents` | Public | - | - | intents | OK |
| GET | `/api/intents/service/:slug` | `GetServiceIntentBySlug` | Public | - | slug | intent | OK |
| GET | `/api/intents/expert` | `GetExpertIntents` | Public | - | - | intents | OK |
| GET | `/api/intents/expert/:slug` | `GetExpertIntentBySlug` | Public | - | slug | intent | OK |
| GET | `/api/profile/:id` | `GetPublicProfile` | Public | - | id/username | sanitized profile | Fixed showcase source |
| GET | `/api/users/:id/profile` | `GetPublicProfile` | Public | - | id/username | sanitized profile | Alias |
| POST | `/api/profile/:id/report` | `ReportUser` | Auth | User | `{reason}` | `{status}` | Fixed nil username panic |
| GET | `/api/profile` | `Me` | Auth | User | - | user | OK |
| PUT | `/api/profile` | `UpdateMyProfile` | Auth | Owner | profile body | user | Hardened |
| POST | `/api/profile/upload-avatar` | `UploadProfileAvatar` | Auth | Owner | multipart file | upload result | Contract fixed |
| POST | `/api/profile/github-request` | `RequestGithubChange` | Auth | User | `{reason}` | request | OK |
| GET | `/api/profile/github-requests` | `GetMyGithubRequests` | Auth | User | - | requests | OK |
| POST | `/api/profile/change-password` | `ChangePassword` | Auth | Owner | `{oldPassword,newPassword}` | `{message}` | OK |
| GET | `/api/profile/inquiries` | `MyInquiries` | Auth | Owner | - | inquiries | OK |
| POST | `/api/profile/inquiries/:id/reply` | `UserReplyToInquiry` | Auth | Owner | `{message}` | result | OK |
| GET | `/api/config` | `GetConfig` | Public | - | - | sanitized config | Hardened |
| GET | `/api/config/admin` | `GetAdminConfig` | Admin | Admin | - | full config | OK |
| PUT | `/api/config` | `UpdateConfig` | Admin | Admin | config body | config | OK |
| GET | `/api/docs` | `ListDocs` | Public | - | filters | docs | OK |
| GET | `/api/docs/:id` | `GetDoc` | Public | - | id | doc/access state | OK |
| POST | `/api/docs` | `CreateDoc` | Admin | Admin | doc body | doc | OK |
| PUT | `/api/docs/:id` | `UpdateDoc` | Admin | Admin | doc body | doc | OK |
| DELETE | `/api/docs/:id` | `DeleteDoc` | Admin | Admin | id | `{message}` | OK |
| GET | `/api/docs/:id/chat` | `GetDocChatHistory` | Auth | User | id | chat history | OK |
| DELETE | `/api/docs/:id/chat` | `DeleteDocChat` | Auth | User | id | result | OK |
| POST | `/api/upload` | `UploadFile` | Admin | Admin | multipart file + scope | upload result | Backward compatible |
| POST | `/api/ai/generate-description` | `GenerateAIDescription` | Auth + AI limit | User | `{title,techStack}` | `{description}` | OK |
| POST | `/api/ai/suggest-tags` | `SuggestAITags` | Auth + AI limit | User | `{title,content}` | `{tags}` | OK |
| POST | `/api/ai/recommend-pricing` | `RecommendAIPricing` | Auth + AI limit | User | `{category,features}` | `{price}` | OK |
| POST | `/api/ai/suggest-usernames` | `SuggestUsernames` | Auth + AI limit | User | `{name}` | `{suggestions}` | OK |
| GET | `/api/ai/recommend` | `GetAIRecommendation` | Pro | Pro/Admin | `techStack` query | `{answer}` | Hardened error |
| POST | `/api/ai/roadmap` | `GetUserRoadmap` | Auth + AI limit | User | `{wishlistIds}` | `{roadmap}` | OK |
| POST | `/api/ai/docsummary` | `GenerateDocSummary` | Pro | Pro/Admin | doc body | summary | OK |
| POST | `/api/ai/doc-universal` | `UniversalDocSearchChat` | Pro | Pro/Admin | chat body | response | OK |
| POST | `/api/ai/chat` | `AskDocAI` | Pro | Pro/Admin | `{markdown,question}` | JSON/SSE consumer | OK |
| POST | `/api/ai/recommend-products` | `RecommendProducts` | Auth + AI limit | User | `{query,budget,category}` | recommendations | OK |
| POST | `/api/ai/generate-requirements` | `GenerateRequirements` | Auth + AI limit | User | `{idea,businessType,budget}` | requirements | OK |
| POST | `/api/ai/improve-product-content` | `ImproveProductContent` | Admin | Admin | product content | improved content | OK |
| GET | `/api/support/sessions` | `GetEliteSessions` | Auth | User/Admin | - | sessions | OK |
| GET | `/api/support/sessions/:id/messages` | `GetEliteMessages` | Auth | Owner/Admin | id | messages/session | OK |
| POST | `/api/support/sessions/:id/messages` | `SendEliteMessage` | Auth | Owner/Admin | `{message}` | message | OK |
| PATCH | `/api/support/sessions/:id/read` | `MarkEliteMessagesRead` | Auth | Owner/Admin | id | result | OK |
| POST | `/api/support/create-order/:productId` | `CreateNegotiationOrder` | Auth | User | `productId`, optional coupon | Razorpay/session | OK |
| POST | `/api/support/verify-payment` | `VerifyNegotiationPayment` | Auth | User | Razorpay verify body | session | OK |
| PATCH | `/api/support/sessions/:id/close` | `CloseEliteSession` | Admin | Admin | id | session | OK |
| PATCH | `/api/support/sessions/:id/resolve` | `ResolveEliteSession` | Admin | Admin | id | session | OK |
| PATCH | `/api/support/sessions/:id/extend` | `ExtendEliteSession` | Admin | Admin | `{days}` | session | OK |
| GET | `/api/chat/ws` | `ServeChatWs` | Ticket | User | `ticket` query | websocket | Origin fixed |
| POST | `/api/chat/ticket` | `CreateChatTicket` | Auth | User | - | `{ticket}` | OK |
| GET | `/api/chat/history` | `GetChatHistory` | Auth | User | - | messages | OK |
| POST | `/api/chat/messages` | `SendChatMessage` | Auth | User | message body | message | Runtime migrate removed |
| PUT | `/api/chat/messages/:id` | `UpdateChatMessage` | Auth | Owner/Admin | `{content}` | message | OK |
| DELETE | `/api/chat/messages/:id` | `DeleteChatMessage` | Auth | Owner/Admin | id | result | OK |
| POST | `/api/chat/messages/:id/pin` | `PinChatMessage` | Auth | Owner/Admin | id | message | OK |
| POST | `/api/chat/messages/:id/report` | `ReportChatMessage` | Auth | User | id | result | OK |
| POST | `/api/chat/messages/bulk-delete` | `BulkDeleteMessages` | Admin | Admin | `{ids}` | result | OK |
| GET | `/api/analytics/metrics` | `GetIntelligenceMetrics` | Admin | Admin | - | metrics | OK |
| GET | `/api/admin/reviews` | `AdminListReviews` | Admin | Admin | `status` | reviews | OK |
| PATCH | `/api/admin/reviews/:id` | `AdminUpdateReview` | Admin | Admin | `{status,verifiedPurchase}` | review | FE fixed |
| DELETE | `/api/admin/reviews/:id` | `AdminDeleteReview` | Admin | Admin | id | result | OK |
| POST | `/api/payments/create-order` | `CreateRazorpayOrder` | Auth | User | `{items,couponCode,addDeploymentService}` | Razorpay order | OK |
| POST | `/api/payments/verify` | `VerifyRazorpayPayment` | Auth | Owner | Razorpay verify body | settlement | OK |
| POST | `/api/webhooks/razorpay` | `RazorpayWebhook` | Signature + rate limit | Razorpay | signed webhook | `{status}` | OK |
| GET | `/api/licenses/my` | `MyLicenses` | Auth | Owner | - | `{licenses,publicKey}` | OK |
| GET | `/api/licenses/my/:id/token` | `GetLicenseToken` | Auth | Owner | id | token payload | OK |
| POST | `/api/licenses/activate` | `ActivateLicenseHandler` | Public + rate limit | License holder | license activation body | activation | OK |
| POST | `/api/licenses/validate` | `VerifyLicenseHandler` | Public + rate limit | License holder | license verify body | verify payload | Added |
| POST | `/api/licenses/verify` | `VerifyLicenseHandler` | Public + rate limit | License holder | license verify body | verify payload | OK |
| POST | `/api/licenses/heartbeat` | `HeartbeatLicenseHandler` | Public + rate limit | License holder | heartbeat body | `{status}` | OK |
| POST | `/api/licenses/deactivate` | `DeactivateLicenseHandler` | Auth | Owner | `{licenseId,activationId}` | result | OK |
| GET | `/api/admin/licenses` | `AdminListLicenses` | Admin | Admin | filters/page | licenses | OK |
| GET | `/api/admin/licenses/:id` | `AdminGetLicense` | Admin | Admin | id | license | OK |
| GET | `/api/admin/licenses/:id/activations` | `AdminGetLicenseActivations` | Admin | Admin | id | activations | OK |
| GET | `/api/admin/licenses/:id/events` | `AdminGetLicenseEvents` | Admin | Admin | id | events | OK |
| POST | `/api/admin/licenses/issue` | `AdminIssueLicenses` | Admin | Admin | `{orderId}` | licenses | OK |
| POST | `/api/admin/licenses/:id/revoke` | `AdminRevokeLicense` | Admin | Admin | `{reason}` | result | OK |
| POST | `/api/admin/licenses/:id/suspend` | `AdminSuspendLicense` | Admin | Admin | `{reason}` | result | OK |
| POST | `/api/admin/licenses/:id/reactivate` | `AdminReactivateLicense` | Admin | Admin | id | result | OK |
| DELETE | `/api/admin/licenses/:id/activations/:activationId` | `AdminRemoveActivation` | Admin | Admin | ids | result | OK |
| GET | `/api/admin/licenses/policy/:productId` | `AdminGetProductPolicy` | Admin | Admin | productId | policy/default | OK |
| PUT | `/api/admin/licenses/policy/:productId` | `AdminUpsertProductPolicy` | Admin | Admin | policy body | policy | OK |
| GET | `/api/testimonials` | `GetApprovedTestimonials` | Public | - | - | testimonials | OK |
| POST | `/api/testimonials` | `CreateTestimonial` | Auth | Purchaser | testimonial body | testimonial | OK |
| GET | `/api/admin/testimonials` | `AdminListTestimonials` | Admin | Admin | status | testimonials | OK |
| PATCH | `/api/admin/testimonials/:id/approve` | `AdminApproveTestimonial` | Admin | Admin | id | testimonial | OK |
| PATCH | `/api/admin/testimonials/:id/reject` | `AdminRejectTestimonial` | Admin | Admin | id | testimonial | OK |
| DELETE | `/api/admin/testimonials/:id` | `AdminDeleteTestimonial` | Admin | Admin | id | result | OK |
| GET | `/api/posts` | `ListPosts` | Public | - | filters | posts | OK |
| GET | `/api/posts/:slug` | `GetPost` | Public | - | slug | post | OK |
| POST | `/api/posts` | `CreatePost` | Admin | Admin | post body | post | OK |
| PUT | `/api/posts/:id` | `UpdatePost` | Admin | Admin | post body | post | OK |
| DELETE | `/api/posts/:id` | `DeletePost` | Admin | Admin | id | result | OK |
| GET | `/api/admin/marketing/coupons` | `ListCoupons` | Admin | Admin | - | coupons | OK |
| POST | `/api/admin/marketing/coupons` | `CreateCoupon` | Admin | Admin | coupon body | coupon | OK |
| PATCH | `/api/admin/marketing/coupons/:id` | `UpdateCoupon` | Admin | Admin | coupon body | coupon | OK |
| PATCH | `/api/admin/marketing/coupons/:id/revoke` | `RevokeCoupon` | Admin | Admin | id | coupon | OK |
| DELETE | `/api/admin/marketing/coupons/:id` | `HardDeleteCoupon` | Admin | Admin | id | result | OK |
| GET | `/api/marketing/validate` | `ValidateCoupon` | Public | - | `code,totalAmount,scope` | discount | OK |
| GET/POST | `/api/marketing/wishlist-deals` | `GetWishlistDeals` | Auth | User | `{items}` | deals | OK |
| POST | `/api/marketing/personalized-offers` | `GetPersonalizedOffers` | Auth | User | `{wishlistIds}` | offers | OK |
| POST | `/api/showcase` | `SubmitShowcase` | Auth | User | `{productId,liveUrl,screenshot}` | showcase | OK |
| GET | `/api/admin/showcases` | `AdminListShowcases` | Admin | Admin | - | showcases | OK |
| PATCH | `/api/admin/showcases/:id/status` | `AdminUpdateShowcaseStatus` | Admin | Admin | `{status}` | showcase | OK |
| GET | `/api/admin/intelligence/metrics` | `GetIntelligenceMetrics` | Admin | Admin | - | metrics | OK |
| POST | `/api/contact` | `CreateContactInquiry` | Public optional auth | - | contact body | result | Fixed validation |
| GET | `/api/my-inquiries` | `MyInquiries` | Auth | Owner | - | inquiries | Alias |
| GET | `/api/admin/contact` | `AdminListInquiries` | Admin | Admin | - | inquiries | OK |
| PATCH | `/api/admin/contact/:id/reply` | `AdminReplyToInquiry` | Admin | Admin | `{reply}` | result | OK |
| GET | `/api/notifications` | `GetMyNotifications` | Auth | User | - | notifications | OK |
| POST | `/api/notifications/broadcast` | `AdminBroadcastNotification` | Admin | Admin | `{title,message,type}` | notification | Runtime migrate removed |
| POST | `/api/affiliate/apply` | `AffiliateApply` | Auth + rate limit | User | affiliate body | affiliate | OK |
| GET | `/api/affiliate/dashboard` | `AffiliateDashboard` | Auth | User | - | dashboard | OK |
| GET | `/api/affiliate/links` | `AffiliateLinks` | Auth | Affiliate | - | links | OK |
| GET | `/api/affiliate/conversions` | `AffiliateConversions` | Auth | Affiliate | - | conversions | OK |
| POST | `/api/affiliate/payout-request` | `AffiliateRequestPayout` | Auth + rate limit | Affiliate | payout body | payout | OK |
| POST | `/api/referral/track` | `TrackReferralClick` | Public + rate limit | - | referral body | result | OK |
| GET | `/api/admin/affiliates` | `AdminListAffiliates` | Admin | Admin | - | affiliates | OK |
| GET | `/api/admin/affiliates/:id` | `AdminGetAffiliate` | Admin | Admin | id | affiliate | OK |
| POST | `/api/admin/affiliates/:id/approve` | `AdminApproveAffiliate` | Admin | Admin | id | affiliate | OK |
| POST | `/api/admin/affiliates/:id/reject` | `AdminRejectAffiliate` | Admin | Admin | id | affiliate | OK |
| POST | `/api/admin/affiliates/:id/suspend` | `AdminSuspendAffiliate` | Admin | Admin | id | affiliate | OK |
| GET | `/api/admin/affiliate-payouts` | `AdminListAffiliatePayouts` | Admin | Admin | - | payouts | OK |
| POST | `/api/admin/affiliate-payouts/:id/approve` | `AdminApproveAffiliatePayout` | Admin | Admin | id | payout | OK |
| POST | `/api/admin/affiliate-payouts/:id/pay` | `AdminPayAffiliatePayout` | Admin | Admin | id | payout | OK |
| POST | `/api/checkout/track` | `TrackCheckoutSession` | Auth | User | session body | result | OK |
| GET | `/api/admin/abandoned-carts` | `AdminListAbandonedCarts` | Admin | Admin | - | carts | OK |
| GET | `/api/admin/abandoned-carts/stats` | `AdminGetCartRecoveryStats` | Admin | Admin | - | stats | OK |
| GET | `/api/admin/abandoned-carts/:id/logs` | `AdminGetCartRecoveryLogs` | Admin | Admin | id | logs | OK |
| POST | `/api/admin/abandoned-carts/trigger-recovery` | `AdminTriggerCartRecovery` | Admin | Admin | body | result | OK |
| POST | `/api/admin/import/products` | `AdminImportProducts` | Admin | Admin | import body/file | job | OK |
| GET | `/api/admin/import/history` | `AdminGetImportHistory` | Admin | Admin | - | jobs | OK |
| GET | `/api/admin/import/history/:id` | `AdminGetImportJob` | Admin | Admin | id | job | OK |
| GET | `/api/admin/import/template` | `AdminDownloadImportTemplate` | Admin | Admin | - | CSV | OK |

## Frontend API Discovery And Matching

| Frontend File | Function/Area | Method | Called URL | Backend Match |
|---|---|---:|---|---|
| `services/authService.js` | login/register/me | POST/GET | `/auth/login`, `/auth/register`, `/auth/me` | Yes |
| `services/productService.js` | product list/detail/slug/download/CRUD/reviews | mixed | `/products...` | Yes |
| `services/orderService.js` | user/admin orders | mixed | `/orders`, `/orders/myorders`, `/admin/orders...` | Yes |
| `services/docService.js` | docs list/detail/admin CRUD | mixed | `/docs...` | Yes |
| `services/blogService.js` | posts list/detail/admin CRUD | mixed | `/posts...` | Yes |
| `services/configService.js` | public/admin config | GET/PUT | `/config`, `/config/admin` | Yes |
| `services/aiService.js` | AI helpers/chat/docs | mixed | `/ai...`, `/docs/:id/chat` | Fixed hardcoded stream URL |
| `services/analyticsService.js` | admin metrics | GET | `/admin/intelligence/metrics` | Yes |
| `services/licenseService.js` | licenses | GET/POST | `/licenses/my`, `/licenses/validate`, `/admin/licenses/issue` | Added backend validate alias |
| `services/marketingService.js` | coupons | mixed | `/admin/marketing/coupons...` | Yes |
| `services/reviewService.js` | review moderation | GET/PATCH/DELETE | `/admin/reviews...` | Fixed PUT to PATCH |
| `services/testimonialService.js` | testimonials | mixed | `/testimonials`, `/admin/testimonials...` | Yes |
| `services/userService.js` | admin users | mixed | `/admin/users...` | Yes |
| `hooks/useChat.js` | chat history/message CRUD | mixed | `/chat/history`, `/chat/messages...` | Yes |
| `context/RealtimeContext.jsx` | websocket ticket | POST | `/chat/ticket` | Fixed API base URL |
| `components/chat/ChatInput.jsx` | image upload | POST | `/upload` | Fixed scope/header/response |
| `pages/elite/EliteChat.jsx` | support messages/upload/read | mixed | `/support/sessions...`, `/upload` | Fixed upload contract |
| `components/ProductHeader.jsx` | support payment | POST | `/support/create-order/:id`, `/support/verify-payment` | Yes |
| `pages/elite/EliteHub.jsx` | support payment/intents/coupon/session | mixed | `/support...`, `/intents/expert/:slug`, `/marketing/validate` | Yes |
| `components/layout/Navbar.jsx` | categories/intents/support unread | GET | `/categories`, `/intents/...`, `/support/sessions` | Yes |
| `components/ContactSection.jsx` | contact/intents | GET/POST | `/intents/service/:slug`, `/contact` | Backend validation fixed |
| `pages/Profile.jsx` | owned products/orders/profile/avatar/download/licenses/affiliate/inquiries | mixed | `/products/owned`, `/orders/myorders`, `/profile...`, `/licenses...`, `/affiliate...` | Fixed avatar + toast errors |
| `pages/PublicProfile.jsx` | public profile/report | GET/POST | `/profile/:handle`, `/profile/:handle/report` | Backend nil/showcase fixed |
| `pages/Checkout.jsx` | checkout tracking/coupon/payment | POST/GET | `/checkout/track`, `/marketing/validate`, `/payments...` | Yes |
| `pages/SubscriptionCheckout.jsx` | subscription checkout | mixed | `/products`, `/marketing/validate`, `/payments...` | Yes |
| `pages/Wishlist.jsx` | wishlist deals | POST | `/marketing/wishlist-deals` | Yes |
| `pages/Templates.jsx` | category lookup | GET | `/categories/:slug` | Yes |
| `pages/admin/TemplateEdit.jsx` | categories/upload/product save/AI | mixed | `/admin/categories`, `/upload`, `/products`, `/ai...` | Yes |
| `pages/admin/DocEdit.jsx` | docs/AI | mixed | `/docs`, `/ai...` | Yes |
| `components/admin/*` | admin managers | mixed | `/admin/*`, `/config`, `/upload`, `/support/*` | Yes |
| `App.jsx` | referral tracking | POST | `/referral/track` | Yes |

## Contract Matrix

| Feature | Frontend Route | Backend Endpoint | Contract Status |
|---|---|---|---|
| Auth register/login/me/refresh | `/register`, `/login`, auth context | `/api/auth/*` | Pass |
| Products/templates/apps listing/detail | `/apps`, `/assets`, `/templates`, details | `/api/products`, `/api/categories` | Pass |
| Product admin/contributor create/update/delete | `/admin/templates/*`, `/sell-your-project` | `/api/products` | Pass with owner/admin checks |
| Cart/checkout/orders | `/cart`, `/checkout`, `/account` | `/api/orders`, `/api/payments/*` | Pass |
| Secure downloads | `/account`, product detail | `/api/products/:id/download` | Pass |
| Razorpay verify/webhook | checkout pages, webhook | `/api/payments/verify`, `/api/webhooks/razorpay` | Pass; signature checked |
| Subscription/pro | `/pricing`, `/subscription-checkout` | product + payment settlement | Pass |
| AI helpers | admin editors, docs/chat pages | `/api/ai/*` | Pass; base URL fixed |
| Docs/blog/SEO | `/docs`, `/blog`, sitemap | `/api/docs`, `/api/posts`, `/sitemap.xml` | Pass |
| Support/elite chat | `/support`, `/elite/chat/:id` | `/api/support/*` | Pass; upload fixed |
| Realtime chat | `/chat` | `/api/chat/*` | Pass; websocket origin fixed |
| Admin dashboard/users/orders/config | `/admin/*` | `/api/admin/*` | Pass |
| Licenses | `/account?tab=licenses` | `/api/licenses/*` | Pass; validate alias added |
| Affiliate/referral | account tabs, referral URL | `/api/affiliate/*`, `/api/referral/track` | Pass |
| Contact/inquiries | `/contact`, admin contact | `/api/contact`, `/api/admin/contact` | Pass; panic risk fixed |

## Issues Found

Fixed in this pass:

- `reviewService.adminUpdate` used `PUT`, backend only registered `PATCH`.
- Frontend license validation called `/licenses/validate`, backend only registered `/licenses/verify`.
- Chat and support upload sent `scope=public-image`; backend allowed `public_image`.
- Chat/support/avatar consumers expected `res.url`; backend returned `filePath`.
- Multipart callers manually set `Content-Type: multipart/form-data`, which can break browser boundary handling.
- AI streaming defaulted to `http://localhost:8080/api`.
- Realtime ticket exchange hardcoded `window.location.origin + /api`.
- Public websocket origin policy allowed any origin.
- OAuth HTTP calls lacked request timeouts and production fallback redirects pointed to localhost.
- `CreateContactInquiry` type-asserted raw JSON and could panic on malformed input.
- `UpdateMyProfile` ran `AutoMigrate` and cleanup SQL during a user request.
- `GetPublicProfile` queried `DeploymentSubmission`, but showcase writes use `Showcase`.
- `ReportUser` could panic when a reported user had no username.
- Admin order search queried nonexistent `orders.customer_email`.
- Notification/chat handlers ran `AutoMigrate` during requests.
- Public AI recommendation exposed provider-specific config errors.
- `go test` auth tests did not migrate the new refresh token table.
- Production runtime always ran critical AutoMigrate before this pass.

Remaining watch items:

- OAuth still transfers the access token through the frontend callback URL query. This is existing behavior and was not changed to avoid breaking auth flow, but it should be moved to an HttpOnly cookie/session exchange in a dedicated auth-hardening pass.
- Public product list still returns an array for compatibility instead of the requested pagination envelope. A breaking API version or additive wrapper endpoint is recommended before changing it.
- Some legacy dead handlers remain unregistered: `AdminListUsers`, `AdminUpdateUser`, `CreateHireDeveloperRequest`, `CreateExpertHelpRequest`.
- Duplicate/alias routes are intentional compatibility surfaces: `/api/profile/:id` and `/api/users/:id/profile`, `/api/my-inquiries` and `/api/profile/inquiries`, `/api/licenses/validate` and `/api/licenses/verify`, `/api/admin/intelligence/metrics` and `/api/analytics/metrics`.

## Security Audit Summary

- Auth/admin/pro checks are present on routed admin, payment, order, profile, support, chat, AI pro, and upload surfaces.
- Ownership checks are present for orders, secure downloads, profile updates, licenses, chat messages, and support sessions where applicable.
- Price/order totals are calculated server-side in `services.CreateDraftOrder`; Razorpay verification checks ownership and signature before settlement.
- Razorpay webhook requires `X-Razorpay-Signature`.
- Uploads validate scope, extension, content type, size, and generated storage keys.
- Websocket origin is now restricted.
- JWT parsing now requires issuer, expiration, and subject/user consistency.
- Runtime schema mutation was removed from request handlers.
- Metrics is now hidden in production unless a bearer token is configured.

## Verification

Commands run:

- `go test ./...` from `go-server` - passed.
- `npm run lint` from `ecom` - passed with warnings only.
- `npm run build` from `ecom` - passed.

Frontend lint still reports warnings for unused imports/variables and hook dependency hygiene. They are not API-contract blockers, but should be cleaned before enforcing zero-warning CI.
