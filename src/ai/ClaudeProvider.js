const axios = require('axios');
const AiProvider = require('./AiProvider');

class ClaudeProvider extends AiProvider {
    constructor(config = {}) {
        super();
        this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
        this.model = config.model || 'claude-3-5-sonnet-20241022';
        this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
    }

    async isAvailable() {
        return !!this.apiKey;
    }

    async query(prompt, context = {}) {
        if (!this.apiKey) {
            return {
                error: true,
                message: `Anthropic Claude API key missing. Please set ANTHROPIC_API_KEY or configure 'ai.apiKey' in .codeatlas/config.yaml.`,
                response: null
            };
        }

        const startTime = Date.now();
        try {
            const res = await axios.post(
                `${this.baseUrl}/messages`,
                {
                    model: this.model,
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                },
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    }
                }
            );

            const durationMs = Date.now() - startTime;
            const text = res.data.content?.[0]?.text || '';
            const usage = res.data.usage || {};

            return {
                error: false,
                provider: 'claude',
                model: this.model,
                response: text,
                inputTokens: usage.input_tokens || Math.ceil(prompt.length / 4),
                outputTokens: usage.output_tokens || Math.ceil(text.length / 4),
                totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
                durationMs
            };
        } catch (err) {
            return {
                error: true,
                message: `Claude query failed: ${err.response?.data?.error?.message || err.message}`,
                response: null
            };
        }
    }
}

module.exports = ClaudeProvider;
