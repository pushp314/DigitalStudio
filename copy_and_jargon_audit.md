# Copy And Jargon Audit

## Result
Public-facing copy was simplified and standardized to plain SaaS language.

## Replacements Applied

| Old pattern | New pattern |
| --- | --- |
| “ultra-premium”, “epic”, “AI-driven”, “elite community” | practical, clear, product-focused wording |
| “Open Community Chat”, “Explore Pro Tiers” | direct actions like “View pricing” or “Browse products” |
| “Premium documentation” | “paid documentation” or “member access” |
| “Quick Search” marketing language | direct utility wording for product/doc search |
| decorative CTA copy | short functional CTAs tied to the action |

## Public Surfaces Cleaned
- templates listing
- features
- testimonials
- FAQ
- docs listing
- docs viewer
- product detail
- pricing
- home metadata
- search palette
- footer and navbar

## Examples
- Product/detail surfaces now describe what is included instead of trying to sound exclusive
- Membership copy now explains access scope instead of using luxury language
- Error and empty states on public routes now use direct professional wording

## Locked-Route Constraint
- `/chat`
- public profile route
- `/account`
- `/admin`

Those routes were intentionally not copy-polished wholesale because they were locked against redesign/restructure in this pass. Some internal sci-fi wording remains there. Public launch routes were prioritized for cleanup without violating the lock constraint.

## Editorial Follow-Up
- Review production site-config content and admin-created docs for any older database text that still uses hype language.
- If the live content already contains older marketing phrasing, update it in the admin CMS before launch.
