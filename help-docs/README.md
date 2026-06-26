# Military LMS Help Center (Nextra)

Real Nextra documentation sub-app for the help center.

## Run

```bash
# from the monorepo root
pnpm docs:dev
```

Opens on `http://localhost:3000`.

## Content

Help articles live in `client/src/help/` and are symlinked here:

- `pages/en` → `../client/src/help/en`
- `pages/ar` → `../client/src/help/ar`

Edit the markdown files in `client/src/help/` only; both the main app command palette and this Nextra site read from the same source.

## Build / serve

```bash
pnpm docs:build
pnpm docs:start
```

## Later: same domain

The main app keeps the `/help` route, which redirects to the Nextra site. In production you can proxy `/help` to the Nextra app, or serve it as a subdomain (`docs.yoursite.com`).
