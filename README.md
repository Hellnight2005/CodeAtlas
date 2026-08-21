# CodeAtlas

> **Local-first code intelligence and structural context engine for developers and AI coding agents.**

CodeAtlas turns codebases into searchable, structural code graphs. It enables developers and AI agents to query repository structure, call relationships, dependencies, change impact, and execution flow without repeatedly rescanning or dumping raw code to LLMs.

---

## ⚡ Core Pipeline

```text
Repository
    ↓
CodeAtlas Indexer
    ↓
AST & Static Analysis
    ↓
Structural Code Graph
    ↓
Query & Analysis Engine
    ↓
Context Compiler
    ↓
CLI / API / MCP Server / Dashboard
    ↓
Developers and AI Agents
```

---

## 🚀 Key Features

- **Local-First & Offline**: Zero mandatory cloud accounts, external databases, SaaS accounts, or API keys required.
- **Multi-Language AST Parsing**: Supports JavaScript, TypeScript, JSX/TSX, Python, Go, Rust, Java, C/C++, PHP, HTML/CSS.
- **Incremental Indexing**: Uses SHA256 file hashing to re-index only changed files, keeping indexing extremely fast.
- **Query & Analysis Engine**:
  - `find`: Find symbol definitions.
  - `callers`: Traverse caller call-graph.
  - `callees`: Traverse callee call-graph.
  - `dependencies`: Inspect file and module dependency tree.
  - `impact`: Calculate blast radius of code changes.
  - `trace`: Trace step-by-step request execution paths.
- **Context Compiler**: Assembles compact, token-budgeted markdown context packages for LLMs with token efficiency metrics.
- **MCP Server**: Native Node.js Model Context Protocol (MCP) server for integration with Cursor, Claude Desktop, Antigravity, and AI agents.
- **Modular Storage Adapters**: Embedded zero-config SQLite storage by default, with Neo4j support as an optional adapter.

---

## 🛠️ Quick Start & CLI Usage

### Installation

```bash
npm install -g codeatlas
```

### CLI Commands

```bash
# Initialize configuration in your repository
codeatlas init

# Index the repository
codeatlas index

# Check repository graph status
codeatlas status

# Run system diagnostics
codeatlas doctor

# Find symbol definitions
codeatlas find UserService

# Find callers of a function
codeatlas callers AuthenticateUser

# Find callees invoked by a function
codeatlas callees AuthenticateUser

# Inspect dependencies of a file
codeatlas dependencies ./src/auth.js

# Calculate change impact / blast radius
codeatlas impact AuthenticateUser

# Trace execution path sequence
codeatlas trace POST /login

# Start Model Context Protocol (MCP) server
codeatlas mcp start
```

---

## 🤖 MCP Integration for AI Agents

Add CodeAtlas to your AI tool configuration (e.g., `claude_desktop_config.json` or Cursor MCP settings):

```json
{
  "mcpServers": {
    "codeatlas": {
      "command": "codeatlas",
      "args": ["mcp", "start"]
    }
  }
}
```

Exposed MCP Tools:
- `codeatlas_find_symbol`
- `codeatlas_get_callers`
- `codeatlas_get_callees`
- `codeatlas_get_dependencies`
- `codeatlas_analyze_impact`
- `codeatlas_trace_execution`
- `codeatlas_get_context`

---

## 📄 License

CodeAtlas is open-source software licensed under the [MIT License](./LICENSE).
