# Troubleshooting Guide

This guide helps resolve common issues when using CodeAtlas.

## 1. Diagnostics Check

Your first step when encountering issues should always be running system diagnostics:

```bash
codeatlas doctor
```

## 2. Common Issues & Solutions

### Issue: Indexing Failed
**Symptoms**: `codeatlas index` exits with an error code.
**Solution**:
1. Check logs:
   ```bash
   codeatlas logs
   ```
2. Re-run indexing with `--force` flag to clear cache:
   ```bash
   codeatlas index --force
   ```

### Issue: MCP Connection Failure
**Symptoms**: AI agent (Cursor / Claude / Antigravity) cannot connect to CodeAtlas MCP server.
**Solution**:
1. Verify Node path in your MCP config file (`~/.gemini/config/mcp_config.json`):
   ```json
   {
     "mcpServers": {
       "codeatlas": {
         "command": "node",
         "args": ["C:/Users/Abhijeet/Desktop/CodeAltas_upgrade/bin/codeatlas.js", "mcp", "start"]
       }
     }
   }
   ```
2. Test stdio server manually:
   ```bash
   node bin/codeatlas.js mcp start
   ```

### Issue: Visualizer Dashboard Won't Load (Port Refused)
**Symptoms**: `ERR_CONNECTION_REFUSED` on `http://localhost:3000` or `3001`.
**Solution**:
1. Ensure `codeatlas serve` is running in one terminal window.
2. In a second terminal window, run:
   ```bash
   cd frontend
   npm run dev
   ```
