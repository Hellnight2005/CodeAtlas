class Telemetry {
    constructor() {
        this.metrics = {
            indexing: [],
            retrieval: []
        };
    }

    recordIndexing(repoId, stats) {
        const entry = {
            timestamp: Date.now(),
            repoId,
            totalFiles: stats.totalFiles || 0,
            processedCount: stats.processedCount || 0,
            durationMs: stats.durationMs || 0,
            filesPerSec: stats.durationMs > 0 ? ((stats.processedCount / stats.durationMs) * 1000).toFixed(2) : 0
        };
        this.metrics.indexing.push(entry);
        return entry;
    }

    recordRetrieval(query, breakdown) {
        const entry = {
            timestamp: Date.now(),
            query,
            totalMs: breakdown.totalMs || 0,
            lexicalMs: breakdown.lexicalMs || 0,
            semanticMs: breakdown.semanticMs || 0,
            graphTraversalMs: breakdown.graphTraversalMs || 0,
            contextBuildMs: breakdown.contextBuildMs || 0,
            tokensEstimate: breakdown.tokensEstimate || 0
        };
        this.metrics.retrieval.push(entry);
        return entry;
    }

    getSummary() {
        const idx = this.metrics.indexing;
        const ret = this.metrics.retrieval;

        const avgQueryMs = ret.length > 0
            ? Math.round(ret.reduce((sum, r) => sum + r.totalMs, 0) / ret.length)
            : 0;

        const p95QueryMs = ret.length > 0
            ? [...ret].sort((a, b) => a.totalMs - b.totalMs)[Math.floor(ret.length * 0.95)]?.totalMs || avgQueryMs
            : 0;

        return {
            totalIndexedRuns: idx.length,
            totalQueries: ret.length,
            avgQueryMs,
            p95QueryMs,
            latestIndexRun: idx[idx.length - 1] || null
        };
    }
}

module.exports = new Telemetry();
