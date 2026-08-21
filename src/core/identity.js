const path = require('path');

/**
 * Generate stable unique identity strings for Graph Nodes.
 * ID format: <repoId>::<filePath>::<entityType>::<entityName>
 */
function createNodeId(repoId, filePath, entityType, entityName) {
    const normalizedRepo = (repoId || 'local-repo').replace(/\\/g, '/');
    const normalizedPath = (filePath || '').replace(/\\/g, '/');
    const type = (entityType || 'entity').toLowerCase();
    const name = entityName || 'anonymous';
    return `${normalizedRepo}::${normalizedPath}::${type}::${name}`;
}

/**
 * Normalize file path to relative forward-slash format
 */
function normalizePath(filePath) {
    if (!filePath) return '';
    return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Generate MD5/SHA256 hash or simple content signature
 */
const crypto = require('crypto');
function hashContent(content) {
    return crypto.createHash('sha256').update(content || '').digest('hex');
}

function createSymbolId(projectId, filePath, symbolType, qualifiedName, signature = '') {
    const rawStr = `${projectId || 'proj_default'}::${normalizePath(filePath)}::${(symbolType || 'symbol').toLowerCase()}::${qualifiedName || ''}::${signature}`;
    const hash = crypto.createHash('sha256').update(rawStr).digest('hex').slice(0, 16);
    return `sym_${hash}`;
}

module.exports = {
    createNodeId,
    createSymbolId,
    normalizePath,
    hashContent
};
