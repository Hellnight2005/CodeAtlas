# Storage Architecture & Project Isolation

CodeAtlas uses a **Multi-Project Isolated Storage System** located in the user's home directory.

## Storage Directory Layout

```text
~/.codeatlas/
├── config.yaml              # Global configuration
├── global.db                # Global Project Registry SQLite database
├── logs/                    # Global CLI and server logs
└── projects/
    └── <project-id>/
        ├── metadata.db      # Per-project graph database (nodes, edges, files)
        ├── index/           # Incremental index hashes
        ├── logs/            # Project execution logs
        ├── runs/            # Execution run history (Run IDs)
        └── usage/           # Token usage tracking logs
```

## Why CodeAtlas Data Is Stored Outside Source Repositories

CodeAtlas stores graph databases and logs in `~/.codeatlas/` outside the user's Git repository for key architectural reasons:

1. **Avoid Repository Pollution**: Prevents auto-generated SQLite database files (`.db`) or logs from polluting Git working trees.
2. **Prevent Accidental Commits**: Guarantees that internal database files and run telemetry are never accidentally committed into source repositories.
3. **Centralized Multi-Project Management**: Enables CodeAtlas CLI (`codeatlas projects`) and MCP Server to register, list, and query multiple independent projects from a central location.
4. **Data Isolation**: Ensures repositories never mix graph nodes or symbol relationships. Every project receives a stable unique project ID (`proj_<hash>`).

## Platform Home Paths

- **Linux / macOS**: `~/.codeatlas/` (`/home/username/.codeatlas/`)
- **Windows**: `C:\Users\Username\.codeatlas\`
