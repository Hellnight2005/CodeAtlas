#!/usr/bin/env node

const { createCli } = require('../src/cli/index');

async function main() {
    const cli = createCli();
    await cli.parseAsync(process.argv);
}

main().catch(err => {
    console.error('Fatal CLI Error:', err.message);
    process.exit(1);
});
