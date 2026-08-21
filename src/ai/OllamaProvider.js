const axios = require('axios');
const AiProvider = require('./AiProvider');

class OllamaProvider extends AiProvider {
    constructor(config = {}) {
        super();
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.model = config.model || 'qwen2.5-coder';
    }

    async isAvailable() {
        try {
            const res = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 2000 });
            return res.status === 200;
        } catch (err) {
            return false;
        }
    }

    async query(prompt, context = {}) {
        const available = await this.isAvailable();
        if (!available) {
            return {
                error: true,
                message: `Ollama is not running at ${this.baseUrl}. Please install Ollama from https://ollama.com and run 'ollama run ${this.model}'`,
                response: null
            };
        }

        const startTime = Date.now();
        try {
            const res = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.model,
                prompt,
                stream: false
            });

            const durationMs = Date.now() - startTime;
            const text = res.data.response || '';
            const evalCount = res.data.eval_count || Math.ceil(text.length / 4);
            const promptEvalCount = res.data.prompt_eval_count || Math.ceil(prompt.length / 4);

            return {
                error: false,
                provider: 'ollama',
                model: this.model,
                response: text,
                inputTokens: promptEvalCount,
                outputTokens: evalCount,
                totalTokens: promptEvalCount + evalCount,
                durationMs
            };
        } catch (err) {
            return {
                error: true,
                message: `Ollama query failed: ${err.message}`,
                response: null
            };
        }
    }
}

module.exports = OllamaProvider;
