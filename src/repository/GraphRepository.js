class GraphRepository {
    async connect() { throw new Error('Not implemented'); }
    async disconnect() { throw new Error('Not implemented'); }
    async healthCheck() { throw new Error('Not implemented'); }
    async initializeSchema() { throw new Error('Not implemented'); }

    async createProject(project) { throw new Error('Not implemented'); }
    async getProject(projectId) { throw new Error('Not implemented'); }
    async deleteProjectGraph(projectId) { throw new Error('Not implemented'); }

    async upsertDirectories(projectId, directories) { throw new Error('Not implemented'); }
    async upsertFiles(projectId, files) { throw new Error('Not implemented'); }
    async upsertSymbols(projectId, symbols) { throw new Error('Not implemented'); }
    async upsertRelationships(projectId, relationships) { throw new Error('Not implemented'); }

    async deleteFileGraph(projectId, filePath) { throw new Error('Not implemented'); }

    async findSymbols(query) { throw new Error('Not implemented'); }
    async getSymbol(symbolId) { throw new Error('Not implemented'); }
    async getCallers(symbolId, options) { throw new Error('Not implemented'); }
    async getCallees(symbolId, options) { throw new Error('Not implemented'); }
    async getDependencies(symbolId, options) { throw new Error('Not implemented'); }
    async traverse(query) { throw new Error('Not implemented'); }
    async analyzeImpact(symbolId, depth) { throw new Error('Not implemented'); }
    async findCircularDependencies(projectId) { throw new Error('Not implemented'); }
}

module.exports = GraphRepository;
