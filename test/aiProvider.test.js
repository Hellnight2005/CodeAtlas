const assert = require('assert');
const test = require('node:test');
const AiProviderFactory = require('../src/ai/AiProviderFactory');
const NoneProvider = require('../src/ai/NoneProvider');
const OllamaProvider = require('../src/ai/OllamaProvider');
const OpenAIProvider = require('../src/ai/OpenAIProvider');
const ClaudeProvider = require('../src/ai/ClaudeProvider');
const GeminiProvider = require('../src/ai/GeminiProvider');

test('AiProviderFactory - Multi-provider creation', async () => {
    const none = AiProviderFactory.createProvider('none');
    assert.ok(none instanceof NoneProvider);

    const ollama = AiProviderFactory.createProvider('ollama');
    assert.ok(ollama instanceof OllamaProvider);

    const openai = AiProviderFactory.createProvider('openai');
    assert.ok(openai instanceof OpenAIProvider);

    const claude = AiProviderFactory.createProvider('claude');
    assert.ok(claude instanceof ClaudeProvider);

    const gemini = AiProviderFactory.createProvider('gemini');
    assert.ok(gemini instanceof GeminiProvider);
});

test('ClaudeProvider - Graceful fallback when API key missing', async () => {
    const provider = new ClaudeProvider({ apiKey: '' });
    const isAvail = await provider.isAvailable();
    assert.strictEqual(isAvail, false);

    const res = await provider.query('Hello');
    assert.strictEqual(res.error, true);
    assert.ok(res.message.includes('Claude API key missing'));
});

test('GeminiProvider - Graceful fallback when API key missing', async () => {
    const provider = new GeminiProvider({ apiKey: '' });
    const isAvail = await provider.isAvailable();
    assert.strictEqual(isAvail, false);

    const res = await provider.query('Hello');
    assert.strictEqual(res.error, true);
    assert.ok(res.message.includes('Gemini API key missing'));
});
