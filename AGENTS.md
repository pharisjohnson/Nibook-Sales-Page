# AGENTS.md

## Commands
- Build: `npm run build` (runs `tsc` first, then `vite build` — avoid `vite build` directly)
- Single test: `npx vitest run <test-file>`

## Architecture
- Alias `@/` → `src/` (configured in `vite.config.ts` and `tsconfig.json`)

## Testing
- Vitest, no external services required
