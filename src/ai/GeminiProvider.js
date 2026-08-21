const axios = require('axios');
const AiProvider = require('./AiProvider');

class GeminiProvider extends AiProvider {
    constructor(config = {}) {
        super();
        this.model = config.model || 'gemini-1.5-flash';
        this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
        this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    }

    async isAvailable() {
        return !!this.apiKey;
    }

    async query(prompt, context = {}) {
        if (!this.apiKey) {
            return {
                error: true,
                message: `Gemini API key missing. Please set GEMINI_API_KEY or configure 'ai.apiKey' in .codeatlas/config.yaml.`,
                response: null
            };
        }

        const startTime = Date.now();
        try {
            const res = await axios.post(
                `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    contents: [{ parts: [{ text: prompt }] }]
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            const durationMs = Date.now() - startTime;
            const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const usage = res.data.usageMetadata || {};

            return {
                error: false,
                provider: 'gemini',
                model: this.model,
                response: text,
                inputTokens: usage.promptTokenCount || Math.ceil(prompt.length / 4),
                outputTokens: usage.candidatesTokenCount || Math.ceil(text.length / 4),
                totalTokens: usage.totalTokenCount || 0,
                durationMs
            };
        } catch (err) {
            return {
                error: true,
                message: `Gemini query failed: ${err.response?.data?.error?.message || err.message}`,
                response: null
            };
        }
    }
}

module.exports = GeminiProvider;
