class CodeAtlasError extends Error {
    constructor(message, code = 'INTERNAL_ERROR', details = {}) {
        super(message);
        this.name = 'CodeAtlasError';
        this.code = code;
        this.details = details;
    }
}

class ParseError extends CodeAtlasError {
    constructor(message, filePath, details = {}) {
        super(message, 'PARSE_ERROR', { filePath, ...details });
        this.name = 'ParseError';
    }
}

class StorageError extends CodeAtlasError {
    constructor(message, details = {}) {
        super(message, 'STORAGE_ERROR', details);
        this.name = 'StorageError';
    }
}

class QueryError extends CodeAtlasError {
    constructor(message, details = {}) {
        super(message, 'QUERY_ERROR', details);
        this.name = 'QueryError';
    }
}

class ContextError extends CodeAtlasError {
    constructor(message, details = {}) {
        super(message, 'CONTEXT_ERROR', details);
        this.name = 'ContextError';
    }
}

module.exports = {
    CodeAtlasError,
    ParseError,
    StorageError,
    QueryError,
    ContextError
};
