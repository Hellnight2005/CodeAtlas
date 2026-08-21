class SymbolLookup {
    constructor(storageAdapter) {
        this.storage = storageAdapter;
    }

    async findSymbol(symbolName, repoId = 'local-repo') {
        const nodes = await this.storage.findNodes({ repoId, name: symbolName, limit: 50 });
        return nodes.map(n => ({
            id: n.id,
            name: n.name,
            label: n.label,
            filePath: n.filePath,
            properties: n.properties
        }));
    }
}

module.exports = SymbolLookup;
