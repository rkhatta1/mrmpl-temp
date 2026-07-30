# MRMPL Admin App Shell

## Status

The app shell, access-code gate, Better Auth session protection, and the metal
prices workflow are implemented. Products, categories, enquiries, site media,
and overview content remain later workflow slices.

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

Navigation order: Overview, Products, Categories, Metal prices, Enquiries, Site
media. Categories and subcategories intentionally share one workflow.

Every navigation item resolves to a real route. Metal prices is functional;
the remaining non-overview routes show an honest module scaffold and the next
design decision required for that workflow.

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

The repository already had capitalized legacy UI files. The shadcn-generated
Button, Input, and Separator primitives use `shadcn-*` filenames to prevent
case-only filename collisions without changing the public-site components.

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
and the admin metal-price query and mutations independently require a Convex
identity. The separately named `metalPrices.listPublic` query is intentionally
read-only and unauthenticated because the homepage subscribes to it. A
dedicated role model is still pending, so future sensitive workflows must add
server-side role checks rather than treating the route or Proxy rewrite as
authorization.

Better Auth's Convex configuration explicitly trusts the deployed origins
`https://mrmpl-temp.vercel.app` and `https://www.mayankrawmint.com`, alongside
the configured `SITE_URL` and local development origins. New production or
preview hostnames must be added to `trustedOrigins` before sign-in requests from
that origin will pass CSRF validation.

UploadThing handlers must validate authorization and ownership before the site
media workflow is implemented. Destructive and publishing workflows should
also define their audit-log requirements.

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
- UploadThing remains the file-storage boundary for future product-media
  workflows.
- The app shell does not fetch either service. Data contracts belong to each
  workflow slice, keeping the shell independent from backend loading states.

## Suggested iteration order

1. Product list and search
2. Product create/edit flow with UploadThing imagery
3. Combined category and subcategory management
4. Enquiry triage
5. Site media and publishing controls
6. Overview content
7. Role enforcement, audit log, and destructive-action safeguards

Each workflow should define its empty, loading, error, success, overflow, and
permission-denied states before implementation.
