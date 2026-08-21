# Contributing to CodeAtlas

Thank you for your interest in contributing to CodeAtlas!

## Getting Started

1. Fork and clone the repository.
2. Install dependencies: `npm install`.
3. Run tests: `npm test`.
4. Run CLI locally: `node bin/codeatlas.js doctor`.

## Code Style & Architecture Guidelines

- Keep code modular under `src/`.
- Ensure all storage operations use the `StorageAdapter` interface.
- Keep repository analysis local by default.
- Run tests (`npm test`) before submitting pull requests.
