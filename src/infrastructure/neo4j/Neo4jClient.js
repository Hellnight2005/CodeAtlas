const axios = require('axios');
const Neo4jConfig = require('./Neo4jConfig');

class Neo4jClient {
    constructor(customConfig = {}) {
        this.config = { ...Neo4jConfig.getConfig(), ...customConfig };
        this.authHeader = 'Basic ' + Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
        this.isConnected = false;
    }

    async connect() {
        try {
            await this.executeCypher('RETURN 1 as ping');
            this.isConnected = true;
            return true;
        } catch (err) {
            this.isConnected = false;
            throw new Error(`Neo4j connection failed: ${err.message}`);
        }
    }

    async executeCypher(statement, parameters = {}) {
        const url = `${this.config.httpUrl}/db/${this.config.database}/tx/commit`;
        try {
            const response = await axios.post(
                url,
                { statements: [{ statement, parameters, resultDataContents: ["row", "graph"] }] },
                {
                    headers: {
                        Authorization: this.authHeader,
                        'Content-Type': 'application/json'
                    },
                    timeout: this.config.connectionTimeoutMs
                }
            );

            if (response.data.errors && response.data.errors.length > 0) {
                const msg = response.data.errors[0].message;
                throw new Error(`Cypher Execution Error: ${msg}`);
            }

            return response.data.results[0] || { data: [] };
        } catch (err) {
            if (err.response && err.response.data && err.response.data.errors) {
                throw new Error(`Neo4j Query Error: ${err.response.data.errors[0].message}`);
            }
            throw new Error(`Neo4j Request Failed: ${err.message}`);
        }
    }

    async executeTransaction(statements = []) {
        const url = `${this.config.httpUrl}/db/${this.config.database}/tx/commit`;
        const payloadStatements = statements.map(s => ({
            statement: s.statement,
            parameters: s.parameters || {},
            resultDataContents: ["row"]
        }));

        try {
            const response = await axios.post(
                url,
                { statements: payloadStatements },
                {
                    headers: {
                        Authorization: this.authHeader,
                        'Content-Type': 'application/json'
                    },
                    timeout: this.config.connectionTimeoutMs
                }
            );

            if (response.data.errors && response.data.errors.length > 0) {
                throw new Error(`Transaction Rollback: ${response.data.errors[0].message}`);
            }

            return response.data.results;
        } catch (err) {
            throw new Error(`Transaction Failed: ${err.message}`);
        }
    }

    async disconnect() {
        this.isConnected = false;
    }
}

module.Neo4jClient = Neo4jClient;
module.exports = Neo4jClient;
