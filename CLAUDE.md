# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (uses Shopify CLI tunnel + env injection)
bun run dev          # or: shopify app dev

# Build
bun run build        # react-router build

# Type checking
bun run typecheck    # react-router typegen && tsc --noEmit

# Lint
bun run lint

# Database
bun run db:start     # start local SQLite via docker-compose
bun run db:migrate   # prisma migrate dev (creates + applies new migration)
bun run db:studio    # open Prisma Studio GUI
bun run setup        # prisma generate + prisma migrate deploy (used in prod/docker)
```

## Architecture

This is a **Shopify embedded app** built with React Router v7 + `@shopify/shopify-app-react-router`. The app is called **Edge Reviews** — a product review management tool for Shopify merchants.

### Route layout

Routes are defined explicitly in `app/routes.ts` (not via filesystem convention):

```
/              → routes/_index/route.tsx       (public splash / install redirect)
/app           → routes/layout.tsx             (auth shell — wraps all admin routes)
  /app         → routes/layout._index.tsx      (dashboard — currently uses mock data)
  /app/analytics
  /app/reviews
  /app/products
  /app/settings
  /app/plans
/auth/login    → routes/auth.login/route.tsx
/auth/*        → routes/auth.$.tsx
/webhooks/...  → webhook handlers
```

`routes/layout.tsx` is the auth boundary: every request passes through `authenticate.admin(request)` before rendering. `useLoaderData` in child routes gets `{ shop }` from the session.

### Auth & Shopify integration

- `app/shopify.server.ts` — configures `shopifyApp()` with Prisma session storage. Import `authenticate` from here in every loader/action that needs Shopify Admin API access.
- `app/db.server.ts` — singleton `PrismaClient` (avoids connection exhaustion in dev HMR).
- Sessions are stored in SQLite (`prisma/schema.prisma`, `Session` model). The only model currently is `Session`.

### UI components

The app uses **Polaris Web Components** (`<s-page>`, `<s-stack>`, `<s-grid>`, `<s-button>`, etc.) — these are custom elements, not React components from `@shopify/polaris`. App Bridge React (`useAppBridge`) is used for toasts and cross-frame communication.

Components live in `app/components/`:
- `dashboard/` — StatsRow, QuickActions, TopRatedProducts, LastImportSummary, RecentReviews, RequestFunnel, AnalyticsFilterBar
- `SetupGuideCard.tsx`, `offer-banner.tsx`, `what-new.tsx`

### Mock data

All pages currently use mock data from `app/data/mockData.ts`. The interfaces defined there (`Product`, `Review`, `DashboardStats`, `ImportRecord`, `TopProduct`, `LastImport`) describe the real data shapes that will replace them.

### Embedded app navigation rules

Because the app runs embedded in an iframe inside Shopify Admin:
- Use `Link` from `react-router` for navigation — never `<a>`
- Use `redirect` from `authenticate.admin`, not from `react-router`
- Use `useSubmit` from `react-router` for form submissions

### Webhooks

Registered in `shopify.app.toml` (app-specific, not shop-specific). Handlers at `/webhooks/app/uninstalled` and `/webhooks/app/scopes_update`.
