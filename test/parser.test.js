const assert = require('assert');
const test = require('node:test');
const ParserManager = require('../src/parser/ParserManager');

test('ParserManager - JS/TS AST parsing', () => {
    const code = `
        import fs from 'fs';
        import path from 'path';

        export class UserProcessor {
            constructor(name) {
                this.name = name;
            }

            process() {
                console.log(this.name);
            }
        }

        export function calculateTotal(items) {
            return items.reduce((acc, item) => acc + item.price, 0);
        }
    `;

    const res = ParserManager.parseFile(code, 'src/processor.ts', 'test-repo');

    assert.ok(res.nodes.length > 0, 'Should extract nodes');
    assert.ok(res.edges.length > 0, 'Should extract edges');
    assert.strictEqual(res.imports.length, 2, 'Should extract 2 imports');

    const classNode = res.nodes.find(n => n.name === 'UserProcessor');
    assert.ok(classNode, 'UserProcessor class should exist');
    assert.strictEqual(classNode.label, 'Class');

    const fnNode = res.nodes.find(n => n.name === 'calculateTotal');
    assert.ok(fnNode, 'calculateTotal function should exist');
    assert.strictEqual(fnNode.label, 'Function');
});

test('ParserManager - Python AST parsing', () => {
    const pyCode = `
import os
import sys
from datetime import datetime

class ReportGenerator:
    def __init__(self, title):
        self.title = title

    def generate(self):
        print(self.title)

def calculate_score(data):
    return sum(data)
    `;

    const res = ParserManager.parseFile(pyCode, 'src/report.py', 'test-repo');
    assert.ok(res.nodes.length > 0);
    assert.ok(res.imports.length >= 2);

    const classNode = res.nodes.find(n => n.name === 'ReportGenerator');
    assert.ok(classNode);

    const fnNode = res.nodes.find(n => n.name === 'calculate_score');
    assert.ok(fnNode);
});
