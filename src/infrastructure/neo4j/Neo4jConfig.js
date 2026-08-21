const path = require('path');
require('dotenv').config();

class Neo4jConfig {
    static getConfig() {
        return {
            uri: process.env.NEO4J_URI || process.env.NEO4J_BASE_URL || 'bolt://localhost:7687',
            httpUrl: process.env.NEO4J_HTTP_URL || process.env.NEO4J_BASE_URL || 'http://localhost:7474',
            username: process.env.NEO4J_USERNAME || (process.env.NEO4J_AUTH ? process.env.NEO4J_AUTH.split(':')[0] : 'neo4j'),
            password: process.env.NEO4J_PASSWORD || (process.env.NEO4J_AUTH ? process.env.NEO4J_AUTH.split(':')[1] : 'password'),
            database: process.env.NEO4J_DATABASE || 'neo4j',
            maxConnectionPoolSize: parseInt(process.env.NEO4J_POOL_SIZE || '50', 10),
            connectionTimeoutMs: parseInt(process.env.NEO4J_TIMEOUT_MS || '10000', 10),
        };
    }
}

module.exports = Neo4jConfig;
