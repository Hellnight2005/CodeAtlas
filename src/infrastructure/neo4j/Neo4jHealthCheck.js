const Neo4jClient = require('./Neo4jClient');

class Neo4jHealthCheck {
    static async checkHealth(customConfig = {}) {
        const client = new Neo4jClient(customConfig);
        const startTime = Date.now();
        try {
            await client.connect();
            const res = await client.executeCypher('CALL dbms.components() YIELD name, versions, edition RETURN name, versions[0] as version, edition');
            const latencyMs = Date.now() - startTime;
            const row = res.data && res.data[0] ? res.data[0].row : ['Neo4j Kernel', '5.x', 'community'];

            return {
                status: 'healthy',
                latencyMs,
                database: client.config.database,
                server: row[0],
                version: row[1],
                edition: row[2]
            };
        } catch (err) {
            return {
                status: 'unhealthy',
                error: err.message,
                database: client.config.database
            };
        }
    }
}

module.exports = Neo4jHealthCheck;
