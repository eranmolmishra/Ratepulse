function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Handle PostgreSQL specific constraint errors
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json({
      success: false,
      message: 'A record with this information already exists',
      detail: err.detail,
    });
  }

  if (err.code === '23514') {
    // Check constraint violation
    return res.status(400).json({
      success: false,
      message: 'Data validation constraint failed',
      detail: err.detail,
    });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist',
      detail: err.detail,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
