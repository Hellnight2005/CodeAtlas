const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Logger {
    constructor(options = {}) {
        this.runId = options.runId || `run_${crypto.randomBytes(4).toString('hex')}`;
        this.level = options.level || 'info';
        this.logDir = options.logDir || '.codeatlas/logs';
        this.quiet = options.quiet || false;

        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        this.currentLevelWeight = levels[this.level.toLowerCase()] ?? 1;

        if (this.logDir && !fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    log(level, action, message, metadata = {}) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const levelWeight = levels[level.toLowerCase()] ?? 1;

        if (levelWeight < this.currentLevelWeight) return;

        const event = {
            id: `evt_${crypto.randomBytes(4).toString('hex')}`,
            runId: this.runId,
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            component: metadata.component || 'core',
            action,
            message,
            ...metadata
        };

        const jsonLine = JSON.stringify(event);

        // Write to log file
        if (this.logDir) {
            const logFile = path.join(this.logDir, `codeatlas_${new Date().toISOString().split('T')[0]}.log`);
            fs.appendFileSync(logFile, jsonLine + '\n', 'utf8');
        }

        // Print to console if not quiet
        if (!this.quiet) {
            const prefix = `[${event.timestamp.slice(11, 19)}] [${event.level}] [${event.component}:${action}]`;
            if (level === 'error') {
                console.error(`${prefix} ${message}`, metadata.error || '');
            } else if (level === 'warn') {
                console.warn(`${prefix} ${message}`);
            } else {
                console.log(`${prefix} ${message}`);
            }
        }

        return event;
    }

    debug(action, message, metadata = {}) {
        return this.log('debug', action, message, metadata);
    }

    info(action, message, metadata = {}) {
        return this.log('info', action, message, metadata);
    }

    warn(action, message, metadata = {}) {
        return this.log('warn', action, message, metadata);
    }

    error(action, message, metadata = {}) {
        return this.log('error', action, message, metadata);
    }
}

module.exports = Logger;
