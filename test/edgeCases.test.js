const assert = require('assert');
const test = require('node:test');
const SecurityGuard = require('../src/core/security');
const ProjectLocker = require('../src/indexer/ProjectLocker');

test('Edge Cases - Path Traversal Security Guard', () => {
    const safePath = SecurityGuard.sanitizePath('src/api/server.js', process.cwd());
    assert.ok(safePath.includes('src'));

    assert.throws(() => {
        SecurityGuard.sanitizePath('../../secret.txt', process.cwd());
    }, /Security Violation/);
});

test('Edge Cases - Secret Scrubbing', () => {
    const rawCode = `const API_KEY = "sk_live_1234567890abcdef"; const bearer = "Bearer eyJhbGciOiJIUzI1NiJ9";`;
    const scrubbed = SecurityGuard.scrubSecrets(rawCode);

    assert.ok(!scrubbed.includes('sk_live_1234567890abcdef'));
    assert.ok(scrubbed.includes('[REDACTED_SECRET]'));
});

test('Edge Cases - Project Lock Safety', () => {
    const repoId = 'test-lock-repo';
    const jobId = ProjectLocker.acquireLock(repoId);
    assert.ok(jobId);

    assert.throws(() => {
        ProjectLocker.acquireLock(repoId);
    }, /Indexing lock active/);

    ProjectLocker.releaseLock(repoId);
});

test('Edge Cases - Syntax Error AST Parsing Resilience', () => {
    const IntelligenceExtractor = require('../src/extraction/IntelligenceExtractor');
    const invalidJsCode = `function brokenSyntax( { const x = ; return ??? `;
    
    // Should not throw, should return empty or fallback nodes array safely
    const extracted = IntelligenceExtractor.extract(invalidJsCode, 'broken.js', 'test-repo');
    assert.ok(Array.isArray(extracted.nodes));
    assert.ok(Array.isArray(extracted.edges));
});

test('Edge Cases - Regex Special Character Search Safety', () => {
    const SearchEngine = require('../src/search/SearchEngine');
    const searchEngine = new SearchEngine();
    
    // Test regex special characters query: [test] + (symbol) * ? \
    const result = searchEngine.search('[test] + (symbol) * ? \\', []);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 0);
});
