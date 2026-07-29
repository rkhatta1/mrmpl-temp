# MRMPL Admin App Shell

## Status

Barebones foundation implemented. The shell is intentionally ready for
iteration; authentication, authorization, CRUD workflows, Convex queries, and
UploadThing uploads are out of scope for this slice.

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
- a left-aligned MRMPL emblem in the sidebar header that fades into the
  sidebar toggle only while its control area is hovered;
- no workspace header, leaving the content canvas uninterrupted;
- a mobile-only floating opener while the off-canvas sidebar is closed;
- no edge rail or resize-like handle; collapse is controlled from the header;
- an explicit “Authentication pending” state in the sidebar footer.

Navigation is grouped by operator task:

1. Workspace — Overview
2. Catalog — Products, Categories, Subcategories
3. Operations — Metal prices, Enquiries
4. System — Site settings

Every navigation item resolves to a real route. Non-overview routes currently
show an honest module scaffold and the next design decision required for that
workflow.

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
fixed product-UI typography, familiar navigation patterns, and minimal motion
that only communicates sidebar state.

## Responsive behavior

- Desktop: inset sidebar, expandable or icon-collapsed.
- Mobile: sidebar becomes a modal sheet. Its open state keeps the emblem on the
  left and the close toggle on the right; its closed state exposes a fixed
  44-pixel opener over the content canvas.
- Content width stays readable while the shell itself fills the viewport.
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

This shell has no authentication or authorization yet. A hidden subdomain,
`robots` metadata, or Proxy rewrite is not a security boundary.

Before adding production write operations:

1. authenticate every admin user;
2. enforce authorization in every Convex query, mutation, and action;
3. protect UploadThing route handlers and validate ownership;
4. validate all server actions and route handlers independently of Proxy;
5. define audit logging for destructive or publishing actions.

## Data and storage boundaries

- Convex remains the source of truth for catalog, pricing, enquiries, and site
  settings.
- UploadThing remains the file-storage boundary for future product-media
  workflows.
- The app shell does not fetch either service. Data contracts belong to each
  workflow slice, keeping the shell independent from backend loading states.

## Suggested iteration order

1. Authentication and role model
2. Product list and search
3. Product create/edit flow with UploadThing imagery
4. Category and subcategory management
5. Metal-price management
6. Enquiry triage
7. Site settings and publishing controls
8. Audit log and destructive-action safeguards

Each workflow should define its empty, loading, error, success, overflow, and
permission-denied states before implementation.
