# MRMPL Next.js App

This is the Bun + Next.js migration workspace for the MRMPL site.

## Development

Run every long-lived dev process in one Turborepo TUI:

```sh
bun run dev
```

This opens the Turbo TUI and runs:

- `next:dev` - Next.js dev server
- `convex:dev` - Convex dev sync/watch process

The same command is also available as:

```sh
bun run tui
bun run dev:tui
```

## Tasks

Build the application:

```
bun run build
```

Lint source code:

```
bun run lint
```

Type check source code:

```
bun run check-types
```

Run tests:

```
bun run test
```

Seed Convex:

```
bun run convex:seed
```
