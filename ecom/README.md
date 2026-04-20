# DigitalStudio — Frontend Engineering Guide

Welcome to the DigitalStudio frontend repository. This platform is built for performance, trust, and high conversion.

## 1. Frontend Overview & Philosophy

### Core Stack
- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS (Vanilla CSS approach where logic-heavy)
- **State Management:** TanStack Query (Server state), React Context (Global UI state)
- **Routing:** React Router v7

### Engineering Principles
- **Trust First:** Every UI element must reinforce credibility. Use real product visuals, clear labels, and verified badges.
- **Conversion-Centric:** Minimize friction. "Buy Now" leads directly to checkout. Value propositions are clear and grounded.
- **Performance:** Avoid heavy filters/effects that impact mobile UX. Debounce search and memoize context providers.
- **No Jargon:** We speak "Developer". Use terms like "Source Code", "Live Demo", and "Purchases" instead of speculative tech-speak.

---

## 2. Architecture Guide

### State Management Strategy
1.  **Server State (React Query):** Use for all API-driven data (Products, Docs, Profile). This handles caching and refetching automatically.
2.  **Client State (Context):** Use for persistent UI state (Auth session, Cart items, Theme).
3.  **Local State (useState):** Default for component-level UI logic (modals, forms).

### Component Organization
- `src/components/common`: Primitive UI components (Meta, ProtectedRoute).
- `src/components/layout`: App-shell elements (Navbar, Footer, Search).
- `src/components/ui`: Highly reusable atoms (Skeletons, StarRating).
- `src/pages`: Top-level route components.

---

## 3. Backend Integration Rules

- **Auth Session:** Auth state is managed via `AuthContext`. Tokens are stored in `localStorage`.
- **Payment Verification:** Success states must be verified via the backend `/payments/verify` endpoint. Never trust client-side state for ownership truth.
- **Config Data:** Site configuration is fetched once on mount via `ConfigProvider`. Use this for feature-flagging and brand constants.

---

## 4. Performance & SEO

- **Image SOP:** Use `.webp` where possible. Optimized fallbacks are required for all asset previews.
- **SEO SOP:** Every route must use the `<Meta />` component. For PDPs, pass dynamic product data to the component props.
- **Lazy Loading:** All pages are lazy-loaded in `App.jsx` to keep initial bundle size minimal.

---

## 5. Design System Usage

Refer to `design_system.md` for full specs.
- **Buttons:** Use consistent rounded-full styles.
- **Colors:** Stick to the Slate/Blue palette for a premium dev-tool aesthetic.
- **Spacing:** Use Tailwind's spacing scale (4, 8, 16, 24...) for visual balance.

---

## 6. Conversion & UX Principles

- **Clarity > Novelty:** Avoid using creative terms for standard actions. Use "Buy Now", "Login", and "Search" instead of "Initialize Purchase" or "Access Portal".
- **Friction Reduction:** Express checkout is the default for PDPs. Minimize clicks to purchase.
- **Trust Anchors:** Always place trust signals (Lock icons, Verified badges, Social proof) near action buttons.
- **No Dead Ends:** Empty states (Empty Cart, 404) must always provide a clear path back to the marketplace.

---

## 7. Community Chat & Real-time Systems

### Infrastructure
- **WebSocket Gateway:** `/api/chat/ws?token=JWT`
- **Reconnection:** Indefinite exponential backoff (Max 30s delay).
- **Protocol:** JSON-based bidirectional stream. Supports `CID` (Client ID) for optimistic reconciliation.

### Implementation Patterns
- **Optimistic UI:** Always use the `useChat` hook for messaging. Messages are injected locally with `status: 'sending'` before server confirmation.
- **Markdown Rendering:** All chat content is sanitized via `react-markdown` with GFM support.
- **Mobile Defense:** Layout uses `100dvh` to ensure input accessibility across all mobile viewports.
- **Rate Limiting:** Enforced at the gateway (5/min for Basic, 50+/min for Pro). Signals are surfaced via `system` message types.