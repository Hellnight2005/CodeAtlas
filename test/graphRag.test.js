const assert = require('assert');
const test = require('node:test');
const SqliteAdapter = require('../src/storage/SqliteAdapter');
const IntelligenceExtractor = require('../src/extraction/IntelligenceExtractor');
const QueryNormalizer = require('../src/search/QueryNormalizer');
const SearchEngine = require('../src/search/SearchEngine');
const ContextCompiler = require('../src/context/ContextCompiler');

test('Graph-RAG Pipeline - Natural language query concept retrieval', async () => {
    const storage = new SqliteAdapter(':memory:');
    await storage.initialize();

    // 1. Intelligence Extractor test on mock code containing upload route
    const mockCode = `
        const express = require('express');
        const router = express.Router();
        const multer = require('multer');

        function uploadHandler(req, res) {
            return processUpload(req.file);
        }

        function processUpload(file) {
            return "uploaded";
        }

        router.post('/upload', uploadHandler);
    `;

    const extracted = IntelligenceExtractor.extract(mockCode, 'src/routes/upload.route.js', 'test-repo');
    assert.ok(extracted.routes.length > 0);
    assert.strictEqual(extracted.routes[0].name, 'POST /upload');
    assert.ok(extracted.technologies.includes('Express'));

    await storage.saveNodes(extracted.nodes);
    await storage.saveEdges(extracted.edges);

    // 2. Query Normalizer test
    const query = "What happens when a user uploads a file?";
    const normalized = QueryNormalizer.normalize(query);
    assert.ok(normalized.concepts.includes('upload'));

    // 3. Search Engine retrieval test
    const searchEngine = new SearchEngine(storage);
    const searchRes = await searchEngine.search(query, 'test-repo');
    assert.ok(searchRes.totalResults > 0);

    // 4. Context Compiler test
    const compiler = new ContextCompiler(storage, {});
    const context = await compiler.compileContext(query, process.cwd(), 'test-repo');
    assert.ok(context.formattedContext.includes('upload'));

    await storage.close();
});
