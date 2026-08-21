const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
require('dotenv').config();

const DEFAULT_CONFIG = {
    repository: {
        id: 'codeatlas-repo',
        ignore: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/.next/**',
            '**/*.png',
            '**/*.jpg',
            '**/*.jpeg',
            '**/*.gif',
            '**/*.svg',
            '**/*.ico',
            '**/*.pdf',
            '**/*.zip',
            '**/*.tar',
            '**/*.gz',
            '**/*.lock',
            '**/package-lock.json'
        ],
        maxFileSize: 10 * 1024 * 1024 // 10MB
    },
    graph: {
        provider: process.env.GRAPH_PROVIDER || 'sqlite', // 'sqlite' or 'neo4j'
        sqlitePath: process.env.SQLITE_PATH || '.codeatlas/codeatlas.db',
        neo4jUrl: process.env.NEO4J_BASE_URL || 'http://localhost:7474',
        neo4jAuth: process.env.NEO4J_AUTH || 'neo4j:password'
    },
    indexing: {
        incremental: true,
        batchSize: 50
    },
    ai: {
        provider: process.env.AI_PROVIDER || 'none', // 'ollama', 'openai', 'anthropic', 'none'
        baseUrl: process.env.AI_BASE_URL || 'http://localhost:11434',
        model: process.env.AI_MODEL || 'qwen2.5-coder',
        apiKey: process.env.AI_API_KEY || ''
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        logDir: '.codeatlas/logs'
    },
    context: {
        maxTokens: parseInt(process.env.CONTEXT_MAX_TOKENS || '8000', 10),
        maxGraphDepth: parseInt(process.env.CONTEXT_MAX_DEPTH || '5', 10),
        maxFiles: parseInt(process.env.CONTEXT_MAX_FILES || '20', 10)
    }
};

function loadConfig(cwd = process.cwd()) {
    const configPath = path.join(cwd, '.codeatlas', 'config.yaml');
    let loaded = {};

    if (fs.existsSync(configPath)) {
        try {
            const raw = fs.readFileSync(configPath, 'utf8');
            loaded = yaml.parse(raw) || {};
        } catch (err) {
            console.warn(`[Config] Failed to parse ${configPath}: ${err.message}. Using defaults.`);
        }
    }

    return {
        repository: { ...DEFAULT_CONFIG.repository, ...(loaded.repository || {}) },
        graph: { ...DEFAULT_CONFIG.graph, ...(loaded.graph || {}) },
        indexing: { ...DEFAULT_CONFIG.indexing, ...(loaded.indexing || {}) },
        ai: { ...DEFAULT_CONFIG.ai, ...(loaded.ai || {}) },
        logging: { ...DEFAULT_CONFIG.logging, ...(loaded.logging || {}) },
        context: { ...DEFAULT_CONFIG.context, ...(loaded.context || {}) }
    };
}

module.exports = {
    DEFAULT_CONFIG,
    loadConfig
};
