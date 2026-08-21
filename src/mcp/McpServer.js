const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const SymbolLookup = require('../analysis/SymbolLookup');
const CallGraph = require('../analysis/CallGraph');
const Dependency = require('../analysis/Dependency');
const ImpactAnalysis = require('../analysis/ImpactAnalysis');
const ExecutionTracer = require('../analysis/ExecutionTracer');
const ContextCompiler = require('../context/ContextCompiler');
const mcpActivityLogger = require('./McpActivityLogger');

class CodeAtlasMcpServer {
    constructor(storageAdapter, config = {}) {
        this.storage = storageAdapter;
        this.config = config;
        this.symbolLookup = new SymbolLookup(storageAdapter);
        this.callGraph = new CallGraph(storageAdapter);
        this.dependency = new Dependency(storageAdapter);
        this.impactAnalysis = new ImpactAnalysis(storageAdapter);
        this.executionTracer = new ExecutionTracer(storageAdapter);
        this.contextCompiler = new ContextCompiler(storageAdapter, config);

        this.server = new Server(
            { name: 'codeatlas-mcp', version: '1.0.0' },
            { capabilities: { tools: {} } }
        );

        this._setupHandlers();
    }

    _setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'codeatlas_search',
                        description: 'Search the indexed repository using natural-language concepts, symbols, files, routes, technologies, and semantic relationships. Use this when the user asks about a feature or concept without knowing exact symbol names.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'Natural language search query or feature name (e.g. upload pipeline)' },
                                limit: { type: 'number', description: 'Max candidate results (default 20)' }
                            },
                            required: ['query']
                        }
                    },
                    {
                        name: 'codeatlas_get_context',
                        description: 'Use this tool when answering questions that require understanding relationships, architecture, execution flow, dependencies, or impact within the indexed codebase. It retrieves a focused structural subgraph from CodeAtlas.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'Natural language engineering question or task (e.g. How does authentication work?)' },
                                depth: { type: 'number', description: 'Graph traversal depth (1-3, default 2)' },
                                maxNodes: { type: 'number', description: 'Max node budget (default 100)' }
                            },
                            required: ['query']
                        }
                    },
                    {
                        name: 'codeatlas_find_symbol',
                        description: 'Use this tool when you need to find definitions of a function, class, file, or variable in the code graph.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                symbol: { type: 'string', description: 'Name of the symbol, class, or function to find' }
                            },
                            required: ['symbol']
                        }
                    },
                    {
                        name: 'codeatlas_get_callers',
                        description: 'Use this tool when you need to determine which functions or methods invoke a specific target symbol.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                symbol: { type: 'string', description: 'Target function name' },
                                maxDepth: { type: 'number', description: 'Max call graph depth (default 3)' }
                            },
                            required: ['symbol']
                        }
                    },
                    {
                        name: 'codeatlas_get_callees',
                        description: 'Use this tool when you need to determine which functions or methods are invoked by a specific target symbol.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                symbol: { type: 'string', description: 'Target function name' },
                                maxDepth: { type: 'number', description: 'Max call graph depth (default 3)' }
                            },
                            required: ['symbol']
                        }
                    },
                    {
                        name: 'codeatlas_get_dependencies',
                        description: 'Use this tool when you need to inspect imports or module dependencies for a file.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                target: { type: 'string', description: 'File path or module name' }
                            },
                            required: ['target']
                        }
                    },
                    {
                        name: 'codeatlas_analyze_impact',
                        description: 'Use this tool when evaluating what parts of the codebase may be affected by modifying a symbol or file.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                target: { type: 'string', description: 'Symbol or file path to analyze' }
                            },
                            required: ['target']
                        }
                    },
                    {
                        name: 'codeatlas_trace_execution',
                        description: 'Use this tool when tracing a step-by-step execution path from an entry point or API route to database layer.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                entryPoint: { type: 'string', description: 'Route, controller, or entry point function' }
                            },
                            required: ['entryPoint']
                        }
                    }
                ]
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const startTime = Date.now();

            try {
                let resultText = '';
                let nodeCount = 0;
                let relationshipCount = 0;

                const McpQueryCache = require('./McpQueryCache');
                const projectId = args.projectId || this.config.repository?.id || 'local-repo';

                if (name === 'codeatlas_search') {
                    const cached = McpQueryCache.get(projectId, args.query, 1);
                    if (cached) {
                        resultText = cached;
                        nodeCount = 10;
                    } else {
                        const SearchEngine = require('../search/SearchEngine');
                        const searchEngine = new SearchEngine(this.storage);
                        const res = await searchEngine.search(args.query, projectId, args.limit || 20);
                        resultText = JSON.stringify(res, null, 2);
                        nodeCount = res.totalResults;
                        McpQueryCache.set(projectId, args.query, 1, resultText);
                    }
                } else if (name === 'codeatlas_get_context') {
                    const depth = args.depth || 2;
                    const cached = McpQueryCache.get(projectId, args.query, depth);
                    if (cached) {
                        resultText = cached;
                        nodeCount = 10;
                    } else {
                        const res = await this.contextCompiler.compileContext(args.query, process.cwd(), projectId, depth, args.maxNodes || 100);
                        resultText = res.formattedContext;
                        nodeCount = res.selectedFilesCount || 10;
                        relationshipCount = Math.floor(nodeCount * 1.5);
                        McpQueryCache.set(projectId, args.query, depth, resultText);
                    }
                } else if (name === 'codeatlas_find_symbol') {
                    const res = await this.symbolLookup.findSymbol(args.symbol);
                    resultText = JSON.stringify(res, null, 2);
                    nodeCount = res.length;
                } else if (name === 'codeatlas_get_callers') {
                    const res = await this.callGraph.getCallers(args.symbol, args.maxDepth || 3);
                    resultText = JSON.stringify(res, null, 2);
                    nodeCount = res.length;
                } else if (name === 'codeatlas_get_callees') {
                    const res = await this.callGraph.getCallees(args.symbol, args.maxDepth || 3);
                    resultText = JSON.stringify(res, null, 2);
                    nodeCount = res.length;
                } else if (name === 'codeatlas_get_dependencies') {
                    const res = await this.dependency.getDependencies(args.target);
                    resultText = JSON.stringify(res, null, 2);
                    nodeCount = res.length;
                } else if (name === 'codeatlas_analyze_impact') {
                    const res = await this.impactAnalysis.analyzeImpact(args.target);
                    resultText = JSON.stringify(res, null, 2);
                    nodeCount = res.affectedFilesCount || 0;
                } else if (name === 'codeatlas_trace_execution') {
                    const res = await this.executionTracer.traceExecution(args.entryPoint);
                    resultText = JSON.stringify(res, null, 2);
                    nodeCount = res.chain ? res.chain.length : 0;
                } else {
                    throw new Error(`Unknown tool: ${name}`);
                }

                const durationMs = Date.now() - startTime;
                mcpActivityLogger.logActivity({
                    toolName: name,
                    query: args.query || args.symbol || args.target || args.entryPoint || '',
                    durationMs,
                    status: 'success',
                    nodeCount,
                    relationshipCount
                });

                return { content: [{ type: 'text', text: resultText }] };
            } catch (err) {
                const durationMs = Date.now() - startTime;
                mcpActivityLogger.logActivity({
                    toolName: name,
                    query: args?.query || args?.symbol || args?.target || '',
                    durationMs,
                    status: 'error',
                    error: err.message
                });

                return {
                    isError: true,
                    content: [{ type: 'text', text: `Tool error: ${err.message}` }]
                };
            }
        });
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}

module.exports = CodeAtlasMcpServer;
