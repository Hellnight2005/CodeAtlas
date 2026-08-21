class CallGraph {
    constructor(storageAdapter) {
        this.storage = storageAdapter;
    }

    async getCallers(symbolName, maxDepth = 3) {
        const results = [];
        const visited = new Set();

        const queue = [{ symbol: symbolName, depth: 0 }];

        while (queue.length > 0) {
            const { symbol, depth } = queue.shift();
            if (depth >= maxDepth || visited.has(symbol)) continue;
            visited.add(symbol);

            const callers = await this.storage.getCallers(symbol);
            for (const caller of callers) {
                results.push({
                    caller: caller.name,
                    callerFile: caller.filePath,
                    callerLabel: caller.label,
                    target: symbol,
                    depth: depth + 1
                });

                if (depth + 1 < maxDepth) {
                    queue.push({ symbol: caller.id || caller.name, depth: depth + 1 });
                }
            }
        }

        return results;
    }

    async getCallees(symbolName, maxDepth = 3) {
        const results = [];
        const visited = new Set();

        const queue = [{ symbol: symbolName, depth: 0 }];

        while (queue.length > 0) {
            const { symbol, depth } = queue.shift();
            if (depth >= maxDepth || visited.has(symbol)) continue;
            visited.add(symbol);

            const callees = await this.storage.getCallees(symbol);
            for (const callee of callees) {
                results.push({
                    caller: symbol,
                    callee: callee.name,
                    calleeFile: callee.filePath,
                    calleeLabel: callee.label,
                    depth: depth + 1
                });

                if (depth + 1 < maxDepth) {
                    queue.push({ symbol: callee.id || callee.name, depth: depth + 1 });
                }
            }
        }

        return results;
    }
}

module.exports = CallGraph;
