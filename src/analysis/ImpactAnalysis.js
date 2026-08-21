const CallGraph = require('./CallGraph');
const Dependency = require('./Dependency');

class ImpactAnalysis {
    constructor(storageAdapter) {
        this.storage = storageAdapter;
        this.callGraph = new CallGraph(storageAdapter);
        this.dependency = new Dependency(storageAdapter);
    }

    async analyzeImpact(symbolOrFile, maxDepth = 4) {
        const callers = await this.callGraph.getCallers(symbolOrFile, maxDepth);
        const directCallers = callers.filter(c => c.depth === 1);
        const indirectCallers = callers.filter(c => c.depth > 1);

        const affectedFiles = new Set();
        callers.forEach(c => {
            if (c.callerFile) affectedFiles.add(c.callerFile);
        });

        // Dependencies of the symbol's file if applicable
        const deps = await this.dependency.getDependencies(symbolOrFile);

        return {
            target: symbolOrFile,
            impactScore: affectedFiles.size * 10 + callers.length * 5,
            affectedFilesCount: affectedFiles.size,
            affectedFiles: Array.from(affectedFiles),
            directCallersCount: directCallers.length,
            directCallers: directCallers.map(c => `${c.caller} (${c.callerFile})`),
            indirectCallersCount: indirectCallers.length,
            indirectCallers: indirectCallers.map(c => `${c.caller} (${c.callerFile})`),
            dependenciesCount: deps.length,
            dependencies: deps.map(d => d.name || d.filePath)
        };
    }
}

module.exports = ImpactAnalysis;
