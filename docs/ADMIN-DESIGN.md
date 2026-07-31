# MRMPL Admin App Shell

## Status

The app shell, access-code gate, Better Auth session protection, products,
enquiries, site media, and metal-prices workflows are implemented. Overview
content remains a later workflow slice.

## Purpose

The admin surface gives MRMPL operators a stable workspace for managing the
public website. It is isolated from the marketing-site shell so future admin
workflows can evolve without inheriting the public header, footer, or page
composition.

## URL and routing

- Production entry point: `https://admin.domain.com`
- Local subdomain entry point: `http://admin.localhost:3000`
- Local fallback: `http://localhost:3000/admin`
- `src/proxy.ts` rewrites requests from an `admin.*` hostname into the
  `/admin` App Router segment while preserving the visible subdomain URL.
- `ADMIN_HOSTNAME` can define an explicit production hostname.
- The subdomain must still be attached to the Vercel project and configured in
  DNS; repository code cannot create that domain mapping.

The shell computes link targets from the request host. Links are root-relative
on the admin subdomain and `/admin`-prefixed when using the local fallback.

## Shell anatomy

The app shell uses the shadcn `Sidebar` component with:

- an inset layout;
- icon-collapse behavior on desktop;
- an off-canvas sheet on mobile;
- a persistent collapse preference;
- the built-in `Ctrl+B` / `Cmd+B` shortcut;
- collapsed-state tooltips;
- shared `SidebarHeader`, `SidebarMenu`, and `SidebarMenuButton` geometry for
  the header and navigation, keeping their controls and icons on one native
  alignment grid in both expanded and collapsed states;
- a single flat navigation menu without section labels;
- a left-aligned MRMPL emblem in the sidebar header that fades into the
  sidebar toggle only while its control area is hovered;
- no workspace header, leaving the content canvas uninterrupted;
- a mobile-only floating opener while the off-canvas sidebar is closed;
- no edge rail or resize-like handle; collapse is controlled from the header;
- the authenticated admin profile and logout control in the sidebar footer.

Navigation order: Overview, Products, Metal prices, Enquiries, Site media.
Category, subcategory, and product CRUD intentionally share the Products
workflow; there is no standalone Categories route.

Every navigation item resolves to a real route. Only Overview still renders a
module scaffold.

## Visual foundation

- shadcn preset: `b6npFahmd8`
- style: Mira
- base primitives: Base UI
- neutral base: Taupe
- theme: Green
- icons: Phosphor
- body type: Outfit
- heading type: Montserrat
- radius: Small
- menu treatment: Default translucent with subtle accents

The repository's original capitalized public-site primitives now use explicit
`legacy-*` filenames. Canonical lowercase `button`, `input`, `card`, and
`badge` files contain the shadcn components used throughout the admin panel.

The interface follows a restrained product register. Green communicates active
or primary state; it is not decorative. Layout uses the Tailwind spacing scale,
fixed product-UI typography, familiar navigation patterns, and short motion
that communicates navigation and data-state changes.

## Responsive behavior

- Desktop: inset sidebar, expandable or icon-collapsed.
- Mobile: sidebar becomes a modal sheet. Its open state keeps the emblem on the
  left and the close toggle on the right; its closed state exposes a fixed
  44-pixel opener over the content canvas.
- `AdminShell` centrally owns the shared workspace cap (`max-w-5xl`, expanding
  to `92rem` at `xl`) while page modules remain width-agnostic.
- The navigation order and labels remain identical at every viewport.

## Accessibility

- The sidebar is built from the official shadcn component and includes an
  accessible mobile-sheet title and description.
- The always-visible mobile sidebar triggers have focus treatment and
  screen-reader labels. Desktop users can also use the built-in keyboard
  shortcut.
- Active navigation is exposed through the component’s active state.
- Icons are paired with text labels and collapsed-state tooltips.
- Admin pages opt out of search-engine indexing.

## Security boundary

The access-code gate limits account entry, Better Auth protects the workspace,
and the admin catalog and metal-price queries and mutations independently
require a Convex identity. The separately named public queries remain
read-only and unauthenticated for marketing-site consumers. A dedicated role
model is still pending, so future sensitive workflows must add server-side
role checks rather than treating the route or Proxy rewrite as authorization.

Better Auth's Convex configuration explicitly trusts the deployed origins
`https://mrmpl-temp.vercel.app`, `https://www.mayankrawmint.com`, and
`https://admin.mayankrawmint.com`, alongside the configured `SITE_URL` and local
development origins. New production or preview hostnames must be added to
`trustedOrigins` before sign-in requests from that origin will pass CSRF
validation.

The `productImage` and site-media UploadThing routes validate the Better Auth
session before accepting files. Destructive catalog actions require UI
confirmation and server-side parent/child integrity checks; audit logging is
still pending.

## Data and storage boundaries

- Convex remains the source of truth for catalog, pricing, enquiries, and site
  media metadata.
- `metalPrices.list` is an authenticated admin query; `listPublic` is the
  homepage's explicit read-only query. Both are indexed and capped at six
  records. Create, update, and remove require authentication, perform bounded
  duplicate checks, and write at most one record per operation.
- The metal editor accepts at most six rows, normalizes symbols to two uppercase
  characters, rejects duplicate names or symbols, and publishes saves to the
  homepage cards through the shared Convex subscription.
- The homepage keeps a validated 24-hour local-storage warm cache. Convex stays
  authoritative, overwrites that cache whenever its live query resolves, and
  successful admin mutations invalidate the cache in the current browser.
- `catalogAdmin.listCatalog` returns a bounded two-level hierarchy: category,
  subcategory, then product. The Products page renders that hierarchy as a file
  tree, keeps ancestors while filtering, and loads full product details only
  for the selected file.
- Catalog create, rename, update, move, and delete operations require a Convex
  identity. Category/subcategory renames cascade into the denormalized product
  references; parent deletes are refused until their descendants are removed.
  Migration-safe optional top-level category/subcategory reference fields back
  these indexes because Convex does not allow indexes through the legacy nested
  `_id` properties. Existing rows remain readable and are upgraded by normal
  product edits or branch cascades without requiring an eager production
  backfill. Imported legacy product references contain category/subcategory
  names rather than the standalone records' external IDs, so the bounded tree
  query canonicalizes them with in-memory maps over its existing category and
  subcategory result sets; selected-product detail uses indexed point lookups.
- Product images are stored through UploadThing as one logical asset with four
  responsive WebP variants (480, 768, 880, and 1080). Each variant is capped at
  50 KiB before upload, and the authenticated route accepts only a complete,
  consistently identified four-file set. Convex stores the canonical 1080
  custom-ID URL; the public resolver selects its sibling URL for the requested
  display size. The ordered URL array defines primary (position 1), secondary
  (position 2), and remaining media.
- The app shell does not fetch either service. Data contracts belong to each
  workflow slice, keeping the shell independent from backend loading states.

## Suggested iteration order

1. Overview content
2. Role enforcement and audit logging
3. Product-media orphan cleanup and ownership policy
4. Bulk catalog import/export, if operators require it

Each workflow should define its empty, loading, error, success, overflow, and
permission-denied states before implementation.
