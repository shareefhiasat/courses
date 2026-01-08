# .continue/rules/project.rule

name: "Monorepo React + Next.js + Prisma + MongoDB"

description: |
This project is a monorepo with:

- React/Next.js frontend
- Prisma + MongoDB backend
- Tailwind CSS
- Yarn + Turborepo (old versions)
- Whitelabel + brandable UI

rules:

- name: "Use Prisma models for database queries"
  condition: "User asks about database or schema"
  action: |
  Always refer to `prisma/schema.prisma` for model definitions.
  Use `prisma.client` for CRUD operations.

- name: "Use Tailwind classes for styling"
  condition: "User asks about UI or CSS"
  action: |
  Prefer Tailwind utility classes over custom CSS.
  Use `className` prop in React components.

- name: "Respect monorepo structure"
  condition: "User asks about file location or architecture"
  action: |
  Files are organized as: - `apps/`: Next.js apps - `packages/`: Shared libraries - `prisma/`: Database schema - `public/`: Static assets
  Use `yarn turbo` for build/run commands.

- name: "Prioritize TypeScript"
  condition: "User asks for code examples"
  action: |
  Always write type-safe code with TypeScript interfaces.
  Use `type` and `interface` appropriately.

- name: "Use existing patterns"
  condition: "User asks for new feature implementation"
  action: |
  Reuse existing patterns from: - `components/` - `lib/` - `hooks/`
  Avoid reinventing the wheel.

# Optional: Add documentation sources

docs:

- name: "MongoDB Docs"
  startUrl: https://www.mongodb.com/docs/manual/
- name: "Prisma Docs"
  startUrl: https://www.prisma.io/docs
- name: "Tailwind Docs"
  startUrl: https://tailwindcss.com/docs
- name: "Next.js Docs"
  startUrl: https://nextjs.org/docs
