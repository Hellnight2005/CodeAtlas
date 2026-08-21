# Neo4j Architecture & Cypher Query Engine Guide

CodeAtlas uses **Neo4j** as its primary graph database engine for high-performance structural code analysis, call graph traversals, and blast radius impact calculation.

---

## 1. Graph Data Model

### Node Labels
- **`(:Project)`**: Represents an indexed repository.
  - Properties: `id`, `name`, `rootPath`, `createdAt`, `updatedAt`
- **`(:Directory)`**: Directory node.
  - Properties: `id`, `projectId`, `path`, `name`
- **`(:File)`**: Source file node.
  - Properties: `id`, `projectId`, `path`, `name`, `extension`, `language`, `hash`, `size`, `lastIndexedAt`
- **`(:Symbol)`**: AST symbol node (function, class, method, variable).
  - Properties: `id`, `projectId`, `name`, `qualifiedName`, `type`, `filePath`, `startLine`, `endLine`, `signature`, `hash`

### Relationships
- `(Project)-[:CONTAINS]->(Directory)`
- `(Project)-[:CONTAINS]->(File)`
- `(Directory)-[:CONTAINS]->(Directory)`
- `(Directory)-[:CONTAINS]->(File)`
- `(File)-[:DEFINES]->(Symbol)`
- `(File)-[:IMPORTS]->(File)`
- `(Symbol)-[:CALLS]->(Symbol)`
- `(Symbol)-[:DEPENDS_ON]->(Symbol)`
- `(Symbol)-[:EXTENDS]->(Symbol)`

---

## 2. Idempotent Constraints & Indexes

Initialization creates strict unique constraints and lookup indexes:
```cypher
CREATE CONSTRAINT project_id_unique IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT file_id_unique IF NOT EXISTS FOR (f:File) REQUIRE f.id IS UNIQUE;
CREATE CONSTRAINT symbol_id_unique IF NOT EXISTS FOR (s:Symbol) REQUIRE s.id IS UNIQUE;

CREATE INDEX file_project_idx IF NOT EXISTS FOR (f:File) ON (f.projectId);
CREATE INDEX symbol_project_idx IF NOT EXISTS FOR (s:Symbol) ON (s.projectId);
CREATE INDEX symbol_name_idx IF NOT EXISTS FOR (s:Symbol) ON (s.name);
```

---

## 3. Parameterized Batch Updates (`UNWIND`)

To prevent memory leaks and Cypher injection, CodeAtlas uses parameterized `UNWIND` queries:

```cypher
UNWIND $symbols AS s
MERGE (sym:Symbol {id: s.id})
SET sym.projectId = $projectId,
    sym.name = s.name,
    sym.type = s.type,
    sym.filePath = s.filePath
```
