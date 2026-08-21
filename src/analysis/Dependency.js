class Dependency {
    constructor(storageAdapter) {
        this.storage = storageAdapter;
    }

    async getDependencies(targetPath) {
        const deps = await this.storage.getDependencies(targetPath);
        return deps.map(d => ({
            id: d.id,
            name: d.name,
            filePath: d.filePath,
            label: d.label,
            properties: d.properties
        }));
    }
}

module.exports = Dependency;
