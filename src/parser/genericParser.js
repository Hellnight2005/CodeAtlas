const { createNodeId } = require('../core/identity');

function parseGeneric(content, filePath, language, repoId = 'local-repo') {
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
        properties: { language }
    });

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Generic Imports/Includes (Go, Rust, C++, Java, PHP)
        const importMatch = line.match(/^(?:import|use|require|include|package)\s+["'<]?([\w\.\/\-_]+)["'>]?;?/i);
        if (importMatch && importMatch[1]) {
            const impName = importMatch[1];
            imports.push({ source: impName });
            const modNodeId = createNodeId(repoId, impName, 'Module', impName);

            nodes.push({
                id: modNodeId,
                repoId,
                label: 'Module',
                name: impName,
                filePath: impName,
                properties: {}
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

        // Generic Classes/Structs/Interfaces
        const structMatch = line.match(/(?:class|struct|interface|trait|enum)\s+([A-Za-z0-9_]+)/i);
        if (structMatch && structMatch[1]) {
            const structName = structMatch[1];
            const structNodeId = createNodeId(repoId, filePath, 'Class', structName);

            nodes.push({
                id: structNodeId,
                repoId,
                label: 'Class',
                name: structName,
                filePath,
                properties: {}
            });

            edges.push({
                id: `${fileNodeId}->DEFINES->${structNodeId}`,
                repoId,
                source: fileNodeId,
                target: structNodeId,
                type: 'DEFINES',
                properties: {}
            });
        }

        // Generic Functions/Methods (func foo(), void foo(), fn foo())
        const funcMatch = line.match(/(?:func|fn|function|def|void|int|string|boolean|public|private|protected)\s+([A-Za-z0-9_]+)\s*\(/i);
        if (funcMatch && funcMatch[1]) {
            const fnName = funcMatch[1];
            if (!['if', 'for', 'while', 'switch', 'catch'].includes(fnName.toLowerCase())) {
                const fnNodeId = createNodeId(repoId, filePath, 'Function', fnName);

                nodes.push({
                    id: fnNodeId,
                    repoId,
                    label: 'Function',
                    name: fnName,
                    filePath,
                    properties: {}
                });

                edges.push({
                    id: `${fileNodeId}->DEFINES->${fnNodeId}`,
                    repoId,
                    source: fileNodeId,
                    target: fnNodeId,
                    type: 'DEFINES',
                    properties: {}
                });
            }
        }
    }

    return { nodes, edges, imports, exports };
}

module.exports = { parseGeneric };
