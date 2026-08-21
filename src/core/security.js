const path = require('path');

class SecurityGuard {
    static sanitizePath(targetPath, rootPath = process.cwd()) {
        const resolvedTarget = path.resolve(rootPath, targetPath);
        const resolvedRoot = path.resolve(rootPath);

        if (!resolvedTarget.startsWith(resolvedRoot)) {
            throw new Error(`Security Violation: Path traversal outside project root is forbidden (${targetPath})`);
        }

        return resolvedTarget;
    }

    static scrubSecrets(text) {
        if (!text || typeof text !== 'string') return text;

        // Replace sensitive key-value pairs (API_KEY=..., TOKEN=..., PASSWORD=..., SECRET=...)
        return text
            .replace(/(api[_-]?key|token|password|secret|private[_-]?key)\s*[:=]\s*['"]?([a-zA-Z0-9_\-\.\~]{8,})['"]?/gi, '$1=[REDACTED_SECRET]')
            .replace(/(bearer\s+)[a-zA-Z0-9_\-\.]{15,}/gi, '$1[REDACTED_TOKEN]');
    }
}

module.exports = SecurityGuard;
