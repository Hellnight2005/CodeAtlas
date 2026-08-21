class AiProvider {
    async query(prompt, context = {}) {
        throw new Error('query() must be implemented');
    }

    async isAvailable() {
        return false;
    }
}

module.exports = AiProvider;
