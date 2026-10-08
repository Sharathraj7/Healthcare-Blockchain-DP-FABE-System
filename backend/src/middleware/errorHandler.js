/**
 * Error Handler Middleware
 * Centralized error handling with consistent JSON responses
 */

/**
 * Not found handler
 */
function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  console.error(`[Error] ${status} - ${err.message}`);
  if (isDevelopment && err.stack) {
    console.error(err.stack);
  }
  
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'An internal server error occurred',
      ...(isDevelopment && { stack: err.stack }),
    },
  });
}

/**
 * Validation error handler for express-validator
 */
function validationErrorHandler(errors) {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    },
  };
}

module.exports = {
  notFound,
  errorHandler,
  validationErrorHandler,
};
