// Error response formatter
export function formatErrorResponse(code, message) {
    return {
        code,
        message
    };
}

// Success response formatter
export function formatSuccessResponse(data) {
    return {
        id: data.id,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        created_at: data.created_at || new Date().toISOString()
    };
}

// Error handler middleware
export function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    // Default error
    let errorResponse = formatErrorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred'
    );

    // Specific error types
    if (err.name === 'ValidationError') {
        errorResponse = formatErrorResponse('INVALID_REQUEST', err.message);
    } else if (err.name === 'NotFoundError') {
        errorResponse = formatErrorResponse('RESOURCE_NOT_FOUND', err.message);
    } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
        errorResponse = formatErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests');
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json(errorResponse);
}
