const path = require('path');
const { parseJsTs } = require('./jsTsParser');
const { parsePython } = require('./pythonParser');
const { parseGeneric } = require('./genericParser');

class ParserManager {
    static parseFile(content, filePath, repoId = 'local-repo') {
        const ext = path.extname(filePath).toLowerCase();

        if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext)) {
            return parseJsTs(content, filePath, repoId);
        }

        if (['.py', '.pyw'].includes(ext)) {
            return parsePython(content, filePath, repoId);
        }

        const languageMap = {
            '.go': 'go',
            '.rs': 'rust',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.html': 'html',
            '.css': 'css'
        };

        const lang = languageMap[ext] || 'unknown';
        return parseGeneric(content, filePath, lang, repoId);
    }
}

module.exports = ParserManager;
