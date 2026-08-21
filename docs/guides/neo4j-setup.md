# Neo4j Local & Remote Setup Guide

This guide explains how to start and configure Neo4j for CodeAtlas.

---

## 1. Quick Start via Docker Compose (Recommended)

Start local Neo4j 5 Community container:

```bash
docker compose up -d neo4j
```

- **Neo4j Browser**: `http://localhost:7474`
- **Bolt Port**: `7687`
- **Default Auth**: `neo4j` / `password`

### Docker Container Controls
- Stop container: `docker compose stop neo4j`
- View logs: `docker compose logs -f neo4j`
- Reset data: `docker compose down -v`

---

## 2. Environment Variables

Create `.env` in repository root (or copy `.env.example`):

```bash
GRAPH_PROVIDER=neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_HTTP_URL=http://localhost:7474
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j
```

---

## 3. Verifying Connection

Run system diagnostics to verify Neo4j connection:

```bash
codeatlas doctor
```
