const assert = require('assert');
const test = require('node:test');
const Neo4jGraphRepository = require('../src/repository/Neo4jGraphRepository');

test('Neo4jGraphRepository - Unit contract and interface completeness', () => {
    const repo = new Neo4jGraphRepository();

    assert.ok(typeof repo.connect === 'function');
    assert.ok(typeof repo.initializeSchema === 'function');
    assert.ok(typeof repo.createProject === 'function');
    assert.ok(typeof repo.upsertFiles === 'function');
    assert.ok(typeof repo.upsertSymbols === 'function');
    assert.ok(typeof repo.upsertRelationships === 'function');
    assert.ok(typeof repo.deleteFileGraph === 'function');
    assert.ok(typeof repo.findSymbols === 'function');
    assert.ok(typeof repo.getCallers === 'function');
    assert.ok(typeof repo.getCallees === 'function');
    assert.ok(typeof repo.analyzeImpact === 'function');
    assert.ok(typeof repo.findCircularDependencies === 'function');
});
