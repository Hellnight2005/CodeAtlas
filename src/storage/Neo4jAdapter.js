const axios = require('axios');
const StorageAdapter = require('./StorageAdapter');

class Neo4jAdapter extends StorageAdapter {
    constructor(options = {}) {
        super();
        let rawUrl = options.url || process.env.NEO4J_BASE_URL || 'http://localhost:7474';
        rawUrl = rawUrl.replace(/^bolt:\/\//i, 'http://').replace(/^neo4j:\/\//i, 'http://').replace(':7687', ':7474');
        if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
            rawUrl = 'http://' + rawUrl;
        }
        this.baseUrl = rawUrl;

        let authStr = options.auth || process.env.NEO4J_AUTH || 'neo4j/codeatlas123';
        authStr = authStr.replace('/', ':');
        this.authHeader = 'Basic ' + Buffer.from(authStr).toString('base64');
        this.dbName = options.database || 'neo4j';
    }

    async initialize() {
        // Test connection
        try {
            await this._cypher('RETURN 1 as ping');
        } catch (err) {
            throw new Error(`Neo4j connection failed: ${err.message}`);
        }
    }

    async _cypher(statement, parameters = {}) {
        const url = `${this.baseUrl}/db/${this.dbName}/tx/commit`;
        try {
            const response = await axios.post(
                url,
                { statements: [{ statement, parameters, resultDataContents: ["row", "graph"] }] },
                { headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' } }
            );

            if (response.data.errors && response.data.errors.length > 0) {
                throw new Error(response.data.errors[0].message);
            }

            return response.data.results[0];
        } catch (err) {
            const detailMsg = err.response?.data?.errors?.[0]?.message || err.message;
            throw new Error(detailMsg);
        }
    }

    async saveNodes(nodes) {
        if (!nodes || !nodes.length) return;
        for (const node of nodes) {
            const cleanLabel = (node.label || 'Entity').replace(/[^a-zA-Z0-9_]/g, '_');
            const statement = `
                MERGE (n:${cleanLabel} {id: $id})
                SET n.repoId = $repoId,
                    n.name = $name,
                    n.filePath = $filePath
            `;
            await this._cypher(statement, {
                id: String(node.id || node.name),
                repoId: String(node.repoId || 'default'),
                name: String(node.name || node.id || ''),
                filePath: String(node.filePath || '')
            });
        }
    }

    async saveEdges(edges) {
        if (!edges || !edges.length) return;
        for (const edge of edges) {
            const relType = (edge.type || 'DEPENDS_ON').toUpperCase().replace(/[^a-zA-Z0-9_]/g, '_');
            const statement = `
                MATCH (a {id: $sourceId})
                MATCH (b {id: $targetId})
                MERGE (a)-[r:${relType}]->(b)
                SET r.repoId = $repoId
            `;
            await this._cypher(statement, {
                sourceId: String(edge.source),
                targetId: String(edge.target),
                repoId: String(edge.repoId || 'default')
            });
        }
    }

    async findNodes(query = {}) {
        let cypher = 'MATCH (n) WHERE 1=1';
        const params = {};

        if (query.repoId) {
            cypher += ' AND n.repoId = $repoId';
            params.repoId = query.repoId;
        }
        if (query.name) {
            cypher += ' AND (toLower(n.name) CONTAINS toLower($name) OR toLower(n.id) CONTAINS toLower($name))';
            params.name = query.name;
        }
        if (query.filePath) {
            cypher += ' AND toLower(n.filePath) CONTAINS toLower($filePath)';
            params.filePath = query.filePath;
        }

        cypher += ' RETURN n LIMIT 100';
        const result = await this._cypher(cypher, params);
        if (!result || !result.data) return [];

        return result.data.map(row => {
            const graphNode = row.graph.nodes[0];
            return {
                id: graphNode.properties.id || String(graphNode.id),
                repoId: graphNode.properties.repoId,
                label: graphNode.labels[0],
                name: graphNode.properties.name,
                filePath: graphNode.properties.filePath,
                properties: graphNode.properties
            };
        });
    }

    async getCallers(symbolId) {
        const cypher = `
            MATCH (caller)-[:CALLS]->(target)
            WHERE target.id = $symbolId OR target.id ENDS WITH $symbolId OR target.name = $symbolId
            RETURN caller
        `;
        const result = await this._cypher(cypher, { symbolId });
        if (!result || !result.data) return [];
        return result.data.map(row => {
            const n = row.graph.nodes[0];
            return {
                id: n.properties.id || String(n.id),
                label: n.labels[0],
                name: n.properties.name,
                filePath: n.properties.filePath,
                properties: n.properties
            };
        });
    }

    async getCallees(symbolId) {
        const cypher = `
            MATCH (caller)-[:CALLS]->(callee)
            WHERE caller.id = $symbolId OR caller.id ENDS WITH $symbolId OR caller.name = $symbolId
            RETURN callee
        `;
        const result = await this._cypher(cypher, { symbolId });
        if (!result || !result.data) return [];
        return result.data.map(row => {
            const n = row.graph.nodes[0];
            return {
                id: n.properties.id || String(n.id),
                label: n.labels[0],
                name: n.properties.name,
                filePath: n.properties.filePath,
                properties: n.properties
            };
        });
    }

    async getDependencies(filePath) {
        const cypher = `
            MATCH (f:File)-[r:IMPORTS|DEPENDS_ON]->(target)
            WHERE f.filePath CONTAINS $filePath
            RETURN target
        `;
        const result = await this._cypher(cypher, { filePath });
        if (!result || !result.data) return [];
        return result.data.map(row => {
            const n = row.graph.nodes[0];
            return {
                id: n.properties.id || String(n.id),
                label: n.labels[0],
                name: n.properties.name,
                filePath: n.properties.filePath,
                properties: n.properties
            };
        });
    }

    async clearRepository(repoId) {
        // Safe repo-specific deletion!
        const cypher = `
            MATCH (n {repoId: $repoId})
            DETACH DELETE n
        `;
        await this._cypher(cypher, { repoId });
    }

    async close() {
        // HTTP REST adapter cleanup (no-op)
        return Promise.resolve();
    }
}

module.exports = Neo4jAdapter;
