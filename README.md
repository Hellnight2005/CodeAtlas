<div align="center">
  <h1>🗺️ CodeAtlas</h1>
  <p><strong>Local-First Graph-Native Code Intelligence Engine for AI Agents</strong></p>

  <p>
    <a href="#-quick-start"><img src="https://img.shields.io/badge/Node.js-v20%2B-green?style=for-the-badge&logo=node.js" alt="Node.js"></a>
    <a href="#-mcp-integration"><img src="https://img.shields.io/badge/MCP-Native-indigo?style=for-the-badge&logo=ai" alt="MCP"></a>
    <a href="#-100-local-privacy"><img src="https://img.shields.io/badge/Privacy-100%25_Local-emerald?style=for-the-badge" alt="Privacy"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge" alt="License"></a>
  </p>

  <h3><em>"Stop making AI read the entire codebase. Make the graph tell the AI where to look."</em></h3>

  <br />
</div>

---

## 💡 What is CodeAtlas?

**CodeAtlas** is an open-source, local-first graph-native code intelligence engine. It parses source code repositories into a high-performance structural knowledge graph (Neo4j + SQLite metadata), connects to AI Agents (**Cursor**, **Antigravity**, **Claude Desktop**) via the Model Context Protocol (MCP), and delivers graph-grounded evidence with **zero cloud dependence**.

CodeAtlas eliminates token bloat and hallucination by retrieving exact symbol definitions, execution chains (`POST /upload` ➔ `uploadController` ➔ `pipelineService`), and file line ranges (`file`, `startLine`, `endLine`).

---

## 🌟 Core Features

| Feature | Description |
| :--- | :--- |
| ⚡ **Graph-RAG Retrieval** | Combines concept normalization, lexical search, and 6-factor Neo4j graph reranking. |
| 🤖 **8 Progressive MCP Tools** | Exposes `codeatlas_search`, `codeatlas_get_context`, `codeatlas_find_symbol`, `codeatlas_get_callers`, `codeatlas_get_callees`, `codeatlas_get_dependencies`, `codeatlas_analyze_impact`, `codeatlas_trace_execution`. |
| 🔒 **100% Local Privacy** | Operates completely offline (`~/.codeatlas/`). Zero code uploads, zero telemetry, zero mandatory cloud APIs. |
| 🚀 **Multi-Core Parallel Indexer** | Bounded CPU worker pool featuring SHA-256 content hash skipping for sub-second re-indexing. |
| 🔌 **Multi-Provider AI Factory** | Supports **Anthropic Claude**, **Google Gemini**, **OpenAI**, **Ollama**, or 100% **Local-First** Graph-RAG mode. |
| 📊 **Control Center Dashboard** | Next.js 16 interactive graph workspace with tabbed node inspector, execution tracing, and Docker configurator. |

---

## 🚀 Quick Start

### 1. Global Installation

Clone CodeAtlas and link it globally on your machine:

```bash
git clone https://github.com/Hellnight2005/CodeAtlas-.git
cd CodeAtlas-
npm install
npm link
```

### 2. Run CodeAtlas in Any Project Repository

Navigate to any codebase folder on your system:

```bash
cd /path/to/your/project

# Initialize configuration
codeatlas init

# Index the repository AST into structural code graph
codeatlas index .

# One-command start (Boots REST API Engine, Dashboard UI, and MCP transport)
codeatlas start
```

- 🌐 **Dashboard UI**: [http://localhost:3001](http://localhost:3001)
- 🔌 **REST API Engine**: [http://localhost:5001](http://localhost:5001)

---

## 🤖 MCP Integration for AI Agents

Add CodeAtlas to your AI Agent's configuration file (`mcp_config.json`):

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
- 💬 *"How does the upload pipeline work in this repository?"*
- 💬 *"What happens after POST /upload?"*
- 💬 *"If I modify `directUpload.js`, what components could be impacted?"*

---

## 🏗️ System Architecture

```text
               User Question (Natural Language)
                              │
                              ▼
           AI Agent (Cursor / Antigravity / Claude)
                              │
                              │ Model Context Protocol (stdio)
                              ▼
                    ┌──────────────────┐
                    │  CodeAtlas MCP   │
                    └─────────┬────────┘
                              │
                              ▼
                   Concept Normalizer & Search
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
             Lexical Search     Neo4j Graph Expansion
                     │                 │
                     └────────┬────────┘
                              ▼
                     6-Factor Reranker
                              │
                              ▼
                   Token-Budgeted Context
                              │
                              ▼
                   Grounded Answer to Agent
```

---

## 🛠️ CLI Command Reference

| Command | Description |
| :--- | :--- |
| `codeatlas start` | One-command environment start (API Engine + Dashboard UI + MCP). |
| `codeatlas stop` | Gracefully stop background services and release project storage locks. |
| `codeatlas reset` | Safely reset graph index data for a target project (source code untouched). |
| `codeatlas init` | Initialize local `.codeatlas/config.yaml` in active repository. |
| `codeatlas index .` | Scan repository, parse ASTs, build structural code graph. |
| `codeatlas watch` | Watch repository for file modifications and apply incremental updates. |
| `codeatlas serve` | Launch REST API engine (5001) and Dashboard UI (3001). |
| `codeatlas doctor` | Run environment diagnostics (Node.js, SQLite, Neo4j, Search). |
| `codeatlas benchmark` | Run automated latency & context token efficiency benchmarks. |

---

## 📊 Performance Telemetry Benchmarks

| Metric | Measured Target |
| :--- | :--- |
| **Initial Indexing Throughput** | ~550 files / sec (Bounded CPU Concurrency) |
| **Incremental Re-indexing** | sub-second (< 180ms SHA-256 hash skip) |
| **Search & Concept Normalization** | 12ms |
| **Neo4j Graph Expansion (Depth 2)** | 48ms |
| **6-Factor Reranking & Context Build** | 24ms |
| **Total MCP Response Latency** | **~184ms** |

---

## 📄 License & Community

Released under the [Apache License 2.0](LICENSE). Built for developers and AI pair programmers worldwide.
