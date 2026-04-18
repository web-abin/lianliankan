# mp-automator-mcp

MCP server for driving WeChat Mini Program DevTools via `miniprogram-automator`. Lets Claude Code (or any MCP client) navigate pages, tap elements, mock requests, read page data, and take screenshots.

## Prerequisites

- macOS (Windows works but you must override `cliPath`)
- Node.js 20+
- WeChat DevTools **Stable 2.01.2510xxx** or newer (older versions use a different CLI syntax)
- In DevTools → 设置 → 安全:
  - **服务端口** = ON
  - **自动化接口打开工具时默认信任项目** = ON

## Install

```bash
npm install
npm run build
```

## Register with Claude Code

Edit `~/.claude.json`, add under `mcpServers`:

```json
{
  "mcpServers": {
    "mp-automator": {
      "command": "node",
      "args": ["/absolute/path/to/mp-automator-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Code. Verify with `/mcp` — you should see `mp-automator` listed.

## Usage

Just ask Claude in natural language — it will pick the right tool:

> "Open /Users/me/Documents/my-miniprogram, navigate to /pages/home/home, take a screenshot"

> "On the current page, setData `{loading: true}` and screenshot"

> "Mock all requests matching `/api/user/` to return `{code: 0, data: null}`, then tap `.refresh-btn`"

### Tools

| Tool | Purpose |
|---|---|
| `mp_launch` | Launch DevTools, open a project, enable automation |
| `mp_connect` | Attach to an already-running automation session by ws endpoint |
| `mp_close` | Disconnect the automator session (IDE stays open) |
| `mp_reLaunch` / `mp_navigateTo` | Navigate pages (URL must start with `/` — MCP auto-adds it) |
| `mp_currentPage` | Current page route + `this.data` snapshot |
| `mp_setData` | Merge data into the current page |
| `mp_callMethod` | Call `this.method(...args)` on the current page |
| `mp_query` | Find an element by selector; returns exists/text/size/attrs |
| `mp_tap` / `mp_longpress` / `mp_input` | Element interactions |
| `mp_mockRequest` | Mock `wx.request` matching a regex URL pattern |
| `mp_screenshot` | Screenshot the simulator; returns a local file path |
| `mp_evaluate` | Run arbitrary JS in AppService context — escape hatch |
| `mp_ping` | Health check |

## Smoke tests

Before wiring into Claude Code, verify the stack works end-to-end:

```bash
# Option A: launch flow (quits/opens IDE itself)
pkill -f wechatwebdevtools; sleep 1
npm run smoke:automator -- /absolute/path/to/miniprogram

# Option B: connect to an already-running IDE
# First, manually open the project with automation enabled:
#   /Applications/wechatwebdevtools.app/Contents/MacOS/cli auto \
#     --project /path/to/miniprogram --auto-port 9420 --trust-project
npm run smoke:connect -- ws://127.0.0.1:9420

# Option C: full MCP round-trip (launch → navigate → screenshot → close)
npm run smoke:mcp -- /absolute/path/to/miniprogram pages/index/index
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Failed to launch wechat web devTools` | Stale IDE process or untrusted project | `pkill -f wechatwebdevtools`, confirm both 设置 → 安全 toggles are ON |
| `port 9420 did not open within 60000ms` | IDE CLI failed silently; likely trust prompt blocked it | Enable 自动化接口打开工具时默认信任项目 |
| `Failed connecting to ws://...` / `Connection closed` | Wrong port, or you connected to DevTools HTTP port instead of automator WS | Automator WS is the one opened by `--auto-port`, NOT the one in 设置 → 服务端口 |
| `page "pages/x/pages/x/y" is not found` | URL missing leading `/` — WeChat resolved relatively | MCP auto-adds `/`, but if you call via custom code make sure to include it |
| `缺失参数 'project / appid' (code 31)` | Old CLI syntax (`--auto <path>`) on newer IDE | This MCP already uses v2 syntax (`cli auto --project ... --auto-port ...`). If you still see this, your IDE is too new and CLI flags changed again |
| `Connection closed, check if wechat web devTools is still running` mid-session | IDE crashed, got suspended, or was quit | Bring IDE to front; worst case `mp_close` + `mp_launch` |

## Notes on `mp_launch` vs `automator.launch`

`miniprogram-automator@0.11` internally spawns `cli --auto <path> --auto-port <port>` (v1 global flag). DevTools 2.01.2510xxx+ rejects that syntax with `缺失参数 'project / appid' (code 31)`. This MCP reimplements `launch` to use the v2 subcommand form (`cli auto --project ... --auto-port ... --trust-project`), then `automator.connect`s to the port. That's why `mp_launch` works where upstream's `.launch()` doesn't.

## Development

```bash
npm run dev   # tsc --watch
npm run build # one-off build to dist/
```

After editing `src/`, rebuild and restart Claude Code (or use `/mcp` to reconnect) so the new bundle is loaded.

## Packaging for distribution

### Option A: single-file bundle (recommended for sharing)

```bash
npm run bundle
# → dist/bundle.mjs (≈2 MB, self-contained)
```

Send `dist/bundle.mjs` to the recipient. They only need Node 20+ — no `npm install` required. Their `~/.claude.json`:

```json
{
  "mcpServers": {
    "mp-automator": {
      "command": "node",
      "args": ["/their/path/to/bundle.mjs"]
    }
  }
}
```

### Option B: source tarball

```bash
tar --exclude=node_modules --exclude=dist -czf mp-automator-mcp.tgz mp-automator-mcp/
```

Recipient: unpack, `npm install`, `npm run build`, update `~/.claude.json` to point at `dist/index.js`.
