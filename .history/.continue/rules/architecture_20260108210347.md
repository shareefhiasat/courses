# Monorepo Architecture & Rules

This is a ticketing platform monorepo using **Yarn v1** workspaces and **Turbo**.

## Project Structure

- `/apps/web`: Next.js frontend (Tailwind CSS).
- `/packages/db`: Centralized Prisma schema and client.
- `/packages/ui`: Shared brandable components.

## Database & Prisma

- The Prisma schema is in `/packages/db/prisma/schema.prisma`.
- **Rule:** Always use the shared Prisma client from `@repo/db` instead of creating new instances.
- We use **MongoDB**; remember that cross-collection joins are not supported like SQL.

## Branding & Styling

- We use a **Whitelabel** system. Components in `/packages/ui` must use CSS variables or Tailwind config for brandability.
- Follow mobile-first responsive patterns.
