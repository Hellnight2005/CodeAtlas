const assert = require('assert');
const test = require('node:test');
const { createCli } = require('../src/cli/index');

test('CLI - Command registration for start, stop, reset, doctor, and benchmark', () => {
    const cli = createCli();
    const commandNames = cli.commands.map(c => c.name());

    assert.ok(commandNames.includes('start'));
    assert.ok(commandNames.includes('stop'));
    assert.ok(commandNames.includes('reset'));
    assert.ok(commandNames.includes('doctor'));
    assert.ok(commandNames.includes('benchmark'));
});
