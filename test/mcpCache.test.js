const assert = require('assert');
const test = require('node:test');
const mcpQueryCache = require('../src/mcp/McpQueryCache');
const IntelligenceExtractor = require('../src/extraction/IntelligenceExtractor');

test('McpQueryCache - Cache set, get, and project isolation', () => {
    mcpQueryCache.clear();

    mcpQueryCache.set('proj_A', 'How does upload work?', 2, 'cached_context_A');
    mcpQueryCache.set('proj_B', 'How does upload work?', 2, 'cached_context_B');

    assert.strictEqual(mcpQueryCache.get('proj_A', 'How does upload work?', 2), 'cached_context_A');
    assert.strictEqual(mcpQueryCache.get('proj_B', 'How does upload work?', 2), 'cached_context_B');

    mcpQueryCache.invalidate('proj_A');
    assert.strictEqual(mcpQueryCache.get('proj_A', 'How does upload work?', 2), null);
    assert.strictEqual(mcpQueryCache.get('proj_B', 'How does upload work?', 2), 'cached_context_B');
});

test('IntelligenceExtractor - Precompute architectural layers', () => {
    const code = `
        class UserController {}
        class UserService {}
        class UserRepository {}
    `;

    const extracted = IntelligenceExtractor.extract(code, 'src/user.js', 'test-repo');
    const controllerNode = extracted.nodes.find(n => n.name === 'UserController');
    const serviceNode = extracted.nodes.find(n => n.name === 'UserService');
    const repoNode = extracted.nodes.find(n => n.name === 'UserRepository');

    assert.strictEqual(controllerNode.properties.layer, 'CONTROLLER');
    assert.strictEqual(serviceNode.properties.layer, 'SERVICE');
    assert.strictEqual(repoNode.properties.layer, 'REPOSITORY');
});
