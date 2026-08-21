class QueryNormalizer {
    constructor() {
        this.stopWords = new Set([
            'what', 'happens', 'when', 'does', 'the', 'a', 'an', 'user', 'is', 'are',
            'of', 'to', 'for', 'in', 'on', 'with', 'how', 'where', 'why', 'can', 'you',
            'explain', 'show', 'me', 'find', 'get', 'trace', 'check', 'do', 'it', 'work',
            'system', 'this', 'that', 'code', 'file', 'symbol', 'function', 'class'
        ]);
    }

    normalize(query) {
        if (!query || typeof query !== 'string') {
            return { raw: '', tokens: [], concepts: [] };
        }

        const raw = query.trim().toLowerCase();
        // Extract words (letters, numbers, underscores, slashes, colons)
        const allWords = raw.split(/[\s,?.!/\\():;{}'"]+/).filter(Boolean);

        const concepts = allWords.filter(w => !this.stopWords.has(w) && w.length > 1);

        // Generate token variations (singular/plural, basic stems)
        const variations = new Set();
        for (const c of concepts) {
            variations.add(c);
            if (c === 'authentication') { variations.add('auth'); variations.add('authenticate'); }
            if (c === 'auth') { variations.add('authentication'); variations.add('authenticate'); }
            if (c.endsWith('s') && c.length > 3) variations.add(c.slice(0, -1));
            if (c.endsWith('ing') && c.length > 5) variations.add(c.slice(0, -3));
            if (c.endsWith('ed') && c.length > 4) variations.add(c.slice(0, -2));
            if (c.endsWith('er') && c.length > 4) variations.add(c.slice(0, -2));
        }

        return {
            raw,
            tokens: allWords,
            concepts: Array.from(variations)
        };
    }
}

module.exports = new QueryNormalizer();
