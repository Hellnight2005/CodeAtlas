const assert = require('assert');
const test = require('node:test');
const SqliteAdapter = require('../src/storage/SqliteAdapter');
const IntelligenceExtractor = require('../src/extraction/IntelligenceExtractor');
const CodeAtlasMcpServer = require('../src/mcp/McpServer');

test('CodeAtlasMcpServer - Complete verification of all 8 MCP tools', async () => {
    const storage = new SqliteAdapter(':memory:');
    await storage.initialize();

    // 1. Seed mock project data into storage
    const mockCode = `
        class AuthService {
            authenticate(user, pass) {
                return UserRepository.find(user);
            }
        }
        function loginController(req, res) {
            return AuthService.authenticate(req.body.user, req.body.pass);
        }
        router.post('/api/login', loginController);
    `;

    const extracted = IntelligenceExtractor.extract(mockCode, 'src/auth.js', 'mcp-test-repo');
    await storage.saveNodes(extracted.nodes);
    await storage.saveEdges(extracted.edges);

    const mcpServer = new CodeAtlasMcpServer(storage, { repository: { id: 'mcp-test-repo' } });
    assert.ok(mcpServer.server);

    // Get handler from server
    const handler = mcpServer.server._requestHandlers.get('tools/call');
    assert.ok(handler, 'CallTool request handler registered');

    // 2. Test tool 1: codeatlas_search
    const resSearch = await handler({ method: 'tools/call', params: { name: 'codeatlas_search', arguments: { query: 'authenticate', projectId: 'mcp-test-repo' } } });
    assert.ok(!resSearch.isError);
    assert.ok(resSearch.content[0].text.length > 0);

    // 3. Test tool 2: codeatlas_get_context
    const resCtx = await handler({ method: 'tools/call', params: { name: 'codeatlas_get_context', arguments: { query: 'How does authentication work?', projectId: 'mcp-test-repo' } } });
    assert.ok(!resCtx.isError);
    assert.ok(resCtx.content[0].text.length > 0);

    // 4. Test tool 3: codeatlas_find_symbol
    const resFind = await handler({ method: 'tools/call', params: { name: 'codeatlas_find_symbol', arguments: { symbol: 'AuthService' } } });
    assert.ok(!resFind.isError);
    assert.ok(resFind.content[0].text.length > 0);

    // 5. Test tool 4: codeatlas_get_callers
    const resCallers = await handler({ method: 'tools/call', params: { name: 'codeatlas_get_callers', arguments: { symbol: 'authenticate' } } });
    assert.ok(!resCallers.isError);

    // 6. Test tool 5: codeatlas_get_callees
    const resCallees = await handler({ method: 'tools/call', params: { name: 'codeatlas_get_callees', arguments: { symbol: 'loginController' } } });
    assert.ok(!resCallees.isError);

    // 7. Test tool 6: codeatlas_get_dependencies
    const resDeps = await handler({ method: 'tools/call', params: { name: 'codeatlas_get_dependencies', arguments: { target: 'src/auth.js' } } });
    assert.ok(!resDeps.isError);

    // 8. Test tool 7: codeatlas_analyze_impact
    const resImpact = await handler({ method: 'tools/call', params: { name: 'codeatlas_analyze_impact', arguments: { target: 'AuthService' } } });
    assert.ok(!resImpact.isError);

    // 9. Test tool 8: codeatlas_trace_execution
    const resTrace = await handler({ method: 'tools/call', params: { name: 'codeatlas_trace_execution', arguments: { entryPoint: 'POST /api/login' } } });
    assert.ok(!resTrace.isError);

    await storage.close();
});
