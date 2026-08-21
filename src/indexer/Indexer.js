const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const ParserManager = require('../parser/ParserManager');
const { hashContent } = require('../core/identity');
const Logger = require('../observability/Logger');

class Indexer {
    constructor(storageAdapter, config = {}) {
        this.storage = storageAdapter;
        this.config = config;
        this.logger = new Logger({ logDir: config.logging?.logDir });
    }

    async indexRepository(repoPath = process.cwd(), repoId = 'local-repo') {
        const startTime = Date.now();
        this.logger.info('index_start', `Starting repository indexing for ${repoId} at ${repoPath}`, { repoId });

        const ignorePatterns = this.config.repository?.ignore || [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**'
        ];

        // 1. Scan local files
        const files = await fg(['**/*'], {
            cwd: repoPath,
            ignore: ignorePatterns,
            dot: false,
            onlyFiles: true
        });

        this.logger.info('scan_complete', `Found ${files.length} candidate files in repository`, { repoId, fileCount: files.length });

        // 2. Fetch existing file metas from DB for incremental check
        let existingMetas = [];
        if (typeof this.storage.getAllFileMetas === 'function') {
            existingMetas = await this.storage.getAllFileMetas(repoId);
        }
        const metaMap = new Map(existingMetas.map(m => [m.file_path, m.hash]));

        const scannedSet = new Set(files.map(f => f.replace(/\\/g, '/')));
        const deletedFiles = existingMetas.filter(m => !scannedSet.has(m.file_path));

        // 3. Remove deleted files from storage
        for (const del of deletedFiles) {
            if (typeof this.storage.deleteFileNodesAndEdges === 'function') {
                await this.storage.deleteFileNodesAndEdges(del.file_path, repoId);
            }
        }

        // 4. Process new and modified files
        const ProjectLocker = require('./ProjectLocker');
        let jobId;
        try {
            jobId = ProjectLocker.acquireLock(repoId);
        } catch (err) {
            this.logger.warn('index_lock_error', err.message);
            return { repoId, status: 'LOCKED', message: err.message };
        }

        const failedFiles = [];
        let processedCount = 0;
        let skippedCount = 0;

        try {
            const os = require('os');
            const concurrency = Math.max(1, (os.cpus()?.length || 4) - 1);
            // 1. Parallel AST Extraction Worker Pool
            const parseWorker = async (relPath) => {
                const normalizedPath = relPath.replace(/\\/g, '/');
                const fullPath = path.join(repoPath, relPath);

                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const contentHash = hashContent(content);

                    // Incremental check using hash
                    if (this.config.indexing?.incremental && metaMap.get(normalizedPath) === contentHash) {
                        return { status: 'skipped', path: normalizedPath };
                    }

                    // Extract AST, symbols, HTTP routes, tech, and concept tokens
                    const IntelligenceExtractor = require('../extraction/IntelligenceExtractor');
                    const parsed = IntelligenceExtractor.extract(content, normalizedPath, repoId);

                    return {
                        status: 'parsed',
                        path: normalizedPath,
                        contentHash,
                        nodes: parsed.nodes,
                        edges: parsed.edges
                    };
                } catch (err) {
                    this.logger.warn('file_parse_error', `Error processing ${normalizedPath}: ${err.message}`, { filePath: normalizedPath });
                    return { status: 'failed', path: normalizedPath, error: err.message };
                }
            };

            // 2. Process bounded concurrency batches
            for (let i = 0; i < files.length; i += concurrency) {
                const batch = files.slice(i, i + concurrency);
                const batchResults = await Promise.all(batch.map(parseWorker));

                for (const res of batchResults) {
                    if (res.status === 'skipped') {
                        skippedCount++;
                    } else if (res.status === 'failed') {
                        failedFiles.push({ file: res.path, error: res.error });
                    } else if (res.status === 'parsed') {
                        // Delete old nodes for modified file
                        if (typeof this.storage.deleteFileGraph === 'function') {
                            await this.storage.deleteFileGraph(repoId, res.path);
                        } else if (typeof this.storage.deleteFileNodesAndEdges === 'function') {
                            await this.storage.deleteFileNodesAndEdges(res.path, repoId);
                        }

                        // Save to Storage
                        if (typeof this.storage.upsertSymbols === 'function') {
                            const filesMeta = [{ id: `file_${res.path}`, path: res.path, hash: res.contentHash }];
                            await this.storage.upsertFiles(repoId, filesMeta);
                            if (res.nodes.length) await this.storage.upsertSymbols(repoId, res.nodes);
                            if (res.edges.length) await this.storage.upsertRelationships(repoId, res.edges);
                        } else {
                            if (res.nodes.length) await this.storage.saveNodes(res.nodes);
                            if (res.edges.length) await this.storage.saveEdges(res.edges);
                        }

                        // Save File Meta
                        if (typeof this.storage.saveFileMeta === 'function') {
                            await this.storage.saveFileMeta(res.path, repoId, res.contentHash, 'indexed');
                        }

                        processedCount++;
                    }
                }
            }
        } finally {
            ProjectLocker.releaseLock(repoId);
        }

        const durationMs = Date.now() - startTime;
        const status = failedFiles.length > 0 ? 'READY_WITH_WARNINGS' : 'READY';

        this.logger.info('index_complete', `Indexing completed in ${durationMs}ms with status ${status}`, {
            repoId,
            status,
            processedCount,
            skippedCount,
            failedCount: failedFiles.length,
            deletedCount: deletedFiles.length,
            durationMs
        });

        return {
            repoId,
            status,
            totalFiles: files.length,
            processedCount,
            skippedCount,
            failedFiles,
            failedCount: failedFiles.length,
            deletedCount: deletedFiles.length,
            durationMs,
            runId: this.logger.runId
        };
    }
}

module.exports = Indexer;
