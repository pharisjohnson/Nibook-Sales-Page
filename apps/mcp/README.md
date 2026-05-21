# Nibook MCP Server

Let Claude manage your Nibook business — check bookings, create appointments, track revenue, and more — directly from Claude Desktop or Claude.ai.

## Tools available

| Tool | Description |
|------|-------------|
| `list_bookings` | List bookings, filter by status or date |
| `create_booking` | Book a client in |
| `update_booking` | Change status, payment, notes |
| `list_services` | See all your services and IDs |
| `create_service` | Add a new service |
| `update_service` | Edit or deactivate a service |
| `get_analytics` | Revenue, bookings, top clients |
| `get_profile` | Business info and booking link |
| `list_clients` | All clients ranked by spend |

## Setup

### 1. Find your Owner ID

Go to your Nibook dashboard → Settings → Support, or open the browser dev tools after logging in and run:

```js
// In browser console on nibook.noonstudio.africa
localStorage.getItem("nibook_user")
```

Copy the `id` field.

### 2. Build the server

```bash
cd apps/mcp
pnpm install
pnpm run build
```

### 3. Configure Claude Desktop

Open your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this block (replace paths and ID):

```json
{
  "mcpServers": {
    "nibook": {
      "command": "node",
      "args": ["C:/Users/YourName/path/to/Nibook-Sales-Page/apps/mcp/dist/index.mjs"],
      "env": {
        "NIBOOK_API_URL": "https://nibook.noonstudio.africa/api",
        "NIBOOK_OWNER_ID": "your-user-id-here"
      }
    }
  }
}
```

Restart Claude Desktop. You'll see a hammer icon — that's the MCP tools menu.

### 4. Configure Claude.ai (claude.ai/code)

In the Claude Code CLI, add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "nibook": {
      "type": "stdio",
      "command": "node",
      "args": ["apps/mcp/dist/index.mjs"],
      "env": {
        "NIBOOK_API_URL": "https://nibook.noonstudio.africa/api",
        "NIBOOK_OWNER_ID": "your-user-id-here"
      }
    }
  }
}
```

## Example prompts

```
What bookings do I have today?

Book Sarah Kimani (+254722000000) for a haircut at 3pm tomorrow

Cancel the booking with ID abc-123

How much revenue did I make this month?

Add a new service: Eyebrow Threading, 20 minutes, KES 350

Who are my top 5 clients by spend?

Show me all pending bookings
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NIBOOK_OWNER_ID` | ✅ | Your Nibook user ID |
| `NIBOOK_API_URL` | optional | Defaults to `https://nibook.noonstudio.africa/api` |
