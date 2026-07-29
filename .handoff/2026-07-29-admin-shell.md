# Admin Shell Handoff

Date: 2026-07-29

## Completed work

- Exported the original Convex development deployment to
  `backups/convex/dev-20260729T140859Z.zip` and imported it into the replacement
  Convex account selected by the user.
- Added the admin App Router segment and hostname rewrite. The admin workspace
  is available locally at `http://admin.localhost:3000` and through the fallback
  route `http://localhost:3000/admin`.
- Added the shadcn sidebar app shell using preset `b6npFahmd8`.
- Removed the app-shell header and the sidebar resize rail.
- Implemented the approved sidebar header behavior:
  - desktop uses one native 32px menu-button slot;
  - the 16px MRMPL emblem is shown normally;
  - the collapse icon crossfades in only while that slot is hovered;
  - focus or a prior click does not keep the collapse icon visible;
  - mobile keeps the emblem left and the close trigger right;
  - the closed mobile canvas retains the 44px opener.
- Replaced the grouped navigation model with one flat menu. There are no
  Workspace, Catalog, Operations, or System labels and no repeated section
  wrappers. The order is Overview, Products, Categories, Subcategories, Metal
  prices, Enquiries, Site settings.

## Current architecture

- `src/proxy.ts`: recognizes `admin.*`, `admin.localhost`, and an optional
  `ADMIN_HOSTNAME`, then rewrites requests into `/admin` without changing the
  visible URL.
- `src/app/admin/layout.tsx`: isolated admin metadata/layout.
- `src/app/admin/page.tsx`: overview placeholder.
- `src/app/admin/[section]/page.tsx`: placeholder modules for every navigation
  destination.
- `src/components/admin/admin-shell.tsx`: responsive shell, flat navigation,
  active-route handling, and header controls.
- `src/components/ui/sidebar.tsx`: generated shadcn sidebar primitive. Its
  upstream spacing behavior is intact; app-specific composition belongs in the
  admin shell.
- `docs/ADMIN-DESIGN.md`: source-of-truth design and security notes.

## Verified behavior

- Desktop expanded and collapsed states contain one navigation group, zero
  group labels, and a consistent 1px gap between all seven buttons.
- Header and navigation icons share the same alignment grid.
- Mobile sheet behavior remains responsive with no horizontal overflow.
- `bun run lint`: passes with six pre-existing hook dependency warnings in
  unrelated public-site files.
- `bun run check-types`: passes.
- `bun test src/lib/admin-routing.test.ts`: 3 passing tests.
- `bun run build`: passes on Next.js 16.2.0.

## Security and deployment constraints

- Authentication and authorization are not implemented. The admin UI is not a
  security boundary and must not expose sensitive reads or writes yet.
- Enforce authorization inside every future Convex query, mutation, and action.
- Protect UploadThing routes and validate ownership before adding file-management
  workflows.
- `admin.domain.com` is the requested production shape, but the actual owned
  hostname still needs to be attached to the Vercel project and configured in
  DNS. Set `ADMIN_HOSTNAME` when the final hostname is known.

## Suggested next slice

Implement authentication and an explicit role model before adding the first
Convex-backed admin workflow. After that, start with the product list/search
module described in `docs/ADMIN-DESIGN.md`.

## Repository notes

- Admin-shell foundation commit: `d93f482 feat: add admin application shell`
- `AGENTS.md` is user-owned and intentionally left untracked by this work.
