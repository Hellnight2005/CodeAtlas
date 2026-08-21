const NoneProvider = require('./NoneProvider');
const OllamaProvider = require('./OllamaProvider');
const OpenAIProvider = require('./OpenAIProvider');
const ClaudeProvider = require('./ClaudeProvider');
const GeminiProvider = require('./GeminiProvider');

class AiProviderFactory {
    static createProvider(providerName = 'none', config = {}) {
        const name = (providerName || 'none').toLowerCase();
        switch (name) {
            case 'ollama':
                return new OllamaProvider(config);
            case 'openai':
                return new OpenAIProvider(config);
            case 'claude':
            case 'anthropic':
                return new ClaudeProvider(config);
            case 'gemini':
            case 'google':
                return new GeminiProvider(config);
            case 'none':
            default:
                return new NoneProvider(config);
        }
    }
}

module.exports = AiProviderFactory;
