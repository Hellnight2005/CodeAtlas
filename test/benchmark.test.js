const assert = require('assert');
const test = require('node:test');
const telemetry = require('../src/observability/Telemetry');

test('Telemetry - Record indexing and retrieval metrics', () => {
    telemetry.recordIndexing('test-repo', { totalFiles: 100, processedCount: 100, durationMs: 500 });
    telemetry.recordRetrieval('How does upload work?', { totalMs: 45, lexicalMs: 10, semanticMs: 15, graphTraversalMs: 10, contextBuildMs: 10 });

    const summary = telemetry.getSummary();
    assert.strictEqual(summary.totalIndexedRuns, 1);
    assert.strictEqual(summary.totalQueries, 1);
    assert.strictEqual(summary.avgQueryMs, 45);
});
