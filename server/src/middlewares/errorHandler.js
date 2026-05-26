/* eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('🔥 Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: Object.fromEntries(
        Object.entries(err.errors || {}).map(([k, v]) => [k, v.message]),
      ),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate value',
      keys: err.keyValue,
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
