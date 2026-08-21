/**
 * Abstract Base Class / Interface for Storage Adapters
 */
class StorageAdapter {
    async initialize() {
        throw new Error('initialize() must be implemented by storage adapter');
    }

    async saveNodes(nodes) {
        throw new Error('saveNodes() must be implemented');
    }

    async saveEdges(edges) {
        throw new Error('saveEdges() must be implemented');
    }

    async findNodes(query) {
        throw new Error('findNodes() must be implemented');
    }

    async getCallers(symbolId) {
        throw new Error('getCallers() must be implemented');
    }

    async getCallees(symbolId) {
        throw new Error('getCallees() must be implemented');
    }

    async getDependencies(filePath) {
        throw new Error('getDependencies() must be implemented');
    }

    async clearRepository(repoId) {
        throw new Error('clearRepository() must be implemented');
    }

    async close() {
        // Optional cleanup
    }
}

module.exports = StorageAdapter;
