const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const StorageAdapter = require('./StorageAdapter');

class SqliteAdapter extends StorageAdapter {
    constructor(dbPath = '.codeatlas/codeatlas.db') {
        super();
        this.dbPath = dbPath;
        this.db = null;
    }

    async initialize() {
        const dir = path.dirname(this.dbPath);
        if (dir && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) return reject(err);
                this._createTables()
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    _run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) return reject(err);
                resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    _all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    _get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    async _createTables() {
        await this._run(`
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                repo_id TEXT,
                label TEXT,
                name TEXT,
                file_path TEXT,
                properties TEXT
            )
        `);

        await this._run(`
            CREATE TABLE IF NOT EXISTS edges (
                id TEXT PRIMARY KEY,
                repo_id TEXT,
                source_id TEXT,
                target_id TEXT,
                type TEXT,
                properties TEXT
            )
        `);

        await this._run(`
            CREATE TABLE IF NOT EXISTS files (
                file_path TEXT PRIMARY KEY,
                repo_id TEXT,
                hash TEXT,
                last_modified INTEGER,
                status TEXT
            )
        `);

        await this._run(`
            CREATE TABLE IF NOT EXISTS usage_logs (
                id TEXT PRIMARY KEY,
                repo_id TEXT,
                provider TEXT,
                model TEXT,
                input_tokens INTEGER,
                output_tokens INTEGER,
                total_tokens INTEGER,
                candidate_tokens INTEGER,
                selected_tokens INTEGER,
                duration_ms INTEGER,
                timestamp TEXT
            )
        `);

        await this._run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                repo_id TEXT,
                action TEXT,
                status TEXT,
                duration_ms INTEGER,
                run_id TEXT,
                timestamp TEXT
            )
        `);

        await this._run(`CREATE INDEX IF NOT EXISTS idx_nodes_repo ON nodes(repo_id)`);
        await this._run(`CREATE INDEX IF NOT EXISTS idx_nodes_name ON nodes(name)`);
        await this._run(`CREATE INDEX IF NOT EXISTS idx_nodes_label ON nodes(label)`);
        await this._run(`CREATE INDEX IF NOT EXISTS idx_nodes_filepath ON nodes(file_path)`);
        await this._run(`CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id)`);
        await this._run(`CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id)`);
        await this._run(`CREATE INDEX IF NOT EXISTS idx_edges_type ON edges(type)`);
    }

    async saveNodes(nodes) {
        if (!nodes || !nodes.length) return;
        await this._run('BEGIN TRANSACTION');
        try {
            for (const node of nodes) {
                const propsJson = JSON.stringify(node.properties || {});
                await this._run(
                    `INSERT OR REPLACE INTO nodes (id, repo_id, label, name, file_path, properties)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [node.id, node.repoId || 'default', node.label, node.name, node.filePath || '', propsJson]
                );
            }
            await this._run('COMMIT');
        } catch (err) {
            await this._run('ROLLBACK');
            throw err;
        }
    }

    async saveEdges(edges) {
        if (!edges || !edges.length) return;
        await this._run('BEGIN TRANSACTION');
        try {
            for (const edge of edges) {
                const propsJson = JSON.stringify(edge.properties || {});
                await this._run(
                    `INSERT OR REPLACE INTO edges (id, repo_id, source_id, target_id, type, properties)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [edge.id, edge.repoId || 'default', edge.source, edge.target, edge.type, propsJson]
                );
            }
            await this._run('COMMIT');
        } catch (err) {
            await this._run('ROLLBACK');
            throw err;
        }
    }

    async saveFileMeta(filePath, repoId, hash, status = 'indexed') {
        await this._run(
            `INSERT OR REPLACE INTO files (file_path, repo_id, hash, last_modified, status)
             VALUES (?, ?, ?, ?, ?)`,
            [filePath, repoId, hash, Date.now(), status]
        );
    }

    async getFileMeta(filePath) {
        return await this._get(`SELECT * FROM files WHERE file_path = ?`, [filePath]);
    }

    async getAllFileMetas(repoId) {
        return await this._all(`SELECT * FROM files WHERE repo_id = ?`, [repoId]);
    }

    async deleteFileNodesAndEdges(filePath, repoId) {
        await this._run(`DELETE FROM nodes WHERE file_path = ? AND repo_id = ?`, [filePath, repoId]);
        await this._run(`DELETE FROM files WHERE file_path = ? AND repo_id = ?`, [filePath, repoId]);
    }

    async findNodes(query = {}) {
        let sql = `SELECT * FROM nodes WHERE 1=1`;
        const params = [];

        if (query.repoId) {
            sql += ` AND repo_id = ?`;
            params.push(query.repoId);
        }
        if (query.label) {
            sql += ` AND label = ?`;
            params.push(query.label);
        }
        if (query.name) {
            sql += ` AND (name LIKE ? OR id LIKE ?)`;
            params.push(`%${query.name}%`, `%${query.name}%`);
        }
        if (query.filePath) {
            sql += ` AND file_path LIKE ?`;
            params.push(`%${query.filePath}%`);
        }

        sql += ` LIMIT ${query.limit || 100}`;
        const rows = await this._all(sql, params);
        return rows.map(r => ({
            id: r.id,
            repoId: r.repo_id,
            label: r.label,
            name: r.name,
            filePath: r.file_path,
            properties: JSON.parse(r.properties || '{}')
        }));
    }

    async findEdges(query = {}) {
        let sql = `SELECT * FROM edges WHERE 1=1`;
        const params = [];
        if (query.repoId) {
            sql += ` AND repo_id = ?`;
            params.push(query.repoId);
        }
        if (query.nodeIds && query.nodeIds.length) {
            const placeholders = query.nodeIds.map(() => '?').join(',');
            sql += ` AND (source_id IN (${placeholders}) OR target_id IN (${placeholders}))`;
            params.push(...query.nodeIds, ...query.nodeIds);
        }
        sql += ` LIMIT ${query.limit || 500}`;
        const rows = await this._all(sql, params);
        return rows.map(r => ({
            id: r.id,
            source: r.source_id,
            target: r.target_id,
            type: r.type,
            properties: JSON.parse(r.properties || '{}')
        }));
    }

    async getCallers(symbolId) {
        const sql = `
            SELECT n.*, e.type as rel_type FROM edges e
            JOIN nodes n ON e.source_id = n.id
            WHERE (e.target_id = ? OR e.target_id LIKE ?)
              AND e.type = 'CALLS'
        `;
        const rows = await this._all(sql, [symbolId, `%::${symbolId}`]);
        return rows.map(r => ({
            id: r.id,
            label: r.label,
            name: r.name,
            filePath: r.file_path,
            properties: JSON.parse(r.properties || '{}')
        }));
    }

    async getCallees(symbolId) {
        const sql = `
            SELECT n.*, e.type as rel_type FROM edges e
            JOIN nodes n ON e.target_id = n.id
            WHERE (e.source_id = ? OR e.source_id LIKE ?)
              AND e.type = 'CALLS'
        `;
        const rows = await this._all(sql, [symbolId, `%::${symbolId}`]);
        return rows.map(r => ({
            id: r.id,
            label: r.label,
            name: r.name,
            filePath: r.file_path,
            properties: JSON.parse(r.properties || '{}')
        }));
    }

    async getDependencies(filePath) {
        const sql = `
            SELECT n.*, e.type as rel_type FROM edges e
            JOIN nodes n ON e.target_id = n.id
            WHERE e.source_id LIKE ? AND e.type IN ('IMPORTS', 'DEPENDS_ON')
        `;
        const rows = await this._all(sql, [`%${filePath}%`]);
        return rows.map(r => ({
            id: r.id,
            label: r.label,
            name: r.name,
            filePath: r.file_path,
            properties: JSON.parse(r.properties || '{}')
        }));
    }

    async clearRepository(repoId) {
        await this._run(`DELETE FROM nodes WHERE repo_id = ?`, [repoId]);
        await this._run(`DELETE FROM edges WHERE repo_id = ?`, [repoId]);
        await this._run(`DELETE FROM files WHERE repo_id = ?`, [repoId]);
    }

    async logUsage(data) {
        await this._run(
            `INSERT INTO usage_logs (id, repo_id, provider, model, input_tokens, output_tokens, total_tokens, candidate_tokens, selected_tokens, duration_ms, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.id || `req_${Date.now()}`,
                data.repoId || 'default',
                data.provider || 'none',
                data.model || 'none',
                data.inputTokens || 0,
                data.outputTokens || 0,
                data.totalTokens || 0,
                data.candidateTokens || 0,
                data.selectedTokens || 0,
                data.durationMs || 0,
                new Date().toISOString()
            ]
        );
    }

    async getUsageSummary(repoId) {
        let sql = `SELECT provider, model, SUM(input_tokens) as total_input, SUM(output_tokens) as total_output, SUM(total_tokens) as grand_total, COUNT(*) as count FROM usage_logs`;
        const params = [];
        if (repoId) {
            sql += ` WHERE repo_id = ?`;
            params.push(repoId);
        }
        sql += ` GROUP BY provider, model`;
        return await this._all(sql, params);
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => this.db.close(resolve));
        }
    }
}

module.exports = SqliteAdapter;
