const assert = require('assert');
const test = require('node:test');
const fs = require('fs');
const path = require('path');
const os = require('os');
const GlobalRegistry = require('../src/storage/GlobalRegistry');

test('GlobalRegistry - Multi-project isolation and registration', async () => {
    const testHome = path.join(os.tmpdir(), `codeatlas_test_home_${Date.now()}`);
    const registry = new GlobalRegistry(testHome);
    await registry.initialize();

    const proj1 = await registry.registerProject('/mock/repo1');
    const proj2 = await registry.registerProject('/mock/repo2');

    assert.ok(proj1.id.startsWith('proj_'));
    assert.ok(proj2.id.startsWith('proj_'));
    assert.notStrictEqual(proj1.id, proj2.id, 'Project IDs must be unique');

    const dbPath1 = await registry.getProjectDbPath(proj1.id);
    assert.ok(dbPath1.includes(proj1.id));
    assert.ok(fs.existsSync(path.dirname(dbPath1)));

    const projectsList = await registry.listProjects();
    assert.strictEqual(projectsList.length, 2);

    await registry.close();
    fs.rmSync(testHome, { recursive: true, force: true });
});
