const fs = require('fs');
const path = require('path');
const SymbolLookup = require('../analysis/SymbolLookup');
const CallGraph = require('../analysis/CallGraph');
const Dependency = require('../analysis/Dependency');

class ContextCompiler {
    constructor(storageAdapter, config = {}) {
        this.storage = storageAdapter;
        this.config = config.context || { maxTokens: 8000, maxGraphDepth: 5, maxFiles: 20 };
        this.symbolLookup = new SymbolLookup(storageAdapter);
        this.callGraph = new CallGraph(storageAdapter);
        this.dependency = new Dependency(storageAdapter);
    }

    estimateTokens(text) {
        // Rough estimation: ~4 chars per token
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }

    async compileContext(queryOrTarget, repoPath = process.cwd(), repoId = 'local-repo') {
        const maxTokens = this.config.maxTokens || 8000;
        const SearchEngine = require('../search/SearchEngine');
        const searchEngine = new SearchEngine(this.storage);

        const searchResult = await searchEngine.search(queryOrTarget, repoId, 20);
        let matchedNodes = searchResult.results.map(r => r.node);

        // Fallback: if search engine returns 0, try symbol lookup directly
        if (!matchedNodes.length) {
            matchedNodes = await this.symbolLookup.findSymbol(queryOrTarget, repoId);
        }

        const candidateFiles = new Map();
        const candidateSymbols = new Set();
        let totalCandidateTokens = 0;

        for (const node of matchedNodes) {
            candidateSymbols.add(node.name);
            if (node.filePath) {
                candidateFiles.set(node.filePath, { filePath: node.filePath, score: 10 });
            }

            // Fetch callers & callees
            const callers = await this.callGraph.getCallers(node.name, 2);
            for (const c of callers) {
                candidateSymbols.add(c.caller);
                if (c.callerFile) {
                    const existing = candidateFiles.get(c.callerFile) || { filePath: c.callerFile, score: 0 };
                    existing.score += 5;
                    candidateFiles.set(c.callerFile, existing);
                }
            }

            const callees = await this.callGraph.getCallees(node.name, 2);
            for (const c of callees) {
                candidateSymbols.add(c.callee);
                if (c.calleeFile) {
                    const existing = candidateFiles.get(c.calleeFile) || { filePath: c.calleeFile, score: 0 };
                    existing.score += 5;
                    candidateFiles.set(c.calleeFile, existing);
                }
            }
        }

        // Rank candidate files by score
        const rankedFiles = Array.from(candidateFiles.values()).sort((a, b) => b.score - a.score);

        const selectedFiles = [];
        let selectedTokens = 0;
        const snippets = [];

        for (const fileObj of rankedFiles) {
            const absPath = path.join(repoPath, fileObj.filePath);
            if (!fs.existsSync(absPath)) continue;

            try {
                const content = fs.readFileSync(absPath, 'utf8');
                const fileTokens = this.estimateTokens(content);
                totalCandidateTokens += fileTokens;

                if (selectedTokens + fileTokens <= maxTokens) {
                    selectedTokens += fileTokens;
                    selectedFiles.push(fileObj.filePath);
                    snippets.push({
                        filePath: fileObj.filePath,
                        tokens: fileTokens,
                        content
                    });
                } else {
                    // Truncate file if partial fit available
                    const remainingTokens = maxTokens - selectedTokens;
                    if (remainingTokens > 200) {
                        const maxChars = remainingTokens * 4;
                        const truncatedContent = content.slice(0, maxChars) + '\n\n/* ... [Truncated by CodeAtlas Context Compiler] ... */';
                        selectedTokens += remainingTokens;
                        selectedFiles.push(fileObj.filePath + ' (partial)');
                        snippets.push({
                            filePath: fileObj.filePath,
                            tokens: remainingTokens,
                            content: truncatedContent
                        });
                    }
                    break;
                }
            } catch (err) {
                // Ignore unreadable files
            }
        }

        // Format structured output package
        let formattedPackage = `### CODEATLAS CONTEXT PACKAGE\n\n`;
        formattedPackage += `**Query / Target**: ${queryOrTarget}\n`;
        formattedPackage += `**Relevant Symbols**: ${Array.from(candidateSymbols).join(', ') || 'None'}\n`;
        formattedPackage += `**Estimated Selected Tokens**: ~${selectedTokens}\n`;
        formattedPackage += `**Candidate Tokens Processed**: ~${totalCandidateTokens}\n`;
        formattedPackage += `**Context Efficiency (Selection Ratio)**: ${totalCandidateTokens > 0 ? ((selectedTokens / totalCandidateTokens) * 100).toFixed(1) : 100}%\n\n`;
        formattedPackage += `#### Selected Source Code Snippets:\n\n`;

        for (const snippet of snippets) {
            formattedPackage += `\`\`\`file:${snippet.filePath}\n${snippet.content}\n\`\`\`\n\n`;
        }

        return {
            query: queryOrTarget,
            candidateTokens: totalCandidateTokens,
            selectedTokens,
            selectedFilesCount: selectedFiles.length,
            selectedFiles,
            symbols: Array.from(candidateSymbols),
            formattedContext: formattedPackage,
            snippets
        };
    }
}

module.exports = ContextCompiler;
