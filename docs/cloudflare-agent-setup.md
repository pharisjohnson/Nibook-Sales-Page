# Cloudflare Agent Setup (Skills + MCP)

Official instructions: https://developers.cloudflare.com/agent-setup/prompt.md

These steps must be run on the HOST machine (not inside the Hermes Docker
sandbox, where `~/.hermes/skills/` is mounted read-only and agent configs
are sandbox-local copies).

## 1. Install Cloudflare skills for all agents

```bash
npx -y skills add cloudflare/skills --skill '*' --yes --global
```

## 2. Register Cloudflare MCP servers for OpenCode

```bash
opencode mcp add cloudflare --url https://mcp.cloudflare.com/mcp
opencode mcp add cloudflare-docs --url https://docs.mcp.cloudflare.com/mcp
opencode mcp add cloudflare-bindings --url https://bindings.mcp.cloudflare.com/mcp
opencode mcp add cloudflare-builds --url https://builds.mcp.cloudflare.com/mcp
opencode mcp add cloudflare-observability --url https://observability.mcp.cloudflare.com/mcp
opencode mcp auth cloudflare   # opens browser once for OAuth
```

## 3. Register Cloudflare MCP servers for Hermes

Add to `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  cloudflare:
    url: "https://mcp.cloudflare.com/mcp"
  cloudflare-docs:
    url: "https://docs.mcp.cloudflare.com/mcp"
  cloudflare-bindings:
    url: "https://bindings.mcp.cloudflare.com/mcp"
  cloudflare-builds:
    url: "https://builds.mcp.cloudflare.com/mcp"
  cloudflare-observability:
    url: "https://observability.mcp.cloudflare.com/mcp"
```

Then restart Hermes. MCP tools appear as `mcp_cloudflare_*` after restart.

Notes:

- `cloudflare-docs` is public and requires no authentication.
- The other servers trigger OAuth on first tool use.
- Until this is set up, Cloudflare can be managed with a scoped API token
  (Account > R2 > Edit, or add Cloudflare Pages > Edit for deploys).

## Cloudflare account references

- Account ID: `8685e719afdc64a21ab54523ef7615d0`
- R2 bucket for Nibook images: `nibook-images`
  - Folders: `logos/`, `covers/`, `services/`, `team/`
  - Files named: `{folder}/{userId}_{uuid}.{ext}`
  - Binding in wrangler.jsonc: `NIBOOK_IMAGES`
- Pages project: `nibook` (build command `pnpm --filter @workspace/nibook-landing build`,
  output dir `apps/landing/dist/public`)
- Other buckets: `nibook-assets` (empty), `noon-client-files`
