const fs = require('fs');
const path = require('path');
const os = require('os');

class McpActivityLogger {
    constructor() {
        this.logDir = path.join(os.homedir(), '.codeatlas', 'logs');
        this.logFile = path.join(this.logDir, 'mcp_activity.log');
        this.memoryLogs = [];
        this.maxMemory = 100;
        this._ensureDir();
    }

    _ensureDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    logActivity(record) {
        const item = {
            requestId: record.requestId || `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
            toolName: record.toolName || 'unknown',
            projectId: record.projectId || 'local-repo',
            query: record.query || record.symbol || record.target || '',
            durationMs: record.durationMs || 0,
            status: record.status || 'success',
            nodeCount: record.nodeCount || 0,
            relationshipCount: record.relationshipCount || 0,
            truncated: Boolean(record.truncated)
        };

        this.memoryLogs.unshift(item);
        if (this.memoryLogs.length > this.maxMemory) {
            this.memoryLogs.pop();
        }

        try {
            fs.appendFileSync(this.logFile, JSON.stringify(item) + '\n', 'utf8');
        } catch (err) {
            // Ignore file logging errors in restricted environments
        }

        return item;
    }

    getRecentActivity(limit = 20) {
        return this.memoryLogs.slice(0, limit);
    }
}

const globalLogger = new McpActivityLogger();
module.exports = globalLogger;
