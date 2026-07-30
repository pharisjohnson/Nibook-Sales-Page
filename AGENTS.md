# AGENTS.md

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS).

- **Project:** **new-app-nibook** (API base `https://sci5cd29.us-east.insforge.app`)
- **Credentials:** app code reads keys from `.env`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.
- **Skills:** Use the `insforge` skill for app code (SDK) and `insforge-cli` for backend infrastructure.
- **Key patterns:**
  - Database inserts take an array: `insert([{ ... }])`.
  - Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
  - For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

## Commands
- Build: `npm run build` (runs `tsc` first, then `vite build` — avoid `vite build` directly)
- Single test: `npx vitest run <test-file>`

## Architecture
- Alias `@/` → `src/` (configured in `vite.config.ts` and `tsconfig.json`)
- Frontend: Cloudflare Pages at https://nibook.pages.dev
- API: Cloudflare Pages Functions (`functions/api/[[path]].ts`)

## Testing
- Vitest, no external services required
