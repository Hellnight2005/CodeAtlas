const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { createNodeId } = require('../core/identity');

function parseJsTs(content, filePath, repoId = 'local-repo') {
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
        properties: { language: filePath.endsWith('ts') || filePath.endsWith('tsx') ? 'typescript' : 'javascript' }
    });

    try {
        const ast = babelParser.parse(content, {
            sourceType: 'module',
            plugins: [
                'jsx',
                'typescript',
                'classProperties',
                'dynamicImport',
                'exportDefaultFrom',
                'exportNamespaceFrom',
                'objectRestSpread',
                'asyncGenerators',
                'decorators-legacy'
            ],
            tokens: false
        });

        traverse(ast, {
            ImportDeclaration(path) {
                const source = path.node.source.value;
                const symbols = path.node.specifiers.map(s => s.local.name);
                imports.push({ source, symbols });

                const impNodeId = createNodeId(repoId, source, 'Module', source);
                nodes.push({
                    id: impNodeId,
                    repoId,
                    label: source.startsWith('.') ? 'File' : 'Module',
                    name: source,
                    filePath: source,
                    properties: { external: !source.startsWith('.') }
                });

                edges.push({
                    id: `${fileNodeId}->IMPORTS->${impNodeId}`,
                    repoId,
                    source: fileNodeId,
                    target: impNodeId,
                    type: 'IMPORTS',
                    properties: { symbols }
                });
            },

            FunctionDeclaration(path) {
                const fnName = path.node.id ? path.node.id.name : 'anonymous';
                const fnNodeId = createNodeId(repoId, filePath, 'Function', fnName);
                const params = path.node.params.map(p => p.name || 'param');

                nodes.push({
                    id: fnNodeId,
                    repoId,
                    label: 'Function',
                    name: fnName,
                    filePath,
                    properties: { params, async: path.node.async, generator: path.node.generator }
                });

                edges.push({
                    id: `${fileNodeId}->DEFINES->${fnNodeId}`,
                    repoId,
                    source: fileNodeId,
                    target: fnNodeId,
                    type: 'DEFINES',
                    properties: {}
                });

                // Extract function calls inside function body
                path.traverse({
                    CallExpression(callPath) {
                        let calleeName = '';
                        if (callPath.node.callee.type === 'Identifier') {
                            calleeName = callPath.node.callee.name;
                        } else if (callPath.node.callee.type === 'MemberExpression') {
                            const obj = callPath.node.callee.object.name || 'this';
                            const prop = callPath.node.callee.property.name || 'call';
                            calleeName = `${obj}.${prop}`;
                        }

                        if (calleeName) {
                            const calleeNodeId = createNodeId(repoId, filePath, 'Function', calleeName);
                            edges.push({
                                id: `${fnNodeId}->CALLS->${calleeNodeId}`,
                                repoId,
                                source: fnNodeId,
                                target: calleeNodeId,
                                type: 'CALLS',
                                properties: { calleeName }
                            });
                        }
                    }
                });
            },

            ClassDeclaration(path) {
                const className = path.node.id ? path.node.id.name : 'AnonymousClass';
                const classNodeId = createNodeId(repoId, filePath, 'Class', className);

                nodes.push({
                    id: classNodeId,
                    repoId,
                    label: 'Class',
                    name: className,
                    filePath,
                    properties: {}
                });

                edges.push({
                    id: `${fileNodeId}->DEFINES->${classNodeId}`,
                    repoId,
                    source: fileNodeId,
                    target: classNodeId,
                    type: 'DEFINES',
                    properties: {}
                });

                if (path.node.superClass && path.node.superClass.name) {
                    const superClassNodeId = createNodeId(repoId, filePath, 'Class', path.node.superClass.name);
                    edges.push({
                        id: `${classNodeId}->EXTENDS->${superClassNodeId}`,
                        repoId,
                        source: classNodeId,
                        target: superClassNodeId,
                        type: 'EXTENDS',
                        properties: {}
                    });
                }
            },

            ExportNamedDeclaration(path) {
                if (path.node.declaration && path.node.declaration.id) {
                    exports.push(path.node.declaration.id.name);
                }
            },

            ExportDefaultDeclaration(path) {
                const exportName = path.node.declaration.id ? path.node.declaration.id.name : '__default__';
                exports.push(exportName);
            }
        });

    } catch (err) {
        // Syntax error or fallback
        nodes.push({
            id: fileNodeId,
            repoId,
            label: 'File',
            name: filePath,
            filePath,
            properties: { parseError: err.message }
        });
    }

    return { nodes, edges, imports, exports };
}

module.exports = { parseJsTs };
