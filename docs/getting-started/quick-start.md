# Quick Start Guide

Get started with CodeAtlas in 3 simple commands.

## Step 1: Initialize Configuration

Navigate to your target project folder and run:

```bash
codeatlas init
```

This creates `.codeatlas/config.yaml` with default settings.

## Step 2: Index Your Repository

Build the local structural code graph:

```bash
codeatlas index
```

CodeAtlas scans repository files, extracts AST symbols, and writes the graph to `~/.codeatlas/projects/<project-id>/metadata.db`.

## Step 3: Query Your Codebase

```bash
# Check index summary
codeatlas status

# Find symbol definitions
codeatlas find UserService

# Find callers of a function
codeatlas callers authenticateUser

# Analyze change impact
codeatlas impact UserService
```
