const assert = require('assert');
const test = require('node:test');
const SqliteAdapter = require('../src/storage/SqliteAdapter');
const Indexer = require('../src/indexer/Indexer');

const fs = require('fs');
const path = require('path');
const os = require('os');

const ProjectLocker = require('../src/indexer/ProjectLocker');

test('Indexer - Bounded concurrency parallel parsing pool', async () => {
    const storage = new SqliteAdapter(':memory:');
    await storage.initialize();

    const repoId = `parallel-repo-${Date.now()}`;
    ProjectLocker.releaseLock(repoId);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeatlas-parallel-'));
    fs.writeFileSync(path.join(tmpDir, 'a.js'), 'function foo() { return 1; }');
    fs.writeFileSync(path.join(tmpDir, 'b.js'), 'function bar() { return 2; }');

    const config = {
        repository: { id: repoId, ignore: [] },
        indexing: { incremental: true },
        logging: { logDir: path.join(tmpDir, 'logs') }
    };

    const indexer = new Indexer(storage, config);
    const res = await indexer.indexRepository(tmpDir, repoId);

    assert.ok(res.processedCount >= 2);
    assert.strictEqual(res.status, 'READY');

    await storage.close();
    ProjectLocker.releaseLock(repoId);
    fs.rmSync(tmpDir, { recursive: true, force: true });
});
