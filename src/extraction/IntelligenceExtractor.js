const ParserManager = require('../parser/ParserManager');
const SecurityGuard = require('../core/security');

class IntelligenceExtractor {
    static extract(content, filePath, repoId = 'local-repo') {
        const cleanContent = SecurityGuard.scrubSecrets(content);
        const parsed = ParserManager.parseFile(cleanContent, filePath, repoId);
        const lowerContent = cleanContent.toLowerCase();

        const technologies = new Set();
        const routes = [];
        const conceptTokens = new Set();

        // 1. Detect Technologies
        if (lowerContent.includes('express') || lowerContent.includes('router.')) technologies.add('Express');
        if (lowerContent.includes('next') || lowerContent.includes('app router')) technologies.add('Next.js');
        if (lowerContent.includes('multer') || lowerContent.includes('formdata') || lowerContent.includes('multipart')) technologies.add('Multer');
        if (lowerContent.includes('ffmpeg')) technologies.add('FFmpeg');
        if (lowerContent.includes('crypto') || lowerContent.includes('sha256') || lowerContent.includes('md5')) technologies.add('SHA-256');
        if (lowerContent.includes('redis')) technologies.add('Redis');
        if (lowerContent.includes('s3') || lowerContent.includes('aws-sdk')) technologies.add('AWS S3');
        if (lowerContent.includes('sqlite') || lowerContent.includes('sqlite3')) technologies.add('SQLite');
        if (lowerContent.includes('neo4j')) technologies.add('Neo4j');
        if (lowerContent.includes('jwt') || lowerContent.includes('token') || lowerContent.includes('bearer')) technologies.add('JWT Auth');

        // 2. HTTP Route Detection (Regex for router.get/post/put/delete, app.get/post)
        const routeRegex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]\s*,\s*([a-zA-Z0-9_]+)/g;
        let match;
        while ((match = routeRegex.exec(content)) !== null) {
            const method = match[1].toUpperCase();
            const routePath = match[2];
            const handlerName = match[3];

            const routeId = `route_${method}_${routePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
            routes.push({
                id: routeId,
                repoId,
                label: 'Route',
                name: `${method} ${routePath}`,
                method,
                routePath,
                handlerName,
                filePath
            });

            // Create HANDLED_BY relationship edge
            const handlerNodeId = `symbol_${repoId}_${filePath}_Function_${handlerName}`;
            parsed.edges.push({
                id: `${routeId}->HANDLED_BY->${handlerNodeId}`,
                repoId,
                source: routeId,
                target: handlerNodeId,
                type: 'HANDLED_BY',
                properties: {}
            });
        }

        // Add Route nodes to parsed nodes
        routes.forEach(r => {
            parsed.nodes.push({
                id: r.id,
                repoId: r.repoId,
                label: 'Route',
                name: r.name,
                filePath: r.filePath,
                properties: { method: r.method, routePath: r.routePath, handlerName: r.handlerName }
            });
        });

        // 3. Extract Concept Tokens from path, comments, string literals
        const pathParts = filePath.split(/[\/\\]+/);
        pathParts.forEach(p => {
            p.split(/[^a-zA-Z0-9]+/).forEach(token => {
                if (token.length > 2) conceptTokens.add(token.toLowerCase());
            });
        });

        parsed.nodes.forEach(n => {
            if (n.name) {
                n.name.split(/[^a-zA-Z0-9]+/).forEach(t => {
                    if (t.length > 2) conceptTokens.add(t.toLowerCase());
                });
            }
        });

        parsed.nodes.forEach(node => {
            const nameLower = node.name.toLowerCase();
            let layer = 'MODULE';
            if (node.label === 'Route') layer = 'ROUTE';
            else if (nameLower.includes('controller') || nameLower.includes('route')) layer = 'CONTROLLER';
            else if (nameLower.includes('service') || nameLower.includes('pipeline')) layer = 'SERVICE';
            else if (nameLower.includes('repository') || nameLower.includes('storage') || nameLower.includes('db')) layer = 'REPOSITORY';

            node.properties = {
                ...(node.properties || {}),
                layer,
                callerCount: 0,
                dependencyCount: 0
            };
        });

        return {
            nodes: parsed.nodes,
            edges: parsed.edges,
            imports: parsed.imports || [],
            exports: parsed.exports || [],
            routes,
            technologies: Array.from(technologies),
            conceptTokens: Array.from(conceptTokens),
            fileMetadata: {
                filePath,
                repoId,
                size: content.length,
                language: filePath.endsWith('.py') ? 'python' : 'javascript',
                technologyCount: technologies.size,
                routeCount: routes.length
            }
        };
    }
}

module.exports = IntelligenceExtractor;
