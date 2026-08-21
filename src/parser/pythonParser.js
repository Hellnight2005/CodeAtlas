const { createNodeId } = require('../core/identity');

function parsePython(content, filePath, repoId = 'local-repo') {
    const nodes = [];
    const edges = [];
    const imports = [];
    const exports = [];

    const fileNodeId = createNodeId(repoId, filePath, 'File', filePath);
    nodes.push({
        id: fileNodeId,
        repoId,
        label: 'File',
        name: filePath,
        filePath,
        properties: { language: 'python' }
    });

    const lines = content.split('\n');
    let currentScopeNodeId = fileNodeId;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 1. Imports
        const importMatch = line.match(/^import\s+([\w\.]+)|^from\s+([\w\.]+)\s+import\s+([\w\*\,]+)/);
        if (importMatch) {
            const modName = importMatch[1] || importMatch[2];
            if (modName) {
                imports.push({ source: modName });
                const modNodeId = createNodeId(repoId, modName, 'Module', modName);
                nodes.push({
                    id: modNodeId,
                    repoId,
                    label: modName.startsWith('.') ? 'File' : 'Module',
                    name: modName,
                    filePath: modName,
                    properties: { external: !modName.startsWith('.') }
                });
                edges.push({
                    id: `${fileNodeId}->IMPORTS->${modNodeId}`,
                    repoId,
                    source: fileNodeId,
                    target: modNodeId,
                    type: 'IMPORTS',
                    properties: {}
                });
            }
        }

        // 2. Class Definition
        const classMatch = line.match(/^class\s+([A-Za-z0-9_]+)(?:\(([^)]+)\))?:/);
        if (classMatch) {
            const className = classMatch[1];
            const baseClass = classMatch[2];
            const classNodeId = createNodeId(repoId, filePath, 'Class', className);

            nodes.push({
                id: classNodeId,
                repoId,
                label: 'Class',
                name: className,
                filePath,
                properties: { baseClass }
            });

            edges.push({
                id: `${fileNodeId}->DEFINES->${classNodeId}`,
                repoId,
                source: fileNodeId,
                target: classNodeId,
                type: 'DEFINES',
                properties: {}
            });

            if (baseClass) {
                const superClassNodeId = createNodeId(repoId, filePath, 'Class', baseClass.trim());
                edges.push({
                    id: `${classNodeId}->EXTENDS->${superClassNodeId}`,
                    repoId,
                    source: classNodeId,
                    target: superClassNodeId,
                    type: 'EXTENDS',
                    properties: {}
                });
            }
            currentScopeNodeId = classNodeId;
        }

        // 3. Function Definition
        const funcMatch = line.match(/^def\s+([A-Za-z0-9_]+)\s*\(([^)]*)\):/);
        if (funcMatch) {
            const fnName = funcMatch[1];
            const params = funcMatch[2].split(',').map(p => p.trim());
            const fnNodeId = createNodeId(repoId, filePath, 'Function', fnName);

            nodes.push({
                id: fnNodeId,
                repoId,
                label: 'Function',
                name: fnName,
                filePath,
                properties: { params }
            });

            edges.push({
                id: `${fileNodeId}->DEFINES->${fnNodeId}`,
                repoId,
                source: fileNodeId,
                target: fnNodeId,
                type: 'DEFINES',
                properties: {}
            });

            currentScopeNodeId = fnNodeId;
        }

        // 4. Function calls
        const callMatches = line.matchAll(/([A-Za-z0-9_]+)\s*\(/g);
        for (const match of callMatches) {
            const calleeName = match[1];
            if (!['def', 'class', 'if', 'elif', 'while', 'for', 'return', 'print', 'len', 'range'].includes(calleeName)) {
                const calleeNodeId = createNodeId(repoId, filePath, 'Function', calleeName);
                edges.push({
                    id: `${currentScopeNodeId}->CALLS->${calleeNodeId}`,
                    repoId,
                    source: currentScopeNodeId,
                    target: calleeNodeId,
                    type: 'CALLS',
                    properties: { calleeName }
                });
            }
        }
    }

    return { nodes, edges, imports, exports };
}

module.exports = { parsePython };
