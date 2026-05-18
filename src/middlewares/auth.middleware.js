const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { isBlacklisted } = require('../services/blacklist.service');
const env = require('../config/env');

const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Unauthorized request. Please login to continue.');
    }

    if (isBlacklisted(token)) {
      throw new ApiError(401, 'Token has been revoked. Please login again.');
    }

    try {
      const decodedToken = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decodedToken?._id).select(
        '-password -refreshToken -forgotPasswordToken'
      );

      if (!user) {
        throw new ApiError(401, 'Invalid access token. User not found.');
      }

      if (!user.isActive) {
        throw new ApiError(401, 'User account is inactive.');
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Access token expired. Please refresh your token.');
      }
      if (jwtError instanceof ApiError) {
        throw jwtError;
      }
      throw new ApiError(401, 'Invalid access token. Please login again.');
    }
  } catch (error) {
    next(error);
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized request. Please login to continue.');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(
          403,
          'You do not have permission to perform this action.'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { verifyJWT, authorizeRoles };
