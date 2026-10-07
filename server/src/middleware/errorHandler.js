import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const issueMessages = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${issueMessages}`
      }
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode === 400 ? 'BAD_REQUEST' : statusCode === 403 ? 'FORBIDDEN' : statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    error: {
      code,
      message
    }
  });
}
