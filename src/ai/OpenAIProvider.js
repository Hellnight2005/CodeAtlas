const axios = require('axios');
const AiProvider = require('./AiProvider');

class OpenAIProvider extends AiProvider {
    constructor(config = {}) {
        super();
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        this.model = config.model || 'gpt-4o-mini';
        this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    }

    async isAvailable() {
        return !!this.apiKey;
    }

    async query(prompt, context = {}) {
        if (!this.apiKey) {
            return {
                error: true,
                message: `OpenAI API key missing. Please configure 'ai.apiKey' in .codeatlas/config.yaml or OPENAI_API_KEY environment variable.`,
                response: null
            };
        }

        const startTime = Date.now();
        try {
            const res = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }]
                },
                {
                    headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
                }
            );

            const durationMs = Date.now() - startTime;
            const text = res.data.choices[0]?.message?.content || '';
            const usage = res.data.usage || {};

            return {
                error: false,
                provider: 'openai',
                model: this.model,
                response: text,
                inputTokens: usage.prompt_tokens || Math.ceil(prompt.length / 4),
                outputTokens: usage.completion_tokens || Math.ceil(text.length / 4),
                totalTokens: usage.total_tokens || 0,
                durationMs
            };
        } catch (err) {
            return {
                error: true,
                message: `OpenAI query failed: ${err.message}`,
                response: null
            };
        }
    }
}

module.exports = OpenAIProvider;
