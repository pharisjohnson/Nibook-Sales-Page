# AGENTS.md

## Commands
- Build: `pnpm run build` (typecheck + workspace builds; landing app is `apps/landing`)
- Landing dev: `pnpm --filter @workspace/nibook-landing run dev`
- Single test: `npx vitest run <test-file>` (from `apps/landing` or `apps/api`)

## InsForge backend (use CLI, not global install)
- Linked project: **Nibook** — see `.insforge/project.json`
- Session check: `npx @insforge/cli whoami` and `npx @insforge/cli current`
- Schema/metadata: `npx @insforge/cli metadata --json`
- SQL migrations: `migrations/` → `npx @insforge/cli db migrations up --all -y`
- Ad-hoc SQL: `npx @insforge/cli db query "<sql>"`
- Agent skills (local): `.agents/skills/insforge-cli`, `insforge`, `insforge-debug`
- App SDK work: follow `insforge` skill; infrastructure/SQL/RLS: follow `insforge-cli` skill

## Architecture
- Monorepo: `apps/landing` (Vite + React), `apps/api` (Express, Vercel `/api`), `migrations/`
- Frontend alias `@/` → `apps/landing/src/`
- InsForge URL/keys: `VITE_INSFORGE_*` (client), `INSFORGE_URL` + `INSFORGE_API_KEY` (server/Vercel)

## Testing
- Vitest in `apps/landing` and `apps/api`; no external services required for most unit tests
