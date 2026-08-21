const queryNormalizer = require('./QueryNormalizer');

class SearchEngine {
    constructor(storageAdapter) {
        this.storage = storageAdapter;
    }

    async search(query, repoId = 'local-repo', limit = 20) {
        const normalized = queryNormalizer.normalize(query);
        const candidates = new Map();

        const addCandidate = (node, score, reason) => {
            const id = node.id || node.name;
            const existing = candidates.get(id);
            if (existing) {
                existing.score += score;
                if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
            } else {
                candidates.set(id, {
                    node,
                    score,
                    reasons: [reason]
                });
            }
        };

        // 1. Stage 1: Fast Lexical & Symbol Lookup
        const directNodes = await this.storage.findNodes({ repoId, name: query, limit: 10 });
        directNodes.forEach(n => addCandidate(n, 100, 'exact_symbol_match'));

        // 2. Normalized concepts search
        for (const concept of normalized.concepts) {
            const conceptNodes = await this.storage.findNodes({ repoId, name: concept, limit: 10 });
            conceptNodes.forEach(n => addCandidate(n, 50, `concept_match:${concept}`));

            const pathNodes = await this.storage.findNodes({ repoId, filePath: concept, limit: 10 });
            pathNodes.forEach(n => addCandidate(n, 40, `path_match:${concept}`));
        }

        // 3. Stage 2: Graph-Aware Reranking & Neighbor Proximity Boost
        const candidateList = Array.from(candidates.values());
        for (const candidate of candidateList) {
            const node = candidate.node;
            // Entry point boost (Routes, Controllers)
            if (node.label === 'Route' || (node.name && node.name.toLowerCase().includes('controller'))) {
                candidate.score += 35;
                candidate.reasons.push('entry_point_score');
            }
            // Graph Proximity Boost
            if (typeof this.storage.getCallees === 'function') {
                const callees = await this.storage.getCallees(node.id || node.name);
                if (callees && callees.length > 0) {
                    candidate.score += Math.min(callees.length * 5, 25);
                    candidate.reasons.push(`graph_proximity:${callees.length}_callees`);
                }
            }
        }

        // Sort by final reranked score
        const sortedCandidates = candidateList
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return {
            query,
            concepts: normalized.concepts,
            totalResults: sortedCandidates.length,
            results: sortedCandidates,
            diagnostics: {
                exactMatches: directNodes.length,
                candidateCount: candidates.size,
                rerankedCount: sortedCandidates.length
            }
        };
    }
}

module.exports = SearchEngine;
