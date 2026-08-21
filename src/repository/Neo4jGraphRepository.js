const GraphRepository = require('./GraphRepository');
const { Neo4jClient, Neo4jHealthCheck } = require('../infrastructure/neo4j');

class Neo4jGraphRepository extends GraphRepository {
    constructor(customConfig = {}) {
        super();
        this.client = new Neo4jClient(customConfig);
    }

    async connect() {
        return await this.client.connect();
    }

    async disconnect() {
        return await this.client.disconnect();
    }

    async healthCheck() {
        return await Neo4jHealthCheck.checkHealth(this.client.config);
    }

    async initializeSchema() {
        const constraints = [
            'CREATE CONSTRAINT project_id_unique IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE',
            'CREATE CONSTRAINT file_id_unique IF NOT EXISTS FOR (f:File) REQUIRE f.id IS UNIQUE',
            'CREATE CONSTRAINT symbol_id_unique IF NOT EXISTS FOR (s:Symbol) REQUIRE s.id IS UNIQUE',
            'CREATE INDEX project_id_idx IF NOT EXISTS FOR (n:Project) ON (n.id)',
            'CREATE INDEX file_project_idx IF NOT EXISTS FOR (f:File) ON (f.projectId)',
            'CREATE INDEX file_path_idx IF NOT EXISTS FOR (f:File) ON (f.path)',
            'CREATE INDEX symbol_project_idx IF NOT EXISTS FOR (s:Symbol) ON (s.projectId)',
            'CREATE INDEX symbol_name_idx IF NOT EXISTS FOR (s:Symbol) ON (s.name)',
            'CREATE INDEX symbol_qualified_idx IF NOT EXISTS FOR (s:Symbol) ON (s.qualifiedName)',
            'CREATE INDEX symbol_type_idx IF NOT EXISTS FOR (s:Symbol) ON (s.type)'
        ];

        for (const statement of constraints) {
            try {
                await this.client.executeCypher(statement);
            } catch (err) {
                // Ignore constraint creation warnings if unsupported on community version
            }
        }
    }

    async createProject(project) {
        const statement = `
            MERGE (p:Project {id: $id})
            SET p.name = $name,
                p.rootPath = $rootPath,
                p.createdAt = $createdAt,
                p.updatedAt = $updatedAt
            RETURN p
        `;
        await this.client.executeCypher(statement, {
            id: project.id,
            name: project.name,
            rootPath: project.rootPath || project.path || '',
            createdAt: project.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return project;
    }

    async getProject(projectId) {
        const res = await this.client.executeCypher(`MATCH (p:Project {id: $projectId}) RETURN p`, { projectId });
        if (!res.data || !res.data.length) return null;
        return res.data[0].row[0];
    }

    async deleteProjectGraph(projectId) {
        // Safe project-scoped deletion!
        const statement = `
            MATCH (n {projectId: $projectId})
            DETACH DELETE n
        `;
        await this.client.executeCypher(statement, { projectId });
    }

    async upsertDirectories(projectId, directories) {
        if (!directories || !directories.length) return;
        const statement = `
            UNWIND $directories AS d
            MERGE (dir:Directory {id: d.id})
            SET dir.projectId = $projectId,
                dir.path = d.path,
                dir.name = d.name
        `;
        await this.client.executeCypher(statement, { projectId, directories });
    }

    async upsertFiles(projectId, files) {
        if (!files || !files.length) return;
        const statement = `
            UNWIND $files AS f
            MERGE (file:File {id: f.id})
            SET file.projectId = $projectId,
                file.path = f.path,
                file.name = f.name,
                file.extension = f.extension || '',
                file.language = f.language || '',
                file.hash = f.hash || '',
                file.size = f.size || 0,
                file.lastIndexedAt = $now
        `;
        await this.client.executeCypher(statement, {
            projectId,
            files,
            now: new Date().toISOString()
        });
    }

    async upsertSymbols(projectId, symbols) {
        if (!symbols || !symbols.length) return;
        const statement = `
            UNWIND $symbols AS s
            MERGE (sym:Symbol {id: s.id})
            SET sym.projectId = $projectId,
                sym.name = s.name,
                sym.qualifiedName = s.qualifiedName || s.name,
                sym.type = s.type || s.label || 'symbol',
                sym.filePath = s.filePath || '',
                sym.startLine = s.startLine || 0,
                sym.endLine = s.endLine || 0,
                sym.signature = s.signature || '',
                sym.hash = s.hash || ''
        `;
        await this.client.executeCypher(statement, { projectId, symbols });
    }

    async upsertRelationships(projectId, relationships) {
        if (!relationships || !relationships.length) return;
        const statements = relationships.map(rel => {
            const relType = rel.type ? rel.type.toUpperCase() : 'DEPENDS_ON';
            return {
                statement: `
                    MATCH (a {id: $sourceId})
                    MATCH (b {id: $targetId})
                    MERGE (a)-[r:${relType}]->(b)
                    SET r.projectId = $projectId,
                        r.confidence = $confidence,
                        r.updatedAt = $now
                `,
                parameters: {
                    sourceId: rel.source,
                    targetId: rel.target,
                    projectId,
                    confidence: rel.confidence || 'high',
                    now: new Date().toISOString()
                }
            };
        });
        await this.client.executeTransaction(statements);
    }

    async deleteFileGraph(projectId, filePath) {
        // Transactional file graph replacement:
        // Delete symbols owned by this file and their relationships
        const statements = [
            {
                statement: `
                    MATCH (f:File {projectId: $projectId, path: $filePath})-[r:DEFINES]->(s:Symbol)
                    DETACH DELETE s
                `,
                parameters: { projectId, filePath }
            },
            {
                statement: `
                    MATCH (f:File {projectId: $projectId, path: $filePath})
                    DETACH DELETE f
                `,
                parameters: { projectId, filePath }
            }
        ];
        await this.client.executeTransaction(statements);
    }

    async findSymbols(query = {}) {
        let cypher = 'MATCH (s:Symbol) WHERE 1=1';
        const params = {};

        if (query.projectId) {
            cypher += ' AND s.projectId = $projectId';
            params.projectId = query.projectId;
        }
        if (query.name) {
            cypher += ' AND (toLower(s.name) CONTAINS toLower($name) OR toLower(s.qualifiedName) CONTAINS toLower($name))';
            params.name = query.name;
        }
        if (query.filePath) {
            cypher += ' AND toLower(s.filePath) CONTAINS toLower($filePath)';
            params.filePath = query.filePath;
        }
        if (query.type) {
            cypher += ' AND toLower(s.type) = toLower($type)';
            params.type = query.type;
        }

        cypher += ' RETURN s LIMIT 100';
        const res = await this.client.executeCypher(cypher, params);
        if (!res.data) return [];
        return res.data.map(row => row.row[0]);
    }

    async getSymbol(symbolId) {
        const res = await this.client.executeCypher(`MATCH (s:Symbol {id: $symbolId}) RETURN s`, { symbolId });
        if (!res.data || !res.data.length) return null;
        return res.data[0].row[0];
    }

    async getCallers(symbolId, options = {}) {
        const maxDepth = options.depth || 1;
        const cypher = `
            MATCH (caller:Symbol)-[:CALLS*1..${maxDepth}]->(target:Symbol)
            WHERE target.id = $symbolId OR target.name = $symbolId
            RETURN caller
        `;
        const res = await this.client.executeCypher(cypher, { symbolId });
        if (!res.data) return [];
        return res.data.map(row => row.row[0]);
    }

    async getCallees(symbolId, options = {}) {
        const maxDepth = options.depth || 1;
        const cypher = `
            MATCH (target:Symbol)-[:CALLS*1..${maxDepth}]->(callee:Symbol)
            WHERE target.id = $symbolId OR target.name = $symbolId
            RETURN callee
        `;
        const res = await this.client.executeCypher(cypher, { symbolId });
        if (!res.data) return [];
        return res.data.map(row => row.row[0]);
    }

    async getDependencies(symbolId, options = {}) {
        const cypher = `
            MATCH (source)-[r:IMPORTS|DEPENDS_ON]->(target)
            WHERE source.id = $symbolId OR source.path CONTAINS $symbolId
            RETURN target
        `;
        const res = await this.client.executeCypher(cypher, { symbolId });
        if (!res.data) return [];
        return res.data.map(row => row.row[0]);
    }

    async traverse(query = {}) {
        const projectId = query.projectId;
        const cypher = `
            MATCH (a {projectId: $projectId})-[r]->(b {projectId: $projectId})
            RETURN a, r, b LIMIT 200
        `;
        const res = await this.client.executeCypher(cypher, { projectId });
        return res.data || [];
    }

    async analyzeImpact(symbolId, depth = 3) {
        const cypher = `
            MATCH path = (affected:Symbol)-[:CALLS|DEPENDS_ON|REFERENCES*1..${depth}]->(target:Symbol)
            WHERE target.id = $symbolId OR target.name = $symbolId
            RETURN affected, length(path) as distance
        `;
        const res = await this.client.executeCypher(cypher, { symbolId });
        if (!res.data) return { targetSymbol: symbolId, impactScore: 0, affected: [] };

        const affected = res.data.map(row => ({ symbol: row.row[0], distance: row.row[1] }));
        return {
            targetSymbol: symbolId,
            impactScore: affected.length,
            affected
        };
    }

    async findCircularDependencies(projectId) {
        const cypher = `
            MATCH path = (a:Symbol {projectId: $projectId})-[:CALLS|DEPENDS_ON*2..6]->(a)
            RETURN nodes(path) as cycleNodes
        `;
        const res = await this.client.executeCypher(cypher, { projectId });
        if (!res.data) return [];
        return res.data.map(row => row.row[0]);
    }
}

module.exports = Neo4jGraphRepository;
