# CodeAtlas Control Center — Dashboard Documentation

## Overview

The CodeAtlas Control Center is the primary developer dashboard and control panel for CodeAtlas. It transforms raw repository code graphs into a technical, information-dense developer workspace.

## Feature Architecture

- **Projects Registry (`/projects`)**: Registered local repositories, status badges (`Ready`, `Indexing`), and indexing triggers.
- **Repository Explorer (`/explorer`)**: IDE-like split view with file tree, symbol definitions, and properties.
- **Code Graph (`/graph`)**: Interactive ReactFlow canvas with concentric node layout, double-click expansion, node type filtering, and property inspection.
- **Symbol Search (`/symbols`)**: Fast symbol lookup and resolution across indexed repositories.
- **Structural Analysis (`/analysis`)**: Workspace for Impact Analysis (blast radius), Callers & Callees graph traversal, and Execution Flow tracing.
- **Query Workspace & Context Compiler (`/query`)**: Graph-driven context compilation inspector displaying candidate vs selected tokens and Selection Ratio context metrics.
- **Execution Runs (`/runs`)**: Run ID execution history and failure diagnostics.
- **Structured Logs (`/logs`)**: Log viewer reading directly from `~/.codeatlas/logs/`.
- **Usage & Token Analytics (`/usage`)**: Token tracking and cost estimation metrics.
- **MCP Integration (`/mcp`)**: Server transport status and active MCP tools overview.
- **Local Storage (`/storage`)**: Storage manager for `~/.codeatlas/` project directories and global registry.
- **System Doctor (`/system`)**: Visual `codeatlas doctor` diagnostics page.
