class McpQueryCache {
    constructor() {
        this.cache = new Map();
    }

    makeKey(projectId, query, depth = 2) {
        const cleanQuery = String(query).trim().toLowerCase();
        return `${projectId}:${depth}:${cleanQuery}`;
    }

    get(projectId, query, depth = 2) {
        const key = this.makeKey(projectId, query, depth);
        const item = this.cache.get(key);
        if (!item) return null;

        // TTL check (5 minutes)
        if (Date.now() - item.timestamp > 5 * 60 * 1000) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    set(projectId, query, depth = 2, value) {
        const key = this.makeKey(projectId, query, depth);
        this.cache.set(key, {
            timestamp: Date.now(),
            value
        });
    }

    invalidate(projectId) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${projectId}:`)) {
                this.cache.delete(key);
            }
        }
    }

    clear() {
        this.cache.clear();
    }
}

module.exports = new McpQueryCache();
