const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((val) => val.message)
        .join(', ');
      error = new ApiError(400, message);
    } else if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      error = new ApiError(400, `${field} already exists`);
    } else if (error.name === 'CastError') {
      error = new ApiError(400, 'Invalid ID format');
    } else if (error.name === 'JsonWebTokenError') {
      error = new ApiError(401, 'Invalid token. Please login again.');
    } else if (error.name === 'TokenExpiredError') {
      error = new ApiError(401, 'Token expired. Please login again.');
    } else if (error.message === 'Not allowed by CORS') {
      error = new ApiError(403, 'CORS policy violation. Origin not allowed.');
    } else {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';
      error = new ApiError(statusCode, message);
    }
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
  };

  if (env.isDevelopment) {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
