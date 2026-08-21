const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

class GlobalRegistry {
    constructor(homeDir = path.join(os.homedir(), '.codeatlas')) {
        this.homeDir = homeDir;
        this.globalDbPath = path.join(this.homeDir, 'global.db');
        this.projectsDir = path.join(this.homeDir, 'projects');
        this.logsDir = path.join(this.homeDir, 'logs');
        this.db = null;
    }

    async initialize() {
        if (!fs.existsSync(this.homeDir)) fs.mkdirSync(this.homeDir, { recursive: true });
        if (!fs.existsSync(this.projectsDir)) fs.mkdirSync(this.projectsDir, { recursive: true });
        if (!fs.existsSync(this.logsDir)) fs.mkdirSync(this.logsDir, { recursive: true });

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.globalDbPath, (err) => {
                if (err) return reject(err);
                this._createRegistryTables().then(resolve).catch(reject);
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

    _get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
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

    async _createRegistryTables() {
        await this._run(`
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT,
                path TEXT UNIQUE,
                status TEXT,
                created_at TEXT,
                last_indexed_at TEXT
            )
        `);
    }

    async registerProject(repoPath) {
        const absPath = path.resolve(repoPath).replace(/\\/g, '/');
        const repoName = path.basename(absPath);

        const existing = await this._get(`SELECT * FROM projects WHERE path = ?`, [absPath]);
        if (existing) {
            return existing;
        }

        const projHash = crypto.createHash('md5').update(absPath).digest('hex').slice(0, 8);
        const projectId = `proj_${projHash}`;

        const now = new Date().toISOString();
        await this._run(
            `INSERT INTO projects (id, name, path, status, created_at, last_indexed_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [projectId, repoName, absPath, 'registered', now, now]
        );

        // Create isolated directory structure
        const projDir = path.join(this.projectsDir, projectId);
        ['index', 'logs', 'runs', 'usage', 'cache'].forEach(sub => {
            fs.mkdirSync(path.join(projDir, sub), { recursive: true });
        });

        return {
            id: projectId,
            name: repoName,
            path: absPath,
            status: 'registered',
            created_at: now,
            last_indexed_at: now
        };
    }

    async getProjectByPath(repoPath) {
        const absPath = path.resolve(repoPath).replace(/\\/g, '/');
        return await this._get(`SELECT * FROM projects WHERE path = ?`, [absPath]);
    }

    async getProjectDbPath(projectId) {
        return path.join(this.projectsDir, projectId, 'metadata.db');
    }

    async listProjects() {
        return await this._all(`SELECT * FROM projects ORDER BY created_at DESC`);
    }

    async updateLastIndexed(projectId) {
        const now = new Date().toISOString();
        await this._run(`UPDATE projects SET last_indexed_at = ?, status = 'indexed' WHERE id = ?`, [now, projectId]);
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => this.db.close(resolve));
        }
    }
}

module.exports = GlobalRegistry;
