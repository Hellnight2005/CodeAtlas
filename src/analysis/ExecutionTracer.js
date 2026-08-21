const CallGraph = require('./CallGraph');
const SymbolLookup = require('./SymbolLookup');

class ExecutionTracer {
    constructor(storageAdapter) {
        this.storage = storageAdapter;
        this.callGraph = new CallGraph(storageAdapter);
        this.symbolLookup = new SymbolLookup(storageAdapter);
    }

    async traceExecution(entryPointTarget, maxDepth = 5, repoId = 'local-repo') {
        // Look up starting symbol
        const matchedSymbols = await this.symbolLookup.findSymbol(entryPointTarget, repoId);

        if (!matchedSymbols || matchedSymbols.length === 0) {
            return {
                target: entryPointTarget,
                found: false,
                confidence: 'inferred',
                chain: [],
                message: `No exact matching entry point symbol found for '${entryPointTarget}'`
            };
        }

        const startSymbol = matchedSymbols[0];
        const chain = [{
            step: 1,
            symbol: startSymbol.name,
            label: startSymbol.label,
            filePath: startSymbol.filePath
        }];

        const visited = new Set([startSymbol.id || startSymbol.name]);
        let currentSymbol = startSymbol.id || startSymbol.name;
        let step = 1;

        for (let depth = 0; depth < maxDepth; depth++) {
            let callees = await this.storage.getCallees(currentSymbol);
            if (typeof this.storage.findEdges === 'function') {
                const routeEdges = await this.storage.findEdges({ nodeIds: [currentSymbol] });
                if (routeEdges && routeEdges.length) {
                    const targetIds = routeEdges.map(e => e.target);
                    const targetNodes = await this.storage.findNodes({ limit: 10 });
                    callees = callees.concat(targetNodes.filter(n => targetIds.includes(n.id)));
                }
            }
            if (!callees || callees.length === 0) break;

            const next = callees.find(c => !visited.has(c.id || c.name)) || callees[0];
            if (visited.has(next.id || next.name)) break;

            visited.add(next.id || next.name);
            step++;
            chain.push({
                step,
                symbol: next.name,
                label: next.label,
                filePath: next.filePath
            });
            currentSymbol = next.id || next.name;
        }

        return {
            target: entryPointTarget,
            found: true,
            confidence: chain.length > 1 ? 'structural' : 'partial',
            stepsCount: chain.length,
            chain
        };
    }
}

module.exports = ExecutionTracer;
