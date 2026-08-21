# 🗺️ CodeAtlas — Local-First Graph-Native Code Intelligence Engine for AI Agents

> **Stop making AI read the entire codebase. Make the graph tell the AI where to look.**

CodeAtlas is an open-source, local-first graph-native code intelligence engine. It parses source code repositories into a structured knowledge graph (Neo4j + SQLite), connects with AI Agents (Cursor, Antigravity, Claude Desktop) via the Model Context Protocol (MCP), and delivers graph-grounded evidence with zero cloud dependence.

---

## 🌟 Key Highlights

- 🧠 **Graph-RAG Retrieval Pipeline**: Combines lexical concept search with Neo4j 6-factor reranking to find exact source locations (`file`, `startLine`, `endLine`).
- 🤖 **8 Progressive MCP Tools**: Exposes `codeatlas_search`, `codeatlas_get_context`, `codeatlas_find_symbol`, `codeatlas_get_callers`, `codeatlas_get_callees`, `codeatlas_get_dependencies`, `codeatlas_analyze_impact`, `codeatlas_trace_execution`.
- ⚡ **Zero-Friction Local Experience**: Runs 100% offline on your machine (`~/.codeatlas/`). Zero telemetry, zero external AI API required.
- 🚀 **Parallel Bounded Indexer**: Multi-core CPU parallel AST extraction with fast SHA-256 content hash skipping.
- 📊 **Control Center & Full-Screen Canvas**: Next.js 16 interactive dashboard with tabbed node inspector, execution tracing, and keyboard navigation.

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/Hellnight2005/CodeAtlas-.git
cd CodeAtlas-
npm install
npm link
```

### 2. Run CodeAtlas on Any Project
Navigate to any repository on your machine:
```bash
cd /path/to/your/project
codeatlas init
codeatlas index .
codeatlas serve
```
- **Dashboard UI**: [http://localhost:3001](http://localhost:3001)
- **REST API**: [http://localhost:5001](http://localhost:5001)

---

## 🔌 Connecting to AI Agents via MCP

Add CodeAtlas to your AI Agent (`mcp_config.json`):

```json
{
  "mcpServers": {
    "codeatlas": {
      "command": "codeatlas",
      "args": ["mcp", "start"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

Now ask your AI Agent natural questions:
- *"How does the upload pipeline work?"*
- *"What happens after POST /upload?"*
- *"If I modify `directUpload.js`, what components are impacted?"*

---

## 📊 Architecture

```text
User Question → AI Agent → CodeAtlas MCP (stdio)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           Concept Normalization    Candidate Search
                    │                   │
                    └─────────┬─────────┘
                              ▼
                     Neo4j Graph Expansion
                              │
                              ▼
                     6-Factor Reranking
                              │
                              ▼
                   Token-Budgeted Context
                              │
                              ▼
                   AI Agent Grounded Answer
```

---

## 💻 CLI Commands

```bash
codeatlas start           # One-command environment start (API + Dashboard + MCP)
codeatlas index .         # Index repository into structural graph
codeatlas watch           # File watcher with incremental indexing
codeatlas doctor          # Diagnose Node.js, SQLite, Neo4j, and Search engine
codeatlas benchmark       # Run performance latency & retrieval quality tests
codeatlas reset           # Reset project graph safely (source code untouched)
```

---

## 📄 License

MIT © [CodeAtlas Contributors](LICENSE)
