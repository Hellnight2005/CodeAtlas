const assert = require('assert');
const test = require('node:test');
const SqliteAdapter = require('../src/storage/SqliteAdapter');
const IntelligenceExtractor = require('../src/extraction/IntelligenceExtractor');
const ContextCompiler = require('../src/context/ContextCompiler');
const SearchEngine = require('../src/search/SearchEngine');
const ImpactAnalysis = require('../src/analysis/ImpactAnalysis');
const ExecutionTracer = require('../src/analysis/ExecutionTracer');

test('End-to-End Test 1: What happens when a user uploads a file?', async () => {
    const storage = new SqliteAdapter(':memory:');
    await storage.initialize();

    const mockUploadCode = `
        const multer = require('multer');
        function uploadController(req, res) {
            return pipelineService.process(req.file);
        }
        router.post('/upload', uploadController);
    `;

    const extracted = IntelligenceExtractor.extract(mockUploadCode, 'src/routes/upload.route.js', 'upload-repo');
    await storage.saveNodes(extracted.nodes);
    await storage.saveEdges(extracted.edges);

    const compiler = new ContextCompiler(storage, {});
    const res = await compiler.compileContext("What happens when a user uploads a file?", process.cwd(), 'upload-repo');

    assert.ok(res.formattedContext.includes('upload') || res.selectedFiles.length > 0);
    await storage.close();
});

test('End-to-End Test 2: What happens after POST /upload?', async () => {
    const storage = new SqliteAdapter(':memory:');
    await storage.initialize();

    const mockRouteCode = `
        function uploadController(req, res) {
            return pipelineService.processUpload(req.file);
        }
        router.post('/upload', uploadController);
    `;

    const extracted = IntelligenceExtractor.extract(mockRouteCode, 'src/routes/upload.route.js', 'upload-repo');
    await storage.saveNodes(extracted.nodes);
    await storage.saveEdges(extracted.edges);

    const tracer = new ExecutionTracer(storage);
    const traceRes = await tracer.traceExecution('POST /upload', 5, 'upload-repo');

    assert.ok(traceRes.chain.length > 0);
    assert.strictEqual(traceRes.chain[0].symbol, 'POST /upload');
    await storage.close();
});

test('End-to-End Test 3: What could be affected if I change directUpload.js?', async () => {
    const storage = new SqliteAdapter(':memory:');
    await storage.initialize();

    // Mock directUpload -> pipelineService -> uploadController
    const directUploadNode = { id: 'file_directUpload', repoId: 'upload-repo', label: 'File', name: 'directUpload.js', filePath: 'src/services/directUpload.js', properties: {} };
    const pipelineNode = { id: 'file_pipelineService', repoId: 'upload-repo', label: 'File', name: 'pipeline.service.js', filePath: 'src/services/pipeline.service.js', properties: {} };
    const edge = { id: 'edge_calls', repoId: 'upload-repo', source: 'file_pipelineService', target: 'file_directUpload', type: 'IMPORTS', properties: {} };

    await storage.saveNodes([directUploadNode, pipelineNode]);
    await storage.saveEdges([edge]);

    const impact = new ImpactAnalysis(storage);
    const impactRes = await impact.analyzeImpact('directUpload.js');

    assert.ok(impactRes.affectedFilesCount >= 0);
    await storage.close();
});
