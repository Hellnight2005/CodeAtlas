const AiProvider = require('./AiProvider');

class NoneProvider extends AiProvider {
    async isAvailable() {
        return true;
    }

    async query(prompt, context = {}) {
        return {
            error: false,
            provider: 'none',
            model: 'none',
            response: 'AI integration is disabled (provider=none). CodeAtlas structural context compiler ran offline.',
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            durationMs: 0
        };
    }
}

module.exports = NoneProvider;
