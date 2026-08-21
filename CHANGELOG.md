# Changelog

All notable changes to CodeAtlas will be documented in this file.

## [1.0.0] - 2026-08-21
### Added
- Upgraded CodeAtlas into a local-first code intelligence and structural context engine.
- Multi-language AST parsing for JavaScript, TypeScript, Python, Go, Rust, Java, C/C++, HTML/CSS.
- Embedded zero-config SQLite storage adapter alongside optional Neo4j adapter.
- Query engine commands: `find`, `callers`, `callees`, `dependencies`, `impact`, `trace`.
- Context Compiler with token budgeting and selection ratio metrics.
- Native Node.js Model Context Protocol (MCP) server (`codeatlas mcp start`).
- CLI developer interface (`codeatlas init`, `index`, `status`, `doctor`, `logs`, etc.).
- Structured event logging with Run IDs and token usage tracking.
