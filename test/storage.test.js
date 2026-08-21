const assert = require('assert');
const test = require('node:test');
const fs = require('fs');
const path = require('path');
const SqliteAdapter = require('../src/storage/SqliteAdapter');
const ContextCompiler = require('../src/context/ContextCompiler');

test('SqliteAdapter & ContextCompiler integration', async () => {
    const dbPath = path.join(process.cwd(), '.codeatlas', 'test_codeatlas.db');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

    const storage = new SqliteAdapter(dbPath);
    await storage.initialize();

    // Insert mock nodes
    await storage.saveNodes([
        { id: 'repo::src/auth.js::file::src/auth.js', repoId: 'repo', label: 'File', name: 'src/auth.js', filePath: 'src/auth.js', properties: {} },
        { id: 'repo::src/auth.js::function::authenticateUser', repoId: 'repo', label: 'Function', name: 'authenticateUser', filePath: 'src/auth.js', properties: {} }
    ]);

    await storage.saveEdges([
        { id: 'e1', repoId: 'repo', source: 'repo::src/auth.js::file::src/auth.js', target: 'repo::src/auth.js::function::authenticateUser', type: 'DEFINES', properties: {} }
    ]);

    const found = await storage.findNodes({ repoId: 'repo', name: 'authenticateUser' });
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].name, 'authenticateUser');

    const compiler = new ContextCompiler(storage, { context: { maxTokens: 4000 } });
    const ctx = await compiler.compileContext('authenticateUser', process.cwd(), 'repo');

    assert.ok(ctx.formattedContext.includes('CODEATLAS CONTEXT PACKAGE'));
    assert.ok(ctx.symbols.includes('authenticateUser'));

    await storage.close();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
});
